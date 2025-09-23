import { Amplify } from 'aws-amplify'

// Amplify configuration that will be populated when backend is set up
const amplifyConfig = {
  // Authentication configuration
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
      identityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID || '',
      loginWith: {
        email: true,
        username: false,
      },
      signUpVerificationMethod: 'code' as const,
      userAttributes: {
        email: {
          required: true,
        },
      },
      allowGuestAccess: true,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: false,
      },
    },
  },
  // Data/API configuration
  API: {
    GraphQL: {
      endpoint: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || '',
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      defaultAuthMode: 'userPool' as const,
    },
  },
  // Storage configuration
  Storage: {
    S3: {
      bucket: process.env.NEXT_PUBLIC_S3_BUCKET || '',
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    },
  },
  // DataStore configuration
  DataStore: {
    authModeStrategyType: 'multiAuth' as const,
    conflictHandler: 'automerge' as const,
    syncPageSize: 1000,
    fullSyncInterval: 24 * 60, // 24 hours in minutes
    syncInterval: 1 * 60, // 1 minute
    maxRecordsToSync: 10000,
  },
}

// Configure Amplify
export function configureAmplify() {
  try {
    Amplify.configure(amplifyConfig)
    console.log('✅ Amplify configured successfully')
  } catch (error) {
    console.error('❌ Failed to configure Amplify:', error)
  }
}

export { amplifyConfig }
