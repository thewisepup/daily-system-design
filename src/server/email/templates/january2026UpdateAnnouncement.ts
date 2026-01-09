/**
 * Email template for January 2026 Update Announcement
 * Includes {{FEEDBACK_URL}} placeholder for per-user substitution
 */
export function getJanuary2026UpdateAnnouncementContent(): {
  subject: string;
  htmlContent: string;
  textContent: string;
} {
  const subject = "🎉 Daily System Design Newsletter - January 2026 Updates";

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily System Design Newsletter - January 2026 Updates</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #252525;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
    }
    .container {
      background-color: #ffffff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      border-bottom: 1px solid #ebebeb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .title {
      color: #252525;
      font-size: 24px;
      font-weight: 600;
      margin: 0;
    }
    .section {
      margin-bottom: 24px;
    }
    .section-headline {
      color: #252525;
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 12px 0;
    }
    .section-content {
      color: #252525;
      font-size: 16px;
      line-height: 1.6;
    }
    .update-list {
      margin: 0;
      padding-left: 20px;
    }
    .update-item {
      color: #252525;
      margin-bottom: 12px;
      line-height: 1.6;
    }
    .feedback-section {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 20px;
      margin: 24px 0;
    }
    .sponsor-section {
      background-color: #fef3c7;
      border: 1px solid #fde047;
      border-radius: 10px;
      padding: 20px;
      margin: 24px 0;
    }
    .sponsor-title {
      color: #92400e;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 10px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #10b981;
      color: #ffffff;
      padding: 12px 24px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 500;
    }
    .cta-button:hover {
      background-color: #059669;
    }
    .footer {
      border-top: 1px solid #ebebeb;
      padding-top: 20px;
      font-size: 12px;
      color: #8b8b8b;
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
      <h1 class="title">🎉 January 2026 Updates</h1>
    </div>

    <div class="section">
      <div class="section-content">Happy New Year!</div>
    </div>

    <div class="section">
      <div class="section-content">One of my goals this year is to invest more time into this newsletter. Here's what's changed so far:</div>
    </div>

    <div class="section">
      <h2 class="section-headline">What's New</h2>
      <ul class="update-list">
        <li class="update-item"><strong>🤖 Updated Newsletter Generation</strong> - Newsletters are much shorter and easier to read. Newsletters will also start using <strong>Claude Opus 4.5</strong> instead of GPT-4o.</li>
        <li class="update-item"><strong>📚 Newsletter Archive</strong> - You can now read previous newsletters at <a href="https://dailysystemdesign.com/newsletter"> dailysystemdesign.com/newsletter</a>. This was highly requested feedback from you all (yes, I do read your feedback).</li>
        <li class="update-item"><strong>🎨 New Landing Page</strong> - Check it out at <a href="https://dailysystemdesign.com"> dailysystemdesign.com</a></li>
        </ul>
    </div>
    <div class="feedback-section">
      <h2 class="section-headline" style="margin-top: 0;">Feedback</h2>
      <div class="section-content" style="margin-bottom: 15px;"> I read everyone's feedback. It helps me know what to focus on to push the newsletter in the right direction. Please share what you'd like to see in future newsletters!</div>
      <div style="text-align: center;">
        <a data-ses-no-track href="{{FEEDBACK_URL}}" class="cta-button">Submit Feedback</a>
      </div>
    </div>

    <div class="sponsor-section">
      <p class="sponsor-title">💼 Looking for Sponsors</p>
      <div class="section-content">To keep this newsletter free, I'm looking for sponsors interested in ad slots. If you or anyone you know are interested please contact me at <a href="mailto:wisepup257@gmail.com">wisepup257@gmail.com</a>.</div>
    </div>

    <div class="section">
      <div class="section-content">Thank you for subscribing! It truly means a lot to me.<br><br>Best,<br>the.wisepup</div>
    </div>

    <div class="footer">
      <p>This email was sent by Daily System Design Newsletter</p>
    </div>
  </div>
</body>
</html>`;

  const textContent = `🎉 Daily System Design Newsletter - January 2026 Updates

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

💼 LOOKING FOR SPONSORS

To keep this newsletter free for everyone and make it a sustainable project, I'm looking for sponsors. If you or anyone you know are interested in sponsoring a newsletter that targets software engineers, please contact me at wisepup257@gmail.com.

---

FEEDBACK

Please share your thoughts on what can be improved and what you'd like to see in future newsletters. I read everyone's feedback, and it helps me push the newsletter in the right direction.

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
