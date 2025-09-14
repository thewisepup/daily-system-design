
# SES Configuration Set Event Destination
resource "aws_sesv2_configuration_set_event_destination" "destination" {
  event_destination_name = var.event_destination_name
  configuration_set_name = var.configuration_set_name

  event_destination {
    enabled              = var.enabled
    matching_event_types = var.event_types

    # SNS Destination (conditional)
    dynamic "sns_destination" {
      for_each = var.sns_destination != null ? [var.sns_destination] : []
      content {
        topic_arn = sns_destination.value.topic_arn
      }
    }

    # CloudWatch Destination (conditional)
    dynamic "cloud_watch_destination" {
      for_each = var.cloudwatch_destination != null ? [1] : []
      content {
        dynamic "dimension_configuration" {
          for_each = var.cloudwatch_destination != null ? var.cloudwatch_destination : []
          content {
            default_dimension_value = dimension_configuration.value.default_value
            dimension_name          = dimension_configuration.value.dimension_name
            dimension_value_source  = dimension_configuration.value.value_source
          }
        }
      }
    }

    # Kinesis Destination (conditional)
    dynamic "kinesis_firehose_destination" {
      for_each = var.kinesis_destination != null ? [var.kinesis_destination] : []
      content {
        delivery_stream_arn = kinesis_firehose_destination.value.stream_arn
        iam_role_arn        = kinesis_firehose_destination.value.role_arn
      }
    }
  }
}
