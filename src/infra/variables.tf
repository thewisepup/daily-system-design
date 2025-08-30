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
