/**
 * Generate a unique confirmation code (6 characters, alphanumeric)
 * This is a fallback if the database function fails
 */
export function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing characters
  let result = ''
  
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

