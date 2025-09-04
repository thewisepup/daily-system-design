variable "database_name" {
  description = "Name of the Upstash Redis database"
  type        = string
}

variable "primary_region" {
  description = "Primary Upstash region for global Redis database"
  type        = string
  default     = "us-west-2"
}

