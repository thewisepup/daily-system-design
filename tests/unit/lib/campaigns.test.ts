import {
  MARKETING_CAMPAIGNS,
  isValidCampaignId,
  type MarketingCampaignId,
} from "~/lib/constants/campaigns";

describe("Campaign Constants", () => {
  describe("MARKETING_CAMPAIGNS", () => {
    it("contains LAUNCH_ANNOUNCEMENT campaign", () => {
      expect(MARKETING_CAMPAIGNS.LAUNCH_ANNOUNCEMENT).toBe(
        "launch_announcement_2026_01",
      );
    });

    it("has expected structure with const assertion", () => {
      expect(typeof MARKETING_CAMPAIGNS).toBe("object");
      expect(Object.keys(MARKETING_CAMPAIGNS).length).toBeGreaterThan(0);
    });
  });

  describe("isValidCampaignId", () => {
    describe("Valid Campaign IDs", () => {
      it("returns true for LAUNCH_ANNOUNCEMENT campaign ID", () => {
        expect(isValidCampaignId("launch_announcement_2026_01")).toBe(true);
      });

      it("returns true for campaign ID from MARKETING_CAMPAIGNS constant", () => {
        const campaignId: MarketingCampaignId =
          MARKETING_CAMPAIGNS.LAUNCH_ANNOUNCEMENT;
        expect(isValidCampaignId(campaignId)).toBe(true);
      });
    });

    describe("Invalid Campaign IDs", () => {
      it.each([
        ["", "empty string"],
        ["unknown_campaign", "unknown campaign"],
        ["launch_announcement", "partial match"],
        ["LAUNCH_ANNOUNCEMENT_2026_01", "case mismatch"],
        ["launch_announcement_2026_01_extra", "extra characters"],
        [" launch_announcement_2026_01 ", "whitespace-padded"],
      ])("returns false for %s (%s)", (input) => {
        expect(isValidCampaignId(input)).toBe(false);
      });
    });
  });
});
