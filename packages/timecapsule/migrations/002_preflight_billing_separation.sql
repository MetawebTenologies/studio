-- Pre-Flight Fix (Checkpoint 3A): Separate provider-reported cost from Timecapsule user-billed credits
-- Never equate external provider credits/currency with Timecapsule integer credits.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS user_billed_credits BIGINT NULL,
  ADD COLUMN IF NOT EXISTS provider_reported_cost NUMERIC(18, 6) NULL,
  ADD COLUMN IF NOT EXISTS provider_cost_unit TEXT NULL;

ALTER TABLE jobs
  DROP CONSTRAINT IF EXISTS chk_jobs_user_billed_credits_bounds;

ALTER TABLE jobs
  ADD CONSTRAINT chk_jobs_user_billed_credits_bounds
  CHECK (
    user_billed_credits IS NULL OR (
      user_billed_credits >= 0 AND
      user_billed_credits <= credits_reserved AND
      (actual_cost IS NULL OR user_billed_credits = actual_cost)
    )
  );

ALTER TABLE jobs
  DROP CONSTRAINT IF EXISTS chk_jobs_provider_reported_cost_nonnegative;

ALTER TABLE jobs
  ADD CONSTRAINT chk_jobs_provider_reported_cost_nonnegative
  CHECK (provider_reported_cost IS NULL OR provider_reported_cost >= 0);
