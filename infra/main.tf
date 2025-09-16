locals {
  app_name = "daily-system-design"

  # Workspace validation - HARD ERROR if workspace doesn't match environment
  workspace_validation = terraform.workspace == var.env ? "valid" : file("ERROR: Terraform workspace '${terraform.workspace}' does not match environment '${var.env}'. Please switch to the correct workspace with: terraform workspace select ${var.env}")
}

# S3 bucket using module
module "s3_bucket" {
  source = "./modules/s3-bucket"

  app_name = local.app_name
  env      = var.env
}

# SES admin email identity using module
module "ses_admin_email" {
  source = "./modules/ses-email-identity"

  admin_email_address = var.admin_email_address
  app_name            = local.app_name
  env                 = var.env
}

# SES domain identity using module
module "ses_domain_identity" {
  source = "./modules/ses-domain-identity"

  domain   = var.domain
  app_name = local.app_name
  env      = var.env
}

# IAM user for Next.js application
module "iam_nextjs_user" {
  source = "./modules/iam-nextjs-user"

  app_name                = local.app_name
  env                     = var.env
  ses_identity_arn        = module.ses_admin_email.admin_email_identity_arn
  ses_domain_identity_arn = module.ses_domain_identity.domain_identity_arn
  region                  = var.region
}


# SES Virtual Deliverability Manager (VDM) configuration
module "ses_vdm" {
  source = "./modules/ses-vdm"

  app_name                                   = local.app_name
  env                                        = var.env
  vdm_enabled                                = var.vdm_enabled
  dashboard_engagement_metrics_enabled       = var.dashboard_engagement_metrics_enabled
  guardian_optimized_shared_delivery_enabled = var.guardian_optimized_shared_delivery_enabled

  # Ensure VDM is configured after SES identities are created
  depends_on = [
    module.ses_admin_email,
    module.ses_domain_identity
  ]
}

# SES Event Tracking Infrastructure
# SNS topic for SES bounce notifications
module "ses_bounce_sns_topic" {
  source = "./modules/sns-topic"

  topic_name = "${local.app_name}-email-bounce-notifications-${var.env}"

  //TODO: Code smell, we're coupling ses publish policy with sns topic creation.
  enable_ses_publish_policy = true

  tags = {
    Name        = "${local.app_name}-ses-bounce-notifications-${var.env}"
    Environment = var.env
    Purpose     = "SES bounce event notifications for subscription management"
  }
}

# SNS subscription to webhook with DLQ and exponential retry
module "ses_bounce_webhook_subscription" {
  source = "./modules/sns-subscription"

  topic_arn = module.ses_bounce_sns_topic.topic_arn
  protocol  = "https"
  endpoint  = var.ses_bounce_webhook_endpoint

  enable_dlq                    = true
  dlq_name                      = "${local.app_name}-email-bounce-webhook-dlq-${var.env}"
  dlq_message_retention_seconds = 1209600 # 14 days
  tags = {
    Environment = var.env
    Purpose     = "SES bounce webhook subscription with DLQ"
  }
}

# SES event destinations for newsletter configuration set (SNS for bounce handling)
module "newsletter_ses_bounce_sns_destination" {
  source = "./modules/ses-event-destination"

  configuration_set_name = module.ses_vdm.newsletter_configuration_set_name
  event_destination_name = "${local.app_name}-newsletter-bounce-sns-${var.env}"
  event_types            = ["BOUNCE"]
  enabled                = true

  sns_destination = {
    topic_arn = module.ses_bounce_sns_topic.topic_arn
  }

  depends_on = [module.ses_vdm]
}

# SES event destinations for transactional configuration set (SNS for bounce handling)
module "transactional_ses_bounce_sns_destination" {
  source = "./modules/ses-event-destination"

  configuration_set_name = module.ses_vdm.transactional_configuration_set_name
  event_destination_name = "${local.app_name}-transactional-bounce-sns-${var.env}"
  event_types            = ["BOUNCE"]
  enabled                = true

  sns_destination = {
    topic_arn = module.ses_bounce_sns_topic.topic_arn
  }

  depends_on = [module.ses_vdm]
}

# CloudWatch Event Destinations for Phase 2 Monitoring
# Newsletter configuration set CloudWatch destination - tracks by issue
module "newsletter_ses_cloudwatch_destination" {
  source = "./modules/ses-event-destination"

  configuration_set_name = module.ses_vdm.newsletter_configuration_set_name
  event_destination_name = "newsletter-cloudwatch-${var.env}"
  event_types            = ["SEND", "DELIVERY", "BOUNCE", "COMPLAINT", "OPEN", "CLICK", "REJECT", "RENDERING_FAILURE"]
  enabled                = true

