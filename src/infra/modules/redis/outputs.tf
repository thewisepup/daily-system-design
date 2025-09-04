output "redis_token" {
  description = "Upstash Redis REST Token"
  value       = upstash_redis_database.main.rest_token
  sensitive   = true
}

output "database_id" {
  description = "Upstash Redis Database ID"
  value       = upstash_redis_database.main.database_id
}

output "endpoint" {
  description = "Upstash Redis Endpoint"
  value       = upstash_redis_database.main.endpoint
}
