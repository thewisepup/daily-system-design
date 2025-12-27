import { describe, it, expect } from "vitest";
import { sanitizeNewsletterHtml } from "./sanitize";

describe("sanitizeNewsletterHtml", () => {
  describe("data URI blocking", () => {
    it("should block SVG data URIs in img src attributes", () => {
      const maliciousSvg = `<img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' onload='alert(1)'></svg>" alt="test" />`;
      const sanitized = sanitizeNewsletterHtml(maliciousSvg);
      
      // The img tag should be removed or the src attribute should be stripped
      expect(sanitized).not.toContain("data:image/svg+xml");
      expect(sanitized).not.toContain("onload");
      expect(sanitized).not.toContain("alert(1)");
    });

    it("should block PNG data URIs in img src attributes", () => {
      const pngDataUri = `<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="test" />`;
      const sanitized = sanitizeNewsletterHtml(pngDataUri);
      
      // The img tag should be removed or the src attribute should be stripped
      expect(sanitized).not.toContain("data:image/png");
    });

    it("should block JPEG data URIs in img src attributes", () => {
      const jpegDataUri = `<img src="data:image/jpeg;base64,/9j/4AAQSkZJRg==" alt="test" />`;
      const sanitized = sanitizeNewsletterHtml(jpegDataUri);
      
      // The img tag should be removed or the src attribute should be stripped
      expect(sanitized).not.toContain("data:image/jpeg");
    });

    it("should block generic data URIs in img src attributes", () => {
      const genericDataUri = `<img src="data:text/plain,malicious content" alt="test" />`;
      const sanitized = sanitizeNewsletterHtml(genericDataUri);
      
      // The img tag should be removed or the src attribute should be stripped
      expect(sanitized).not.toContain("data:text/plain");
    });

    it("should allow http URLs in img src attributes", () => {
      const httpImage = `<img src="http://example.com/image.png" alt="test" />`;
      const sanitized = sanitizeNewsletterHtml(httpImage);
      
      expect(sanitized).toContain("http://example.com/image.png");
      expect(sanitized).toContain("<img");
    });

    it("should allow https URLs in img src attributes", () => {
      const httpsImage = `<img src="https://example.com/image.png" alt="test" />`;
      const sanitized = sanitizeNewsletterHtml(httpsImage);
      
      expect(sanitized).toContain("https://example.com/image.png");
      expect(sanitized).toContain("<img");
    });

    it("should preserve img tag with valid https URL even when data URI is attempted", () => {
      const mixedContent = `<img src="https://example.com/image.png" alt="test" /><img src="data:image/svg+xml,<svg></svg>" alt="malicious" />`;
      const sanitized = sanitizeNewsletterHtml(mixedContent);
      
      // Valid https image should be preserved
      expect(sanitized).toContain("https://example.com/image.png");
      // Data URI should be blocked
      expect(sanitized).not.toContain("data:image/svg+xml");
    });
  });

  describe("general sanitization", () => {
    it("should preserve safe HTML tags", () => {
      const safeHtml = `<p>Hello <strong>world</strong></p><h1>Title</h1>`;
      const sanitized = sanitizeNewsletterHtml(safeHtml);
      
      expect(sanitized).toContain("<p>");
      expect(sanitized).toContain("<strong>");
      expect(sanitized).toContain("<h1>");
      expect(sanitized).toContain("Hello");
      expect(sanitized).toContain("world");
      expect(sanitized).toContain("Title");
    });

    it("should remove script tags", () => {
      const maliciousHtml = `<p>Hello</p><script>alert('XSS')</script>`;
      const sanitized = sanitizeNewsletterHtml(maliciousHtml);
      
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("alert('XSS')");
      expect(sanitized).toContain("<p>Hello</p>");
    });

    it("should remove event handlers from attributes", () => {
      const maliciousHtml = `<p onclick="alert('XSS')">Hello</p>`;
      const sanitized = sanitizeNewsletterHtml(maliciousHtml);
      
      expect(sanitized).not.toContain("onclick");
      expect(sanitized).not.toContain("alert('XSS')");
      expect(sanitized).toContain("<p>");
      expect(sanitized).toContain("Hello");
    });

    it("should preserve safe link attributes", () => {
      const safeLink = `<a href="https://example.com" title="Example" target="_blank" rel="noopener">Link</a>`;
      const sanitized = sanitizeNewsletterHtml(safeLink);
      
      expect(sanitized).toContain("https://example.com");
      expect(sanitized).toContain("title");
      expect(sanitized).toContain("target");
      expect(sanitized).toContain("rel");
    });

    it("should block javascript: URLs in links", () => {
      const maliciousLink = `<a href="javascript:alert('XSS')">Click me</a>`;
      const sanitized = sanitizeNewsletterHtml(maliciousLink);
      
      expect(sanitized).not.toContain("javascript:");
      expect(sanitized).not.toContain("alert('XSS')");
    });
  });
});
