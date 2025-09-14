output "event_destination_name" {
  description = "Name of the SES event destination"
  value       = aws_sesv2_configuration_set_event_destination.destination.event_destination_name
}

output "configuration_set_name" {
  description = "Name of the SES configuration set"
  value       = aws_sesv2_configuration_set_event_destination.destination.configuration_set_name
}

output "event_types" {
  description = "List of event types being captured"
  value       = aws_sesv2_configuration_set_event_destination.destination.event_destination[0].matching_event_types
}

output "enabled" {
  description = "Whether the event destination is enabled"
  value       = aws_sesv2_configuration_set_event_destination.destination.event_destination[0].enabled
}