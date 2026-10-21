import net from 'net';

export function isPrivateHostname(hostname) {
  const host = String(hostname || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (
    !host ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host === 'metadata.google.internal'
  ) {
    return true;
  }

  // Block integer, hex, or octal IPv4 encodings (e.g., 2130706433, 0x7f000001, 0177.0.0.1)
  if (/^(0x[0-9a-f]+|\d+)$/i.test(host)) return true;
  if (host.split('.').some((part) => /^0\d+$/.test(part) || /^0x/i.test(part))) return true;

  if (net.isIPv6(host) || host.includes(':')) {
    if (
      host === '::1' ||
      host === '::' ||
      host === '0:0:0:0:0:0:0:1' ||
      host === '0:0:0:0:0:0:0:0' ||
      host.startsWith('fc') ||
      host.startsWith('fd') ||
      host.startsWith('fe8') ||
      host.startsWith('fe9') ||
      host.startsWith('fea') ||
      host.startsWith('feb') ||
      host.startsWith('::ffff:') ||
      host.startsWith('0:0:0:0:0:ffff:')
    ) {
      return true;
    }
  }

  if (/^(127|0)\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  const match172 = host.match(/^172\.(\d+)\./);
  if (match172 && Number(match172[1]) >= 16 && Number(match172[1]) <= 31) return true;
  const match100 = host.match(/^100\.(\d+)\./);
  if (match100 && Number(match100[1]) >= 64 && Number(match100[1]) <= 127) return true;
  return false;
}

export function validateExternalMediaUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    throw new Error('Missing media URL');
  }
  if (urlString.startsWith('data:') || urlString.startsWith('/assets/')) {
    return { protocol: 'local', url: urlString };
  }
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error('Invalid media URL');
  }
  if (!['https:', 'http:'].includes(parsed.protocol)) {
    throw new Error(`Unsupported media protocol: ${parsed.protocol}`);
  }
  if (isPrivateHostname(parsed.hostname)) {
    const err = new Error('Media host is not allowed (private network blocked)');
    err.code = 'SSRF_BLOCKED';
    err.status = 400;
    err.statusCode = 400;
    throw err;
  }
  return { protocol: parsed.protocol, url: parsed.toString(), hostname: parsed.hostname };
}
