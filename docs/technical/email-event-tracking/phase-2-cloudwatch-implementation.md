# Phase 2: CloudWatch Email Event Tracking Implementation Plan

## Overview
Implement CloudWatch monitoring for email delivery operations using existing configuration set infrastructure. Add CloudWatch event destinations, automated alerting, and operational dashboards.

## Current Infrastructure Analysis
✅ **Configuration Sets**: Already implemented via `ses-vdm` module
✅ **Email Service Integration**: `deliveryConfiguration` parameter already passes config sets to SES
✅ **Event Destination Module**: Existing `ses-event-destination` module supports CloudWatch destinations

## Implementation Steps

### 1. Infrastructure Updates (Terraform)

#### A. Add CloudWatch Event Destinations
- Create CloudWatch event destinations for newsletter and transactional config sets
- Configure dimensions for email type differentiation (newsletter vs transactional)
- Capture all SES events: SEND, DELIVERY, BOUNCE, COMPLAINT, OPEN, CLICK

#### B. Create SNS Alarm Topics
- Email notifications topic for operational alerts
- SMS notifications topic for critical alerts
- Separate topics for different severity levels

#### C. Add CloudWatch Alarms
- Bounce rate thresholds: >5% warning, >10% critical
- Complaint rate thresholds: >0.1% warning, >0.5% critical
- Delivery failure spike detection (statistical anomaly detection)

#### D. Create CloudWatch Dashboard
- Real-time email volume metrics by type
- Delivery rates, bounce rates, complaint rates
- Historical trend analysis widgets

### 2. Email Service Code Updates (Minor)

#### A. Configuration Set Selection Logic
- Newsletter emails: Auto-select `daily-system-design-newsletter-{env}`
- Transactional emails: Auto-select `daily-system-design-transactional-{env}`
- Maintain backward compatibility with explicit `deliveryConfiguration`

#### B. Helper Methods
- Add config set name constants
- Update email service methods to automatically set config sets when not provided

### 3. CloudWatch Configuration

#### Data Retention Settings
- **CloudWatch Logs**: Forever (indefinite retention)
- **CloudWatch Metrics**: Standard 15 months retention
- **Estimated Cost**: $10-30/month for typical email volumes

#### Dashboard Features
- Email volume trends (daily/weekly/monthly)
- Success/failure rates by email type
- Real-time event stream monitoring
- Comparative analysis (newsletter vs transactional performance)

### 4. Alerting Strategy

#### Email Notifications (via SNS)
- Bounce rate spike alerts
- Complaint rate threshold breaches
- Delivery failure pattern detection

#### SMS Notifications (via SNS)
- Critical threshold breaches only
- System-wide email delivery failures

### 5. Testing & Validation

#### Dev Environment Testing
- Verify CloudWatch metrics collection
- Test alarm threshold triggers
- Validate dashboard data accuracy

#### Production Deployment
- Gradual rollout with monitoring
- Alarm threshold tuning based on baseline metrics
- Dashboard optimization for operational use

## Detailed Technical Implementation

### Configuration Set Names
```
Newsletter: daily-system-design-newsletter-{env}
Transactional: daily-system-design-transactional-{env}
```

### CloudWatch Metrics Dimensions
```
- MessageTag_emailType: newsletter | transactional
- ConfigurationSet: {config-set-name}
- Event: send | delivery | bounce | complaint | open | click
```

### Alarm Thresholds
```
Bounce Rate Warning: > 5%
Bounce Rate Critical: > 10%
Complaint Rate Warning: > 0.1%
Complaint Rate Critical: > 0.5%
```

### SNS Topics Structure
```
- daily-system-design-email-alerts-{env}
- daily-system-design-email-critical-{env}
```

## Key Benefits
- **Zero Email Service Disruption**: Leverages existing configuration set infrastructure
- **Real-time Operational Visibility**: Immediate insight into email delivery health
- **Proactive Issue Detection**: Automated alerting for delivery problems
- **Type-Specific Monitoring**: Separate tracking for newsletter vs transactional emails
- **Foundation for Analytics**: Ready for Phase 3 data lake integration

## Implementation Timeline
- **Week 1**: Infrastructure setup (Terraform resources)
- **Week 2**: Email service updates and testing
- **Week 3**: Dashboard configuration and alarm tuning
- **Week 4**: Production deployment and monitoring validation

## Success Criteria
- ✅ CloudWatch metrics collecting for all SES events
- ✅ Separate monitoring for newsletter vs transactional emails
- ✅ Automated alerting for bounce/complaint rate spikes
- ✅ Operational dashboard providing real-time visibility
- ✅ No disruption to existing email sending functionality

## Files to Modify/Create

### Terraform Infrastructure
- `infra/main.tf`: Add CloudWatch event destinations and alarms
- `infra/modules/cloudwatch-dashboard/`: New module for email dashboard
- `infra/modules/sns-topic/`: Extend for alarm notifications
- `infra/variables.tf`: Add CloudWatch configuration variables
- `infra/dev.tfvars` & `infra/prod.tfvars`: Environment-specific values

### Email Service Code
- `src/server/email/emailService.ts`: Add config set selection logic
- `src/server/email/constants/configSets.ts`: New file for config set names
- `src/server/email/types.ts`: Extend types if needed

### Environment Configuration
- `.env.example`: Document new CloudWatch-related variables
- Environment files: Add SNS topic ARNs for notifications

## Next Steps
1. Create Terraform resources for CloudWatch event destinations
2. Implement email service config set selection logic
3. Set up CloudWatch dashboard and alarms
4. Configure SNS notification subscriptions
5. Test in development environment
6. Deploy to production with monitoring