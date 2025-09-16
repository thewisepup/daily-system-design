# SES Event Destinations for Email Analytics
# Routes SES events to Kinesis Firehose streams for data lake storage

# Newsletter SES Firehose Destination
module "newsletter_ses_firehose_destination" {
  source = "../ses-event-destination"

  configuration_set_name  = var.newsletter_configuration_set_name
  event_destination_name  = "newsletter-firehose"
  event_types            = var.event_types
  enabled                = var.enabled

  kinesis_destination = {
    stream_arn = aws_kinesis_firehose_delivery_stream.newsletter_events.arn
    role_arn   = aws_iam_role.firehose_delivery_role.arn
  }
}

# Transactional SES Firehose Destination
module "transactional_ses_firehose_destination" {
  source = "../ses-event-destination"

  configuration_set_name  = var.transactional_configuration_set_name
  event_destination_name  = "transactional-firehose"
  event_types            = var.event_types
  enabled                = var.enabled

  kinesis_destination = {
    stream_arn = aws_kinesis_firehose_delivery_stream.transactional_events.arn
    role_arn   = aws_iam_role.firehose_delivery_role.arn
  }
}