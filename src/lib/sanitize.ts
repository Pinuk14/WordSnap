/**
 * Input sanitization utilities.
 * Prevents HTML injection, script injection, invalid characters,
 * and enforces length limits on all user-generated content.
 */

const HTML_TAG_REGEX = /<[^>]*>/g;
const SCRIPT_REGEX = /javascript:|on\w+\s*=/gi;
const CONTROL_CHAR_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const NON_ALPHA_REGEX = /[^a-zA-Z]/g;

/**
 * Strip HTML tags, script patterns, and control characters from a string.
 */
function stripDangerous(input: string): string {
  return input
    .replace(HTML_TAG_REGEX, '')
    .replace(SCRIPT_REGEX, '')
    .replace(CONTROL_CHAR_REGEX, '')
    .trim();
}

/**
 * Sanitize a player name.
 * - Strips HTML/script/control chars
 * - Trims whitespace
 * - Max 20 characters
 * - Must be at least 1 character
 */
export function sanitizePlayerName(name: string): string {
  const cleaned = stripDangerous(name).slice(0, 20);
  return cleaned;
}

/**
 * Sanitize a room code.
 * - Uppercase alphanumeric only
 * - Max 10 characters
 */
export function sanitizeRoomCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10);
}

/**
 * Sanitize a submitted word.
 * - Lowercase
 * - Alpha characters only
 * - Max 45 characters
 */
export function sanitizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(NON_ALPHA_REGEX, '')
    .slice(0, 45);
}

/**
 * Validate that an input string is safe and non-empty.
 */
export function isValidInput(input: string, maxLength = 100): boolean {
  if (!input || typeof input !== 'string') return false;
  const cleaned = stripDangerous(input);
  if (cleaned.length === 0) return false;
  if (cleaned.length > maxLength) return false;
  return true;
}

/**
 * Validate a player name meets requirements.
 */
export function isValidPlayerName(name: string): boolean {
  const sanitized = sanitizePlayerName(name);
  return sanitized.length >= 1 && sanitized.length <= 20;
}
