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
