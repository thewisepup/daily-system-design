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

/**
 * Sanitizes HTML content to prevent XSS attacks while preserving safe formatting.
 * Allows common newsletter HTML tags but removes scripts, event handlers, and dangerous attributes.
 *
 * @param html - Raw HTML string to sanitize
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeNewsletterHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "a",
      "blockquote",
      "code",
      "pre",
      "span",
      "div",
      "hr",
      "img",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title"],
      "*": ["class", "id"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
    },
    allowedSchemesAppliedToAttributes: ["href", "src"],
    disallowedTagsMode: "discard",
    enforceHtmlBoundary: true,
  });
}
