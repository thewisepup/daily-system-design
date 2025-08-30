resource "aws_s3_bucket" "hello_world_bucket" {
  bucket = "${var.app_name}-bucket-${var.env}"
}
