import {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  type SignUpInput,
  type SignInInput,
  type ResetPasswordInput,
  type ConfirmResetPasswordInput,
} from 'aws-amplify/auth'

// Types for authentication
export interface AuthUser {
  userId: string
  username: string
  email?: string
  isGuest: boolean
}

export interface SignUpData {
  email: string
  password: string
}

export interface SignInData {
  email: string
  password: string
}

export interface ResetPasswordData {
  email: string
}

export interface ConfirmResetPasswordData {
  email: string
  confirmationCode: string
  newPassword: string
}

// Authentication functions
export class AuthService {
  /**
   * Sign up a new user
   */
  static async signUp({ email, password }: SignUpData) {
    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      })

      return {
        success: true,
        isSignUpComplete,
        userId,
        nextStep,
      }
    } catch (error) {
      console.error('Sign up error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign up failed',
      }
    }
  }

  /**
   * Confirm sign up with verification code
   */
  static async confirmSignUp(email: string, confirmationCode: string) {
    try {
      const result = await confirmSignUp({
        username: email,
        confirmationCode,
      })

      return {
        success: true,
        result,
      }
    } catch (error) {
      console.error('Confirm sign up error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Confirmation failed',
      }
    }
  }

  /**
   * Resend confirmation code
   */
  static async resendConfirmationCode(email: string) {
    try {
      await resendSignUpCode({
        username: email,
      })

      return {
        success: true,
      }
    } catch (error) {
      console.error('Resend code error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resend code',
      }
    }
  }

  /**
   * Sign in user
   */
  static async signIn({ email, password }: SignInData) {
    try {
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password,
      })

      if (isSignedIn) {
        const user = await this.getCurrentUser()
        return {
          success: true,
          isSignedIn,
          user,
        }
      }

      return {
        success: true,
        isSignedIn,
        nextStep,
      }
    } catch (error) {
      console.error('Sign in error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      }
    }
  }

  /**
   * Sign out user
   */
  static async signOut() {
    try {
      await signOut()
      return {
        success: true,
      }
    } catch (error) {
      console.error('Sign out error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
      }
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const user = await getCurrentUser()
      return {
        userId: user.userId,
        username: user.username,
        email: user.signInDetails?.loginId,
        isGuest: false,
      }
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  /**
   * Reset password
   */
  static async resetPassword({ email }: ResetPasswordData) {
    try {
      const result = await resetPassword({
        username: email,
      })

      return {
        success: true,
        nextStep: result.nextStep,
      }
    } catch (error) {
      console.error('Reset password error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Reset password failed',
      }
    }
  }

  /**
   * Confirm reset password
   */
  static async confirmResetPassword({
    email,
    confirmationCode,
    newPassword,
  }: ConfirmResetPasswordData) {
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode,
        newPassword,
      })

      return {
        success: true,
      }
    } catch (error) {
      console.error('Confirm reset password error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password reset confirmation failed',
      }
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const user = await getCurrentUser()
      return !!user
    } catch {
      return false
    }
  }

  /**
   * Create guest user session (for local storage)
   */
  static createGuestUser(): AuthUser {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      userId: guestId,
      username: 'Guest User',
      isGuest: true,
    }
  }
}