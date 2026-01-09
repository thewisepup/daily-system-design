/**
 * Email template for January 2025 Update Announcement
 * Includes {{FEEDBACK_URL}} placeholder for per-user substitution
 */
export function getJanuary2025UpdateAnnouncementContent(): {
  subject: string;
  htmlContent: string;
  textContent: string;
} {
  const subject = "🎉 Daily System Design Newsletter - January 2025 Updates";

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily System Design Newsletter - January 2025 Updates</title>
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
      margin-bottom: 24px;
    }
    .section-headline {
      color: #1f2937;
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 12px 0;
    }
    .section-content {
      color: #374151;
      font-size: 16px;
      line-height: 1.6;
    }
    .update-list {
      margin: 0;
      padding-left: 20px;
    }
    .update-item {
      color: #374151;
      margin-bottom: 12px;
      line-height: 1.6;
    }
    .cta-section {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
      text-align: center;
    }
    .cta-title {
      color: #166534;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 10px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #16a34a;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
    }
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
    a {
      color: #2563eb;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">🎉 January 2025 Updates</h1>
    </div>

    <div class="section">
      <div class="section-content">Hi there!</div>
    </div>

    <div class="section">
      <div class="section-content">We've been working hard on some exciting improvements to the Daily System Design Newsletter. Here's what's new:</div>
    </div>

    <div class="section">
      <h2 class="section-headline">What's New</h2>
      <ul class="update-list">
        <li class="update-item"><strong>🎨 Refreshed Landing Page</strong> - We've updated our landing page with a cleaner design and better user experience.</li>
        <li class="update-item"><strong>📚 Newsletter Archive</strong> - You can now browse and read all previous newsletters at <a href="https://dailysystemdesign.com/newsletter">/newsletter</a>. Catch up on any topics you may have missed!</li>
        <li class="update-item"><strong>🤖 Upgraded AI Model</strong> - Newsletter content is now generated using <strong>Claude Opus 4.5</strong>, delivering even higher quality system design explanations and examples.</li>
      </ul>
    </div>

    <div class="cta-section">
      <p class="cta-title">We'd Love Your Feedback!</p>
      <div class="section-content" style="margin-bottom: 15px;">Help us improve by sharing your thoughts on the newsletter.</div>
      <a data-ses-no-track href="{{FEEDBACK_URL}}" class="cta-button">Submit Feedback</a>
    </div>

    <div class="section">
      <div class="section-content">Thank you for being part of our community!<br><br>Best regards,<br>the.wisepup</div>
    </div>

    <div class="footer">
      <p>This email was sent by Daily System Design Newsletter</p>
    </div>
  </div>
</body>
</html>`;

  const textContent = `🎉 Daily System Design Newsletter - January 2025 Updates

Hi there!

We've been working hard on some exciting improvements to the Daily System Design Newsletter. Here's what's new:

WHAT'S NEW
----------

🎨 Refreshed Landing Page
We've updated our landing page with a cleaner design and better user experience.

📚 Newsletter Archive
You can now browse and read all previous newsletters at /newsletter. Catch up on any topics you may have missed!

🤖 Upgraded AI Model
Newsletter content is now generated using Claude Opus 4.5, delivering even higher quality system design explanations and examples.

---

WE'D LOVE YOUR FEEDBACK!

Help us improve by sharing your thoughts on the newsletter.
Submit feedback here: {{FEEDBACK_URL}}

---

Thank you for being part of our community!

Best regards,
the.wisepup

---
This email was sent by Daily System Design Newsletter`;

  return {
    subject,
    htmlContent,
    textContent,
  };
}

