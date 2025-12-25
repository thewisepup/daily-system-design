interface NewsletterContentProps {
  title: string;
  sentAt?: Date | null;
  rawHtml?: string | null;
}

function extractBodyContent(html: string): string {
  // If the HTML contains a full document structure, extract just the body content
  const bodyRegex = /<body[^>]*>([\s\S]*)<\/body>/i;
  const bodyMatch = bodyRegex.exec(html);
  if (bodyMatch?.[1]) {
    return bodyMatch[1];
  }
  return html;
}

export default function NewsletterContent({
  title,
  sentAt,
  rawHtml,
}: NewsletterContentProps) {
  const contentHtml = rawHtml ? extractBodyContent(rawHtml) : null;

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

      {/* Newsletter content */}
      {contentHtml ? (
        <div
          className="newsletter-content prose prose-lg prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-4xl prose-h2:mb-6 prose-h2:mt-12 prose-h2:text-3xl prose-h3:mb-4 prose-h3:mt-8 prose-h3:text-2xl prose-p:mb-6 prose-p:leading-relaxed prose-p:text-foreground/90 prose-a:font-medium prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-strong:text-foreground prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-sm prose-code:text-foreground prose-pre:bg-muted prose-pre:text-foreground prose-ul:my-6 prose-ol:my-6 prose-li:my-2 max-w-none"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      ) : (
        <div className="text-muted-foreground py-12 text-center">
          <p className="text-lg">Newsletter content is not available.</p>
        </div>
      )}
    </article>
  );
}
