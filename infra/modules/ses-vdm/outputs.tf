# VDM Account Configuration Outputs
output "vdm_account_enabled" {
  description = "Whether VDM is enabled at account level"
  value       = aws_sesv2_account_vdm_attributes.main.vdm_enabled
}

output "dashboard_engagement_metrics_enabled" {
  description = "Whether Dashboard engagement metrics are enabled"
  value       = aws_sesv2_account_vdm_attributes.main.dashboard_attributes[0].engagement_metrics
}

output "guardian_optimized_shared_delivery_enabled" {
  description = "Whether Guardian optimized shared delivery is enabled"
  value       = aws_sesv2_account_vdm_attributes.main.guardian_attributes[0].optimized_shared_delivery
}

# Newsletter Configuration Set Outputs
output "newsletter_configuration_set_name" {
  description = "Name of the newsletter SES configuration set"
  value       = aws_sesv2_configuration_set.newsletter.configuration_set_name
}

output "newsletter_configuration_set_arn" {
  description = "ARN of the newsletter SES configuration set"
  value       = aws_sesv2_configuration_set.newsletter.arn
}

# Transactional Configuration Set Outputs
output "transactional_configuration_set_name" {
  description = "Name of the transactional SES configuration set"
  value       = aws_sesv2_configuration_set.transactional.configuration_set_name
}

output "transactional_configuration_set_arn" {
  description = "ARN of the transactional SES configuration set"
  value       = aws_sesv2_configuration_set.transactional.arn
}