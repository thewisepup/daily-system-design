/**
 * Email template for launch announcement
 */
export function getLaunchAnnouncementContent(): {
  subject: string;
  htmlContent: string;
  textContent: string;
} {
  const subject = "🚀 Daily System Design Newsletter Launch";

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily System Design Newsletter Launch</title>
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
    }
    .format-list {
      margin: 0;
      padding-left: 20px;
    }
    .format-item {
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
      <h1 class="title">🚀 Daily System Design Newsletter Launch</h1>
    </div>

    <div class="section">
      <div class="section-content">Hi there!</div>
    </div>

    <div class="section">
      <div class="section-content">We're finally ready to launch Daily System Design Newsletter on <strong>Monday September 29th, 2025</strong>.</div>
    </div>

    <div class="section">
      <div class="section-content">Newsletters get sent out daily at <strong>3:00 AM PST / 6:00 AM EST</strong>.</div>
    </div>

    <div class="section">
      <div class="section-content"><em>Note: All newsletters and topics are generated with AI.</em></div>
    </div>

    <div class="section">
      <div class="section-content">Send feedback to @the.wisepup on <a href="https://instagram.com/the.wisepup" style="color: #2563eb; text-decoration: none;">Instagram</a> or <a href="https://tiktok.com/@the.wisepup" style="color: #2563eb; text-decoration: none;">TikTok</a>.</div>
    </div>

    <div class="section">
      <div class="section-content">Many thanks,<br>the.wisepup</div>
    </div>

    <div class="footer">
      <p>This email was sent by Daily System Design Newsletter</p>
    </div>
  </div>
</body>
</html>`;

  const textContent = `🚀 Daily System Design Newsletter Launch

Hi there!

We're finally ready to launch Daily System Design Newsletter on **Monday September 29th, 2025**.

Newsletters get sent out daily at **3:00 AM PST / 6:00 AM EST**.

*Note: All newsletters and topics are generated with AI.*

Send feedback to @the.wisepup on Instagram and TikTok so we can fine tune the newsletter system prompt.

Many thanks,
the.wisepup

---
This email was sent by Daily System Design Newsletter`;

  return {
    subject,
    htmlContent,
    textContent,
  };
}
