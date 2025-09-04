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
