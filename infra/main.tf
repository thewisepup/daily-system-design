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
