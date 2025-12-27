interface NewsletterJsonContentProps {
  title: string;
  sentAt?: Date | null;
  contentJson: unknown;
}

/**
 * Type guard to check if a section has valid content structure.
 * Validates that a section object has both headline and content as non-empty strings.
 *
 * @param section - The section object to validate
 * @returns True if the section has valid headline and content properties
 */
function hasValidSection(
  section: unknown,
): section is { headline: string; content: string } {
  return (
    typeof section === "object" &&
    section !== null &&
    "headline" in section &&
    "content" in section &&
    typeof section.headline === "string" &&
    typeof section.content === "string" &&
    section.headline.length > 0 &&
    section.content.length > 0
  );
}

/**
 * Type guard to check if a key takeaways section has valid structure.
 * Validates that the section has headline, bullets array, and closingSentence.
 * Ensures headline is non-empty and bullets array contains at least one item.
 *
 * @param section - The section object to validate
 * @returns True if the section has valid key takeaways structure
 */
function hasValidKeyTakeaways(
  section: unknown,
): section is { headline: string; bullets: string[]; closingSentence: string } {
  return (
    typeof section === "object" &&
    section !== null &&
    "headline" in section &&
    "bullets" in section &&
    "closingSentence" in section &&
    typeof section.headline === "string" &&
    Array.isArray(section.bullets) &&
    section.bullets.every((b) => typeof b === "string") &&
    typeof section.closingSentence === "string" &&
    section.headline.length > 0 &&
    section.bullets.length > 0
  );
}

/**
 * Reusable component for rendering newsletter sections with headline and content.
 * Used for standard sections like introduction, concept, tradeoffs, etc.
 *
 * @param headline - The section headline
 * @param content - The section content text
 * @returns A section element with formatted headline and content
 */
function NewsletterSection({
  headline,
  content,
}: {
  headline: string;
  content: string;
}) {
  return (
    <section>
      <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight">
        {headline}
      </h2>
      <p className="text-foreground/90 text-lg leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
    </section>
  );
}

/**
 * Component for rendering newsletter content from JSON structure.
 * Dynamically renders only the sections that exist in the contentJson.
 * Supports sections: introduction, concept, tradeoffs, applications, example,
 * commonPitfalls, and keyTakeaways.
 *
 * @param title - The newsletter title
 * @param sentAt - The date when the newsletter was sent
 * @param contentJson - The JSON content object containing newsletter sections
 * @returns Newsletter article with dynamically rendered sections
 */
export default function NewsletterJsonContent({
  title,
  sentAt,
  contentJson,
}: NewsletterJsonContentProps) {
  // Safely cast to object for property access
  const content =
    typeof contentJson === "object" && contentJson !== null
      ? (contentJson as Record<string, unknown>)
      : {};

  // Extract available sections
  const introduction = hasValidSection(content.introduction)
    ? content.introduction
    : null;
  const concept = hasValidSection(content.concept) ? content.concept : null;
  const tradeoffs = hasValidSection(content.tradeoffs)
    ? content.tradeoffs
    : null;
  const applications = hasValidSection(content.applications)
    ? content.applications
    : null;
  const example = hasValidSection(content.example) ? content.example : null;
  const commonPitfalls = hasValidSection(content.commonPitfalls)
    ? content.commonPitfalls
    : null;
  const keyTakeaways = hasValidKeyTakeaways(content.keyTakeaways)
    ? content.keyTakeaways
    : null;

  // Check if we have any valid content
  const hasAnyContent = Boolean(
    introduction ??
      concept ??
      tradeoffs ??
      applications ??
      example ??
      commonPitfalls ??
      keyTakeaways,
  );

  return (
    <article>
      {/* Newsletter header */}
      <header className="border-border mb-12 border-b pb-8">
        <h1 className="text-foreground mb-4 text-4xl leading-tight font-bold tracking-tight md:text-5xl">
          {title}
        </h1>
        {sentAt && (
          <time
            dateTime={
              sentAt instanceof Date
                ? sentAt.toISOString()
                : new Date(sentAt).toISOString()
            }
            className="text-muted-foreground text-base font-medium"
          >
            {new Intl.DateTimeFormat("en-US", {
              dateStyle: "long",
            }).format(sentAt instanceof Date ? sentAt : new Date(sentAt))}
          </time>
        )}
      </header>

      {/* Newsletter sections - only render sections that exist */}
      {hasAnyContent ? (
        <div className="space-y-12">
          {introduction && (
            <NewsletterSection
              headline={introduction.headline}
              content={introduction.content}
            />
          )}

          {concept && (
            <NewsletterSection
              headline={concept.headline}
              content={concept.content}
            />
          )}

          {tradeoffs && (
            <NewsletterSection
              headline={tradeoffs.headline}
              content={tradeoffs.content}
            />
          )}

          {applications && (
            <NewsletterSection
              headline={applications.headline}
              content={applications.content}
            />
          )}

          {example && (
            <NewsletterSection
              headline={example.headline}
              content={example.content}
            />
          )}

          {commonPitfalls && (
            <NewsletterSection
              headline={commonPitfalls.headline}
              content={commonPitfalls.content}
            />
          )}

          {keyTakeaways && (
            <section>
              <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight">
                {keyTakeaways.headline}
              </h2>
              <ul className="text-foreground/90 my-6 space-y-3 pl-6 text-lg leading-relaxed">
                {keyTakeaways.bullets.map((bullet, index) => (
                  <li key={index} className="list-disc">
                    {bullet}
                  </li>
                ))}
              </ul>
              {keyTakeaways.closingSentence && (
                <p className="text-foreground/90 mt-6 text-lg leading-relaxed">
                  {keyTakeaways.closingSentence}
                </p>
              )}
            </section>
          )}
        </div>
      ) : (
        <div className="text-muted-foreground py-12 text-center">
          <p className="text-lg">Newsletter content is not available.</p>
        </div>
      )}
    </article>
  );
}
