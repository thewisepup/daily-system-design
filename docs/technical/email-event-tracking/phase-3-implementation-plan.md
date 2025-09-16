# Phase 3: SES Event Data Lake Implementation Plan

## Architecture Decision Summary
- **2 Kinesis Firehose streams** (newsletter + transactional) for clean data separation
- **Daily partitioning** (`year/month/day/`) without hours for optimal file sizes
- **Parquet format** with GZIP compression for cost efficiency and query performance

## Infrastructure Components

### 1. S3 Bucket Configuration
- **Environment-specific buckets**: `daily-system-design-email-events-{env}` (dev/prod)
- **Region**: us-west-2
- **Lifecycle policy**: Standard (0-30 days) → Standard-IA (30+ days)
- **Versioning**: Enabled for data protection
- **Server-side encryption**: AES-256

### 2. Kinesis Data Firehose Streams (2 per environment)
- **Newsletter stream**: `email-events-newsletter-{env}`
- **Transactional stream**: `email-events-transactional-{env}`
- **Destination**: Extended S3 with Parquet conversion
- **Compression**: GZIP
- **Buffering**: 60 seconds OR 5MB (whichever first)
- **Error handling**: Separate S3 prefix for failed records

### 3. S3 Partitioning Structure
```
s3://daily-system-design-email-events-{env}/
├── newsletter/
│   ├── year=2025/month=01/day=15/
│   ├── year=2025/month=01/day=16/
│   └── year=2025/month=01/day=17/
├── transactional/
│   ├── year=2025/month=01/day=15/
│   ├── year=2025/month=01/day=16/
│   └── year=2025/month=01/day=17/
└── errors/
    ├── newsletter/
    └── transactional/
```

### 4. AWS Glue Data Catalog
- **Database**: `email_events_db_{env}`
- **Tables**: `newsletter_events`, `transactional_events`
- **Schema discovery**: AWS Glue Crawler (weekly schedule)
- **Partition projection**: Enabled for fast querying without crawling

### 5. Amazon Athena Configuration
- **Workgroup**: `email-analytics-{env}`
- **Query result location**: `s3://daily-system-design-athena-results-{env}/`
- **Data format**: Parquet with partition projection
- **Cost controls**: 1GB query limit, result retention policies

## Implementation Steps

### Step 1: S3 Infrastructure Setup
1. Create S3 buckets for email events and Athena results
2. Configure lifecycle policies (Standard → Standard-IA after 30 days)
3. Set up server-side encryption and versioning
4. Create IAM service roles for Firehose with S3 access

### Step 2: Kinesis Data Firehose Configuration
1. Create 2 delivery streams per environment:
   - Newsletter events stream with S3 destination `newsletter/`
   - Transactional events stream with S3 destination `transactional/`
2. Configure Extended S3 with Parquet conversion and GZIP compression
3. Set up daily partitioning (`year=YYYY/month=MM/day=DD/`)
4. Configure buffering (60s OR 5MB) and error record handling
5. Enable CloudWatch logging for monitoring

### Step 3: SES Configuration Integration
1. Update existing SES configuration sets:
   - `daily-system-design-newsletter-{env}` → Newsletter Firehose stream
   - `daily-system-design-transactional-{env}` → Transactional Firehose stream
2. Configure event publishing for: send, delivery, bounce, complaint, open, click
3. Test event flow with sample emails from both configuration sets
4. Validate events appear in correct S3 partitions

### Step 4: AWS Glue Data Catalog Setup
1. Create Glue database `email_events_db_{env}`
2. Create tables for newsletter_events and transactional_events
3. Configure partition projection for date-based querying
4. Set up Glue Crawler for schema evolution (weekly schedule)

### Step 5: Amazon Athena Configuration
1. Create dedicated workgroup `email-analytics-{env}`
2. Configure query result location and 1GB scan limit
3. Create tables with partition projection for optimized queries
4. Test sample queries for advertiser metrics

### Step 6: Testing & Validation
1. Send test emails through both newsletter and transactional flows
2. Verify events appear in correct S3 partitions within 60 seconds
3. Validate Athena can query both tables successfully
4. Test key advertiser metric queries:
   - Daily engagement rates
   - Weekly growth trends
   - Top clicked links
5. Monitor Firehose delivery success in CloudWatch

### Step 7: Monitoring & Operations Setup
1. Configure CloudWatch dashboards for both Firehose streams
2. Set up alerts for delivery failures and high error rates
3. Monitor S3 storage costs and Athena query costs
4. Create billing alerts for unexpected usage spikes
5. Document query patterns for advertiser reporting

## Terraform Implementation Structure
```
src/infra/modules/
├── email-analytics/
│   ├── s3.tf              # S3 buckets and lifecycle
│   ├── firehose.tf        # 2 Firehose streams
│   ├── glue.tf            # Data catalog and crawler
│   ├── athena.tf          # Workgroup and result bucket
│   ├── iam.tf             # Service roles and policies
│   ├── variables.tf       # Environment-specific vars
│   └── outputs.tf         # Resource ARNs for SES config
```

## Key Metrics for Advertisers
- **Overall engagement**: Opens/Delivered, Clicks/Delivered ratios
- **Subscriber growth**: Daily/weekly/monthly subscriber acquisition
- **Newsletter performance**: Daily open rates and click-through rates
- **Link engagement**: Most clicked links and engagement patterns

## Cost Optimization Benefits
- **Parquet + GZIP**: ~90% reduction in storage costs vs raw JSON
- **2-stream architecture**: No configuration_set filtering overhead
- **Daily partitioning**: Optimal file sizes (2K+ events/day per stream)
- **Partition projection**: Eliminates expensive MSCK REPAIR operations
- **Standard-IA lifecycle**: 40-50% storage cost reduction after 30 days

## Future Extensibility
- **Schema evolution**: Automatic via Glue Crawler for new SES event fields
- **Campaign tracking**: Ready for advertiser/campaign ID via SES message tags
- **Real-time analytics**: Can add Kinesis Analytics for live dashboards
- **Redshift integration**: Same S3 data can feed Redshift for complex reporting

## Technical Requirements Summary

### Prerequisites
- Existing SES configuration sets:
  - `daily-system-design-newsletter-{env}`
  - `daily-system-design-transactional-{env}`
- AWS CLI profiles configured for each environment
- Terraform workspaces set up for dev/prod isolation

### Resource Naming Convention
- S3 Buckets: `daily-system-design-{purpose}-{env}`
- Firehose Streams: `email-events-{type}-{env}`
- Glue Database: `email_events_db_{env}`
- Athena Workgroup: `email-analytics-{env}`

### Security Considerations
- IAM roles with least privilege access
- S3 bucket policies restricting cross-account access
- Encryption at rest (AES-256) and in transit
- CloudTrail logging for audit compliance
- VPC endpoints for secure AWS service communication

### Monitoring & Alerting
- CloudWatch dashboards for Firehose delivery metrics
- Alerts for delivery failures and error rates
- Cost monitoring for S3 storage and Athena queries
- Billing alerts for unexpected usage spikes

### Performance Optimization
- Partition projection for fast query performance
- Optimal buffering configuration for file sizes
- GZIP compression for storage efficiency
- Parquet columnar format for analytical queries