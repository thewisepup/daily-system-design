variable "configuration_set_name" {
  description = "Name of the SES configuration set to add the event destination to"
  type        = string
}

variable "event_destination_name" {
  description = "Name for the SES event destination"
  type        = string
}

variable "event_types" {
  description = "List of SES event types to capture (BOUNCE, COMPLAINT, DELIVERY, SEND, REJECT, OPEN, CLICK, RENDERING_FAILURE, DELIVERY_DELAY, SUBSCRIPTION)"
  type        = list(string)
  default     = ["SEND", "REJECT", "BOUNCE", "COMPLAINT", "DELIVERY", "OPEN", "CLICK", "RENDERING_FAILURE", "DELIVERY_DELAY", "SUBSCRIPTION"]
  validation {
    condition = alltrue([
      for event_type in var.event_types : contains([
        "SEND", "REJECT", "BOUNCE", "COMPLAINT", "DELIVERY",
        "OPEN", "CLICK", "RENDERING_FAILURE", "DELIVERY_DELAY", "SUBSCRIPTION"
      ], event_type)
    ])
    error_message = "Event types must be valid SESv2 event types: SEND, REJECT, BOUNCE, COMPLAINT, DELIVERY, OPEN, CLICK, RENDERING_FAILURE, DELIVERY_DELAY, SUBSCRIPTION."
  }
}

variable "enabled" {
  description = "Whether the event destination is enabled"
  type        = bool
  default     = true
}

# SNS Destination (mutually exclusive with CloudWatch and Kinesis)
variable "sns_destination" {
  description = "SNS destination configuration"
  type = object({
    topic_arn = string
  })
  default = null
}

# CloudWatch Destination (mutually exclusive with SNS and Kinesis)
variable "cloudwatch_destination" {
  description = "CloudWatch destination configuration"
  type = list(object({
    default_value  = string
    dimension_name = string
    value_source   = string # "messageTag", "emailHeader", or "linkTag"
  }))
  default = null
}

# Kinesis Destination (mutually exclusive with SNS and CloudWatch)
variable "kinesis_destination" {
  description = "Kinesis Firehose destination configuration"
  type = object({
    stream_arn = string
    role_arn   = string
  })
  default = null
}

