export function getWelcomeEmailText(): string {
  return `Welcome to Daily System Design!

Hi there,
Welcome to Daily System Design!

We're launching VERY soon and we'll notify you when we do. In the meantime, thank you for joining our waitlist!

We're on a mission to education the next generation of software engineers. Follow @the.wisepup on Instagram (https://instagram.com/the.wisepup) and TikTok (https://tiktok.com/@the.wisepup) for updates and system design content. I appreciate the support from you all.

Best regards,
the.wisepup

---
You're receiving this email because you signed up for Daily System Design.`;
}

export function getWelcomeEmail(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Daily System Design</title>
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
      text-align: center;
    }
    .title {
      color: #2563eb;
      font-size: 28px;
      font-weight: 600;
      margin: 0;
    }
    .subtitle {
      color: #666;
      font-size: 18px;
      margin: 10px 0 0 0;
    }
    .content {
      color: #374151;
      font-size: 16px;
      margin-bottom: 30px;
    }
    .section-title {
      color: #2563eb;
      font-size: 20px;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
      margin: 25px 0 15px 0;
    }
    a {
      color: #2563eb;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">Welcome to Daily System Design!</h1>
      <p class="subtitle">Learn a system design concept every day in just 10 minutes</p>
    </div>
    
    <div class="content">
      <p>Hi there,</p>
      
      <p>Welcome to Daily System Design!</p>
      
      <p>We're launching VERY soon and we'll notify you when we do. In the meantime, thank you for joining our waitlist!</p>
      
      <p>We're on a mission to education the next generation of software engineers. Follow @the.wisepup on <a href="https://instagram.com/the.wisepup" style="color: #2563eb; text-decoration: none;">Instagram</a> and <a href="https://tiktok.com/@the.wisepup" style="color: #2563eb; text-decoration: none;">TikTok</a> for updates and system design content. I appreciate the support from you all.</p>
      
      <p>Best regards,<br>
      the.wisepup</p>
    </div>
    
    <div class="footer">
      <p>You're receiving this email because you signed up for Daily System Design.</p>
    </div>
  </div>
</body>
</html>`;
}
