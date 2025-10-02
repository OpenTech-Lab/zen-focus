import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  TimerSession: a
    .model({
      mode: a.string().required(),
      duration: a.integer().required(),
      startTime: a.datetime().required(),
      endTime: a.datetime(),
      completed: a.boolean().required(),
    })
    .authorization((allow) => [allow.owner()]),

  UserPreferences: a
    .model({
      defaultDurations: a.json().required(),
      theme: a.string().required(),
      soundEnabled: a.boolean().required(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
