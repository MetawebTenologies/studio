import { NextResponse } from 'next/server';
import {
  t2iModels,
  t2vModels,
  i2iModels,
  i2vModels,
  v2vModels,
  lipsyncModels,
  timecapsuleNativeModels,
  getProviderForModel,
  getEstimatedCreditsForModel,
} from '../../../../packages/timecapsule/src/models/index.js';

export async function GET() {
  const summarize = (list, modality) =>
    list.map((m) => ({
      id: m.id,
      name: m.name,
      family: m.family || null,
      modality,
      provider: getProviderForModel(m.id),
      estimated_credits: getEstimatedCreditsForModel(m.id, modality),
    }));

  return NextResponse.json({
    ok: true,
    native_models: timecapsuleNativeModels,
    counts: {
      t2i: t2iModels.length,
      t2v: t2vModels.length,
      i2i: i2iModels.length,
      i2v: i2vModels.length,
      v2v: v2vModels.length,
      lipsync: lipsyncModels.length,
    },
    catalog: {
      t2i: summarize(t2iModels, 'image'),
      t2v: summarize(t2vModels, 'video'),
      i2i: summarize(i2iModels, 'i2i'),
      i2v: summarize(i2vModels, 'i2v'),
      v2v: summarize(v2vModels, 'v2v'),
      lipsync: summarize(lipsyncModels, 'lipsync'),
    },
  });
}
