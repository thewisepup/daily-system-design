import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  ValidationSchemas,
  validateUserId,
  validateUserIds,
  validateSubjectId,
  validateEmail,
  validateIssueId,
} from "./validation";

describe("ValidationSchemas", () => {
  describe("userId", () => {
    it("accepts valid UUID", () => {
      const validUuid = "00000000-0000-0000-0000-000000000001";
      expect(() => ValidationSchemas.userId.parse(validUuid)).not.toThrow();
    });

    it("rejects invalid UUID format", () => {
      expect(() => ValidationSchemas.userId.parse("not-a-uuid")).toThrow(
        z.ZodError,
      );
    });

    it("rejects empty string", () => {
      expect(() => ValidationSchemas.userId.parse("")).toThrow(z.ZodError);
    });

    it("rejects non-string values", () => {
      expect(() => ValidationSchemas.userId.parse(123)).toThrow(z.ZodError);
    });

    it("provides descriptive error message", () => {
      try {
        ValidationSchemas.userId.parse("invalid");
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        expect((error as z.ZodError).errors[0]?.message).toContain(
          "Invalid user ID format",
        );
      }
    });
  });

  describe("userIds", () => {
    it("accepts array of valid UUIDs", () => {
      const validUuids = [
        "00000000-0000-0000-0000-000000000001",
        "00000000-0000-0000-0000-000000000002",
      ];
      expect(() => ValidationSchemas.userIds.parse(validUuids)).not.toThrow();
    });

    it("rejects empty array", () => {
      expect(() => ValidationSchemas.userIds.parse([])).toThrow(z.ZodError);
    });

    it("rejects array with invalid UUID", () => {
      expect(() =>
        ValidationSchemas.userIds.parse([
          "00000000-0000-0000-0000-000000000001",
          "invalid",
        ]),
      ).toThrow(z.ZodError);
    });

    it("rejects non-array values", () => {
      expect(() => ValidationSchemas.userIds.parse("not-an-array")).toThrow(
        z.ZodError,
      );
    });
  });

  describe("subjectId", () => {
    it("accepts positive integer", () => {
      expect(() => ValidationSchemas.subjectId.parse(1)).not.toThrow();
      expect(() => ValidationSchemas.subjectId.parse(100)).not.toThrow();
    });

    it("rejects zero", () => {
      expect(() => ValidationSchemas.subjectId.parse(0)).toThrow(z.ZodError);
    });

    it("rejects negative numbers", () => {
      expect(() => ValidationSchemas.subjectId.parse(-1)).toThrow(z.ZodError);
    });

    it("rejects decimal numbers", () => {
      expect(() => ValidationSchemas.subjectId.parse(1.5)).toThrow(z.ZodError);
    });

    it("rejects non-number values", () => {
      expect(() => ValidationSchemas.subjectId.parse("1")).toThrow(z.ZodError);
    });
  });

  describe("email", () => {
    it("accepts valid email", () => {
      expect(() =>
        ValidationSchemas.email.parse("user@example.com"),
      ).not.toThrow();
    });

    it("rejects invalid email format", () => {
      expect(() => ValidationSchemas.email.parse("invalid")).toThrow(
        z.ZodError,
      );
    });

    it("rejects email without domain", () => {
      expect(() => ValidationSchemas.email.parse("user@")).toThrow(z.ZodError);
    });

    it("rejects empty string", () => {
      expect(() => ValidationSchemas.email.parse("")).toThrow(z.ZodError);
    });
  });

  describe("issueId", () => {
    it("accepts positive integer", () => {
      expect(() => ValidationSchemas.issueId.parse(1)).not.toThrow();
    });

    it("rejects zero", () => {
      expect(() => ValidationSchemas.issueId.parse(0)).toThrow(z.ZodError);
    });

    it("rejects negative numbers", () => {
      expect(() => ValidationSchemas.issueId.parse(-1)).toThrow(z.ZodError);
    });
  });
});

describe("Validation Functions", () => {
  describe("validateUserId", () => {
    it("accepts valid UUID without throwing", () => {
      expect(() =>
        validateUserId("00000000-0000-0000-0000-000000000001"),
      ).not.toThrow();
    });

    it("throws ZodError for invalid UUID", () => {
      expect(() => validateUserId("invalid")).toThrow(z.ZodError);
    });
  });

  describe("validateUserIds", () => {
    it("accepts array of valid UUIDs without throwing", () => {
      expect(() =>
        validateUserIds([
          "00000000-0000-0000-0000-000000000001",
          "00000000-0000-0000-0000-000000000002",
        ]),
      ).not.toThrow();
    });

    it("throws ZodError for empty array", () => {
      expect(() => validateUserIds([])).toThrow(z.ZodError);
    });

    it("throws ZodError for invalid UUID in array", () => {
      expect(() =>
        validateUserIds(["00000000-0000-0000-0000-000000000001", "invalid"]),
      ).toThrow(z.ZodError);
    });
  });

  describe("validateSubjectId", () => {
    it("accepts positive integer without throwing", () => {
      expect(() => validateSubjectId(1)).not.toThrow();
    });

    it("throws ZodError for zero", () => {
      expect(() => validateSubjectId(0)).toThrow(z.ZodError);
    });

    it("throws ZodError for negative number", () => {
      expect(() => validateSubjectId(-1)).toThrow(z.ZodError);
    });
  });

  describe("validateEmail", () => {
    it("accepts valid email without throwing", () => {
      expect(() => validateEmail("user@example.com")).not.toThrow();
    });

    it("throws ZodError for invalid email", () => {
      expect(() => validateEmail("invalid")).toThrow(z.ZodError);
    });
  });

  describe("validateIssueId", () => {
    it("accepts positive integer without throwing", () => {
      expect(() => validateIssueId(1)).not.toThrow();
    });

    it("throws ZodError for zero", () => {
      expect(() => validateIssueId(0)).toThrow(z.ZodError);
    });
  });
});
