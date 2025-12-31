import { TRPCError } from "@trpc/server";
import {
  ALLOWED_TRANSITIONS,
  isTransitionAllowed,
  getAllowedNextStatuses,
  validateStatusTransition,
  canApprove,
  canUnapprove,
  canSend,
  canAutoApprove,
  STATUS_DESCRIPTIONS,
  getAvailableActions,
} from "~/server/newsletter/issueStatusMachine";
import type { IssueStatus } from "~/server/db/schema/issues";

describe("issueStatusMachine", () => {
  describe("ALLOWED_TRANSITIONS", () => {
    it("defines correct transitions from generating", () => {
      expect(ALLOWED_TRANSITIONS.generating).toEqual(["draft", "failed"]);
    });

    it("defines correct transitions from draft", () => {
      expect(ALLOWED_TRANSITIONS.draft).toEqual(["approved"]);
    });

    it("defines correct transitions from failed", () => {
      expect(ALLOWED_TRANSITIONS.failed).toEqual(["generating"]);
    });

    it("defines correct transitions from approved", () => {
      expect(ALLOWED_TRANSITIONS.approved).toEqual(["draft", "sent"]);
    });

    it("defines no transitions from sent (final state)", () => {
      expect(ALLOWED_TRANSITIONS.sent).toEqual([]);
    });
  });

  describe("isTransitionAllowed", () => {
    describe("valid transitions", () => {
      it("allows generating → draft", () => {
        expect(isTransitionAllowed("generating", "draft")).toBe(true);
      });

      it("allows generating → failed", () => {
        expect(isTransitionAllowed("generating", "failed")).toBe(true);
      });

      it("allows draft → approved", () => {
        expect(isTransitionAllowed("draft", "approved")).toBe(true);
      });

      it("allows failed → generating (retry)", () => {
        expect(isTransitionAllowed("failed", "generating")).toBe(true);
      });

      it("allows approved → draft (unapprove)", () => {
        expect(isTransitionAllowed("approved", "draft")).toBe(true);
      });

      it("allows approved → sent", () => {
        expect(isTransitionAllowed("approved", "sent")).toBe(true);
      });
    });

    describe("invalid transitions", () => {
      it("disallows draft → sent (must be approved first)", () => {
        expect(isTransitionAllowed("draft", "sent")).toBe(false);
      });

      it("disallows sent → any status (final state)", () => {
        const allStatuses: IssueStatus[] = [
          "generating",
          "draft",
          "failed",
          "approved",
          "sent",
        ];
        allStatuses.forEach((status) => {
          expect(isTransitionAllowed("sent", status)).toBe(false);
        });
      });

      it("disallows generating → approved (skip draft)", () => {
        expect(isTransitionAllowed("generating", "approved")).toBe(false);
      });

      it("disallows generating → sent (skip approval)", () => {
        expect(isTransitionAllowed("generating", "sent")).toBe(false);
      });

      it("disallows draft → failed", () => {
        expect(isTransitionAllowed("draft", "failed")).toBe(false);
      });

      it("disallows draft → generating", () => {
        expect(isTransitionAllowed("draft", "generating")).toBe(false);
      });

      it("disallows failed → draft (skip regeneration)", () => {
        expect(isTransitionAllowed("failed", "draft")).toBe(false);
      });

      it("disallows failed → approved", () => {
        expect(isTransitionAllowed("failed", "approved")).toBe(false);
      });

      it("disallows failed → sent", () => {
        expect(isTransitionAllowed("failed", "sent")).toBe(false);
      });

      it("disallows approved → failed", () => {
        expect(isTransitionAllowed("approved", "failed")).toBe(false);
      });

      it("disallows approved → generating", () => {
        expect(isTransitionAllowed("approved", "generating")).toBe(false);
      });
    });

    describe("self-transitions", () => {
      it("disallows generating → generating", () => {
        expect(isTransitionAllowed("generating", "generating")).toBe(false);
      });

      it("disallows draft → draft", () => {
        expect(isTransitionAllowed("draft", "draft")).toBe(false);
      });

      it("disallows failed → failed", () => {
        expect(isTransitionAllowed("failed", "failed")).toBe(false);
      });

      it("disallows approved → approved", () => {
        expect(isTransitionAllowed("approved", "approved")).toBe(false);
      });

      it("disallows sent → sent", () => {
        expect(isTransitionAllowed("sent", "sent")).toBe(false);
      });
    });
  });

  describe("getAllowedNextStatuses", () => {
    it("returns [draft, failed] for generating", () => {
      expect(getAllowedNextStatuses("generating")).toEqual(["draft", "failed"]);
    });

    it("returns [approved] for draft", () => {
      expect(getAllowedNextStatuses("draft")).toEqual(["approved"]);
    });

    it("returns [generating] for failed", () => {
      expect(getAllowedNextStatuses("failed")).toEqual(["generating"]);
    });

    it("returns [draft, sent] for approved", () => {
      expect(getAllowedNextStatuses("approved")).toEqual(["draft", "sent"]);
    });

    it("returns empty array for sent", () => {
      expect(getAllowedNextStatuses("sent")).toEqual([]);
    });
  });

  describe("validateStatusTransition", () => {
    describe("valid transitions", () => {
      it("does not throw for generating → draft", () => {
        expect(() =>
          validateStatusTransition("generating", "draft"),
        ).not.toThrow();
      });

      it("does not throw for draft → approved", () => {
        expect(() =>
          validateStatusTransition("draft", "approved"),
        ).not.toThrow();
      });

      it("does not throw for approved → sent", () => {
        expect(() =>
          validateStatusTransition("approved", "sent"),
        ).not.toThrow();
      });
    });

    describe("invalid transitions", () => {
      it("throws TRPCError with BAD_REQUEST for draft → sent", () => {
        expect(() => validateStatusTransition("draft", "sent")).toThrow(
          TRPCError,
        );

        try {
          validateStatusTransition("draft", "sent");
        } catch (error) {
          expect(error).toBeInstanceOf(TRPCError);
          expect((error as TRPCError).code).toBe("BAD_REQUEST");
          expect((error as TRPCError).message).toContain(
            "Invalid status transition: draft → sent",
          );
          expect((error as TRPCError).message).toContain("approved");
        }
      });

      it("throws TRPCError with BAD_REQUEST for sent → any", () => {
        expect(() => validateStatusTransition("sent", "draft")).toThrow(
          TRPCError,
        );

        try {
          validateStatusTransition("sent", "draft");
        } catch (error) {
          expect(error).toBeInstanceOf(TRPCError);
          expect((error as TRPCError).code).toBe("BAD_REQUEST");
          expect((error as TRPCError).message).toContain(
            "Invalid status transition: sent → draft",
          );
          expect((error as TRPCError).message).toContain("none");
        }
      });

      it("includes allowed transitions in error message", () => {
        try {
          validateStatusTransition("approved", "failed");
        } catch (error) {
          expect((error as TRPCError).message).toContain("draft, sent");
        }
      });
    });
  });

  describe("canApprove", () => {
    it("returns true for draft status", () => {
      expect(canApprove("draft")).toBe(true);
    });

    it("returns false for generating status", () => {
      expect(canApprove("generating")).toBe(false);
    });

    it("returns false for failed status", () => {
      expect(canApprove("failed")).toBe(false);
    });

    it("returns false for approved status", () => {
      expect(canApprove("approved")).toBe(false);
    });

    it("returns false for sent status", () => {
      expect(canApprove("sent")).toBe(false);
    });
  });

  describe("canUnapprove", () => {
    it("returns true for approved status", () => {
      expect(canUnapprove("approved")).toBe(true);
    });

    it("returns false for generating status", () => {
      expect(canUnapprove("generating")).toBe(false);
    });

    it("returns false for draft status", () => {
      expect(canUnapprove("draft")).toBe(false);
    });

    it("returns false for failed status", () => {
      expect(canUnapprove("failed")).toBe(false);
    });

    it("returns false for sent status", () => {
      expect(canUnapprove("sent")).toBe(false);
    });
  });

  describe("canSend", () => {
    it("returns true for approved status", () => {
      expect(canSend("approved")).toBe(true);
    });

    it("returns false for generating status", () => {
      expect(canSend("generating")).toBe(false);
    });

    it("returns false for draft status", () => {
      expect(canSend("draft")).toBe(false);
    });

    it("returns false for failed status", () => {
      expect(canSend("failed")).toBe(false);
    });

    it("returns false for sent status", () => {
      expect(canSend("sent")).toBe(false);
    });
  });

  describe("canAutoApprove", () => {
    it("returns true for draft status", () => {
      expect(canAutoApprove("draft")).toBe(true);
    });

    it("returns false for generating status", () => {
      expect(canAutoApprove("generating")).toBe(false);
    });

    it("returns false for failed status", () => {
      expect(canAutoApprove("failed")).toBe(false);
    });

    it("returns false for approved status (already approved)", () => {
      expect(canAutoApprove("approved")).toBe(false);
    });

    it("returns false for sent status", () => {
      expect(canAutoApprove("sent")).toBe(false);
    });
  });

  describe("STATUS_DESCRIPTIONS", () => {
    it("provides description for generating", () => {
      expect(STATUS_DESCRIPTIONS.generating).toBe(
        "Content is being generated by AI",
      );
    });

    it("provides description for draft", () => {
      expect(STATUS_DESCRIPTIONS.draft).toBe("Content is ready for review");
    });

    it("provides description for failed", () => {
      expect(STATUS_DESCRIPTIONS.failed).toBe("Content generation failed");
    });

    it("provides description for approved", () => {
      expect(STATUS_DESCRIPTIONS.approved).toBe(
        "Content is approved and ready to send",
      );
    });

    it("provides description for sent", () => {
      expect(STATUS_DESCRIPTIONS.sent).toBe(
        "Newsletter has been sent to subscribers",
      );
    });

    it("has descriptions for all statuses", () => {
      const allStatuses: IssueStatus[] = [
        "generating",
        "draft",
        "failed",
        "approved",
        "sent",
      ];
      allStatuses.forEach((status) => {
        expect(STATUS_DESCRIPTIONS[status]).toBeDefined();
        expect(typeof STATUS_DESCRIPTIONS[status]).toBe("string");
      });
    });
  });

  describe("getAvailableActions", () => {
    describe("for generating status", () => {
      it("returns correct actions", () => {
        const actions = getAvailableActions("generating");
        expect(actions).toEqual({
          canApprove: false,
          canAutoApprove: false,
          canUnapprove: false,
          canSend: false,
          canEdit: false,
        });
      });
    });

    describe("for draft status", () => {
      it("returns correct actions", () => {
        const actions = getAvailableActions("draft");
        expect(actions).toEqual({
          canApprove: true,
          canAutoApprove: true,
          canUnapprove: false,
          canSend: false,
          canEdit: true,
        });
      });
    });

    describe("for failed status", () => {
      it("returns correct actions", () => {
        const actions = getAvailableActions("failed");
        expect(actions).toEqual({
          canApprove: false,
          canAutoApprove: false,
          canUnapprove: false,
          canSend: false,
          canEdit: true,
        });
      });
    });

    describe("for approved status", () => {
      it("returns correct actions", () => {
        const actions = getAvailableActions("approved");
        expect(actions).toEqual({
          canApprove: false,
          canAutoApprove: false,
          canUnapprove: true,
          canSend: true,
          canEdit: false,
        });
      });
    });

    describe("for sent status", () => {
      it("returns correct actions (no actions available)", () => {
        const actions = getAvailableActions("sent");
        expect(actions).toEqual({
          canApprove: false,
          canAutoApprove: false,
          canUnapprove: false,
          canSend: false,
          canEdit: false,
        });
      });
    });
  });
});

