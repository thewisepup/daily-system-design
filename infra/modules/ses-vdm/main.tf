# AWS SES Virtual Deliverability Manager (VDM) Configuration
# Enables account-level VDM with Dashboard (engagement metrics) and Guardian (optimized shared delivery)
# Also creates configuration sets for granular control and detailed tracking

# Account-level VDM configuration
resource "aws_sesv2_account_vdm_attributes" "main" {
  vdm_enabled = var.vdm_enabled ? "ENABLED" : "DISABLED"

  # Dashboard provides engagement metrics (open rates, click rates, etc.)
  dashboard_attributes {
    engagement_metrics = var.dashboard_engagement_metrics_enabled ? "ENABLED" : "DISABLED"
  }

  # Guardian provides optimized shared delivery (IP reputation management)
  guardian_attributes {
    optimized_shared_delivery = var.guardian_optimized_shared_delivery_enabled ? "ENABLED" : "DISABLED"
  }
}

# Configuration set for newsletter with VDM options
resource "aws_sesv2_configuration_set" "newsletter" {
  configuration_set_name = "${var.app_name}-newsletter-${var.env}"

  # VDM options for this configuration set
  vdm_options {
    dashboard_options {
      engagement_metrics = var.dashboard_engagement_metrics_enabled ? "ENABLED" : "DISABLED"
    }

    guardian_options {
      optimized_shared_delivery = var.guardian_optimized_shared_delivery_enabled ? "ENABLED" : "DISABLED"
    }
  }

  # Delivery options
  delivery_options {
    tls_policy = "REQUIRE"
  }

  # Enable reputation tracking
  reputation_options {
    reputation_metrics_enabled = true
  }

  # Enable sending
  sending_options {
    sending_enabled = true
  }

  # Suppression options
  suppression_options {
    suppressed_reasons = ["BOUNCE", "COMPLAINT"]
  }

  # Tracking options for detailed analytics
  tracking_options {
    custom_redirect_domain = var.domain
  }

  tags = {
    Name        = "${var.app_name}-newsletter-${var.env}"
    Environment = var.env
    Purpose     = "Newsletter VDM Configuration Set"
  }

  depends_on = [aws_sesv2_account_vdm_attributes.main]
}

# Configuration set for transactional emails (welcome, password reset, etc.)
resource "aws_sesv2_configuration_set" "transactional" {
  configuration_set_name = "${var.app_name}-transactional-${var.env}"

  # VDM options for this configuration set
  vdm_options {
    dashboard_options {
      engagement_metrics = var.dashboard_engagement_metrics_enabled ? "ENABLED" : "DISABLED"
    }

    guardian_options {
      optimized_shared_delivery = var.guardian_optimized_shared_delivery_enabled ? "ENABLED" : "DISABLED"
    }
  }

  # Delivery options
  delivery_options {
    tls_policy = "REQUIRE"
  }

  # Enable reputation tracking
  reputation_options {
    reputation_metrics_enabled = true
  }

  # Enable sending
  sending_options {
    sending_enabled = true
  }

  # Suppression options
  suppression_options {
    suppressed_reasons = ["BOUNCE", "COMPLAINT"]
  }

  # Tracking options for detailed analytics
  tracking_options {
    custom_redirect_domain = var.domain
  }

  tags = {
    Name        = "${var.app_name}-transactional-${var.env}"
    Environment = var.env
    Purpose     = "Transactional Emails VDM Configuration Set"
  }

  depends_on = [aws_sesv2_account_vdm_attributes.main]
}