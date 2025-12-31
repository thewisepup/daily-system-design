import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  sanitizeInput,
  sanitizeNewsletterHtml,
} from "~/lib/sanitize";

describe("escapeHtml", () => {
  it("should escape HTML special characters", () => {
    const input = '<script>alert("XSS")</script>';
    const expected = "&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;";
    expect(escapeHtml(input)).toBe(expected);
  });

  it("should escape ampersands", () => {
    expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("should escape less than and greater than", () => {
    expect(escapeHtml("<div>")).toBe("&lt;div&gt;");
  });

  it("should escape double quotes", () => {
    expect(escapeHtml('He said "hello"')).toBe("He said &quot;hello&quot;");
  });

  it("should escape single quotes", () => {
    expect(escapeHtml("It's fine")).toBe("It&#x27;s fine");
  });

  it("should escape forward slashes", () => {
    expect(escapeHtml("path/to/file")).toBe("path&#x2F;to&#x2F;file");
  });

  it("should handle null by returning empty string", () => {
    expect(escapeHtml(null)).toBe("");
  });

  it("should handle undefined by returning empty string", () => {
    expect(escapeHtml(undefined)).toBe("");
  });

  it("should coerce numbers to strings", () => {
    expect(escapeHtml(123)).toBe("123");
    expect(escapeHtml(0)).toBe("0");
    expect(escapeHtml(-456)).toBe("-456");
  });

  it("should coerce booleans to strings", () => {
    expect(escapeHtml(true)).toBe("true");
    expect(escapeHtml(false)).toBe("false");
  });

  it("should handle objects by converting to string", () => {
    const obj = { toString: () => "custom object" };
    expect(escapeHtml(obj)).toBe("custom object");
  });

  it("should handle empty strings", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("should escape multiple special characters in one string", () => {
    const input = `<a href="javascript:alert('XSS')">Click & Win!</a>`;
    const expected =
      "&lt;a href=&quot;javascript:alert(&#x27;XSS&#x27;)&quot;&gt;Click &amp; Win!&lt;&#x2F;a&gt;";
    expect(escapeHtml(input)).toBe(expected);
  });

  it("should handle strings with no special characters", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World");
  });

  it("should prevent XSS attack vectors", () => {
    const attacks = [
      '<img src=x onerror="alert(1)">',
      '<svg onload="alert(1)">',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(1)">',
      '<body onload=alert("XSS")>',
    ];

    attacks.forEach((attack) => {
      const escaped = escapeHtml(attack);
      // Verify that the escaped output doesn't contain unescaped < or >
      expect(escaped).not.toMatch(/[<>]/);
      // Verify that dangerous characters are escaped
      expect(escaped).toMatch(/(&lt;|&gt;|&quot;|&#x27;|&#x2F;|&amp;)/);
    });
  });
});

describe("sanitizeInput", () => {
  it("should strip all HTML tags", () => {
    const input = "<p>Hello <strong>World</strong></p>";
    expect(sanitizeInput(input)).toBe("Hello World");
  });

  it("should remove script tags and content", () => {
    const input = '<script>alert("XSS")</script>Plain text';
    expect(sanitizeInput(input)).toBe("Plain text");
  });

  it("should handle empty string", () => {
    expect(sanitizeInput("")).toBe("");
  });

  it("should handle null/undefined by returning empty string", () => {
    expect(sanitizeInput(null as unknown as string)).toBe("");
    expect(sanitizeInput(undefined as unknown as string)).toBe("");
  });

  it("should trim whitespace", () => {
    expect(sanitizeInput("  hello  ")).toBe("hello");
  });

  it("should truncate strings longer than 10000 characters", () => {
    const longString = "a".repeat(15000);
    const result = sanitizeInput(longString);
    expect(result.length).toBe(10000);
  });
});

describe("sanitizeNewsletterHtml", () => {
  it("should allow safe HTML tags", () => {
    const input = "<p>Hello <strong>World</strong></p>";
    expect(sanitizeNewsletterHtml(input)).toBe(
      "<p>Hello <strong>World</strong></p>",
    );
  });

  it("should remove script tags", () => {
    const input = '<p>Hello</p><script>alert("XSS")</script>';
    expect(sanitizeNewsletterHtml(input)).toBe("<p>Hello</p>");
  });

  it("should remove dangerous event handlers", () => {
    const input = '<p onclick="alert(1)">Hello</p>';
    expect(sanitizeNewsletterHtml(input)).toBe("<p>Hello</p>");
  });

  it("should allow safe attributes", () => {
    const input = '<a href="https://example.com" title="Example">Link</a>';
    expect(sanitizeNewsletterHtml(input)).toBe(
      '<a href="https://example.com" title="Example">Link</a>',
    );
  });

  it("should handle empty string", () => {
    expect(sanitizeNewsletterHtml("")).toBe("");
  });

  it("should handle null/undefined by returning empty string", () => {
    expect(sanitizeNewsletterHtml(null as unknown as string)).toBe("");
    expect(sanitizeNewsletterHtml(undefined as unknown as string)).toBe("");
  });
});
