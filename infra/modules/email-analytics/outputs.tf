# S3 Bucket Outputs
output "email_events_bucket_name" {
  description = "Name of the S3 bucket for email events"
  value       = aws_s3_bucket.email_events.bucket
}

output "email_events_bucket_arn" {
  description = "ARN of the S3 bucket for email events"
  value       = aws_s3_bucket.email_events.arn
}

output "athena_results_bucket_name" {
  description = "Name of the S3 bucket for Athena query results"
  value       = aws_s3_bucket.athena_results.bucket
}

output "athena_results_bucket_arn" {
  description = "ARN of the S3 bucket for Athena query results"
  value       = aws_s3_bucket.athena_results.arn
}

# Kinesis Firehose Outputs
output "newsletter_firehose_stream_name" {
  description = "Name of the Kinesis Firehose delivery stream for newsletter events"
  value       = aws_kinesis_firehose_delivery_stream.newsletter_events.name
}

output "newsletter_firehose_stream_arn" {
  description = "ARN of the Kinesis Firehose delivery stream for newsletter events"
  value       = aws_kinesis_firehose_delivery_stream.newsletter_events.arn
}

output "transactional_firehose_stream_name" {
  description = "Name of the Kinesis Firehose delivery stream for transactional events"
  value       = aws_kinesis_firehose_delivery_stream.transactional_events.name
}

output "transactional_firehose_stream_arn" {
  description = "ARN of the Kinesis Firehose delivery stream for transactional events"
  value       = aws_kinesis_firehose_delivery_stream.transactional_events.arn
}

# AWS Glue Outputs
output "glue_database_name" {
  description = "Name of the AWS Glue database for email events"
  value       = aws_glue_catalog_database.email_events.name
}

output "newsletter_table_name" {
  description = "Name of the newsletter events table in Glue Data Catalog"
  value       = aws_glue_catalog_table.newsletter_events.name
}

output "transactional_table_name" {
  description = "Name of the transactional events table in Glue Data Catalog"
  value       = aws_glue_catalog_table.transactional_events.name
}

# Amazon Athena Outputs
output "athena_workgroup_name" {
  description = "Name of the Athena workgroup for email analytics"
  value       = aws_athena_workgroup.email_analytics.name
}

# IAM Role Outputs
output "firehose_delivery_role_arn" {
  description = "ARN of the IAM role for Kinesis Firehose delivery"
  value       = aws_iam_role.firehose_delivery_role.arn
}

output "glue_crawler_role_arn" {
  description = "ARN of the IAM role for AWS Glue crawler"
  value       = aws_iam_role.glue_crawler_role.arn
}