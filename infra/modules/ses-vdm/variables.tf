variable "app_name" {
  description = "Application name for resource naming"
  type        = string
}

variable "env" {
  description = "Environment name (dev, prod)"
  type        = string
}


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
