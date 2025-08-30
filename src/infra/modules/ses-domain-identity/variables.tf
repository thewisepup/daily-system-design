variable "domain" {
  description = "Domain name to create SES identity for"
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