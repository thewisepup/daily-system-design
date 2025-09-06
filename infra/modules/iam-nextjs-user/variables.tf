variable "app_name" {
  description = "Application name for resource naming"
  type        = string
}

variable "env" {
  description = "Environment name"
  type        = string
}

variable "ses_identity_arn" {
  description = "ARN of the SES identity to allow sending from"
  type        = string
}

variable "ses_domain_identity_arn" {
  description = "ARN of the SES domain identity to allow sending from"
  type        = string
  default     = null
}

variable "region" {
  description = "AWS region"
  type        = string
}