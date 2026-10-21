import {
  runMigrations,
  getMigrationStatus,
  seedDevelopmentTenant,
  closePool,
} from '../server/db.js';
import { PREVIEW_IDENTITY } from '../server/auth.js';

async function main() {
  const cmd = process.argv[2] || 'status';
  try {
    if (cmd === 'migrate') {
      const result = await runMigrations();
      console.log(
        JSON.stringify(
          {
            ok: true,
            command: 'migrate',
            total_migrations: result.totalMigrations,
            newly_applied: result.newlyApplied,
          },
          null,
          2
        )
      );
    } else if (cmd === 'status') {
      const status = await getMigrationStatus();
      console.log(JSON.stringify({ ok: true, command: 'status', migrations: status }, null, 2));
    } else if (cmd === 'seed') {
      await runMigrations();
      const targetCredits = Number(process.env.TIMECAPSULE_SEED_CREDITS || 5000);
      const tenantId = process.env.TIMECAPSULE_SEED_TENANT_ID || PREVIEW_IDENTITY.tenant_id;
      const seeded = await seedDevelopmentTenant({ tenantId, targetCredits });
      console.log(
        JSON.stringify(
          {
            ok: true,
            command: 'seed',
            tenant: seeded,
          },
          null,
          2
        )
      );
    } else {
      console.error(`Unknown db command: ${cmd}. Expected: migrate | status | seed`);
      process.exitCode = 1;
    }
  } catch (err) {
    console.error(
      JSON.stringify({
        ok: false,
        command: cmd,
        code: err.code || 'DB_CLI_ERROR',
        error: err.message,
      })
    );
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

main();
