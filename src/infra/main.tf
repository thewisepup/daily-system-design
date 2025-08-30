locals {
  app_name = "daily-system-design"
}

# S3 bucket using module
module "s3_bucket" {
  source = "./modules/s3-bucket"
  
  app_name = local.app_name
  env      = var.env
}
