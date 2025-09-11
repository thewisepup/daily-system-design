export interface NewsletterEmailData {
  title: string;
  content: object;
  topicId: number;
  unsubscribeUrl?: string;
}

export function createNewsletterHtml(data: NewsletterEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
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
    .subtitle {
      color: #6b7280;
      font-size: 14px;
      margin: 5px 0 0 0;
    }
    .content {
      color: #374151;
      font-size: 16px;
      white-space: pre-wrap;
      margin-bottom: 30px;
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
      <h1 class="title">${data.title}</h1>
      <p class="subtitle">Daily System Design Newsletter</p>
    </div>
    
    <div class="content">
${data.content}
    </div>
    
    <div class="footer">
      <p>This email was sent by Daily System Design Newsletter</p>
      ${data.unsubscribeUrl ? `<p><a href="${data.unsubscribeUrl}" class="unsubscribe">Unsubscribe</a></p>` : ""}
    </div>
  </div>
</body>
</html>`;
}

export function createNewsletterText(data: NewsletterEmailData): string {
  return `
${data.title}
Daily System Design Newsletter

${data.content}

---
This email was sent by Daily System Design Newsletter
${data.unsubscribeUrl ? `Unsubscribe: ${data.unsubscribeUrl}` : ""}`;
}
