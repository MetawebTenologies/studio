# Changelog

All notable changes to Timecapsule Studio will be documented in this file.

## [Unreleased] - 2026-10-23

### Track F9: Studio Input Parity & Durable Upload History
- **Database Migration 009 (`009_user_uploads_and_soft_delete.sql`)**:
  - Added `user_id`, `deleted_at`, `thumbnail_url`, and `metadata_json` to `assets` table.
  - Added index on active tenant uploads `idx_assets_tenant_modality_active`.
  - Re-scoped tenant RLS policy `rls_assets_tenant_isolation` to enforce `deleted_at IS NULL` for tenant queries while preserving system maintenance access.
- **Durable Server Uploads (`/api/v1/uploads`)**:
  - Added server-side file magic-number inspection (`validateFileMagicBytes`) rejecting spoofed or malicious uploads (PNG, JPEG, WebP, MP4, WebM, MP3, WAV).
  - Added `GET /api/v1/uploads` listing tenant-scoped active uploads.
  - Added `DELETE /api/v1/uploads/[assetId]` providing transactional soft deletion.
- **Model Capabilities Schema (`packages/timecapsule/src/models/capabilities.js`)**:
  - Established unified `getModelCapabilities(slug)` providing model capabilities (aspect ratios, resolutions, qualities, durations, reference support) shared between `/studio` and `/[slug]`.
- **UI Enhancements**:
  - `ModelPlayground.jsx` (`/[slug]`): Dynamic aspect ratios, resolutions, duration selector, and multi-image reference drawer with order badges (`Ref #1`, `Ref #2`), upload history picker, and face consent notice.
  - `ImageStudio.jsx` (`/studio`): Connected persistent upload history picker from server store, soft delete support, and face consent notice.

### Track F10: Data-Driven Cinema Presets
- **Configuration Externalization**:
  - Moved hardcoded camera, lens, focal length, and aperture dictionaries into `packages/timecapsule/src/config/cinema-presets.json`.
  - Implemented `resolveCinemaPresets()` in `packages/timecapsule/src/models/cinema.js` supporting tenant branding overrides (`tenantConfig.branding.cinema_presets`).
  - Refactored `CinemaStudio.jsx` and `src/lib/promptUtils.js` to consume from unified preset definitions.

### Quality Assurance & Automated Tests
- Added `tests/uploads_and_parity.test.mjs` verifying magic byte inspection, upload registration, cross-tenant isolation, soft deletion, capabilities resolution, and cinema preset tenant overrides (43/43 passing across all suites).
