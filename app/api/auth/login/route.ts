import { NextRequest } from 'next/server'
import { AuthService } from '../../../../src/lib/amplify/auth'
import { createUser, validateUser } from '../../../../lib/models/user'
import {
  createDefaultUserPreferences,
  validateUserPreferences,
} from '../../../../lib/models/user-preferences'
import {
  createErrorResponse,
  createSuccessResponse,
  handleValidationError,
  handleJsonParsingError,
  handleAmplifyAuthError,
  generateMockToken,
  AuthSchemas,
} from '../../../../lib/utils/api-response'

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validationResult = AuthSchemas.login.safeParse(body)

    // Handle validation errors
    const validationError = handleValidationError(validationResult)
    if (validationError) {
      return validationError
    }

    const { email, password } = validationResult.data

    try {
      // Attempt to sign in with AWS Amplify
      const authResult = await AuthService.signIn({ email, password })

      if (!authResult.success) {
        return createErrorResponse(
          401,
          'AUTHENTICATION_FAILED',
          authResult.error || 'Invalid credentials'
        )
      }

      if (!authResult.isSignedIn || !authResult.user) {
        return createErrorResponse(401, 'AUTHENTICATION_FAILED', 'Authentication incomplete')
      }

      // Create user data based on Amplify user info
      const user = createUser(authResult.user.email || email)
      user.id = authResult.user.userId

      // Validate user data
      const userValidation = validateUser(user)
      if (!userValidation.success) {
        console.error('User validation failed:', userValidation.error)
        return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to create user data')
      }

      // Create default preferences for the user
      const preferences = createDefaultUserPreferences()

      // Validate preferences
      const preferencesValidation = validateUserPreferences(preferences)
      if (!preferencesValidation.success) {
        console.error('Preferences validation failed:', preferencesValidation.error)
        return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to create user preferences')
      }

      // Generate token
      const token = generateMockToken(user.id)

      // Return successful login response
      return createSuccessResponse({
        token,
        user: userValidation.data,
        preferences: preferencesValidation.data,
      })
    } catch (amplifyError) {
      console.error('Amplify authentication error:', amplifyError)
      return handleAmplifyAuthError(amplifyError)
    }
  } catch (error) {
    console.error('Login API error:', error)

    // Handle JSON parsing errors
    const jsonError = handleJsonParsingError(error)
    if (jsonError) {
      return jsonError
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Internal server error')
  }
}
