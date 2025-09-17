/**
 * Email template for launch announcement
 */
export function getLaunchAnnouncementContent(): {
  subject: string;
  htmlContent: string;
  textContent: string;
} {
  const subject = "🚀 The Daily System Design Newsletter is Live!";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
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
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .emoji {
            font-size: 48px;
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="emoji">🚀</div>
        <h1>The Daily System Design Newsletter is Live!</h1>
    </div>

    <p>Hi there!</p>

    <p>We're excited to announce that the <strong>Daily System Design Newsletter</strong> is officially launching! After months of preparation, we're ready to deliver high-quality system design insights directly to your inbox every day.</p>

    <h2>What to Expect:</h2>
    <ul>
        <li><strong>Daily Lessons:</strong> Bite-sized system design concepts that build on each other</li>
        <li><strong>Real-World Examples:</strong> Learn from actual systems used by major tech companies</li>
        <li><strong>Progressive Learning:</strong> From fundamentals to advanced distributed systems</li>
        <li><strong>Practical Focus:</strong> Concepts you can apply in interviews and on the job</li>
    </ul>

    <p>Your first newsletter will arrive tomorrow morning at 9 AM PT. Each email is designed to be read in under 5 minutes, perfect for your morning coffee or commute.</p>

    <p>We've carefully curated 150+ topics that will take you from system design basics to advanced concepts used at scale. Whether you're preparing for interviews or looking to level up your architecture skills, this newsletter will be your daily dose of system design knowledge.</p>

    <div style="text-align: center;">
        <a href="https://daily-system-design.com" class="button">Visit Our Website</a>
    </div>

    <p>Thank you for being part of our launch! We're committed to making this the best system design learning resource available.</p>

    <p>Happy learning!</p>
    <p>The Daily System Design Team</p>

    <div class="footer">
        <p>You're receiving this because you signed up for the Daily System Design Newsletter.</p>
        <p><a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="https://daily-system-design.com">Website</a></p>
    </div>
</body>
</html>
`;

  const textContent = `
🚀 The Daily System Design Newsletter is Live!

Hi there!

We're excited to announce that the Daily System Design Newsletter is officially launching! After months of preparation, we're ready to deliver high-quality system design insights directly to your inbox every day.

What to Expect:

• Daily Lessons: Bite-sized system design concepts that build on each other
• Real-World Examples: Learn from actual systems used by major tech companies
• Progressive Learning: From fundamentals to advanced distributed systems
• Practical Focus: Concepts you can apply in interviews and on the job

Your first newsletter will arrive tomorrow morning at 9 AM PT. Each email is designed to be read in under 5 minutes, perfect for your morning coffee or commute.

We've carefully curated 150+ topics that will take you from system design basics to advanced concepts used at scale. Whether you're preparing for interviews or looking to level up your architecture skills, this newsletter will be your daily dose of system design knowledge.

Visit our website: https://daily-system-design.com

Thank you for being part of our launch! We're committed to making this the best system design learning resource available.

Happy learning!
The Daily System Design Team

---
You're receiving this because you signed up for the Daily System Design Newsletter.
Unsubscribe: {{unsubscribe_url}} | Website: https://daily-system-design.com
`;

  return {
    subject,
    htmlContent,
    textContent,
  };
}