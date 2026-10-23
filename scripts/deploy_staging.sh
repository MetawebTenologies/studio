#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Timecapsule Studio — Zero-Waste Private Staging Deployment Script
# Deploys Web BFF to Google Cloud Run with scale-to-zero ($0 idle cost)
# ==============================================================================

PROJECT_ID="daddu-ai-studio-d57af"
REGION="us-central1"
SERVICE_NAME="timecapsule-staging-web"

echo "=== Timecapsule Staging Deploy ==="
echo "Project:  ${PROJECT_ID}"
echo "Region:   ${REGION}"
echo "Service:  ${SERVICE_NAME}"
echo "=================================="

# Check for required DATABASE_URL
if [[ -z "${STAGING_DATABASE_URL:-}" && -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: Please set STAGING_DATABASE_URL or DATABASE_URL before deploying."
  echo "Example: STAGING_DATABASE_URL='postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require' ./scripts/deploy_staging.sh"
  exit 1
fi

TARGET_DB_URL="${STAGING_DATABASE_URL:-$DATABASE_URL}"

# 1. Run Migrations against the Staging Database
echo "Step 1: Running PostgreSQL migrations (001–013)..."
DATABASE_URL="${TARGET_DB_URL}" node -e '
  import("./packages/timecapsule/src/server/db.js").then(async ({ runMigrations, closePool }) => {
    try {
      const result = await runMigrations();
      console.log("Migrations applied successfully:", result.newlyApplied.length, "new, total:", result.totalMigrations);
    } finally {
      await closePool();
    }
  }).catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  });
'

# 2. Deploy Web BFF to Cloud Run (Scale-to-Zero = $0.00 idle cost)
echo "Step 2: Deploying ${SERVICE_NAME} to Cloud Run with scale-to-zero (min-instances=0)..."

gcloud run deploy "${SERVICE_NAME}" \
  --source . \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=2 \
  --cpu=1 \
  --memory=512Mi \
  --timeout=300 \
  --set-env-vars="NODE_ENV=production,PORT=8080,TIMECAPSULE_DEFAULT_PROVIDER=fal" \
  --set-env-vars="DATABASE_URL=${TARGET_DB_URL}" \
  ${FAL_KEY:+--set-env-vars="FAL_KEY=${FAL_KEY}"} \
  ${REPLICATE_API_TOKEN:+--set-env-vars="REPLICATE_API_TOKEN=${REPLICATE_API_TOKEN}"} \
  ${TIMECAPSULE_SESSION_SECRET:+--set-env-vars="TIMECAPSULE_SESSION_SECRET=${TIMECAPSULE_SESSION_SECRET}"} \
  ${TIMECAPSULE_PREVIEW_KEY:+--set-env-vars="TIMECAPSULE_PREVIEW_KEY=${TIMECAPSULE_PREVIEW_KEY}"}

echo "=== Deployment Succeeded! ==="
gcloud run services describe "${SERVICE_NAME}" --project="${PROJECT_ID}" --region="${REGION}" --format="value(status.url)"
