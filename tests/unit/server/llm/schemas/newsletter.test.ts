import {
  NewsletterResponseSchema,
  AdvertisementSchema,
} from "~/server/llm/schemas/newsletter";

describe("NewsletterResponseSchema", () => {
  const validSection = {
    headline: "Test Headline",
    content: "Test content for this section",
  };

  const validKeyTakeaways = {
    headline: "Key Takeaways",
    bullets: ["Point 1", "Point 2", "Point 3"],
    closingSentence: "That's all for today!",
  };

  const validNewsletter = {
    introduction: { ...validSection, headline: "Introduction" },
    concept: { ...validSection, headline: "Core Concept" },
    tradeoffs: { ...validSection, headline: "Tradeoffs" },
    applications: { ...validSection, headline: "Real-World Applications" },
    example: { ...validSection, headline: "Practical Example" },
    commonPitfalls: { ...validSection, headline: "Common Pitfalls" },
    keyTakeaways: validKeyTakeaways,
  };

  it("validates complete newsletter structure", () => {
    const result = NewsletterResponseSchema.safeParse(validNewsletter);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.introduction.headline).toBe("Introduction");
      expect(result.data.keyTakeaways.bullets).toHaveLength(3);
    }
  });

  it("rejects missing sections", () => {
    const incompleteNewsletter = {
      introduction: validSection,
      concept: validSection,
    };

    const result = NewsletterResponseSchema.safeParse(incompleteNewsletter);

    expect(result.success).toBe(false);
    if (!result.success) {
      const missingFields = result.error.issues.map((issue) => issue.path[0]);
      expect(missingFields).toContain("tradeoffs");
      expect(missingFields).toContain("applications");
      expect(missingFields).toContain("example");
      expect(missingFields).toContain("commonPitfalls");
      expect(missingFields).toContain("keyTakeaways");
    }
  });

  it("rejects section with missing headline", () => {
    const newsletterWithBadSection = {
      ...validNewsletter,
      introduction: { content: "Content only" },
    };

    const result = NewsletterResponseSchema.safeParse(newsletterWithBadSection);

    expect(result.success).toBe(false);
  });

  it("rejects section with missing content", () => {
    const newsletterWithBadSection = {
      ...validNewsletter,
      concept: { headline: "Headline only" },
    };

    const result = NewsletterResponseSchema.safeParse(newsletterWithBadSection);

    expect(result.success).toBe(false);
  });

  it("accepts empty strings for section fields", () => {
    const newsletterWithEmptyStrings = {
      ...validNewsletter,
      introduction: { headline: "", content: "" },
    };

    const result = NewsletterResponseSchema.safeParse(
      newsletterWithEmptyStrings,
    );

    expect(result.success).toBe(true);
  });
});

describe("KeyTakeawaysSectionSchema", () => {
  const validNewsletter = {
    introduction: { headline: "Intro", content: "Content" },
    concept: { headline: "Concept", content: "Content" },
    tradeoffs: { headline: "Tradeoffs", content: "Content" },
    applications: { headline: "Applications", content: "Content" },
    example: { headline: "Example", content: "Content" },
    commonPitfalls: { headline: "Pitfalls", content: "Content" },
    keyTakeaways: {
      headline: "Key Takeaways",
      bullets: ["Point 1", "Point 2"],
      closingSentence: "Closing",
    },
  };

  it("validates bullets array", () => {
    const result = NewsletterResponseSchema.safeParse(validNewsletter);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keyTakeaways.bullets).toEqual(["Point 1", "Point 2"]);
    }
  });

  it("accepts empty bullets array", () => {
    const newsletterWithEmptyBullets = {
      ...validNewsletter,
      keyTakeaways: {
        headline: "Key Takeaways",
        bullets: [],
        closingSentence: "Closing",
      },
    };

    const result = NewsletterResponseSchema.safeParse(
      newsletterWithEmptyBullets,
    );

    expect(result.success).toBe(true);
  });

  it("rejects non-array bullets", () => {
    const newsletterWithBadBullets = {
      ...validNewsletter,
      keyTakeaways: {
        headline: "Key Takeaways",
        bullets: "Not an array",
        closingSentence: "Closing",
      },
    };

    const result = NewsletterResponseSchema.safeParse(newsletterWithBadBullets);

    expect(result.success).toBe(false);
  });

  it("rejects missing closingSentence", () => {
    const newsletterWithMissingClosing = {
      ...validNewsletter,
      keyTakeaways: {
        headline: "Key Takeaways",
        bullets: ["Point 1"],
      },
    };

    const result = NewsletterResponseSchema.safeParse(
      newsletterWithMissingClosing,
    );

    expect(result.success).toBe(false);
  });
});

describe("AdvertisementSchema", () => {
  const validAd = {
    title: "Sponsor Message",
    content: "Check out our amazing product",
    imageUrl: "https://example.com/image.png",
    campaignId: "campaign-123",
    issueId: 42,
  };

  it("validates ad structure", () => {
    const result = AdvertisementSchema.safeParse(validAd);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validAd);
    }
  });

  it("rejects invalid URL format", () => {
    const adWithBadUrl = {
      ...validAd,
      imageUrl: "not-a-valid-url",
    };

    const result = AdvertisementSchema.safeParse(adWithBadUrl);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("imageUrl");
    }
  });

  it("rejects non-positive issueId", () => {
    const adWithZeroId = { ...validAd, issueId: 0 };
    const adWithNegativeId = { ...validAd, issueId: -5 };

    const zeroResult = AdvertisementSchema.safeParse(adWithZeroId);
    const negativeResult = AdvertisementSchema.safeParse(adWithNegativeId);

    expect(zeroResult.success).toBe(false);
    expect(negativeResult.success).toBe(false);
  });

  it("rejects non-integer issueId", () => {
    const adWithFloatId = { ...validAd, issueId: 1.5 };

    const result = AdvertisementSchema.safeParse(adWithFloatId);

    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const incompleteAd = {
      title: "Sponsor",
    };

    const result = AdvertisementSchema.safeParse(incompleteAd);

    expect(result.success).toBe(false);
    if (!result.success) {
      const missingFields = result.error.issues.map((issue) => issue.path[0]);
      expect(missingFields).toContain("content");
      expect(missingFields).toContain("imageUrl");
      expect(missingFields).toContain("campaignId");
      expect(missingFields).toContain("issueId");
    }
  });

  it("accepts various valid URL formats", () => {
    const httpsUrl = { ...validAd, imageUrl: "https://cdn.example.com/ad.jpg" };
    const httpUrl = { ...validAd, imageUrl: "http://example.com/ad.png" };
    const urlWithPath = {
      ...validAd,
      imageUrl: "https://example.com/images/2024/ad.webp",
    };

    expect(AdvertisementSchema.safeParse(httpsUrl).success).toBe(true);
    expect(AdvertisementSchema.safeParse(httpUrl).success).toBe(true);
    expect(AdvertisementSchema.safeParse(urlWithPath).success).toBe(true);
  });
});
