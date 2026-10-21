import { BackendModal } from './BackendModal.js';

export function AuthModal(onSuccess) {
  const overlay = document.createElement('div');
  overlay.className =
    'fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-6';

  const modal = document.createElement('div');
  modal.className =
    'w-full max-w-md bg-panel-bg border border-white/10 rounded-3xl p-8 shadow-3xl animate-fade-in-up';

  modal.innerHTML = `
    <div class="flex flex-col items-center text-center mb-8">
      <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-glow mb-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      <h2 class="text-2xl font-black text-white uppercase tracking-wider mb-2">Timecapsule Studio</h2>
      <p class="text-secondary text-sm">Connect to Timecapsule Managed BFF or enter a direct provider key.</p>
    </div>

    <div class="space-y-6">
      <button id="managed-bff-btn" class="w-full bg-primary text-black font-black py-4 rounded-2xl hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all">
        Enter Timecapsule Managed Studio →
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

  const input = modal.querySelector('#kie-key-input');
  const btn = modal.querySelector('#save-key-btn');
  const managedBtn = modal.querySelector('#managed-bff-btn');

  managedBtn.onclick = () => {
    localStorage.setItem('timecapsule_mode', 'bff');
    localStorage.setItem('timecapsule_api_key', 'TIMECAPSULE_BFF');
    document.body.removeChild(overlay);
    if (onSuccess) onSuccess();
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
