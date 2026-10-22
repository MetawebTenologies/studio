import { BackendModal } from './BackendModal.js';

export function AuthModal(onSuccess) {
  const overlay = document.createElement('div');
  overlay.className =
    'fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-6';

  const modal = document.createElement('div');
  modal.className =
    'w-full max-w-md bg-panel-bg border border-white/10 rounded-3xl p-8 shadow-3xl animate-fade-in-up';

  modal.innerHTML = `
    <div class="flex flex-col items-center text-center mb-6">
      <div class="w-16 h-16 bg-[#09090b] rounded-2xl flex items-center justify-center border border-[#00e5ff]/30 p-3 shadow-glow mb-6">
        <svg viewBox="0 0 240 240" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 36 45 H 180 V 69 H 60 V 129 H 132 V 153 H 36 Z" fill="#F5F7FA"/>
          <path d="M 108 87 H 204 V 195 H 60 V 171 H 180 V 111 H 108 Z" fill="#00E5FF"/>
        </svg>
      </div>
      <h2 class="text-2xl font-black text-white uppercase tracking-wider mb-2">Timecapsule Studio</h2>
      <p class="text-secondary text-sm">Authenticate with a Private-Preview Access Key or enter a direct provider key.</p>
    </div>

    <div class="space-y-5">
      <div class="space-y-2">
        <label class="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Private-Preview Access Key (Single-Tenant BFF)</label>
        <input 
          type="password" 
          id="preview-key-input"
          placeholder="Enter TIMECAPSULE_PREVIEW_KEY..."
          class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 text-white placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
        >
        <p class="text-[11px] text-muted ml-1">Single-tenant private-preview access only (not multi-tenant authentication).</p>
      </div>

      <button id="managed-bff-btn" class="w-full bg-primary text-black font-black py-4 rounded-2xl hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all">
        Enter Private-Preview Studio →
      </button>

      <div class="space-y-2">
        <label class="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Or Direct Provider API Key</label>
        <input 
          type="password" 
          id="kie-key-input"
          placeholder="Enter direct provider API key..."
          class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
        >
      </div>

      <p id="auth-error-msg" class="text-xs text-red-400 hidden"></p>

      <div class="flex flex-col gap-3">
        <button id="save-key-btn" class="w-full border border-white/10 text-white font-bold py-3.5 rounded-2xl hover:bg-white/5 transition-all">
          Initialize with Direct Key
        </button>
        <button id="backend-login-btn" class="w-full text-muted hover:text-white font-bold py-2 transition-all text-xs uppercase tracking-wider">
          Legacy Bridge Login →
        </button>
      </div>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const previewInput = modal.querySelector('#preview-key-input');
  const input = modal.querySelector('#kie-key-input');
  const errorEl = modal.querySelector('#auth-error-msg');
  const btn = modal.querySelector('#save-key-btn');
  const managedBtn = modal.querySelector('#managed-bff-btn');

  const showError = (msg) => {
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  };

  managedBtn.onclick = async () => {
    const previewKey = previewInput.value.trim();
    if (!previewKey) {
      showError('Private-preview access key is required for Managed BFF mode.');
      return;
    }
    managedBtn.disabled = true;
    errorEl.classList.add('hidden');
    try {
      const res = await fetch('/api/v1/session', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Timecapsule-CSRF': '1',
        },
        body: JSON.stringify({ access_key: previewKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        showError(data.error || `Private-preview authentication failed (${res.status})`);
        return;
      }
      localStorage.setItem('timecapsule_mode', 'bff');
      localStorage.setItem('timecapsule_api_key', 'TIMECAPSULE_BFF');
      document.body.removeChild(overlay);
      if (onSuccess) onSuccess();
    } catch (err) {
      showError(err.message || 'Unable to verify private-preview access key.');
    } finally {
      managedBtn.disabled = false;
    }
  };

  btn.onclick = () => {
    const key = input.value.trim();
    if (key) {
      localStorage.setItem('timecapsule_mode', 'direct');
      localStorage.setItem('timecapsule_api_key', key);
      localStorage.setItem('kie_key', key);
      document.body.removeChild(overlay);
      if (onSuccess) onSuccess();
    } else {
      input.classList.add('border-red-500/50');
      setTimeout(() => input.classList.remove('border-red-500/50'), 2000);
    }
  };

  modal.querySelector('#backend-login-btn').onclick = () => {
    document.body.removeChild(overlay);
    document.body.appendChild(BackendModal(onSuccess));
  };

  return overlay;
}
