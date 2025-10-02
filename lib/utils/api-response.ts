import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  error: string
  message: string
}

/**
 * Standard API success response structure
 */
export interface ApiSuccessResponse<T = any> {
  data?: T
  [key: string]: any
}

/**
 * Helper function to create standardized error responses
 * @param status HTTP status code
 * @param error Error code/type
 * @param message Human-readable error message
 * @returns NextResponse with error structure
 */
export function createErrorResponse(
  status: number,
  error: string,
  message: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ error, message }, { status })
}

/**
 * Helper function to create standardized success responses
 * @param data Response data
 * @param status HTTP status code (default: 200)
 * @returns NextResponse with success structure
 */
export function createSuccessResponse<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status })
}

/**
 * Helper function to handle Zod validation errors
 * @param validationResult Zod validation result
 * @returns Error response if validation failed, null if successful
 */
export function handleValidationError(
  validationResult: z.SafeParseReturnType<any, any>
): NextResponse<ApiErrorResponse> | null {
  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0]
    return createErrorResponse(400, 'VALIDATION_ERROR', firstError.message)
  }
  return null
}

/**
 * Helper function to handle JSON parsing errors
 * @param error The caught error
 * @returns Error response if it's a JSON parsing error, null otherwise
 */
export function handleJsonParsingError(error: unknown): NextResponse<ApiErrorResponse> | null {
  if (error instanceof SyntaxError) {
    return createErrorResponse(400, 'INVALID_JSON', 'Invalid JSON in request body')
  }
  return null
}

/**
 * Helper function to handle Amplify authentication errors
 * @param error Amplify error
 * @returns Appropriate error response based on error type
 */
export function handleAmplifyAuthError(error: unknown): NextResponse<ApiErrorResponse> {
  const errorMessage = error instanceof Error ? error.message : 'Authentication failed'

  // User not confirmed
  if (errorMessage.includes('UserNotConfirmedException')) {
    return createErrorResponse(401, 'USER_NOT_CONFIRMED', 'User account not confirmed')
  }

  // Invalid credentials
  if (
    errorMessage.includes('NotAuthorizedException') ||
    errorMessage.includes('UserNotFoundException')
  ) {
    return createErrorResponse(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
  }

  // User already exists
  if (errorMessage.includes('UsernameExistsException') || errorMessage.includes('already exists')) {
    return createErrorResponse(400, 'EMAIL_EXISTS', 'An account with this email already exists')
  }

  // Invalid password
  if (errorMessage.includes('InvalidPasswordException')) {
    return createErrorResponse(
      400,
      'INVALID_PASSWORD',
      'Password does not meet security requirements'
    )
  }

  // Invalid parameters
  if (errorMessage.includes('InvalidParameterException')) {
    return createErrorResponse(400, 'INVALID_PARAMETER', 'Invalid request parameters')
  }

  // Generic authentication failure
  if (errorMessage.includes('Auth') || errorMessage.includes('Cognito')) {
    return createErrorResponse(401, 'AUTHENTICATION_FAILED', 'Authentication failed')
  }

  // Default error
  return createErrorResponse(500, 'INTERNAL_ERROR', 'Internal server error')
}

/**
 * Helper function to generate mock JWT tokens
 * In a real implementation, this would use a proper JWT library like jose or jsonwebtoken
 * @param userId User identifier
 * @param expiresInHours Expiration time in hours (default: 24)
 * @returns Base64 encoded mock token
 */
export function generateMockToken(userId: string, expiresInHours: number = 24): string {
  const payload = {
    userId,
    iat: Date.now(),
    exp: Date.now() + expiresInHours * 60 * 60 * 1000,
  }
  return btoa(JSON.stringify(payload))
}

/**
 * Common validation schemas for API requests
 */
export const CommonSchemas = {
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  id: z.string().uuid('Invalid ID format'),
} as const

/**
 * Authentication request schemas
 */
export const AuthSchemas = {
  login: z.object({
    email: CommonSchemas.email,
    password: CommonSchemas.password,
  }),
  register: z.object({
    email: CommonSchemas.email,
    password: CommonSchemas.password,
  }),
} as const

/**
 * Type definitions for auth requests
 */
export type LoginRequest = z.infer<typeof AuthSchemas.login>
export type RegisterRequest = z.infer<typeof AuthSchemas.register>
