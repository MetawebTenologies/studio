export const TIMECAPSULE_BRAND = {
  name: 'Timecapsule',
  shortName: 'TC',
  title: 'Timecapsule — AI Cinema, Video & Image Studio',
  description:
    'Timecapsule multimodal creative studio for AI cinema, video, image, and lip-sync generation with a secure managed BFF boundary.',
  tagline: 'Multimodal AI Production Studio',
  accentColor: '#00e5ff',
  accentHover: '#38bdf8',
  accentSecondary: '#6366f1',
  bgApp: '#09090b',
  bgPanel: '#121217',
  storageKeys: {
    apiKey: 'timecapsule_api_key',
    legacyApiKey: 'kie_key',
    backendMode: 'timecapsule_mode',
    legacyBackendMode: 'cf_backend',
    sessionToken: 'timecapsule_session_token',
    imageOutputs: 'studio_image_outputs',
    videoOutputs: 'studio_video_outputs',
    cinemaOutputs: 'studio_cinema_outputs',
    lipsyncOutputs: 'studio_lipsync_outputs',
    pendingJobs: 'pending_generation_jobs_v1',
  },
  routes: {
    bffBase: '/api/v1',
    generations: '/api/v1/generations',
    uploads: '/api/v1/uploads',
    models: '/api/v1/models',
    session: '/api/v1/session',
    assets: '/api/v1/assets',
  },
};

export default TIMECAPSULE_BRAND;
