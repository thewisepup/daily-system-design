variable "env" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.env)
    error_message = "Environment must be either 'dev' or 'prod'."
  }
}

variable "aws_profile" {
  description = "AWS profile to use"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "admin_email_address" {
  description = "Admin email address for SES identity"
  type        = string
}

variable "domain" {
  description = "Domain name for SES domain identity"
  type        = string
}

# VDM (Virtual Deliverability Manager) variables
variable "vdm_enabled" {
  description = "Enable Virtual Deliverability Manager at account level"
  type        = bool
  default     = true
}

variable "dashboard_engagement_metrics_enabled" {
  description = "Enable VDM Dashboard engagement metrics (open rates, click rates, etc.)"
  type        = bool
  default     = true
}

variable "guardian_optimized_shared_delivery_enabled" {
  description = "Enable VDM Guardian optimized shared delivery (IP reputation management)"
  type        = bool
  default     = true
}

# SES Event Tracking variables
variable "ses_bounce_webhook_endpoint" {
  description = "HTTPS webhook endpoint URL for receiving SES bounce notifications from SNS (e.g., https://example.com/api/webhook/ses-bounce)"
  type        = string
  validation {
    condition     = can(regex("^https://", var.ses_bounce_webhook_endpoint))
    error_message = "SES bounce webhook endpoint must be an HTTPS URL."
  }
}

# CloudWatch Alarm Notification variables
variable "alert_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  validation {
    condition     = can(regex("^[^@]+@[^@]+\\.[^@]+$", var.alert_email))
    error_message = "Alert email must be a valid email address."
  }
}

variable "critical_alert_phone" {
  description = "Phone number for critical CloudWatch alarm SMS notifications (format: +1234567890)"
  type        = string
  validation {
    condition     = can(regex("^\\+[1-9][0-9]{10,14}$", var.critical_alert_phone))
    error_message = "Critical alert phone number must be in international format (+1234567890)."
  }
}
