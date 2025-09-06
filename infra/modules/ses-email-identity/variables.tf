variable "admin_email_address" {
  description = "Admin email address to create SES identity for"
  type        = string
}

variable "app_name" {
  description = "Application name for resource naming"
  type        = string
}

variable "env" {
  description = "Environment name"
  type        = string
}