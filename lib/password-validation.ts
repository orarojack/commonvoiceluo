/**
 * Password validation utility for strong password requirements
 */

export interface PasswordRequirements {
  length: boolean
  uppercase: boolean
  lowercase: boolean
  number: boolean
  special: boolean
}

export interface PasswordValidationResult {
  score: number
  feedback: string
  isValid: boolean
  requirements: PasswordRequirements
}

/**
 * Validates password strength based on security requirements
 * @param password - The password to validate
 * @returns PasswordValidationResult with score, feedback, and requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const requirements: PasswordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  }

  const score = Object.values(requirements).filter(Boolean).length
  let feedback = ""
  let isValid = false

  if (score === 0) {
    feedback = "Password is required"
  } else if (score === 1) {
    feedback = "Very weak password"
  } else if (score === 2) {
    feedback = "Weak password"
  } else if (score === 3) {
    feedback = "Fair password"
  } else if (score === 4) {
    feedback = "Good password"
  } else if (score === 5) {
    feedback = "Strong password"
    isValid = true
  }

  // Add specific feedback for missing requirements
  const missingRequirements = []
  if (!requirements.length) missingRequirements.push("at least 8 characters")
  if (!requirements.uppercase) missingRequirements.push("uppercase letter")
  if (!requirements.lowercase) missingRequirements.push("lowercase letter")
  if (!requirements.number) missingRequirements.push("number")
  if (!requirements.special) missingRequirements.push("special character")

  if (missingRequirements.length > 0 && score < 5) {
    feedback += ` (missing: ${missingRequirements.join(", ")})`
  }

  return {
    score,
    feedback,
    isValid,
    requirements
  }
}

/**
 * Gets the color class for password strength indicator
 * @param score - Password strength score (0-5)
 * @returns CSS color class
 */
export function getPasswordStrengthColor(score: number): string {
  if (score <= 1) return 'bg-red-500'
  if (score <= 2) return 'bg-orange-500'
  if (score <= 3) return 'bg-yellow-500'
  if (score <= 4) return 'bg-blue-500'
  return 'bg-green-500'
}

/**
 * Gets the text color class for password strength feedback
 * @param score - Password strength score (0-5)
 * @returns CSS text color class
 */
export function getPasswordStrengthTextColor(score: number): string {
  if (score <= 1) return 'text-red-600'
  if (score <= 2) return 'text-orange-600'
  if (score <= 3) return 'text-yellow-600'
  if (score <= 4) return 'text-blue-600'
  return 'text-green-600'
}
