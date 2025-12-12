export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'MoodFlow API',
    version: '2.0.0'
  },
  servers: [{ url: '/' }],
  paths: {
    '/health': { get: { responses: { '200': { description: 'OK' } } } },
    '/api/auth/register': { post: { responses: { '201': { description: 'Created' } } } },
    '/api/auth/login': { post: { responses: { '200': { description: 'OK' } } } },
    '/api/auth/refresh': { post: { responses: { '200': { description: 'OK' } } } },
    '/api/auth/me': { get: { responses: { '200': { description: 'OK' } } } },
    '/api/sync/records': {
      get: { responses: { '200': { description: 'OK' } } },
      post: { responses: { '200': { description: 'OK' } } },
      delete: { responses: { '200': { description: 'OK' } } }
    },
    '/api/sync/records/{dateKey}': {
      put: { responses: { '200': { description: 'OK' } } },
      delete: { responses: { '200': { description: 'OK' } } }
    },
    '/api/sync/status': { get: { responses: { '200': { description: 'OK' } } } },
    '/api/backup/list': { get: { responses: { '200': { description: 'OK' } } } },
    '/api/backup/create': { post: { responses: { '201': { description: 'Created' } } } },
    '/api/backup/{id}': { get: { responses: { '200': { description: 'OK' } } } },
    '/api/backup/{id}/restore': { post: { responses: { '200': { description: 'OK' } } } },
    '/api/backup/{id}/download': { get: { responses: { '200': { description: 'OK' } } } },
    '/api/user/profile': { put: { responses: { '200': { description: 'OK' } } } },
    '/api/user/settings': {
      get: { responses: { '200': { description: 'OK' } } },
      put: { responses: { '200': { description: 'OK' } } }
    },
    '/api/user/password': { put: { responses: { '200': { description: 'OK' } } } },
    '/api/user/account': { delete: { responses: { '200': { description: 'OK' } } } },
    '/api/user/export': { post: { responses: { '200': { description: 'OK' } } } }
  }
} as const;
