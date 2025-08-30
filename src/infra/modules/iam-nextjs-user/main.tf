# IAM user for Next.js application
resource "aws_iam_user" "nextjs_user" {
  name = "${var.app_name}-nextjs-${var.env}"
  path = "/"

  tags = {
    Name        = "${var.app_name}-nextjs-${var.env}"
    Environment = var.env
    Purpose     = "NextJS application SES access"
  }
}

# IAM policy for SES sending permissions
resource "aws_iam_policy" "ses_send_policy" {
  name        = "${var.app_name}-ses-send-${var.env}"
  path        = "/"
  description = "IAM policy for SES email sending"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = [
          var.ses_identity_arn,
          "arn:aws:ses:${var.region}:*:configuration-set/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ses:GetSendQuota",
          "ses:GetSendStatistics"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-ses-send-${var.env}"
    Environment = var.env
  }
}

# Attach policy to user
resource "aws_iam_user_policy_attachment" "nextjs_ses_policy" {
  user       = aws_iam_user.nextjs_user.name
  policy_arn = aws_iam_policy.ses_send_policy.arn
}

# Create access key for the user
resource "aws_iam_access_key" "nextjs_access_key" {
  user = aws_iam_user.nextjs_user.name
}