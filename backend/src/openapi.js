/** OpenAPI 3.0 spec for Katha Creator API (validation & testing). */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Katha Creator API',
    version: '1.0.0',
    description: 'Creator CMS backend — dashboard, stories, chapters, analytics.',
  },
  servers: [{ url: '/api', description: 'API base' }],
  paths: {
    '/health': {
      get: { summary: 'Health check', responses: { 200: { description: 'OK' } } },
    },
    '/creators/dashboard': {
      get: {
        summary: 'Creator dashboard',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Dashboard payload' } },
      },
    },
    '/creators/stories': {
      get: {
        summary: 'List creator stories',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Stories list' } },
      },
    },
    '/creators/stories/{storyId}/chapters': {
      get: {
        summary: 'List story chapters (published + drafts)',
        parameters: [{ name: 'storyId', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Chapters list' } },
      },
    },
    '/creators/analytics/{storyId}': {
      get: {
        summary: 'Story analytics',
        parameters: [{ name: 'storyId', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Analytics payload with optional demographics' } },
      },
    },
    '/chapters/{storyId}/draft': {
      post: {
        summary: 'Save chapter draft',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Draft saved' } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
};