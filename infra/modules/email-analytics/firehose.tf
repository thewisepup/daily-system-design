# CloudWatch Log Group for Firehose Newsletter Stream
resource "aws_cloudwatch_log_group" "firehose_newsletter" {
  name              = "/aws/kinesisfirehose/email-events-newsletter-${var.environment}"
  retention_in_days = 14

  tags = merge(var.tags, {
    Name        = "firehose-newsletter-logs-${var.environment}"
    Environment = var.environment
  })
}

# CloudWatch Log Stream for Firehose Newsletter Stream
resource "aws_cloudwatch_log_stream" "firehose_newsletter" {
  name           = "S3Delivery"
  log_group_name = aws_cloudwatch_log_group.firehose_newsletter.name
}

# CloudWatch Log Group for Firehose Transactional Stream
resource "aws_cloudwatch_log_group" "firehose_transactional" {
  name              = "/aws/kinesisfirehose/email-events-transactional-${var.environment}"
  retention_in_days = 14

  tags = merge(var.tags, {
    Name        = "firehose-transactional-logs-${var.environment}"
    Environment = var.environment
  })
}

# CloudWatch Log Stream for Firehose Transactional Stream
resource "aws_cloudwatch_log_stream" "firehose_transactional" {
  name           = "S3Delivery"
  log_group_name = aws_cloudwatch_log_group.firehose_transactional.name
}

# Kinesis Data Firehose Delivery Stream for Newsletter Events
resource "aws_kinesis_firehose_delivery_stream" "newsletter_events" {
  name        = "email-events-newsletter-${var.environment}"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn   = aws_iam_role.firehose_delivery_role.arn
    bucket_arn = aws_s3_bucket.email_events.arn
    prefix     = "newsletter/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"
    error_output_prefix = "errors/newsletter/"

    buffering_size     = var.firehose_buffer_size
    buffering_interval = var.firehose_buffer_interval
    compression_format = "UNCOMPRESSED"  # Required when data format conversion is enabled

    # Data format conversion to Parquet
    data_format_conversion_configuration {
      enabled = true

      input_format_configuration {
        deserializer {
          open_x_json_ser_de {}
        }
      }

      output_format_configuration {
        serializer {
          parquet_ser_de {
            compression = "GZIP"  # Enable compression at Parquet level
          }
        }
      }

      schema_configuration {
        database_name = aws_glue_catalog_database.email_events.name
        table_name    = aws_glue_catalog_table.newsletter_events.name
        role_arn      = aws_iam_role.firehose_delivery_role.arn
      }
    }

    # CloudWatch logging
    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = aws_cloudwatch_log_group.firehose_newsletter.name
      log_stream_name = aws_cloudwatch_log_stream.firehose_newsletter.name
    }
  }

  tags = merge(var.tags, {
    Name        = "email-events-newsletter-${var.environment}"
    Environment = var.environment
    Type        = "newsletter"
  })
}

# Kinesis Data Firehose Delivery Stream for Transactional Events
resource "aws_kinesis_firehose_delivery_stream" "transactional_events" {
  name        = "email-events-transactional-${var.environment}"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn   = aws_iam_role.firehose_delivery_role.arn
    bucket_arn = aws_s3_bucket.email_events.arn
    prefix     = "transactional/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"
    error_output_prefix = "errors/transactional/"

    buffering_size     = var.firehose_buffer_size
    buffering_interval = var.firehose_buffer_interval
    compression_format = "UNCOMPRESSED"  # Required when data format conversion is enabled

    # Data format conversion to Parquet
    data_format_conversion_configuration {
      enabled = true

      input_format_configuration {
        deserializer {
          open_x_json_ser_de {}
        }
      }

      output_format_configuration {
        serializer {
          parquet_ser_de {
            compression = "GZIP"  # Enable compression at Parquet level
          }
        }
      }

      schema_configuration {
        database_name = aws_glue_catalog_database.email_events.name
        table_name    = aws_glue_catalog_table.transactional_events.name
        role_arn      = aws_iam_role.firehose_delivery_role.arn
      }
    }

    # CloudWatch logging
    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = aws_cloudwatch_log_group.firehose_transactional.name
      log_stream_name = aws_cloudwatch_log_stream.firehose_transactional.name
    }
  }

  tags = merge(var.tags, {
    Name        = "email-events-transactional-${var.environment}"
    Environment = var.environment
    Type        = "transactional"
  })
}