import type { NewsletterResponse } from "~/server/llm/schemas/newsletter";

/**
 * Converts structured NewsletterResponse contentJson to HTML template
 * Uses {{UNSUBSCRIBE_URL}} placeholder for user-specific substitution
 */
export function convertContentJsonToHtml(
  contentJson: NewsletterResponse,
  title: string,
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    .container {
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .title {
      color: #1f2937;
      font-size: 24px;
      font-weight: 600;
      margin: 0;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-headline {
      color: #1f2937;
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 15px 0;
    }
    .section-content {
      color: #374151;
      font-size: 16px;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .faq-item {
      margin-bottom: 20px;
    }
    .faq-question {
      color: #1f2937;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .faq-answer {
      color: #374151;
      line-height: 1.6;
    }
    .takeaway-list {
      margin: 0;
      padding-left: 20px;
    }
    .takeaway-item {
      color: #374151;
      margin-bottom: 8px;
      line-height: 1.5;
    }
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
    .unsubscribe {
      color: #9ca3af;
      text-decoration: none;
    }
    .unsubscribe:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">${title}</h1>
    </div>
    
    <div class="section">
      <h2 class="section-headline">${contentJson.introduction.headline}</h2>
      <div class="section-content">${contentJson.introduction.content}</div>
    </div>

    <div class="section">
      <h2 class="section-headline">${contentJson.overview.headline}</h2>
      <div class="section-content">${contentJson.overview.content}</div>
    </div>

    <div class="section">
      <h2 class="section-headline">${contentJson.concept.headline}</h2>
      <div class="section-content">${contentJson.concept.content}</div>
    </div>

    <div class="section">
      <h2 class="section-headline">${contentJson.tradeoffs.headline}</h2>
      <div class="section-content">${contentJson.tradeoffs.content}</div>
    </div>

    <div class="section">
      <h2 class="section-headline">${contentJson.applications.headline}</h2>
      <div class="section-content">${contentJson.applications.content}</div>
    </div>

    <div class="section">
      <h2 class="section-headline">${contentJson.example.headline}</h2>
      <div class="section-content">${contentJson.example.content}</div>
    </div>

    <div class="section">
      <h2 class="section-headline">${contentJson.commonPitfalls.headline}</h2>
      <div class="section-content">${contentJson.commonPitfalls.content}</div>
    </div>

    <div class="section">
      <h2 class="section-headline">${contentJson.faq.headline}</h2>
      ${contentJson.faq.items
        .map(
          (item) => `
        <div class="faq-item">
          <div class="faq-question">Q: ${item.q}</div>
          <div class="faq-answer">A: ${item.a}</div>
        </div>
      `,
        )
        .join("")}
    </div>

    <div class="section">
      <h2 class="section-headline">${contentJson.keyTakeaways.headline}</h2>
      <ul class="takeaway-list">
        ${contentJson.keyTakeaways.bullets
          .map(
            (bullet) => `
          <li class="takeaway-item">${bullet}</li>
        `,
          )
          .join("")}
      </ul>
    </div>
    
    <div class="footer">
      <p>This email was sent by Daily System Design Newsletter</p>
      <p><a href="{{UNSUBSCRIBE_URL}}" class="unsubscribe">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Converts structured NewsletterResponse contentJson to plain text template
 * Uses {{UNSUBSCRIBE_URL}} placeholder for user-specific substitution
 */
export function convertContentJsonToText(
  contentJson: NewsletterResponse,
  title: string,
): string {
  const faqText = contentJson.faq.items
    .map((item) => `Q: ${item.q}\nA: ${item.a}`)
    .join("\n\n");

  const takeawaysText = contentJson.keyTakeaways.bullets
    .map((bullet) => `• ${bullet}`)
    .join("\n");

  return `${title}

${contentJson.introduction.headline}
${contentJson.introduction.content}

${contentJson.overview.headline}
${contentJson.overview.content}

${contentJson.concept.headline}
${contentJson.concept.content}

${contentJson.tradeoffs.headline}
${contentJson.tradeoffs.content}

${contentJson.applications.headline}
${contentJson.applications.content}

${contentJson.example.headline}
${contentJson.example.content}

${contentJson.commonPitfalls.headline}
${contentJson.commonPitfalls.content}

${contentJson.faq.headline}
${faqText}

${contentJson.keyTakeaways.headline}
${takeawaysText}

---
This email was sent by Daily System Design Newsletter
Unsubscribe: {{UNSUBSCRIBE_URL}}`;
}
