import { FirebaseSignInModal } from './FirebaseSignInModal.js';

/**
 * AuthModal — now delegates entirely to FirebaseSignInModal.
 *
 * Studios call AuthModal(onSuccess) when a user attempts a generation or
 * upload without being signed in. This wrapper simply surfaces the unified
 * Firebase sign-in experience (Google, Email/Password, Phone SMS).
 */
export function AuthModal(onSuccess) {
  const modal = FirebaseSignInModal(onSuccess);
  document.body.appendChild(modal);
  return modal;
}
