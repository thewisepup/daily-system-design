variable "topic_name" {
  description = "Name of the SNS topic"
  type        = string
}

variable "enable_ses_publish_policy" {
  description = "Whether to attach a policy allowing SES to publish to this topic"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to the SNS topic"
  type        = map(string)
  default     = {}
}