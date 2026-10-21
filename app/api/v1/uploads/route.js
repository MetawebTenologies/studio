import { NextResponse } from 'next/server';
import { requireSession } from '../../../../packages/timecapsule/src/server/auth.js';
import { registerAsset } from '../../../../packages/timecapsule/src/server/store.js';

export async function POST(request) {
  try {
    const session = await requireSession(request);
    const body = await request.json().catch(() => ({}));
    const dataUrl = String(body.dataUrl || '').trim();
    const filename = String(body.filename || 'upload.bin').trim();
    const contentType = String(body.contentType || 'application/octet-stream').trim();

    if (!dataUrl) {
      return NextResponse.json({ error: 'dataUrl is required' }, { status: 400 });
    }

    // If KIE_API_KEY is configured and not in dry-run, upload to Kie CDN server-side
    const kieKey = process.env.KIE_API_KEY;
    if (kieKey && process.env.TIMECAPSULE_DRY_RUN !== '1' && dataUrl.startsWith('data:')) {
      const res = await fetch('https://kieai.redpandaai.co/api/file-base64-upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kieKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Data: dataUrl,
          uploadPath: 'timecapsule/uploads',
          fileName: filename,
        }),
      });
      const json = await res.json().catch(() => ({}));
      const remoteUrl = json?.data?.downloadUrl || json?.data?.fileUrl;
      if (res.ok && remoteUrl) {
        const asset = registerAsset({
          tenant_id: session.tenant_id,
          source_url: remoteUrl,
          modality: 'upload',
          content_type: contentType,
          filename,
        });
        return NextResponse.json({
          ok: true,
          asset_id: asset.asset_id,
          url: remoteUrl,
          delivery_url: asset.url,
        });
      }
    }

    const asset = registerAsset({
      tenant_id: session.tenant_id,
      source_url: dataUrl,
      modality: 'upload',
      content_type: contentType,
      filename,
    });

    return NextResponse.json({
      ok: true,
      asset_id: asset.asset_id,
      url: asset.url,
      delivery_url: asset.url,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Upload failed' },
      { status: err.statusCode || 500 }
    );
  }
}
