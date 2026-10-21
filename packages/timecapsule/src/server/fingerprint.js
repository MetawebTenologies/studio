import crypto from 'crypto';

const ALLOWED_MODALITIES = new Set(['image', 'i2i', 'video', 'i2v', 'v2v', 'lipsync']);

/**
 * Recursively validates and canonicalizes a JSON-compatible value:
 * - Rejects NaN, Infinity, -Infinity, functions, symbols, BigInt, and undefined array elements.
 * - Normalizes -0 to 0.
 * - Strips object keys whose values are undefined or null so omitted vs null/undefined optional
 *   fields produce identical canonical representations.
 * - Sorts object keys lexicographically at every nesting depth.
 * - Preserves array element order.
 */
export function canonicalizeValue(value, pathPrefix = 'body') {
  if (value === undefined || value === null) {
    return undefined;
  }

  const valueType = typeof value;
  if (valueType === 'boolean' || valueType === 'string') {
    return value;
  }

  if (valueType === 'number') {
    if (!Number.isFinite(value)) {
      const err = new Error(`Unsupported non-finite numeric value at ${pathPrefix}`);
      err.code = 'INVALID_REQUEST_VALUE';
      err.status = 400;
      err.statusCode = 400;
      throw err;
    }
    return Object.is(value, -0) ? 0 : value;
  }

  if (valueType === 'bigint' || valueType === 'function' || valueType === 'symbol') {
    const err = new Error(`Unsupported value type "${valueType}" at ${pathPrefix}`);
    err.code = 'INVALID_REQUEST_VALUE';
    err.status = 400;
    err.statusCode = 400;
    throw err;
  }

  if (Array.isArray(value)) {
    return value.map((item, idx) => {
      if (item === undefined || item === null) {
        const err = new Error(`Null or undefined array element is not allowed at ${pathPrefix}[${idx}]`);
        err.code = 'INVALID_REQUEST_VALUE';
        err.status = 400;
        err.statusCode = 400;
        throw err;
      }
      return canonicalizeValue(item, `${pathPrefix}[${idx}]`);
    });
  }

  if (valueType === 'object') {
    const sortedKeys = Object.keys(value).sort();
    const out = {};
    for (const key of sortedKeys) {
      const canonicalChild = canonicalizeValue(value[key], `${pathPrefix}.${key}`);
      if (canonicalChild !== undefined) {
        out[key] = canonicalChild;
      }
    }
    return out;
  }

  const err = new Error(`Unsupported value at ${pathPrefix}`);
  err.code = 'INVALID_REQUEST_VALUE';
  err.status = 400;
  err.statusCode = 400;
  throw err;
}

/**
 * Normalizes, validates, and computes the canonical SHA-256 request fingerprint
 * over all fields that affect execution or billing.
 */
export function normalizeAndFingerprintGenerationRequest(rawBody = {}) {
  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    const err = new Error('Request body must be a JSON object');
    err.code = 'INVALID_REQUEST_BODY';
    err.status = 400;
    err.statusCode = 400;
    throw err;
  }

  const modality = String(rawBody.modality ?? 'image').trim().toLowerCase();
  if (!ALLOWED_MODALITIES.has(modality)) {
    const err = new Error(`Unsupported modality: ${modality}`);
    err.code = 'INVALID_MODALITY';
    err.status = 400;
    err.statusCode = 400;
    throw err;
  }

  const model = String(rawBody.model ?? '').trim();
  if (!model) {
    const err = new Error('model is required');
    err.code = 'MISSING_MODEL';
    err.status = 400;
    err.statusCode = 400;
    throw err;
  }

  const rawInputs =
    rawBody.inputs && typeof rawBody.inputs === 'object' && !Array.isArray(rawBody.inputs)
      ? rawBody.inputs
      : {};

  // Validate numbers in rawBody before default normalization
  canonicalizeValue(rawBody, 'body');

  const prompt = String(rawInputs.prompt ?? '').trim();
  if ((modality === 'image' || modality === 'video') && !prompt) {
    const err = new Error('inputs.prompt is required for text-to-media generation');
    err.code = 'MISSING_PROMPT';
    err.status = 400;
    err.statusCode = 400;
    throw err;
  }

  const normalizedInputs = {
    ...rawInputs,
  };
  delete normalizedInputs.quality;
  delete normalizedInputs.duration;
  delete normalizedInputs.project_id;

  if (prompt) {
    normalizedInputs.prompt = prompt;
  } else {
    delete normalizedInputs.prompt;
  }

  const isVideoLike = ['video', 'i2v', 'v2v', 'lipsync'].includes(modality);
  if (modality === 'image' || modality === 'i2i') {
    normalizedInputs.aspect_ratio = String(rawInputs.aspect_ratio ?? '1:1').trim();
    normalizedInputs.resolution = String(rawInputs.resolution ?? rawInputs.quality ?? '1k')
      .trim()
      .toLowerCase();
  } else if (modality === 'video' || modality === 'i2v') {
    normalizedInputs.aspect_ratio = String(rawInputs.aspect_ratio ?? '16:9').trim();
    normalizedInputs.resolution = String(rawInputs.resolution ?? '720p')
      .trim()
      .toLowerCase();
    const rawDuration = rawInputs.duration_seconds ?? rawInputs.duration ?? 5;
    if (
      typeof rawDuration !== 'number' ||
      !Number.isFinite(rawDuration) ||
      !Number.isInteger(rawDuration) ||
      rawDuration <= 0
    ) {
      const err = new Error('inputs.duration_seconds must be a positive integer');
      err.code = 'INVALID_DURATION';
      err.status = 400;
      err.statusCode = 400;
      throw err;
    }
    normalizedInputs.duration_seconds = rawDuration;
  } else if (modality === 'lipsync') {
    normalizedInputs.resolution = String(rawInputs.resolution ?? '720p')
      .trim()
      .toLowerCase();
  }

  const projectId =
    String(rawBody.project_id ?? rawInputs.project_id ?? 'prj_default').trim() || 'prj_default';

  const rawWorkflow =
    rawBody.workflow && typeof rawBody.workflow === 'object' && !Array.isArray(rawBody.workflow)
      ? rawBody.workflow
      : {};

  const rawDelivery =
    rawBody.delivery && typeof rawBody.delivery === 'object' && !Array.isArray(rawBody.delivery)
      ? rawBody.delivery
      : {};

  const defaultFormats = isVideoLike ? ['mp4'] : ['png'];
  const normalizedDelivery = {
    ...rawDelivery,
    formats: Array.isArray(rawDelivery.formats) && rawDelivery.formats.length > 0
      ? rawDelivery.formats.map((f) => String(f).trim().toLowerCase())
      : defaultFormats,
    thumbnail: rawDelivery.thumbnail !== undefined ? Boolean(rawDelivery.thumbnail) : true,
  };

  const canonicalPayload = canonicalizeValue({
    project_id: projectId,
    modality,
    model,
    inputs: normalizedInputs,
    workflow: rawWorkflow,
    delivery: normalizedDelivery,
  });

  const canonicalJson = JSON.stringify(canonicalPayload);
  const fingerprint = crypto.createHash('sha256').update(canonicalJson, 'utf8').digest('hex');

  return {
    projectId: canonicalPayload.project_id,
    modality: canonicalPayload.modality,
    model: canonicalPayload.model,
    inputs: canonicalPayload.inputs,
    workflow: canonicalPayload.workflow,
    delivery: canonicalPayload.delivery,
    canonicalPayload,
    canonicalJson,
    fingerprint,
  };
}
