export const MARKETING_CAMPAIGNS = {
  JANUARY_2026_UPDATE: "launch_announcement_2026_01",
} as const;

export type MarketingCampaignId =
  (typeof MARKETING_CAMPAIGNS)[keyof typeof MARKETING_CAMPAIGNS];

export function isValidCampaignId(
  campaignId: string,
): campaignId is MarketingCampaignId {
  return Object.values(MARKETING_CAMPAIGNS).includes(
    campaignId as MarketingCampaignId,
  );
}
