# IAM role for Kinesis Data Firehose
resource "aws_iam_role" "firehose_delivery_role" {
  name = "firehose-delivery-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "firehose.amazonaws.com",
            "ses.amazonaws.com"
          ]
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name        = "firehose-delivery-role-${var.environment}"
    Environment = var.environment
  })
}

# IAM policy for Firehose to access S3
resource "aws_iam_role_policy" "firehose_delivery_policy" {
  name = "firehose-delivery-policy-${var.environment}"
  role = aws_iam_role.firehose_delivery_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:AbortMultipartUpload",
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.email_events.arn,
          "${aws_s3_bucket.email_events.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = [
          "arn:aws:logs:${var.region}:*:log-group:/aws/kinesisfirehose/email-events-*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "glue:GetTable",
          "glue:GetTableVersion",
          "glue:GetTableVersions"
        ]
        Resource = [
          "arn:aws:glue:${var.region}:*:catalog",
          "arn:aws:glue:${var.region}:*:database/email_events_db_${var.environment}",
          "arn:aws:glue:${var.region}:*:table/email_events_db_${var.environment}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "firehose:PutRecord",
          "firehose:PutRecordBatch"
        ]
        Resource = [
          aws_kinesis_firehose_delivery_stream.newsletter_events.arn,
          aws_kinesis_firehose_delivery_stream.transactional_events.arn
        ]
      }
    ]
  })
}

# IAM role for AWS Glue Crawler
resource "aws_iam_role" "glue_crawler_role" {
  name = "glue-crawler-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "glue.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name        = "glue-crawler-role-${var.environment}"
    Environment = var.environment
  })
}

# Attach AWS managed policy for Glue service role
resource "aws_iam_role_policy_attachment" "glue_service_role" {
  role       = aws_iam_role.glue_crawler_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole"
}

# IAM policy for Glue Crawler to access S3
resource "aws_iam_role_policy" "glue_crawler_s3_policy" {
  name = "glue-crawler-s3-policy-${var.environment}"
  role = aws_iam_role.glue_crawler_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.email_events.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.email_events.arn
        ]
      }
    ]
  })
}