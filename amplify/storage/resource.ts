import { defineStorage } from '@aws-amplify/backend'

export const storage = defineStorage({
  name: 'zenfocusStorage',
  access: (allow) => ({
    'profile-pictures/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
    'session-exports/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
    'ambient-sounds/*': [
      allow.authenticated.to(['read']),
      allow.guest.to(['read']),
    ],
  }),
})