  cloudwatch_destination = [
    {
      default_value  = "unknown"
      dimension_name = "issue_number"
      value_source   = "MESSAGE_TAG"
    },
    {
      default_value  = module.ses_vdm.newsletter_configuration_set_name
      dimension_name = "ConfigurationSet"
      value_source   = "MESSAGE_TAG"
    }
  ]

  depends_on = [module.ses_vdm]
}

# Transactional configuration set CloudWatch destination - tracks by email type
module "transactional_ses_cloudwatch_destination" {
  source = "./modules/ses-event-destination"

  configuration_set_name = module.ses_vdm.transactional_configuration_set_name
  event_destination_name = "transactional-cloudwatch-${var.env}"
  event_types            = ["SEND", "DELIVERY", "BOUNCE", "COMPLAINT", "OPEN", "CLICK", "REJECT", "RENDERING_FAILURE"]
  enabled                = true

  cloudwatch_destination = [
    {
      default_value  = "transactional"
      dimension_name = "transactional_email_type"
      value_source   = "MESSAGE_TAG"
    },
    {
      default_value  = module.ses_vdm.transactional_configuration_set_name
      dimension_name = "ConfigurationSet"
      value_source   = "MESSAGE_TAG"
    }
  ]

  depends_on = [module.ses_vdm]
}

# SNS Topics for CloudWatch Alarms
# Warning alerts topic
module "warning_alerts_sns_topic" {
  source = "./modules/sns-topic"

  topic_name = "warning-alerts-${var.env}"

  tags = {
    Name        = "warning-alerts-${var.env}"
    Environment = var.env
    Purpose     = "Warning alerts for CloudWatch email monitoring alarms"
  }
}

# Critical alerts topic
module "critical_alerts_sns_topic" {
  source = "./modules/sns-topic"

  topic_name = "critical-alerts-${var.env}"

  tags = {
    Name        = "critical-alerts-${var.env}"
    Environment = var.env
    Purpose     = "Critical alerts for CloudWatch email monitoring alarms"
  }
}

# CloudWatch Alarms for Email Monitoring
# Newsletter bounce rate alarm (warning - >5%)
resource "aws_cloudwatch_metric_alarm" "newsletter_bounce_rate_warning" {
  alarm_name          = "newsletter-bounce-rate-warning-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"

  metric_query {
    id = "bounce_rate"

    metric {
      metric_name = "Bounce"
      namespace   = "AWS/SES"
      period      = 300
      stat        = "Sum"

      dimensions = {
        ConfigurationSet = module.ses_vdm.newsletter_configuration_set_name
      }
    }
  }

  metric_query {
    id = "send_count"

    metric {
      metric_name = "Send"
      namespace   = "AWS/SES"
      period      = 300
      stat        = "Sum"

      dimensions = {
        ConfigurationSet = module.ses_vdm.newsletter_configuration_set_name
      }
    }
  }

  metric_query {
    id          = "bounce_percentage"
    expression  = "bounce_rate / send_count * 100"
    label       = "Bounce Rate Percentage"
    return_data = "true"
  }

  threshold         = "5"
  alarm_description = "Newsletter bounce rate >5%"
  alarm_actions     = [module.warning_alerts_sns_topic.topic_arn]

  tags = {
    Environment = var.env
    Purpose     = "Newsletter bounce rate monitoring"
  }
}

# Newsletter bounce rate alarm (critical - >10%)
resource "aws_cloudwatch_metric_alarm" "newsletter_bounce_rate_critical" {
  alarm_name          = "newsletter-bounce-rate-critical-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"

  metric_query {
    id = "bounce_rate"

    metric {
      metric_name = "Bounce"
      namespace   = "AWS/SES"
      period      = 300
      stat        = "Sum"

      dimensions = {
        ConfigurationSet = module.ses_vdm.newsletter_configuration_set_name
      }
    }
  }

  metric_query {
    id = "send_count"

    metric {
      metric_name = "Send"
      namespace   = "AWS/SES"
      period      = 300
      stat        = "Sum"

      dimensions = {
        ConfigurationSet = module.ses_vdm.newsletter_configuration_set_name
      }
    }
  }

  metric_query {
    id          = "bounce_percentage"
    expression  = "bounce_rate / send_count * 100"
    label       = "Bounce Rate Percentage"
    return_data = "true"
  }

  threshold         = "10"
  alarm_description = "Newsletter bounce rate >10% - CRITICAL"
  alarm_actions     = [module.critical_alerts_sns_topic.topic_arn]

  tags = {
    Environment = var.env
    Purpose     = "Newsletter bounce rate critical monitoring"
  }
}

