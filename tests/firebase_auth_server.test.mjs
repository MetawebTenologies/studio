import test from 'node:test';
import assert from 'node:assert/strict';
import * as jose from 'jose';
import crypto from 'crypto';

process.env.TIMECAPSULE_SESSION_SECRET = 'test_session_secret_at_least_32_chars_long';

import {
  verifyFirebaseIdToken,
  getFirebaseProjectId,
} from '../packages/timecapsule/src/server/firebaseAuth.js';
import {
  provisionFirebaseUserAndTenant,
  getUser,
  getUserByFirebaseUid,
  revokeUserSessions,
  createUser,
} from '../packages/timecapsule/src/server/tenants.js';
import {
  issueTenantSessionToken,
  verifySessionToken,
  requireSession,
} from '../packages/timecapsule/src/server/auth.js';
import { submitGenerationJob } from '../packages/timecapsule/src/server/orchestrator.js';
import { getTenantCredits } from '../packages/timecapsule/src/server/store.js';
import { runMigrations, closePool } from '../packages/timecapsule/src/server/db.js';

test('[Server Test: Firebase Auth & Session Seam]', async (t) => {
  // Ensure DB migrations (including migration 011) are applied
  await runMigrations();

  // Generate test RSA Keypair for cryptographically valid test ID tokens
  const keyPair = await jose.generateKeyPair('RS256');
  const publicJwk = await jose.exportJWK(keyPair.publicKey);
  publicJwk.kid = 'tc-test-firebase-kid-1';
  publicJwk.alg = 'RS256';
  publicJwk.use = 'sig';
  const testJwks = jose.createLocalJWKSet({ keys: [publicJwk] });
  const TEST_PROJECT_ID = 'timecapsule-test-proj';

  async function makeTestIdToken({
    uid = 'fb_usr_test_' + crypto.randomBytes(4).toString('hex'),
    email = 'user@example.com',
    emailVerified = true,
    projectId = TEST_PROJECT_ID,
    kid = 'tc-test-firebase-kid-1',
    expiresIn = '1h',
    issuer = null,
  } = {}) {
    const builder = new jose.SignJWT({
      sub: uid,
      email,
      email_verified: emailVerified,
      name: 'Test User',
      auth_time: Math.floor(Date.now() / 1000),
    })
      .setProtectedHeader({ alg: 'RS256', kid })
      .setAudience(projectId)
      .setIssuer(issuer || `https://securetoken.google.com/${projectId}`)
      .setIssuedAt();

    if (expiresIn) {
      builder.setExpirationTime(expiresIn);
    }
    return builder.sign(keyPair.privateKey);
  }

  await t.test('1. Fails closed when Firebase Project ID is unconfigured', async () => {
    const origPid = process.env.FIREBASE_PROJECT_ID;
    const origNextPid = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    try {
      assert.throws(
        () => getFirebaseProjectId(),
        (err) => err.code === 'FIREBASE_NOT_CONFIGURED' && err.statusCode === 503
      );
    } finally {
      if (origPid) process.env.FIREBASE_PROJECT_ID = origPid;
      if (origNextPid) process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = origNextPid;
    }
  });

  await t.test('2. Rejects forged or invalid Firebase ID tokens with 401', async () => {
    // Malformed token
    await assert.rejects(
      async () => verifyFirebaseIdToken('not-a-jwt', { projectId: TEST_PROJECT_ID, jwks: testJwks }),
      (err) => err.code === 'INVALID_ID_TOKEN' && err.statusCode === 401
    );

    // Wrong audience / project ID
    const wrongAudToken = await makeTestIdToken({ projectId: 'wrong-project' });
    await assert.rejects(
      async () => verifyFirebaseIdToken(wrongAudToken, { projectId: TEST_PROJECT_ID, jwks: testJwks }),
      (err) => err.code === 'INVALID_ID_TOKEN' && err.statusCode === 401
    );

    // Valid token verifies successfully
    const validToken = await makeTestIdToken({ uid: 'fb_valid_99', email: 'verified@example.com' });
    const decoded = await verifyFirebaseIdToken(validToken, {
      projectId: TEST_PROJECT_ID,
      jwks: testJwks,
    });
    assert.equal(decoded.uid, 'fb_valid_99');
    assert.equal(decoded.email, 'verified@example.com');
    assert.equal(decoded.email_verified, true);
  });

  await t.test(
    '3. Atomically provisions new user, tenant, and membership with ZERO starter credits',
    async () => {
      const fbUid = 'fb_usr_' + crypto.randomBytes(6).toString('hex');
      const email = `newuser_${crypto.randomBytes(4).toString('hex')}@timecapsule.test`;

      const provisioned = await provisionFirebaseUserAndTenant({
        firebaseUid: fbUid,
        email,
        emailVerified: true,
        name: 'New Artist',
      });

      assert.equal(provisioned.isNewUser, true);
      assert.ok(provisioned.user.user_id.startsWith('usr_'));
      assert.equal(provisioned.user.firebase_uid, fbUid);
      assert.equal(provisioned.user.email_verified, true);
      assert.equal(provisioned.role, 'reseller_admin'); // least-privileged owner role

      // Verify ZERO starter credits
      const credits = await getTenantCredits(provisioned.tenantId);
      assert.equal(credits.available_credits, 0, 'Must have zero starter credits');
      assert.equal(credits.total_credits, 0);
      assert.equal(credits.reserved_credits, 0);

      // Second call for existing user returns existing identity
      const secondCall = await provisionFirebaseUserAndTenant({
        firebaseUid: fbUid,
        email,
        emailVerified: true,
      });
      assert.equal(secondCall.isNewUser, false);
      assert.equal(secondCall.user.user_id, provisioned.user.user_id);
      assert.equal(secondCall.tenantId, provisioned.tenantId);
    }
  );

  await t.test(
    '4. Prevents race conditions: concurrent first sign-ins create exactly ONE tenant and user',
    async () => {
      const fbUid = 'fb_concurrent_' + crypto.randomBytes(6).toString('hex');
      const email = `concurrent_${crypto.randomBytes(4).toString('hex')}@timecapsule.test`;

      // Dispatch 5 concurrent sign-in provisioning calls simultaneously
      const results = await Promise.all([
        provisionFirebaseUserAndTenant({ firebaseUid: fbUid, email, emailVerified: true }),
        provisionFirebaseUserAndTenant({ firebaseUid: fbUid, email, emailVerified: true }),
        provisionFirebaseUserAndTenant({ firebaseUid: fbUid, email, emailVerified: true }),
        provisionFirebaseUserAndTenant({ firebaseUid: fbUid, email, emailVerified: true }),
        provisionFirebaseUserAndTenant({ firebaseUid: fbUid, email, emailVerified: true }),
      ]);

      const userIds = new Set(results.map((r) => r.user.user_id));
      const tenantIds = new Set(results.map((r) => r.tenantId));

      assert.equal(userIds.size, 1, 'Concurrent calls must resolve to single user_id');
      assert.equal(tenantIds.size, 1, 'Concurrent calls must resolve to single tenant_id');
    }
  );

  await t.test(
    '5. Strict Account Collision Guard: Never links accounts by email alone',
    async () => {
      const collisionEmail = `preexisting_${crypto.randomBytes(4).toString('hex')}@test.com`;

      // Pre-existing user in DB without firebase_uid
      const existingUser = await createUser({
        email: collisionEmail,
        authMode: 'token',
      });
      assert.ok(existingUser.user_id);

      // Attempt by a different Firebase user to sign in with same email
      const newFbUid = 'fb_intruder_' + crypto.randomBytes(6).toString('hex');

      await assert.rejects(
        async () =>
          provisionFirebaseUserAndTenant({
            firebaseUid: newFbUid,
            email: collisionEmail,
            emailVerified: true,
          }),
        (err) =>
          err.code === 'ACCOUNT_COLLISION_EMAIL_LINK_FORBIDDEN' && err.statusCode === 409
      );
    }
  );

  await t.test(
    '6. Generation S-Gate: Verified email is required before initiating generation jobs',
    async () => {
      const fbUid = 'fb_unverified_' + crypto.randomBytes(6).toString('hex');
      const email = `unverified_${crypto.randomBytes(4).toString('hex')}@test.com`;

      const provisioned = await provisionFirebaseUserAndTenant({
        firebaseUid: fbUid,
        email,
        emailVerified: false, // Unverified email!
      });

      const session = {
        user_id: provisioned.user.user_id,
        tenant_id: provisioned.tenantId,
        role: provisioned.role,
        auth_mode: 'tenant_session',
        email_verified: false,
      };

      await assert.rejects(
        async () =>
          submitGenerationJob({
            session,
            body: {
              modality: 'image',
              model: 'flux-schnell',
              inputs: { prompt: 'A cinematic neon city' },
            },
          }),
        (err) =>
          err.code === 'EMAIL_VERIFICATION_REQUIRED' && err.statusCode === 403
      );
    }
  );

  await t.test(
    '7. Session Revocation: Incrementing token_version immediately revokes active sessions',
    async () => {
      const fbUid = 'fb_revokable_' + crypto.randomBytes(6).toString('hex');
      const email = `revokable_${crypto.randomBytes(4).toString('hex')}@test.com`;

      const provisioned = await provisionFirebaseUserAndTenant({
        firebaseUid: fbUid,
        email,
        emailVerified: true,
      });

      // Issue token with tokenVersion = 1
      const tokenV1 = issueTenantSessionToken({
        userId: provisioned.user.user_id,
        tenantId: provisioned.tenantId,
        role: provisioned.role,
        email,
        emailVerified: true,
        tokenVersion: 1,
      });

      // Verify token is valid initially
      const mockReq = {
        headers: {
          get: (name) => (name.toLowerCase() === 'authorization' ? `Bearer ${tokenV1}` : null),
        },
      };
      const session = await requireSession(mockReq);
      assert.equal(session.user_id, provisioned.user.user_id);

      // Revoke user sessions in DB (increments token_version to 2)
      await revokeUserSessions(provisioned.user.user_id);

      // Subsequent call with tokenV1 MUST fail with 401 SESSION_REVOKED
      await assert.rejects(
        async () => requireSession(mockReq),
        (err) => err.code === 'SESSION_REVOKED' && err.statusCode === 401
      );
    }
  );

  await t.test(
    '8. Query-string tokens are strictly REJECTED (SSE must authenticate via same-origin cookie or Bearer)',
    async () => {
      const token = issueTenantSessionToken({
        userId: 'usr_mock_1',
        tenantId: 'tnt_mock_1',
      });

      // Request with token only in query string
      const reqWithQueryToken = {
        url: `https://studio.timecapsule.ai/api/v1/generations/job_123/events?token=${token}`,
        headers: { get: () => null },
      };

      await assert.rejects(
        async () => requireSession(reqWithQueryToken),
        (err) => err.code === 'UNAUTHORIZED' && err.statusCode === 401
      );
    }
  );
});
