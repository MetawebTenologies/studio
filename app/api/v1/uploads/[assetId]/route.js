import {
  requireSession,
  verifyMutationOrigin,
} from '../../../../../packages/timecapsule/src/server/auth.js';
import { getAsset, softDeleteAsset } from '../../../../../packages/timecapsule/src/server/store.js';
import { handleCorsPreflight, getCorsHeaders } from '../../../../../packages/timecapsule/src/server/cors.js';
import { sanitizeError } from '../../../../../packages/timecapsule/src/server/credentials.js';

export async function OPTIONS(request) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;
  return new Response(null, { status: 204 });
}

export async function DELETE(request, { params }) {
  const corsHeaders = getCorsHeaders(request);
  try {
    verifyMutationOrigin(request);
    const session = await requireSession(request);
    const resolvedParams = await params;
    const assetId = resolvedParams?.assetId;

    if (!assetId) {
      return Response.json(
        { error: 'Asset ID is required', code: 'MISSING_ASSET_ID' },
        { status: 400, headers: { 'Cache-Control': 'private, no-store, max-age=0', ...corsHeaders } }
      );
    }

    // Task C1: Look up asset within tenant context
    const asset = await getAsset(assetId, { tenant_id: session.tenant_id });
    if (!asset) {
      return Response.json(
        { error: `Asset "${assetId}" not found or already deleted`, code: 'ASSET_NOT_FOUND' },
        { status: 404, headers: { 'Cache-Control': 'private, no-store, max-age=0', ...corsHeaders } }
      );
    }

    // User-scoped check: only the uploading user or a tenant/platform admin can delete
    const isOwner = !asset.user_id || asset.user_id === session.user_id;
    const isAdmin =
      session.role === 'platform_admin' ||
      session.role === 'admin' ||
      session.role === 'reseller_admin';

    if (!isOwner && !isAdmin) {
      return Response.json(
        {
          error: 'Forbidden: you cannot delete an asset uploaded by another user',
          code: 'FORBIDDEN_ASSET_DELETE',
        },
        { status: 403, headers: { 'Cache-Control': 'private, no-store, max-age=0', ...corsHeaders } }
      );
    }

    const deleted = await softDeleteAsset({
      tenant_id: session.tenant_id,
      asset_id: assetId,
    });

    if (!deleted) {
      return Response.json(
        { error: `Asset "${assetId}" not found or already deleted`, code: 'ASSET_NOT_FOUND' },
        { status: 404, headers: { 'Cache-Control': 'private, no-store, max-age=0', ...corsHeaders } }
      );
    }

    return Response.json(
      { ok: true, deleted: true, asset_id: assetId },
      { headers: { 'Cache-Control': 'private, no-store, max-age=0', ...corsHeaders } }
    );
  } catch (err) {
    const safe = sanitizeError(err, err.statusCode || err.status || 500);
    return Response.json(
      { error: safe.error, code: safe.code },
      { status: safe.statusCode, headers: { 'Cache-Control': 'private, no-store, max-age=0', ...corsHeaders } }
    );
  }
}
