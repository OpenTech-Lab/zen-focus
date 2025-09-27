import { defineAuth } from '@aws-amplify/backend'

/**
 * Define and configure a Cognito User Pool and Identity Pool
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
  },
  accountRecovery: 'EMAIL_ONLY',
  multifactor: {
    mode: 'OFF',
  },
})
