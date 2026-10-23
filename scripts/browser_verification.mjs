import { spawn } from 'child_process';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200 || res.status === 304 || res.status === 404) return true;
    } catch {
      // retry
    }
    await sleep(250);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function run() {
  console.log('--- Starting Browser Verification ---');

  // 1. Start Next.js server on port 3333 with test database
  const server = spawn('npx', ['next', 'start', '-p', '3333'], {
    env: {
      ...process.env,
      PORT: '3333',
      DATABASE_URL: 'postgresql://localhost:5432/timecapsule_test',
    },
    stdio: 'ignore',
  });

  let chrome = null;
  try {
    await waitForServer('http://localhost:3333/apps');
    console.log('[OK] Next.js server is listening at http://localhost:3333');

    // 2. Launch headless Chrome with CDP
    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    chrome = spawn(
      chromePath,
      [
        '--headless=new',
        '--remote-debugging-port=9222',
        '--no-first-run',
        '--user-data-dir=/tmp/tc_chrome_test_' + Date.now(),
      ],
      { stdio: 'ignore' }
    );

    await waitForServer('http://localhost:9222/json/version');
    console.log('[OK] Headless Chrome running with CDP port 9222');

    // 3. Connect to page target via CDP WebSocket
    let newTabRes = await fetch('http://localhost:9222/json/new', { method: 'PUT' });
    let pageTarget = await newTabRes.json();
    const wsUrl = pageTarget.webSocketDebuggerUrl;
    console.log('[OK] Created page target:', wsUrl);

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const callbacks = new Map();
    const networkRequests = [];

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && callbacks.has(data.id)) {
        callbacks.get(data.id)(data);
        callbacks.delete(data.id);
      }
      if (data.method === 'Network.requestWillBeSent') {
        networkRequests.push({
          url: data.params.request.url,
          method: data.params.request.method,
          postData: data.params.request.postData,
        });
      }
    };

    function sendCommand(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        callbacks.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evaluateScript(expression) {
      const res = await sendCommand('Runtime.evaluate', { expression });
      return res.result?.result?.value;
    }

    async function waitForCondition(checkFn, timeoutMs = 15000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const val = await checkFn();
        if (val) return val;
        await sleep(200);
      }
      throw new Error(`Condition timed out after ${timeoutMs}ms`);
    }

    // Enable CDP domains
    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');
    await sendCommand('Network.enable');

    // 4. Navigate to /apps
    console.log('[Browser] Navigating to http://localhost:3333/apps');
    await sendCommand('Page.navigate', { url: 'http://localhost:3333/apps' });

    await waitForCondition(async () => {
      const text = await evaluateScript('document.body.innerText');
      return text && text.includes('Commercial Product Concept');
    });
    console.log('[OK] Apps page loaded and rendered template catalog');

    // Find "Use Template" link for product-concept-pro
    const targetUrl = await waitForCondition(async () => {
      return await evaluateScript(`
        const link = Array.from(document.querySelectorAll('a')).find(a => a.href.includes('preset=product-concept-pro'));
        link ? link.href : null;
      `);
    });
    console.log(`[OK] Found template deep link: ${targetUrl}`);

    // 5. Navigate to Studio via template deep link
    console.log('[Browser] Navigating via deep link to Studio');
    await sendCommand('Page.navigate', { url: targetUrl });
    await sleep(1500);

    // If unauthenticated key modal is shown on fresh browser profile, dismiss via preview button
    await evaluateScript(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Explore UI Preview'));
        if (btn) btn.click();
      })()
    `);

    // Wait for Studio to render and mount the Template Recipe banner
    await waitForCondition(async () => {
      const text = await evaluateScript('document.body.innerText');
      return text && text.includes('Template Recipe:') && text.includes('Commercial Product Concept');
    });
    console.log('[OK] Template Recipe banner is visible in Studio');

    // Verify model is nano-banana-pro
    const isModelSelected = await waitForCondition(async () => {
      const text = await evaluateScript('document.body.innerText');
      return text && (text.includes('Nano Banana Pro') || text.includes('nano-banana-pro'));
    });
    console.log('[OK] Verified selected model is nano-banana-pro');

    // Check Clear Template button exists
    const hasClearBtn = await waitForCondition(async () => {
      return await evaluateScript(`
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Clear Template'));
          return Boolean(btn);
        })()
      `);
    });
    console.log('[OK] Clear Template button found in Studio DOM');

    // 6. Click Clear Template button
    await evaluateScript(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Clear Template'));
        if (btn) btn.click();
      })()
    `);

    // Verify banner is now gone
    await waitForCondition(async () => {
      const text = await evaluateScript('document.body.innerText');
      return text && !text.includes('Template Recipe:');
    });
    console.log('[OK] Clear Template successfully cleared the preset banner');

    // 7. Verify zero generation POST requests were sent during the entire navigation
    const generationPosts = networkRequests.filter(
      (req) => req.url.includes('/api/v1/generations') && req.method === 'POST'
    );

    if (generationPosts.length !== 0) {
      throw new Error(`VIOLATION: Expected 0 generation POST requests, but found ${generationPosts.length}!`);
    }
    console.log(`[OK] Strict Zero-Submission Guarantee verified: 0 generation POST requests executed across the entire session`);

    console.log('--- ALL BROWSER CHECKS PASSED ---');
    ws.close();
  } finally {
    if (chrome) chrome.kill();
    if (server) server.kill();
  }
}

run().catch((err) => {
  console.error('[BROWSER_CHECK_FAILED]', err);
  process.exit(1);
});
