resource "aws_ses_email_identity" "admin_email_identity" {
  email = var.admin_email_address
}