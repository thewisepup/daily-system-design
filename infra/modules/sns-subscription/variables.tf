variable "topic_arn" {
  description = "ARN of the SNS topic to subscribe to"
  type        = string
}

variable "protocol" {
  description = "Protocol for the subscription (sqs, https, email, etc.)"
  type        = string
}

variable "endpoint" {
  description = "Endpoint for the subscription"
  type        = string
}

variable "enable_dlq" {
  description = "Whether to create a dead letter queue for failed deliveries"
  type        = bool
  default     = false
}

variable "dlq_name" {
  description = "Name for the dead letter queue (required if enable_dlq is true)"
  type        = string
  default     = ""
}

variable "dlq_message_retention_seconds" {
  description = "Message retention period for the DLQ in seconds"
  type        = number
  default     = 1209600 # 14 days
}

variable "delivery_policy" {
  description = "Delivery policy configuration for the subscription"
  type = object({
    min_delay_target      = optional(number, 20)
    max_delay_target      = optional(number, 600)
    num_retries          = optional(number, 5)
    num_max_delay_retries = optional(number, 3)
    num_min_delay_retries = optional(number, 0)
    num_no_delay_retries  = optional(number, 0)
    backoff_function     = optional(string, "exponential")
  })
  default = {
    min_delay_target      = 20
    max_delay_target      = 600
    num_retries          = 5
    num_max_delay_retries = 3
    num_min_delay_retries = 0
    num_no_delay_retries  = 0
    backoff_function     = "exponential"
  }
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}