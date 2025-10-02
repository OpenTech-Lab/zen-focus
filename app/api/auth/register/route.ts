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
    const validationResult = AuthSchemas.register.safeParse(body)

    // Handle validation errors
    const validationError = handleValidationError(validationResult)
    if (validationError) {
      return validationError
    }

    const { email, password } = validationResult.data

    try {
      // Attempt to sign up with AWS Amplify
      const authResult = await AuthService.signUp({ email, password })

      if (!authResult.success) {
        // Handle specific registration errors
        const errorMessage = authResult.error || 'Registration failed'

        if (
          errorMessage.includes('UsernameExistsException') ||
          errorMessage.includes('An account with the given email already exists')
        ) {
          return createErrorResponse(
            400,
            'EMAIL_EXISTS',
            'An account with this email already exists'
          )
        }

        return createErrorResponse(400, 'REGISTRATION_FAILED', errorMessage)
      }

      // For now, we'll assume the registration is complete and auto-confirm
      // In a real implementation, you might need to handle confirmation flow
      let userId = authResult.userId

      // If registration requires confirmation, we still need to create user data
      if (!userId) {
        // Generate a temporary user ID for response
        userId = crypto.randomUUID()
      }

      // Create user data
      const user = createUser(email)
      user.id = userId

      // Validate user data
      const userValidation = validateUser(user)
      if (!userValidation.success) {
        console.error('User validation failed:', userValidation.error)
        return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to create user data')
      }

      // Create default preferences for the new user
      const preferences = createDefaultUserPreferences()

      // Validate preferences
      const preferencesValidation = validateUserPreferences(preferences)
      if (!preferencesValidation.success) {
        console.error('Preferences validation failed:', preferencesValidation.error)
        return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to create user preferences')
      }

      // Generate token
      const token = generateMockToken(user.id)

      // Return successful registration response
      return createSuccessResponse(
        {
          token,
          user: userValidation.data,
          preferences: preferencesValidation.data,
        },
        201
      )

    } catch (amplifyError) {
      console.error('Amplify registration error:', amplifyError)
      return handleAmplifyAuthError(amplifyError)
    }
  } catch (error) {
    console.error('Registration API error:', error)

    // Handle JSON parsing errors
    const jsonError = handleJsonParsingError(error)
    if (jsonError) {
      return jsonError
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Internal server error')
  }
}
