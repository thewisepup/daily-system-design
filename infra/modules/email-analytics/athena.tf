# Amazon Athena Workgroup for Email Analytics
resource "aws_athena_workgroup" "email_analytics" {
  name        = "email-analytics-${var.environment}"
  description = "Workgroup for email analytics queries - ${var.environment}"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.athena_results.bucket}/"

      encryption_configuration {
        encryption_option = "SSE_S3"
      }
    }

    bytes_scanned_cutoff_per_query = var.athena_bytes_scanned_cutoff
  }

  tags = merge(var.tags, {
    Name        = "email-analytics-${var.environment}"
    Environment = var.environment
  })
}

# Create a named query for testing the setup
resource "aws_athena_named_query" "test_newsletter_events" {
  name        = "test-newsletter-events-${var.environment}"
  description = "Test query for newsletter events table"
  database    = aws_glue_catalog_database.email_events.name
  workgroup   = aws_athena_workgroup.email_analytics.name

  query = <<-EOF
    SELECT
      eventtype,
      COUNT(*) as event_count,
      DATE(from_unixtime(CAST(mail.timestamp AS bigint) / 1000)) as event_date
    FROM ${aws_glue_catalog_database.email_events.name}.${aws_glue_catalog_table.newsletter_events.name}
    WHERE year = '2025' AND month = '09'
    GROUP BY eventtype, DATE(from_unixtime(CAST(mail.timestamp AS bigint) / 1000))
    ORDER BY event_date DESC, event_count DESC
    LIMIT 100;
  EOF
}

# Create a named query for advertiser metrics
resource "aws_athena_named_query" "newsletter_advertiser_metrics" {
  name        = "newsletter-advertiser-metrics-${var.environment}"
  description = "Daily newsletter performance metrics for advertisers"
  database    = aws_glue_catalog_database.email_events.name
  workgroup   = aws_athena_workgroup.email_analytics.name

  query = <<-EOF
    SELECT
      year, month, day,
      COUNT(CASE WHEN eventtype = 'send' THEN 1 END) as emails_sent,
      COUNT(CASE WHEN eventtype = 'delivery' THEN 1 END) as emails_delivered,
      COUNT(CASE WHEN eventtype = 'open' THEN 1 END) as emails_opened,
      COUNT(CASE WHEN eventtype = 'click' THEN 1 END) as emails_clicked,
      ROUND(
        COUNT(CASE WHEN eventtype = 'open' THEN 1 END) * 100.0 /
        NULLIF(COUNT(CASE WHEN eventtype = 'delivery' THEN 1 END), 0), 2
      ) as open_rate_percent,
      ROUND(
        COUNT(CASE WHEN eventtype = 'click' THEN 1 END) * 100.0 /
        NULLIF(COUNT(CASE WHEN eventtype = 'delivery' THEN 1 END), 0), 2
      ) as click_rate_percent
    FROM ${aws_glue_catalog_database.email_events.name}.${aws_glue_catalog_table.newsletter_events.name}
    WHERE year = '2025' AND month = '09'
    GROUP BY year, month, day
    ORDER BY year, month, day;
  EOF
}
