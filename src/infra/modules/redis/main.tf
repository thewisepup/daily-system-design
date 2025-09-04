terraform {
  required_providers {
    upstash = {
      source  = "upstash/upstash"
      version = ">= 1.0.0"
    }
  }
}
# Upstash Redis Database
resource "upstash_redis_database" "main" {
  database_name  = var.database_name
  region         = "global"
  primary_region = var.primary_region
  tls            = true
  eviction       = true
}
