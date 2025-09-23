# AWS Amplify Configuration

This directory contains AWS Amplify configuration for the ZenFocus application.

## Setup Instructions

### Prerequisites

1. **AWS CLI**: Install and configure AWS CLI with appropriate credentials
   ```bash
   aws configure
   ```

2. **Amplify CLI**: Install globally
   ```bash
   npm install -g @aws-amplify/cli
   ```

3. **Configure Amplify CLI**: Run once to set up your AWS profile
   ```bash
   amplify configure
   ```

### Initialize Amplify Project

1. **Initialize Amplify in the project**:
   ```bash
   amplify init
   ```

   Choose the following options:
   - Project name: `zenfocus`
   - Environment: `dev`
   - Default editor: `Visual Studio Code`
   - App type: `javascript`
   - Framework: `react`
   - Source directory path: `src`
   - Distribution directory path: `out` (for Next.js static export)
   - Build command: `npm run build`
   - Start command: `npm run start`

2. **Add Authentication**:
   ```bash
   amplify add auth
   ```

   Configuration:
   - Default configuration with username login
   - How do you want users to be able to sign in? `Email`
   - Do you want to configure advanced settings? `No, I am done`

3. **Add API (GraphQL)**:
   ```bash
   amplify add api
   ```

   Configuration:
   - Select GraphQL
   - API name: `zenfocusapi`
   - Authorization type: `Amazon Cognito User Pool`
   - Do you want to configure advanced settings? `No`
   - Do you have an annotated GraphQL schema? `No`
   - Choose a schema template: `Single object with fields`
   - Do you want to edit the schema now? `Yes`

4. **Add Storage (S3)**:
   ```bash
   amplify add storage
   ```

   Configuration:
   - Select `Content (Images, audio, video, etc.)`
   - Resource name: `zenfocusstorage`
   - Bucket name: Accept default
   - Who should have access? `Auth and guest users`
   - What kind of access do you want for Authenticated users? `create/update, read, delete`
   - What kind of access do you want for Guest users? `read`

5. **Add Hosting**:
   ```bash
   amplify add hosting
   ```

   Configuration:
   - Select `Amazon CloudFront and S3`
   - hosting bucket name: Accept default

6. **Deploy the backend**:
   ```bash
   amplify push
   ```

   This will:
   - Create AWS resources
   - Generate GraphQL API
   - Create configuration files

## GraphQL Schema

The following schema is used for the ZenFocus application:

```graphql
type User @model @auth(rules: [{allow: owner}]) {
  id: ID!
  email: String! @index(name: "byEmail")
  totalFocusTime: Int!
  currentStreak: Int!
  longestStreak: Int!
  createdAt: AWSDateTime!
  lastActiveAt: AWSDateTime!
  preferences: UserPreferences @hasOne
  sessions: [Session] @hasMany
  customIntervals: [CustomInterval] @hasMany
}

type UserPreferences @model @auth(rules: [{allow: owner}]) {
  id: ID!
  userId: ID! @index(name: "byUser")
  theme: Theme!
  defaultSessionMode: SessionModeType!
  ambientSound: AmbientSoundType!
  ambientVolume: Int!
  notifications: Boolean!
  autoStartBreaks: Boolean!
  user: User @belongsTo
}

type Session @model @auth(rules: [{allow: owner}]) {
  id: ID!
  userId: ID @index(name: "byUser")
  mode: SessionModeType!
  startTime: AWSDateTime!
  endTime: AWSDateTime!
  plannedDuration: Int!
  actualDuration: Int!
  completedFully: Boolean!
  pauseCount: Int!
  totalPauseTime: Int!
  ambientSound: AmbientSoundType!
  notes: String
  user: User @belongsTo
}

type CustomInterval @model @auth(rules: [{allow: owner}]) {
  id: ID!
  userId: ID! @index(name: "byUser")
  name: String!
  workDuration: Int!
  breakDuration: Int!
  sessionMode: SessionModeType!
  isActive: Boolean!
  createdAt: AWSDateTime!
  user: User @belongsTo
}

enum Theme {
  LIGHT
  DARK
  SYSTEM
}

enum SessionModeType {
  STUDY
  DEEPWORK
  YOGA
  ZEN
}

enum AmbientSoundType {
  RAIN
  FOREST
  OCEAN
  SILENCE
}
```

## Environment Variables

After running `amplify push`, copy the generated configuration to your `.env.local`:

```bash
# Copy from aws-exports.js or amplifyconfiguration.json
NEXT_PUBLIC_AWS_REGION=your-region
NEXT_PUBLIC_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_USER_POOL_CLIENT_ID=your-app-client-id
NEXT_PUBLIC_IDENTITY_POOL_ID=your-identity-pool-id
NEXT_PUBLIC_GRAPHQL_ENDPOINT=your-graphql-endpoint
NEXT_PUBLIC_S3_BUCKET=your-storage-bucket
```

## File Structure

After setup, your amplify directory will contain:

```
amplify/
├── backend/
│   ├── api/
│   ├── auth/
│   ├── storage/
│   └── hosting/
├── team-provider-info.json
└── README.md (this file)
```

## Commands Reference

- `amplify status` - Show current status of backend resources
- `amplify push` - Deploy backend changes to AWS
- `amplify pull` - Pull latest backend configuration
- `amplify console` - Open AWS console for the app
- `amplify delete` - Delete all backend resources

## Security Notes

- Never commit `team-provider-info.json` or any files containing secrets
- Use environment variables for sensitive configuration
- Configure appropriate IAM permissions for production
- Enable MFA for AWS accounts
- Use least-privilege access principles