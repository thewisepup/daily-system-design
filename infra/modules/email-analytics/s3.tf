# S3 bucket for storing email events
resource "aws_s3_bucket" "email_events" {
  bucket = var.email_events_bucket_name

  tags = merge(var.tags, {
    Name        = "email-events-${var.environment}"
    Environment = var.environment
    Purpose     = "email-events-storage"
  })
}

# Enable versioning for data protection
resource "aws_s3_bucket_versioning" "email_events" {
  bucket = aws_s3_bucket.email_events.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption for email events bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "email_events" {
  bucket = aws_s3_bucket.email_events.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Block public access to email events bucket
resource "aws_s3_bucket_public_access_block" "email_events" {
  bucket = aws_s3_bucket.email_events.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policy for email events bucket
resource "aws_s3_bucket_lifecycle_configuration" "email_events" {
  bucket = aws_s3_bucket.email_events.id

  rule {
    id     = "email_events_lifecycle"
    status = "Enabled"

    # Apply to all objects in the bucket
    filter {}

    # Transition to Standard-IA after configured days
    transition {
      days          = var.lifecycle_transition_days
      storage_class = "STANDARD_IA"
    }

    # Cleanup incomplete multipart uploads
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# S3 bucket for Athena query results
resource "aws_s3_bucket" "athena_results" {
  bucket = var.athena_results_bucket_name

  tags = merge(var.tags, {
    Name        = "athena-results-${var.environment}"
    Environment = var.environment
    Purpose     = "athena-query-results"
  })
}

# Enable versioning for Athena results bucket
resource "aws_s3_bucket_versioning" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption for Athena results bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Block public access to Athena results bucket
resource "aws_s3_bucket_public_access_block" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policy for Athena results bucket
resource "aws_s3_bucket_lifecycle_configuration" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  rule {
    id     = "athena_results_lifecycle"
    status = "Enabled"

    # Apply to all objects in the bucket
    filter {}

    # Delete query results after retention period
    expiration {
      days = var.athena_query_result_retention_days
    }

    # Cleanup incomplete multipart uploads
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}