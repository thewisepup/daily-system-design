output "subscription_arn" {
  description = "ARN of the SNS subscription"
  value       = aws_sns_topic_subscription.subscription.arn
}

output "subscription_id" {
  description = "ID of the SNS subscription"
  value       = aws_sns_topic_subscription.subscription.id
}

output "dlq_arn" {
  description = "ARN of the dead letter queue (if created)"
  value       = var.enable_dlq ? aws_sqs_queue.dlq[0].arn : null
}

output "dlq_url" {
  description = "URL of the dead letter queue (if created)"
  value       = var.enable_dlq ? aws_sqs_queue.dlq[0].id : null
}

output "dlq_name" {
  description = "Name of the dead letter queue (if created)"
  value       = var.enable_dlq ? aws_sqs_queue.dlq[0].name : null
}