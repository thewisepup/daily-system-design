env                 = "dev"
aws_profile         = "daily-system-design-dev"
region              = "us-west-2"
admin_email_address = "wisepup257+dailysystemdesign-dev@gmail.com"
domain              = "dailysystemdesign.com"

# VDM settings for dev environment (enabled for testing)
# 
# COST OPTIMIZATION NOTE:
# VDM Dashboard engagement metrics have usage-based pricing (~$1 per 1,000 emails).
# For lower environment testing or cost-sensitive scenarios, consider disabling VDM:
#
# TODO: For beta/staging environments, disable VDM to save costs:
# vdm_enabled                                = false
# dashboard_engagement_metrics_enabled       = false  
# guardian_optimized_shared_delivery_enabled = false
#
# Current settings (full VDM enabled for development testing):
vdm_enabled                                = true
dashboard_engagement_metrics_enabled       = true
guardian_optimized_shared_delivery_enabled = true
