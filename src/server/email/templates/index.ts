export function getWelcomeEmailText(): string {
  return `Welcome to Daily System Design!

Hi there,

Welcome to Daily System Design! We're excited to have you join our community of engineers learning system design.

What to Expect:
- Daily system design topics delivered to your inbox
- Real-world examples and case studies from top tech companies  
- Progressive learning from fundamentals to advanced concepts
- Practical insights you can apply in interviews and work

We'll notify you when Daily System Design officially launches. In the meantime, thank you for joining our waitlist!

Best regards,
The Daily System Design Team

---
You're receiving this email because you signed up for Daily System Design.
If you have any questions, feel free to reply to this email.`;
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
    .feature-list {
      margin: 20px 0;
      padding-left: 0;
    }
    .feature-item {
      list-style: none;
      margin-bottom: 12px;
      padding-left: 0;
    }
    .feature-item strong {
      color: #1f2937;
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
      <p class="subtitle">We're excited to have you join our community</p>
    </div>
    
    <div class="content">
      <p>Hi there,</p>
      
      <p>Welcome to Daily System Design! We're excited to have you join our community of engineers learning system design.</p>
      
      <h2 class="section-title">What to Expect</h2>
      
      <ul class="feature-list">
        <li class="feature-item"><strong>Daily system design topics</strong> delivered to your inbox</li>
        <li class="feature-item"><strong>Real-world examples and case studies</strong> from top tech companies</li>
        <li class="feature-item"><strong>Progressive learning</strong> from fundamentals to advanced concepts</li>
        <li class="feature-item"><strong>Practical insights</strong> you can apply in interviews and work</li>
      </ul>
      
      <p>We'll notify you when Daily System Design officially launches. In the meantime, thank you for joining our waitlist!</p>
      
      <p>Best regards,<br>
      The Daily System Design Team</p>
    </div>
    
    <div class="footer">
      <p>You're receiving this email because you signed up for Daily System Design.</p>
      <p>If you have any questions, feel free to reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
}