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

variable "region" {
  description = "AWS region"
  type        = string
}