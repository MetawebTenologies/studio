import { onAuthUserChanged, signOutUser, auth } from '../lib/firebase.js';
import { FirebaseSignInModal } from './FirebaseSignInModal.js';

export function Header(navigate) {
  const header = document.createElement('header');
  header.className = 'w-full flex flex-col z-50 sticky top-0';

  const navBar = document.createElement('div');
  navBar.className =
    'w-full h-16 bg-black flex items-center justify-between px-4 md:px-6 border-b border-white/5 backdrop-blur-md bg-opacity-95';

  const leftPart = document.createElement('div');
  leftPart.className = 'flex items-center gap-8';

  const logoContainer = document.createElement('div');
  logoContainer.className =
    'flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform';
  logoContainer.innerHTML = `
    <div class="w-8 h-8 bg-[#09090b] border border-[#00e5ff]/40 rounded-lg flex items-center justify-center p-1.5 shadow-lg">
      <svg viewBox="0 0 240 240" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 36 45 H 180 V 69 H 60 V 129 H 132 V 153 H 36 Z" fill="#F5F7FA"/>
        <path d="M 108 87 H 204 V 195 H 60 V 171 H 180 V 111 H 108 Z" fill="#00E5FF"/>
      </svg>
    </div>
    <span class="text-lg font-black tracking-tight text-white uppercase">Timecapsule</span>
  `;
  logoContainer.onclick = () => {
    navigate('library');
    activate('Library');
  };

  const menu = document.createElement('nav');
  menu.className = 'hidden lg:flex items-center gap-6 text-[13px] font-bold text-secondary';
  const items = ['Library', 'Image', 'Video', 'Lip Sync', 'Cinema Studio'];

  const pageForItem = {
    Library: 'library',
    Image: 'image',
    Video: 'video',
    'Lip Sync': 'lipsync',
    'Cinema Studio': 'cinema',
  };
  const links = {};

  const activate = (name) => {
    Object.entries(links).forEach(([, link]) => {
      link.classList.remove('text-white');
      const d = link.querySelector('[data-nav-dot]');
      if (d) d.remove();
    });
    const link = links[name];
    if (!link) return;
    link.classList.add('text-white');
    const dot = document.createElement('div');
    dot.className = 'absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full';
    dot.setAttribute('data-nav-dot', '1');
    link.appendChild(dot);
  };

  items.forEach((name) => {
    const link = document.createElement('a');
    link.textContent = name;
    link.className = `hover:text-white transition-all cursor-pointer relative group ${
      name === 'Library' ? 'text-white' : ''
    }`;

    link.onclick = () => {
      activate(name);
      navigate(pageForItem[name]);
    };

    if (name === 'Library') {
      const dot = document.createElement('div');
      dot.className = 'absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full';
      dot.setAttribute('data-nav-dot', '1');
      link.appendChild(dot);
    }

    links[name] = link;
    menu.appendChild(link);
  });

  leftPart.appendChild(logoContainer);
  leftPart.appendChild(menu);

  // Auth area in rightPart
  const rightPart = document.createElement('div');
  rightPart.className = 'flex items-center gap-3';

  function renderAuth(user) {
    rightPart.innerHTML = '';
    if (user) {
      // User is logged in
      const avatarContainer = document.createElement('div');
      avatarContainer.className = 'flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full';
      
      const displayName = user.displayName || user.email?.split('@')[0] || user.phoneNumber || 'User';
      const initial = (displayName[0] || 'U').toUpperCase();

      avatarContainer.innerHTML = `
        <div class="w-6 h-6 rounded-full bg-[#00e5ff] text-black font-extrabold text-[11px] flex items-center justify-center">
          ${initial}
        </div>
        <span class="text-xs text-zinc-300 font-medium max-w-[120px] truncate">${displayName}</span>
      `;

      const signOutBtn = document.createElement('button');
      signOutBtn.className =
        'text-xs text-zinc-400 hover:text-white font-medium border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-full transition-all cursor-pointer';
      signOutBtn.textContent = 'Sign Out';
      signOutBtn.onclick = async () => {
        await signOutUser();
        localStorage.removeItem('firebase_user_uid');
        localStorage.removeItem('firebase_user_email');
        localStorage.removeItem('cf_backend');
        window.location.reload();
      };

      rightPart.appendChild(avatarContainer);
      rightPart.appendChild(signOutBtn);
    } else {
      // User is logged out: show Sign In button
      const signInBtn = document.createElement('button');
      signInBtn.className =
        'bg-[#00e5ff] hover:bg-[#38bdf8] text-black font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer';
      signInBtn.textContent = 'Sign In';
      signInBtn.onclick = () => {
        FirebaseSignInModal(() => {
          window.location.reload();
        });
      };
      rightPart.appendChild(signInBtn);
    }
  }

  // Render immediately with current cached user or logged-out state
  renderAuth(auth.currentUser);

  // Subscribe to Firebase Auth state
  onAuthUserChanged((user) => {
    renderAuth(user);
  });

  navBar.appendChild(leftPart);
  navBar.appendChild(rightPart);

  header.appendChild(navBar);

  return header;
}
