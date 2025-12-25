import type { NewsletterResponse } from "~/server/llm/schemas/newsletter";

interface NewsletterJsonContentProps {
  title: string;
  sentAt?: Date | null;
  contentJson: NewsletterResponse;
}

export default function NewsletterJsonContent({
  title,
  sentAt,
  contentJson,
}: NewsletterJsonContentProps) {
  return (
    <article>
      {/* Newsletter header */}
      <header className="border-border mb-12 border-b pb-8">
        <h1 className="text-foreground mb-4 text-4xl leading-tight font-bold tracking-tight md:text-5xl">
          {title}
        </h1>
        {sentAt && (
          <time
            dateTime={sentAt.toISOString()}
            className="text-muted-foreground text-base font-medium"
          >
            {new Intl.DateTimeFormat("en-US", {
              dateStyle: "long",
            }).format(sentAt)}
          </time>
        )}
      </header>

      {/* Newsletter sections */}
      <div className="space-y-12">
        {/* Introduction */}
        <section>
          <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight">
            {contentJson.introduction.headline}
          </h2>
          <p className="text-foreground/90 text-lg leading-relaxed whitespace-pre-wrap">
            {contentJson.introduction.content}
          </p>
        </section>

        {/* Concept */}
        <section>
          <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight">
            {contentJson.concept.headline}
          </h2>
          <p className="text-foreground/90 text-lg leading-relaxed whitespace-pre-wrap">
            {contentJson.concept.content}
          </p>
        </section>

        {/* Tradeoffs */}
        <section>
          <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight">
            {contentJson.tradeoffs.headline}
          </h2>
          <p className="text-foreground/90 text-lg leading-relaxed whitespace-pre-wrap">
            {contentJson.tradeoffs.content}
          </p>
        </section>

        {/* Applications */}
        <section>
          <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight">
            {contentJson.applications.headline}
          </h2>
          <p className="text-foreground/90 text-lg leading-relaxed whitespace-pre-wrap">
            {contentJson.applications.content}
          </p>
        </section>

        {/* Example */}
        <section>
          <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight">
            {contentJson.example.headline}
          </h2>
          <p className="text-foreground/90 text-lg leading-relaxed whitespace-pre-wrap">
            {contentJson.example.content}
          </p>
        </section>

        {/* Common Pitfalls */}
        <section>
          <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight">
            {contentJson.commonPitfalls.headline}
          </h2>
          <p className="text-foreground/90 text-lg leading-relaxed whitespace-pre-wrap">
            {contentJson.commonPitfalls.content}
          </p>
        </section>

        {/* Key Takeaways */}
        <section>
          <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight">
            {contentJson.keyTakeaways.headline}
          </h2>
          <ul className="text-foreground/90 my-6 space-y-3 pl-6 text-lg leading-relaxed">
            {contentJson.keyTakeaways.bullets.map((bullet, index) => (
              <li key={index} className="list-disc">
                {bullet}
              </li>
            ))}
          </ul>
          <p className="text-foreground/90 mt-6 text-lg leading-relaxed">
            {contentJson.keyTakeaways.closingSentence}
          </p>
        </section>
      </div>
    </article>
  );
}
