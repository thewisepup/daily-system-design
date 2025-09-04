terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    upstash = {
      source  = "upstash/upstash"
      version = "~> 1.0"
    }
  }
}

provider "aws" {
  region  = var.region
  profile = var.aws_profile
}


provider "upstash" {
  email   = var.upstash_email
  api_key = var.upstash_api_key
}
