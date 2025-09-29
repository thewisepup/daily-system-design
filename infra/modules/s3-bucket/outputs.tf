output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.hello_world_bucket.bucket
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.hello_world_bucket.arn
}

output "advertiser_logos_bucket_name" {
  description = "Name of the advertiser logos S3 bucket"
  value       = aws_s3_bucket.advertiser_logos_bucket.bucket
}

output "advertiser_logos_bucket_arn" {
  description = "ARN of the advertiser logos S3 bucket"
  value       = aws_s3_bucket.advertiser_logos_bucket.arn
}

output "advertiser_logos_public_url" {
  description = "Public URL base for advertiser logos (append filename)"
  value       = "https://${aws_s3_bucket.advertiser_logos_bucket.bucket}.s3.amazonaws.com"
}