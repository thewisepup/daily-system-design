resource "aws_s3_bucket" "advertiser_logos_bucket" {
  bucket = "${var.app_name}-advertiser-logos-${var.env}"
}

# Allow public access to bucket
resource "aws_s3_bucket_public_access_block" "advertiser_logos_bucket" {
  bucket = aws_s3_bucket.advertiser_logos_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Bucket policy to allow public read access to objects
resource "aws_s3_bucket_policy" "advertiser_logos_bucket" {
  bucket = aws_s3_bucket.advertiser_logos_bucket.id
  depends_on = [aws_s3_bucket_public_access_block.advertiser_logos_bucket]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.advertiser_logos_bucket.arn}/*"
      }
    ]
  })
}

# Configure bucket versioning (optional)
resource "aws_s3_bucket_versioning" "advertiser_logos_bucket" {
  bucket = aws_s3_bucket.advertiser_logos_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}