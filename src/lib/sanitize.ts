import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes user input to prevent XSS attacks
 * Strips HTML tags and script content while preserving plain text
 * 
 * @param input - User input string that may contain HTML/scripts
 * @returns Sanitized plain text string safe for storage and display
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed - plain text only
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Preserve text content
  });

  const trimmed = sanitized.trim();
  const maxLength = 10000;

  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

