# Get current AWS account ID for policy conditions
data "aws_caller_identity" "current" {}

# SNS Topic
resource "aws_sns_topic" "topic" {
  name = var.topic_name
  tags = var.tags
}

# IAM policy document allowing SES to publish to the topic (conditional)
data "aws_iam_policy_document" "ses_publish_policy" {
  count = var.enable_ses_publish_policy ? 1 : 0

  statement {
    sid    = "AllowSESPublishToTopic"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ses.amazonaws.com"]
    }

    actions = [
      "sns:Publish"
    ]

    resources = [
      aws_sns_topic.topic.arn
    ]

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}

# Attach SES publish policy to the topic (conditional)
resource "aws_sns_topic_policy" "ses_publish_policy" {
  count = var.enable_ses_publish_policy ? 1 : 0

  arn    = aws_sns_topic.topic.arn
  policy = data.aws_iam_policy_document.ses_publish_policy[0].json
}