# Local variables for reusable configurations
locals {
  # Common storage descriptor for SES email events
  email_events_storage_descriptor = {
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"

    ser_de_info = {
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"
    }

    columns = [
      {
        name = "eventtype"
        type = "string"
      },
      {
        name = "mail"
        type = "struct<timestamp:timestamp,messageId:string,source:string,sourceArn:string,sourceIp:string,callerIdentity:string,sendingAccountId:string,destination:array<string>,headersTruncated:boolean,headers:array<struct<name:string,value:string>>,commonHeaders:struct<from:array<string>,to:array<string>,messageId:string,subject:string>,tags:map<string,string>>"
      },
      {
        name = "delivery"
        type = "struct<timestamp:timestamp,processingTimeMillis:bigint,recipients:array<string>,smtpResponse:string,reportingMTA:string>"
      },
      {
        name = "open"
        type = "struct<timestamp:timestamp,userAgent:string,ipAddress:string>"
      },
      {
        name = "click"
        type = "struct<timestamp:timestamp,userAgent:string,ipAddress:string,link:string,linkTags:map<string,string>>"
      },
      {
        name = "bounce"
        type = "struct<timestamp:timestamp,feedbackId:string,bounceType:string,bounceSubType:string,bouncedRecipients:array<struct<emailAddress:string,action:string,status:string,diagnosticCode:string>>>"
      },
      {
        name = "complaint"
        type = "struct<timestamp:timestamp,feedbackId:string,userAgent:string,complaintFeedbackType:string,arrivalDate:timestamp,complainedRecipients:array<struct<emailAddress:string>>>"
      }
    ]
  }

  # Common partition configuration
  date_partitions = [
    {
      name = "year"
      type = "string"
    },
    {
      name = "month"
      type = "string"
    },
    {
      name = "day"
      type = "string"
    }
  ]

  # Common partition projection parameters
  partition_projection_params = {
    "classification"                = "parquet"
    "projection.enabled"            = "true"
    "projection.year.type"          = "integer"
    "projection.year.range"         = "2024,2030"
    "projection.month.type"         = "integer"
    "projection.month.range"        = "1,12"
    "projection.month.digits"       = "2"
    "projection.day.type"           = "integer"
    "projection.day.range"          = "1,31"
    "projection.day.digits"         = "2"
  }
}

# AWS Glue Catalog Database
resource "aws_glue_catalog_database" "email_events" {
  name        = "email_events_db_${var.environment}"
  description = "Database for email event analytics - ${var.environment}"

  tags = merge(var.tags, {
    Name        = "email-events-db-${var.environment}"
    Environment = var.environment
  })
}

# AWS Glue Catalog Table for Newsletter Events
resource "aws_glue_catalog_table" "newsletter_events" {
  name          = "newsletter_events"
  database_name = aws_glue_catalog_database.email_events.name
  description   = "Newsletter email events table"

  table_type = "EXTERNAL_TABLE"

  parameters = merge(local.partition_projection_params, {
    "storage.location.template" = "s3://${var.email_events_bucket_name}/newsletter/year=$${year}/month=$${month}/day=$${day}/"
  })

  dynamic "partition_keys" {
    for_each = local.date_partitions
    content {
      name = partition_keys.value.name
      type = partition_keys.value.type
    }
  }

  storage_descriptor {
    location      = "s3://${var.email_events_bucket_name}/newsletter/"
    input_format  = local.email_events_storage_descriptor.input_format
    output_format = local.email_events_storage_descriptor.output_format

    ser_de_info {
      serialization_library = local.email_events_storage_descriptor.ser_de_info.serialization_library
    }

    dynamic "columns" {
      for_each = local.email_events_storage_descriptor.columns
      content {
        name = columns.value.name
        type = columns.value.type
      }
    }
  }
}

# AWS Glue Catalog Table for Transactional Events
resource "aws_glue_catalog_table" "transactional_events" {
  name          = "transactional_events"
  database_name = aws_glue_catalog_database.email_events.name
  description   = "Transactional email events table"

  table_type = "EXTERNAL_TABLE"

  parameters = merge(local.partition_projection_params, {
    "storage.location.template" = "s3://${var.email_events_bucket_name}/transactional/year=$${year}/month=$${month}/day=$${day}/"
  })

  dynamic "partition_keys" {
    for_each = local.date_partitions
    content {
      name = partition_keys.value.name
      type = partition_keys.value.type
    }
  }

  storage_descriptor {
    location      = "s3://${var.email_events_bucket_name}/transactional/"
    input_format  = local.email_events_storage_descriptor.input_format
    output_format = local.email_events_storage_descriptor.output_format

    ser_de_info {
      serialization_library = local.email_events_storage_descriptor.ser_de_info.serialization_library
    }

    dynamic "columns" {
      for_each = local.email_events_storage_descriptor.columns
      content {
        name = columns.value.name
        type = columns.value.type
      }
    }
  }
}

# AWS Glue Crawler for Newsletter Events
resource "aws_glue_crawler" "newsletter_events" {
  database_name = aws_glue_catalog_database.email_events.name
  name          = "newsletter-events-crawler-${var.environment}"
  role          = aws_iam_role.glue_crawler_role.arn
  description   = "Crawler for newsletter email events"

  s3_target {
    path = "s3://${var.email_events_bucket_name}/newsletter/"
  }

  schedule = var.glue_crawler_schedule

  schema_change_policy {
    update_behavior = "UPDATE_IN_DATABASE"
    delete_behavior = "LOG"
  }

  tags = merge(var.tags, {
    Name        = "newsletter-events-crawler-${var.environment}"
    Environment = var.environment
    Type        = "newsletter"
  })
}

# AWS Glue Crawler for Transactional Events
resource "aws_glue_crawler" "transactional_events" {
  database_name = aws_glue_catalog_database.email_events.name
  name          = "transactional-events-crawler-${var.environment}"
  role          = aws_iam_role.glue_crawler_role.arn
  description   = "Crawler for transactional email events"

  s3_target {
    path = "s3://${var.email_events_bucket_name}/transactional/"
  }

  schedule = var.glue_crawler_schedule

  schema_change_policy {
    update_behavior = "UPDATE_IN_DATABASE"
    delete_behavior = "LOG"
  }

  tags = merge(var.tags, {
    Name        = "transactional-events-crawler-${var.environment}"
    Environment = var.environment
    Type        = "transactional"
  })
}