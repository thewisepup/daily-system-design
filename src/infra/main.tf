locals {
  app_name = "daily-system-design"
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
  app_name           = local.app_name
  env                = var.env
}
