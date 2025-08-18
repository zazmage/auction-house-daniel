export const endpoints = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    apiKey: '/auth/create-api-key',
  },
  profiles: (name) => `/profiles/${name}`,
}
