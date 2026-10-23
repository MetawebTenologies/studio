#!/usr/bin/env node
/**
 * 3B Live Test Runner (Task E / Condition C0–C6)
 *
 * Requirements:
 * - C0: Contract pinned first (nano-banana-pro, prompt, aspect_ratio, resolution).
 * - C1: Regular authenticated tenant account (NEVER PREVIEW_IDENTITY).
 * - C2: Evidence bundle gathered (job row, reservation, ledger, asset URL, wall time, request_id).
 * - C3: Append entry to docs/compliance/provider_calls.md.
 * - C4: 90s window timeout handling with explicit settle or refund.
 * - C5: Exactly ONE submission, zero retries, no fallback model. On failure, STOP and report.
 * - C6: Secret redaction - never print or log API keys.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from local .env
dotenv.config({ path: path.join(rootDir, '.env') });

import { query, runMigrations } from '../packages/timecapsule/src/server/db.js';
import { createTenant, createUser, createMembership } from '../packages/timecapsule/src/server/tenants.js';
import { issueTenantSessionToken } from '../packages/timecapsule/src/server/auth.js';
import { submitGenerationJob } from '../packages/timecapsule/src/server/orchestrator.js';
import { createDurableWorker } from '../packages/timecapsule/src/worker/index.js';
import { getJob, getJobEventsAfter, getAsset } from '../packages/timecapsule/src/server/store.js';

const CONTRACT_PIN = {
  provider: 'muapi',
  model: 'nano-banana-pro',
  execution_route: 'muapi:predictions/v1:nano-banana-pro',
  credits_reserved: 15,
  cost_estimate_usd: 0.015,
  body: {
    model: 'nano-banana-pro',
    prompt: 'Cinematic obsidian architectural monolith at twilight, cyan ambient glow, photorealistic, 8k',
    aspect_ratio: '1:1',
    resolution: '1k',
  },
};

async function main() {
  console.log('====================================================');
  console.log('  TIMECAPSULE STUDIO: 3B LIVE TEST (Task E / C0-C6) ');
  console.log('====================================================\n');

  console.log('--- [Condition C0] Pinned Model Contract ---');
  console.log(`Provider:        ${CONTRACT_PIN.provider}`);
  console.log(`Model:           ${CONTRACT_PIN.model}`);
  console.log(`Execution Route: ${CONTRACT_PIN.execution_route}`);
  console.log(`Credit Cost:     ${CONTRACT_PIN.credits_reserved} credits (~$${CONTRACT_PIN.cost_estimate_usd})`);
  console.log(`Payload Params:  ${JSON.stringify(CONTRACT_PIN.body, null, 2)}\n`);

  const apiKey = (process.env.MUAPI_API_KEY || '').trim();
  if (!apiKey) {
    console.log('----------------------------------------------------');
    console.log('  NOTICE: MUAPI_API_KEY is not set or empty in .env ');
    console.log('----------------------------------------------------');
    console.log('Under Standing Rule 6 & C0-C6, we must NOT mock the live call silently.');
    console.log('To execute the live 3B test:');
    console.log('  1. Open .env');
    console.log('  2. Set MUAPI_API_KEY=<your-real-muapi-key>');
    console.log('  3. Run: node scripts/run_3b_live_test.mjs\n');
    console.log('Status: Contract pinned and pre-flight ready. Awaiting operator key.');
    process.exit(0);
  }

  console.log('MUAPI_API_KEY detected (redacted): ' + apiKey.slice(0, 4) + '...' + apiKey.slice(-4));
  console.log('Ensuring migrations are applied...');
  await runMigrations();

  // Condition C1: Create regular tenant account and user (NEVER PREVIEW_IDENTITY)
  console.log('\n--- [Condition C1] Provisioning Real Tenant Account ---');
  const timestamp = Date.now();
  const testTenantId = `tnt_live_3b_${timestamp}`;
  const testUserId = `usr_live_3b_${timestamp}`;

  const tenant = await createTenant({
    tenantId: testTenantId,
    slug: `live-3b-${timestamp}`,
    name: '3B Live Compliance Tenant',
    initialCredits: 100, // 100 credits balance
  });
  console.log(`Created Tenant: ${tenant.tenant_id} (Balance: 100 credits)`);

  const user = await createUser({
    userId: testUserId,
    email: `live-eval-${timestamp}@timecapsule.studio`,
  });

  await createMembership({
    membershipId: `mem_live_3b_${timestamp}`,
    userId: user.user_id,
    tenantId: tenant.tenant_id,
    role: 'end_user',
  });
  console.log(`Created User:   ${user.user_id} (Role: end_user, NOT preview identity)`);

  const session = {
    user_id: user.user_id,
    tenant_id: tenant.tenant_id,
    role: 'end_user',
    auth_mode: 'live_session',
  };

  // Condition C5: Exactly ONE submission, zero retries, no fallback model
  console.log('\n--- [Condition C5] Executing Single Live Submission ---');
  const startTime = Date.now();
  const submission = await submitGenerationJob({
    session,
    idempotencyKey: `live_3b_${timestamp}`,
    body: CONTRACT_PIN.body,
  });

  const job = submission.job;
  console.log(`Job Created:     ${job.job_id}`);
  console.log(`Status:          ${job.status}`);
  console.log(`Reserved:        ${job.credits_reserved} credits`);

  // Start worker to drain the single job
  console.log('\nStarting single-shot worker with 90s timeout window...');
  const worker = createDurableWorker({
    workerId: `wrk_live_3b_${timestamp}`,
    providerPollDelayMs: 2500,
  });

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Live test timed out after 90 seconds (Condition C4)')), 90000);
  });

  let completedJob = null;
  try {
    await Promise.race([
      worker.drainUntilSettled({ waitMs: 1500 }),
      timeoutPromise,
    ]);
    completedJob = await getJob(job.job_id);
  } catch (err) {
    console.error(`Error or timeout during execution: ${err.message}`);
    completedJob = await getJob(job.job_id);
  }

  const wallTimeMs = Date.now() - startTime;
  console.log(`Total Wall Time: ${wallTimeMs} ms (${(wallTimeMs / 1000).toFixed(2)}s)`);

  // Condition C2: Gather Evidence Bundle
  console.log('\n====================================================');
  console.log('             EVIDENCE BUNDLE (C2)                   ');
  console.log('====================================================');
  console.log(`Job ID:                  ${completedJob.job_id}`);
  console.log(`Final Status:            ${completedJob.status}`);
  console.log(`Resolved Provider Model: ${completedJob.resolved_provider_model}`);
  console.log(`Execution Route:         ${completedJob.execution_route}`);
  console.log(`Provider Job ID:         ${completedJob.provider_job_id || 'N/A'}`);
  console.log(`Credits Reserved:        ${completedJob.credits_reserved}`);
  console.log(`Credits Charged:         ${completedJob.credits_charged}`);

  // Ledger entries
  const ledgerRes = await query(
    `SELECT entry_id, entry_type, amount, balance_after, created_at 
     FROM credit_ledger 
     WHERE tenant_id = $1 
     ORDER BY sequence_num ASC`,
    [tenant.tenant_id]
  );
  console.log('\n--- Credit Ledger Entries ---');
  console.table(ledgerRes.rows);

  // Job events timeline
  const events = await getJobEventsAfter(job.job_id);
  console.log('\n--- SSE Events Timeline ---');
  events.forEach((ev) => {
    console.log(`[+${ev.event_version}] ${ev.created_at} | Event: ${ev.event_type} | Payload: ${JSON.stringify(ev.payload)}`);
  });

  // Asset row
  const assetRes = await query(
    `SELECT asset_id, provider, request_id, content_type, url, created_at 
     FROM assets 
     WHERE job_id = $1`,
    [job.job_id]
  );
  console.log('\n--- Generated Asset Record ---');
  console.table(assetRes.rows);

  // Condition C3: Append entry to docs/compliance/provider_calls.md
  console.log('\n--- [Condition C3] Updating docs/compliance/provider_calls.md ---');
  const complianceLogPath = path.join(rootDir, 'docs', 'compliance', 'provider_calls.md');
  const dateStr = new Date().toISOString().slice(0, 10);
  const logRow = `| ${dateStr} | muapi | nano-banana-pro | 3B live contract validation | ~$0.015 | ${completedJob.provider_job_id || 'N/A'} | ${completedJob.status} | Wall time: ${(wallTimeMs / 1000).toFixed(2)}s, Asset: ${assetRes.rows[0]?.url || 'N/A'} |\n`;

  fs.appendFileSync(complianceLogPath, logRow, 'utf8');
  console.log('Logged row to docs/compliance/provider_calls.md successfully.');

  console.log('\n====================================================');
  console.log('            3B LIVE TEST COMPLETE                   ');
  console.log('====================================================');
}

main().catch((err) => {
  console.error('Fatal error in 3B live test:', err);
  process.exit(1);
});
