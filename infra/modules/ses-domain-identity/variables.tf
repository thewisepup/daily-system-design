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

variable "mail_from_subdomain" {
  description = "Subdomain to use for custom MAIL FROM (e.g., 'mail' creates mail.domain.com)"
  type        = string
  default     = "mail"
}