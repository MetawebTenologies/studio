import {
  requireSession,
  verifyMutationOrigin,
} from '../../../../../packages/timecapsule/src/server/auth.js';
import { softDeleteAsset } from '../../../../../packages/timecapsule/src/server/store.js';

export async function DELETE(request, { params }) {
  try {
    verifyMutationOrigin(request);
    const session = await requireSession(request);
    const resolvedParams = await params;
    const assetId = resolvedParams?.assetId;

    if (!assetId) {
      return Response.json(
        { error: 'Asset ID is required', code: 'MISSING_ASSET_ID' },
        { status: 400, headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
      );
    }

    const deleted = await softDeleteAsset({
      tenant_id: session.tenant_id,
      asset_id: assetId,
    });

    if (!deleted) {
      return Response.json(
        { error: `Asset "${assetId}" not found or already deleted`, code: 'ASSET_NOT_FOUND' },
        { status: 404, headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
      );
    }

    return Response.json(
      { ok: true, deleted: true, asset_id: assetId },
      { headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
    );
  } catch (err) {
    return Response.json(
      { error: err.message || 'Failed to delete asset', code: err.code || 'DELETE_ASSET_ERROR' },
      { status: err.statusCode || err.status || 500, headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
    );
  }
}
