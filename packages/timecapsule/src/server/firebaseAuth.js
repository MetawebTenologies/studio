import * as jose from 'jose';

const GOOGLE_JWKS_URL = new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
);

let cachedRemoteJWKS = null;

function getDefaultJWKS() {
  if (!cachedRemoteJWKS) {
    cachedRemoteJWKS = jose.createRemoteJWKSet(GOOGLE_JWKS_URL);
  }
  return cachedRemoteJWKS;
}

/**
 * Resolves the configured Firebase project ID.
 * Fails closed if not configured on the server.
 */
export function getFirebaseProjectId() {
  const configured = (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    ''
  ).trim();

  if (!configured) {
    const err = new Error(
      'Firebase Authentication is not configured: FIREBASE_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID) is required'
    );
    err.code = 'FIREBASE_NOT_CONFIGURED';
    err.statusCode = 503;
    throw err;
  }
  return configured;
}

/**
 * Cryptographically verifies a Firebase ID Token using the maintained `jose` library.
 *
 * Verifies:
 * - Signature against Google's public JWKS certificates
 * - Expiration and issued-at timestamps
 * - Audience (`aud`) matches Firebase Project ID
 * - Issuer (`iss`) matches `https://securetoken.google.com/<projectId>`
 * - Subject (`sub` / uid) is non-empty
 *
 * Returns normalized claims: `{ uid, email, email_verified, name, picture }`.
 */
export async function verifyFirebaseIdToken(idToken, options = {}) {
  if (!idToken || typeof idToken !== 'string' || !idToken.includes('.')) {
    const err = new Error('Missing or malformed Firebase ID token');
    err.code = 'INVALID_ID_TOKEN';
    err.statusCode = 401;
    throw err;
  }

  // Fail closed if project ID is not configured
  const projectId = options.projectId || getFirebaseProjectId();
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;
  const keyResolver = options.jwks || options.keyResolver || getDefaultJWKS();

  try {
    const { payload } = await jose.jwtVerify(idToken, keyResolver, {
      issuer: expectedIssuer,
      audience: projectId,
      clockTolerance: options.clockTolerance || 5,
    });

    if (!payload.sub || typeof payload.sub !== 'string') {
      const err = new Error('Firebase ID token missing subject claim (uid)');
      err.code = 'INVALID_ID_TOKEN';
      err.statusCode = 401;
      throw err;
    }

    const email = payload.email ? String(payload.email).toLowerCase().trim() : null;
    const emailVerified = Boolean(payload.email_verified);

    return {
      uid: payload.sub,
      email,
      email_verified: emailVerified,
      name: payload.name || (email ? email.split('@')[0] : 'User'),
      picture: payload.picture || null,
      auth_time: payload.auth_time || null,
    };
  } catch (err) {
    if (err.code === 'FIREBASE_NOT_CONFIGURED') {
      throw err;
    }
    const safeErr = new Error(`Firebase ID token verification failed: ${err.message}`);
    safeErr.code = 'INVALID_ID_TOKEN';
    safeErr.statusCode = 401;
    throw safeErr;
  }
}