# Newsletter complaint rate alarm (warning - >0.1%)
resource "aws_cloudwatch_metric_alarm" "newsletter_complaint_rate_warning" {
  alarm_name          = "newsletter-complaint-rate-warning-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"

  metric_query {
    id = "complaint_rate"

    metric {
      metric_name = "Complaint"
      namespace   = "AWS/SES"
      period      = 300
      stat        = "Sum"

      dimensions = {
        ConfigurationSet = module.ses_vdm.newsletter_configuration_set_name
      }
    }
  }

  metric_query {
    id = "send_count"

    metric {
      metric_name = "Send"
      namespace   = "AWS/SES"
      period      = 300
      stat        = "Sum"

      dimensions = {
        ConfigurationSet = module.ses_vdm.newsletter_configuration_set_name
      }
    }
  }

  metric_query {
    id          = "complaint_percentage"
    expression  = "complaint_rate / send_count * 100"
    label       = "Complaint Rate Percentage"
    return_data = "true"
  }

  threshold         = "0.1"
  alarm_description = "Newsletter complaint rate >0.1%"
  alarm_actions     = [module.warning_alerts_sns_topic.topic_arn]

  tags = {
    Environment = var.env
    Purpose     = "Newsletter complaint rate monitoring"
  }
}

# Newsletter complaint rate alarm (critical - >0.5%)
resource "aws_cloudwatch_metric_alarm" "newsletter_complaint_rate_critical" {
  alarm_name          = "newsletter-complaint-rate-critical-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"

  metric_query {
    id = "complaint_rate"

    metric {
      metric_name = "Complaint"
      namespace   = "AWS/SES"
      period      = 300
      stat        = "Sum"

      dimensions = {
        ConfigurationSet = module.ses_vdm.newsletter_configuration_set_name
      }
    }
  }

  metric_query {
    id = "send_count"

    metric {
      metric_name = "Send"
      namespace   = "AWS/SES"
      period      = 300
      stat        = "Sum"

      dimensions = {
        ConfigurationSet = module.ses_vdm.newsletter_configuration_set_name
      }
    }
  }

  metric_query {
    id          = "complaint_percentage"
    expression  = "complaint_rate / send_count * 100"
    label       = "Complaint Rate Percentage"
    return_data = "true"
  }

  threshold         = "0.5"
  alarm_description = "Newsletter complaint rate >0.5% - CRITICAL"
  alarm_actions     = [module.critical_alerts_sns_topic.topic_arn]

  tags = {
    Environment = var.env
    Purpose     = "Newsletter complaint rate critical monitoring"
  }
}

# Transactional bounce rate alarm (warning - >5%)
resource "aws_cloudwatch_metric_alarm" "transactional_bounce_rate_warning" {
  alarm_name          = "transactional-bounce-rate-warning-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"

  metric_query {
    id = "bounce_rate"

    metric {
      metric_name = "Bounce"
      namespace   = "AWS/SES"
      period      = 300
      stat        = "Sum"

      dimensions = {
        ConfigurationSet = module.ses_vdm.transactional_configuration_set_name
      }
    }
  }

  metric_query {
    id = "send_count"

    metric {
      metric_name = "Send"
      namespace   = "AWS/SES"
      period      = 300
      stat        = "Sum"

      dimensions = {
        ConfigurationSet = module.ses_vdm.transactional_configuration_set_name
      }
    }
  }

  metric_query {
    id          = "bounce_percentage"
    expression  = "bounce_rate / send_count * 100"
    label       = "Bounce Rate Percentage"
    return_data = "true"
  }

  threshold         = "5"
  alarm_description = "Transactional bounce rate >5%"
  alarm_actions     = [module.warning_alerts_sns_topic.topic_arn]

  tags = {
    Environment = var.env
    Purpose     = "Transactional bounce rate monitoring"
  }
}

