import {
  t2iModels,
  t2vModels,
  i2iModels,
  i2vModels,
  v2vModels,
  lipsyncModels,
  timecapsuleNativeModels,
  inheritedUpstreamCatalog,
  SUPPORTED_RELEASE_MODELS,
  CONTRACT_VERIFICATION_STATUSES,
  PRICING_POLICY_VERSION,
  EXECUTION_ROUTE_VERSION,
  PROVIDER_DOCUMENTATION_REGISTRY,
  getProviderForModel,
  getEstimatedCreditsForModel,
} from '../../../../packages/timecapsule/src/models/index.js';

export async function GET() {
  const muapiConfigured = Boolean(process.env.MUAPI_API_KEY && process.env.MUAPI_API_KEY.trim());
  const kieConfigured = Boolean(process.env.KIE_API_KEY && process.env.KIE_API_KEY.trim());

  const isProviderConfigured = (provider) => {
    if (provider === 'muapi') return muapiConfigured;
    if (provider === 'kie') return kieConfigured;
    return false;
  };

  const defaultProvider =
    typeof process.env.TIMECAPSULE_DEFAULT_PROVIDER === 'string' &&
    process.env.TIMECAPSULE_DEFAULT_PROVIDER.trim()
      ? process.env.TIMECAPSULE_DEFAULT_PROVIDER.trim().toLowerCase()
      : 'muapi';

  const summarize = (list, modality) =>
    list.map((m) => {
      const primaryProvider = m.primary_provider || getProviderForModel(m.id);
      const activeProvider =
        defaultProvider && m.alternative_providers?.[defaultProvider]
          ? defaultProvider
          : primaryProvider;
      const enabled = m.enabled !== false && m.managed_supported !== false;
      const availability = !enabled
        ? m.availability || m.verification_status || 'disabled'
        : isProviderConfigured(activeProvider)
          ? 'available'
          : 'credentials_missing';

      return {
        id: m.id,
        timecapsule_model_id: m.timecapsule_model_id || m.id,
        name: m.name,
        family: m.family || null,
        modality: m.modality || modality,
        provider: primaryProvider,
        primary_provider: primaryProvider,
        active_provider: activeProvider,
        provider_model_id: m.provider_model_id || m.endpoint || m.id,
        execution_route: m.execution_route || null,
        execution_route_version: m.execution_route_version || EXECUTION_ROUTE_VERSION,
        pricing_policy_version: m.pricing_policy_version || PRICING_POLICY_VERSION,
        alternative_providers: m.alternative_providers
          ? Object.fromEntries(
              Object.entries(m.alternative_providers).map(([provKey, altSpec]) => [
                provKey,
                {
                  ...altSpec,
                  configured: isProviderConfigured(provKey),
                },
              ])
            )
          : {},
        verification_status: m.verification_status || (enabled ? 'contract_tested' : 'disabled'),
        availability,
        available: availability === 'available',
        enabled,
        managed_supported: Boolean(m.managed_supported),
        required_inputs: m.required_inputs || [],
        optional_inputs: m.optional_inputs || [],
        credit_estimate_policy: m.credit_estimate_policy || null,
        estimated_credits: getEstimatedCreditsForModel(m.id, modality),
      };
    });

  const summarizedCatalog = {
    t2i: summarize(t2iModels, 'image'),
    t2v: summarize(t2vModels, 'video'),
    i2i: summarize(i2iModels, 'i2i'),
    i2v: summarize(i2vModels, 'i2v'),
    v2v: summarize(v2vModels, 'v2v'),
    lipsync: summarize(lipsyncModels, 'lipsync'),
  };

  return Response.json(
    {
      ok: true,
      default_provider: defaultProvider,
      pricing_policy_version: PRICING_POLICY_VERSION,
      execution_route_version: EXECUTION_ROUTE_VERSION,
      verification_statuses: CONTRACT_VERIFICATION_STATUSES,
      documentation_registry: PROVIDER_DOCUMENTATION_REGISTRY,
      providers: {
        muapi: {
          primary: true,
          configured: muapiConfigured,
          base_url: PROVIDER_DOCUMENTATION_REGISTRY.muapi.base_url,
        },
        kie: {
          primary: false,
          alternative: true,
          configured: kieConfigured,
          base_url: PROVIDER_DOCUMENTATION_REGISTRY.kie.base_url,
        },
        'timecapsule-gpu': {
          configured: false,
          verified_worker: false,
          verification_status: 'disabled',
          reason: 'Self-hosted GPU worker adapter is not verified in this checkpoint.',
        },
      },
      native_models: timecapsuleNativeModels,
      release_catalog: summarize(SUPPORTED_RELEASE_MODELS, 'release'),
      counts: {
        release_supported: SUPPORTED_RELEASE_MODELS.length,
        t2i: t2iModels.length,
        t2v: t2vModels.length,
        i2i: i2iModels.length,
        i2v: i2vModels.length,
        v2v: v2vModels.filter((m) => m.enabled !== false).length,
        lipsync: lipsyncModels.filter((m) => m.enabled !== false).length,
      },
      catalog: summarizedCatalog,
      models: {
        image: summarizedCatalog.t2i,
        video: summarizedCatalog.t2v,
        i2i: summarizedCatalog.i2i,
        i2v: summarizedCatalog.i2v,
        v2v: summarizedCatalog.v2v,
        lipsync: summarizedCatalog.lipsync,
      },
      inherited_upstream_catalog: inheritedUpstreamCatalog,
    },
    {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
      },
    }
  );
}
