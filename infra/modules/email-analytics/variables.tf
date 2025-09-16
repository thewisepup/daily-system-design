variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be 'dev' or 'prod'."
  }
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "daily-system-design"
}

variable "email_events_bucket_name" {
  description = "S3 bucket name for email events storage"
  type        = string
}

variable "athena_results_bucket_name" {
  description = "S3 bucket name for Athena query results"
  type        = string
}

variable "firehose_buffer_size" {
  description = "Firehose buffer size in MB. Recommended: 128 MB for efficient Parquet conversion"
  type        = number
  default     = 128
}

variable "firehose_buffer_interval" {
  description = "Firehose buffer interval in seconds"
  type        = number
  default     = 60
}

variable "glue_crawler_schedule" {
  description = "Glue crawler schedule (cron expression)"
  type        = string
  default     = "cron(0 6 ? * SUN *)" # Weekly on Sundays at 6 AM UTC
}

variable "athena_query_result_retention_days" {
  description = "Number of days to retain Athena query results"
  type        = number
  default     = 30
}

variable "athena_bytes_scanned_cutoff" {
  description = "Maximum bytes scanned per query (in bytes)"
  type        = number
  default     = 1073741824 # 1 GB
}

variable "lifecycle_transition_days" {
  description = "Days after which objects transition to Standard-IA"
  type        = number
  default     = 30
}

variable "newsletter_configuration_set_name" {
  description = "Name of the newsletter SES configuration set"
  type        = string
}

variable "transactional_configuration_set_name" {
  description = "Name of the transactional SES configuration set"
  type        = string
}

variable "event_types" {
  description = "List of SES event types to capture"
  type        = list(string)
  default     = ["SEND", "REJECT", "BOUNCE", "COMPLAINT", "DELIVERY", "OPEN", "CLICK", "RENDERING_FAILURE", "DELIVERY_DELAY", "SUBSCRIPTION"]
}

variable "enabled" {
  description = "Whether the SES event destinations are enabled"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project   = "daily-system-design"
    Component = "email-analytics"
  }
}