# Get current AWS account ID for policy conditions
data "aws_caller_identity" "current" {}

# Dead Letter Queue for failed deliveries (conditional)
resource "aws_sqs_queue" "dlq" {
  count = var.enable_dlq ? 1 : 0

  name                      = var.dlq_name
  message_retention_seconds = var.dlq_message_retention_seconds

  tags = merge(var.tags, {
    Purpose = "Dead letter queue for failed SNS deliveries"
  })
}

# IAM policy document allowing SNS to send messages to the DLQ (conditional)
data "aws_iam_policy_document" "dlq_policy" {
  count = var.enable_dlq ? 1 : 0

  statement {
    sid    = "AllowSNSSendMessageToDLQ"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }

    actions = [
      "sqs:SendMessage"
    ]

    resources = [
      aws_sqs_queue.dlq[0].arn
    ]

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}

# Attach policy to DLQ (conditional)
resource "aws_sqs_queue_policy" "dlq_policy" {
  count = var.enable_dlq ? 1 : 0

  queue_url = aws_sqs_queue.dlq[0].id
  policy    = data.aws_iam_policy_document.dlq_policy[0].json
}

# SNS Topic Subscription
resource "aws_sns_topic_subscription" "subscription" {
  topic_arn = var.topic_arn
  protocol  = var.protocol
  endpoint  = var.endpoint

  # Delivery policy with exponential backoff
  delivery_policy = jsonencode({
    "healthyRetryPolicy" = {
      "minDelayTarget"     = var.delivery_policy.min_delay_target
      "maxDelayTarget"     = var.delivery_policy.max_delay_target
      "numRetries"         = var.delivery_policy.num_retries
      "numMaxDelayRetries" = var.delivery_policy.num_max_delay_retries
      "numMinDelayRetries" = var.delivery_policy.num_min_delay_retries
      "numNoDelayRetries"  = var.delivery_policy.num_no_delay_retries
      "backoffFunction"    = var.delivery_policy.backoff_function
    }
  })

  # Configure dead letter queue if enabled
  redrive_policy = var.enable_dlq ? jsonencode({
    "deadLetterTargetArn" = aws_sqs_queue.dlq[0].arn
  }) : null
}