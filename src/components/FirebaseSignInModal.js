import {
  auth,
  signInWithGooglePopup,
  signInWithEmail,
  signUpWithEmail,
} from '../lib/firebase.js';

export function FirebaseSignInModal(onSuccess) {
  const overlay = document.createElement('div');
  overlay.className =
    'fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md px-4 py-6 overflow-y-auto';

  const modal = document.createElement('div');
  modal.className =
    'w-full max-w-md bg-[#0e0e12] border border-white/10 rounded-3xl p-7 md:p-8 shadow-2xl relative text-left animate-fade-in-up my-auto';

  modal.innerHTML = `
    <!-- Header -->
    <div class="flex flex-col items-center text-center mb-6">
      <div class="w-14 h-14 bg-[#09090b] rounded-2xl flex items-center justify-center border border-[#00e5ff]/30 shadow-lg shadow-[#00e5ff]/10 mb-4">
        <svg viewBox="0 0 240 240" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 36 45 H 180 V 69 H 60 V 129 H 132 V 153 H 36 Z" fill="#F5F7FA"/>
          <path d="M 108 87 H 204 V 195 H 60 V 171 H 180 V 111 H 108 Z" fill="#00E5FF"/>
        </svg>
      </div>
      <h2 class="text-xl md:text-2xl font-black text-white uppercase tracking-wider">Timecapsule Studio</h2>
      <p class="text-zinc-400 text-xs mt-1">Sign in with Google or Email to access your studio</p>
    </div>

    <!-- 1. Google One-Click Sign-In -->
    <div class="mb-5">
      <button id="btn-google-signin" class="w-full flex items-center justify-center gap-3 bg-white text-zinc-900 font-bold py-3.5 px-4 rounded-xl hover:bg-zinc-100 active:scale-[0.99] transition-all shadow-md">
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        <span>Continue with Google</span>
      </button>
    </div>

    <!-- Divider -->
    <div class="relative flex py-2 items-center mb-5">
      <div class="flex-grow border-t border-white/10"></div>
      <span class="flex-shrink mx-4 text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Or with credentials</span>
      <div class="flex-grow border-t border-white/10"></div>
    </div>

    <!-- 2. Email Section -->
    <div id="section-email" class="space-y-4">
      <div class="space-y-1.5">
        <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Email Address</label>
        <input 
          type="email" 
          id="email-input" 
          placeholder="name@example.com"
          class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00e5ff] transition-colors"
        >
      </div>

      <div class="space-y-1.5">
        <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Password</label>
        <input 
          type="password" 
          id="password-input" 
          placeholder="••••••••"
          class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00e5ff] transition-colors"
        >
      </div>

      <div class="flex items-center justify-between text-xs px-1">
        <span id="auth-mode-label" class="text-zinc-400">Need an account?</span>
        <button id="auth-mode-toggle" type="button" class="text-[#00e5ff] font-bold hover:underline cursor-pointer">
          Create Account
        </button>
      </div>

      <button id="btn-email-submit" class="w-full bg-[#00e5ff] text-black font-extrabold py-3.5 rounded-xl hover:bg-[#38bdf8] active:scale-[0.99] transition-all shadow-md">
        Sign In
      </button>
    </div>

    <!-- Error Message -->
    <p id="modal-error-msg" class="text-xs text-red-400 mt-4 text-center hidden p-2 bg-red-950/30 border border-red-900/40 rounded-lg"></p>

    <!-- Close / Cancel -->
    <div class="mt-6 text-center">
      <button id="btn-close-modal" class="text-xs text-zinc-500 hover:text-white uppercase tracking-wider font-semibold py-1">
        Cancel
      </button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Bind DOM Elements
  const btnGoogle = modal.querySelector('#btn-google-signin');
  const sectionEmail = modal.querySelector('#section-email');
  const emailInput = modal.querySelector('#email-input');
  const passwordInput = modal.querySelector('#password-input');
  const btnEmailSubmit = modal.querySelector('#btn-email-submit');
  const authModeLabel = modal.querySelector('#auth-mode-label');
  const authModeToggle = modal.querySelector('#auth-mode-toggle');

  const errorEl = modal.querySelector('#modal-error-msg');
  const btnClose = modal.querySelector('#btn-close-modal');

  let isSignUpMode = false;

  const showError = (msg) => {
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  };

  const clearError = () => {
    errorEl.textContent = '';
    errorEl.classList.add('hidden');
  };

  const finishSuccess = async (user) => {
    try {
      showError('Establishing secure studio session...');
      const idToken = await user.getIdToken();

      // Session exchange with Next.js BFF endpoint
      const res = await fetch('/api/v1/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-timecapsule-csrf': '1',
        },
        body: JSON.stringify({ id_token: idToken }),
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        showError(data.error || 'Failed to establish backend session with server');
        return;
      }

      // Unlock client views
      localStorage.setItem('cf_backend', '1');

      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      if (onSuccess) onSuccess(data.session);
    } catch (err) {
      showError(err.message || 'Session exchange failed');
    }
  };

  // Toggle Email Sign In / Sign Up
  authModeToggle.onclick = () => {
    clearError();
    isSignUpMode = !isSignUpMode;
    if (isSignUpMode) {
      authModeLabel.textContent = 'Already have an account?';
      authModeToggle.textContent = 'Sign In';
      btnEmailSubmit.textContent = 'Create Account';
    } else {
      authModeLabel.textContent = 'Need an account?';
      authModeToggle.textContent = 'Create Account';
      btnEmailSubmit.textContent = 'Sign In';
    }
  };

  // 1. Google Sign In
  btnGoogle.onclick = async () => {
    clearError();
    btnGoogle.disabled = true;
    btnGoogle.classList.add('opacity-70');
    try {
      const result = await signInWithGooglePopup();
      await finishSuccess(result.user);
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        showError('Google sign in was canceled.');
      } else if (err.code === 'auth/popup-blocked') {
        showError('Popup was blocked by your browser. Please allow popups for this site.');
      } else {
        showError(err.message || 'Google sign in failed.');
      }
    } finally {
      btnGoogle.disabled = false;
      btnGoogle.classList.remove('opacity-70');
    }
  };

  // 2. Email Sign In / Up
  btnEmailSubmit.onclick = async () => {
    clearError();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      showError('Password must be at least 6 characters.');
      return;
    }

    btnEmailSubmit.disabled = true;
    btnEmailSubmit.textContent = isSignUpMode ? 'Creating account...' : 'Signing in...';

    try {
      let result;
      if (isSignUpMode) {
        result = await signUpWithEmail(email, password);
      } else {
        result = await signInWithEmail(email, password);
      }
      await finishSuccess(result.user);
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        showError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        showError('An account with this email already exists. Click "Sign In" instead.');
      } else {
        showError(err.message || 'Authentication failed.');
      }
    } finally {
      btnEmailSubmit.disabled = false;
      btnEmailSubmit.textContent = isSignUpMode ? 'Create Account' : 'Sign In';
    }
  };

  // Close Modal
  btnClose.onclick = () => {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  };

  overlay.onclick = (e) => {
    if (e.target === overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  };

  return overlay;
}