# Transactional bounce rate alarm (critical - >10%)
resource "aws_cloudwatch_metric_alarm" "transactional_bounce_rate_critical" {
  alarm_name          = "transactional-bounce-rate-critical-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"

  metric_query {
    id = "bounce_rate"

    metric {
      metric_name = "Bounce"
      namespace   = "AWS/SES"
      period      = 300
      stat        = "Sum"

      dimensions = {
        ConfigurationSet = module.ses_vdm.transactional_configuration_set_name
      }
    }
  }

  metric_query {
    id = "send_count"

    metric {
      metric_name = "Send"
      namespace   = "AWS/SES"
      period      = 300
      stat        = "Sum"

      dimensions = {
        ConfigurationSet = module.ses_vdm.transactional_configuration_set_name
      }
    }
  }

  metric_query {
    id          = "bounce_percentage"
    expression  = "bounce_rate / send_count * 100"
    label       = "Bounce Rate Percentage"
    return_data = "true"
  }

  threshold         = "10"
  alarm_description = "Transactional bounce rate >10% - CRITICAL"
  alarm_actions     = [module.critical_alerts_sns_topic.topic_arn]

  tags = {
    Environment = var.env
    Purpose     = "Transactional bounce rate critical monitoring"
  }
}

# Transactional complaint rate alarm (warning - >0.1%)
resource "aws_cloudwatch_metric_alarm" "transactional_complaint_rate_warning" {
  alarm_name          = "transactional-complaint-rate-warning-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"

  metric_query {
    id = "complaint_rate"

    metric {
      metric_name = "Complaint"
      namespace   = "AWS/SES"
      period      = 300
      stat        = "Sum"

      dimensions = {
        ConfigurationSet = module.ses_vdm.transactional_configuration_set_name
      }
    }
  }

  metric_query {
    id = "send_count"

    metric {
      metric_name = "Send"
      namespace   = "AWS/SES"
      period      = 300
      stat        = "Sum"

      dimensions = {
        ConfigurationSet = module.ses_vdm.transactional_configuration_set_name
      }
    }
  }

  metric_query {
    id          = "complaint_percentage"
    expression  = "complaint_rate / send_count * 100"
    label       = "Complaint Rate Percentage"
    return_data = "true"
  }

  threshold         = "0.1"
  alarm_description = "Transactional complaint rate >0.1%"
  alarm_actions     = [module.warning_alerts_sns_topic.topic_arn]

  tags = {
    Environment = var.env
    Purpose     = "Transactional complaint rate monitoring"
  }
}

# Transactional complaint rate alarm (critical - >0.5%)
resource "aws_cloudwatch_metric_alarm" "transactional_complaint_rate_critical" {
  alarm_name          = "transactional-complaint-rate-critical-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"

  metric_query {
    id = "complaint_rate"

    metric {
      metric_name = "Complaint"
      namespace   = "AWS/SES"
      period      = 300
      stat        = "Sum"

      dimensions = {
        ConfigurationSet = module.ses_vdm.transactional_configuration_set_name
      }
    }
  }

  metric_query {
    id = "send_count"

    metric {
      metric_name = "Send"
      namespace   = "AWS/SES"
      period      = 300
      stat        = "Sum"

      dimensions = {
        ConfigurationSet = module.ses_vdm.transactional_configuration_set_name
      }
    }
  }

  metric_query {
    id          = "complaint_percentage"
    expression  = "complaint_rate / send_count * 100"
    label       = "Complaint Rate Percentage"
    return_data = "true"
  }

  threshold         = "0.5"
  alarm_description = "Transactional complaint rate >0.5% - CRITICAL"
  alarm_actions     = [module.critical_alerts_sns_topic.topic_arn]

  tags = {
    Environment = var.env
    Purpose     = "Transactional complaint rate critical monitoring"
  }
}

# SNS Subscriptions for Alert Notifications
# Email subscription for warning alerts
module "warning_alerts_email_subscription" {
  source = "./modules/sns-subscription"

  topic_arn = module.warning_alerts_sns_topic.topic_arn
  protocol  = "email"
  endpoint  = var.alert_email

  tags = {
    Environment = var.env
    Purpose     = "Email notifications for warning alerts"
  }
}

# Email subscription for critical alerts
module "critical_alerts_email_subscription" {
  source = "./modules/sns-subscription"

  topic_arn = module.critical_alerts_sns_topic.topic_arn
  protocol  = "email"
  endpoint  = var.alert_email

  tags = {
    Environment = var.env
    Purpose     = "Email notifications for critical alerts"
  }
}

#TODO: figure out how to enable this
# SMS subscription for critical alerts
# module "critical_alerts_sms_subscription" {
#   source = "./modules/sns-subscription"

#   topic_arn = module.critical_alerts_sns_topic.topic_arn
#   protocol  = "sms"
#   endpoint  = var.critical_alert_phone

#   tags = {
#     Environment = var.env
#     Purpose     = "SMS notifications for critical alerts"
#   }
# }
