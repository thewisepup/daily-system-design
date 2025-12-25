import sanitizeHtml from "sanitize-html";

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

  // Strip all HTML tags and attributes, keeping only text content
  const sanitized = sanitizeHtml(input, {
    allowedTags: [], // No HTML tags allowed - plain text only
    allowedAttributes: {}, // No attributes allowed
  });

  const trimmed = sanitized.trim();
  const maxLength = 10000;

  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

