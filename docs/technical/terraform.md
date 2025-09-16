# Terraform Infrastructure Setup

This document provides step-by-step instructions for managing multi-environment AWS infrastructure using Terraform with a **Single Root Config + Environment Variables** approach.

## Project Structure

```
infra/
├── main.tf                    # Main Terraform configuration
├── variables.tf               # Variable definitions
├── provider.tf                # AWS provider configuration
├── outputs.tf                 # Root-level outputs (ALWAYS define here)
├── dev.tfvars                 # Development environment variables
├── prod.tfvars                # Production environment variables
└── modules/
    ├── s3-bucket/             # Reusable S3 bucket module
    │   ├── main.tf           # S3 bucket resource definition
    │   ├── variables.tf      # Module input variables
    │   └── outputs.tf        # Module outputs (bucket name, ARN)
    └── redis/                 # Reusable Redis module
        ├── main.tf           # Upstash Redis resource definition
        ├── variables.tf      # Module input variables
        └── outputs.tf        # Module outputs (URL, token, endpoint)
```

## How This Setup Works

This setup uses a **single root configuration** with **environment-specific variable files** and **reusable modules**. Instead of duplicating configuration files for each environment, we:

1. Define all infrastructure in one `main.tf` file using modules
2. Create reusable modules for common resources (like S3 buckets)
3. Use variables to make resources environment-specific
4. Create separate `.tfvars` files for each environment
5. Use the `-var-file` flag to specify which environment to deploy

### Benefits
- **No duplication**: Single source of truth for infrastructure
- **Reusable modules**: Write once, use everywhere
- **Consistent environments**: All environments use the same configuration
- **Easy maintenance**: Changes to modules apply to all environments
- **Simple deployment**: One command per environment
- **Scalable**: Easy to add new resource types as modules

## Prerequisites

### 1. Install Terraform

```bash
# macOS (using Homebrew)
brew install terraform

# Verify installation
terraform --version
```

### 2. Configure AWS CLI Profiles

Set up separate AWS profiles for each environment following the `daily-system-design-{ENV}` naming pattern:

```bash
# Configure dev profile
aws configure --profile daily-system-design-dev
# Enter your dev AWS Access Key ID, Secret Key, region (us-west-2), and output format

# Configure beta profile
aws configure --profile daily-system-design-beta
# Enter your beta AWS Access Key ID, Secret Key, region (us-west-2), and output format

# Configure prod profile
aws configure --profile daily-system-design-prod
# Enter your prod AWS Access Key ID, Secret Key, region (us-west-2), and output format
```

### 3. Verify AWS Profile Setup

```bash
# Test each profile
aws sts get-caller-identity --profile daily-system-design-dev
aws sts get-caller-identity --profile daily-system-design-beta
aws sts get-caller-identity --profile daily-system-design-prod
```

## Environment Configuration

| Environment | AWS Profile                    | Region      | S3 Bucket Name (Globally Unique)    |
|-------------|--------------------------------|-------------|--------------------------------------|
| Dev         | `daily-system-design-dev`      | `us-west-2` | `daily-system-design-bucket-dev`     |
| Prod        | `daily-system-design-prod`     | `us-west-2` | `daily-system-design-bucket-prod`    |

## Resource Naming Conventions

### Globally Unique Resources (keep project prefix)
- **S3 bucket names**: Must be globally unique across all AWS accounts
  - Format: `daily-system-design-{purpose}-{env}`
  - Examples: `daily-system-design-email-events-dev`, `daily-system-design-athena-results-prod`

### AWS Account Scoped Resources (no project prefix needed)
- **IAM roles and policies**: Unique within AWS account only
  - Format: `{purpose}-{env}`
  - Examples: `firehose-delivery-role-dev`, `glue-crawler-role-prod`
- **Kinesis Firehose streams**: Unique within AWS account and region
  - Format: `{purpose}-{env}`
  - Examples: `email-events-newsletter-dev`, `email-events-transactional-prod`
- **Glue databases and tables**: Unique within AWS account and region
  - Format: `{purpose}_{env}` (underscores for Glue naming)
  - Examples: `email_events_db_dev`, `newsletter_events_table_prod`
- **Athena workgroups**: Unique within AWS account and region
  - Format: `{purpose}-{env}`
  - Examples: `email-analytics-dev`, `email-analytics-prod`
- **CloudWatch log groups**: Unique within AWS account and region
  - Format: `/aws/{service}/{purpose}-{env}`
  - Examples: `/aws/kinesisfirehose/email-events-newsletter-dev`

## Common Terraform Commands

All commands are run from the single `infra/` directory using environment-specific variable files and workspaces.

### Initial Setup (First Time Only)

```bash
# Navigate to infra directory
cd infra

# Initialize Terraform
terraform init

# Create workspaces for each environment
terraform workspace new dev
terraform workspace new prod

# List workspaces to verify
terraform workspace list
```

### Development Environment

```bash
# Navigate to infra directory
cd infra

# Switch to dev workspace
terraform workspace select dev

# Plan infrastructure changes
terraform plan -var-file=dev.tfvars

# Apply infrastructure changes
terraform apply -var-file=dev.tfvars

# Destroy infrastructure (careful!)
terraform destroy -var-file=dev.tfvars
```

### Production Environment

```bash
# Navigate to infra directory
cd infra

# Switch to prod workspace
terraform workspace select prod

# Plan infrastructure changes
terraform plan -var-file=prod.tfvars

# Apply infrastructure changes
terraform apply -var-file=prod.tfvars

# Destroy infrastructure (careful!)
terraform destroy -var-file=prod.tfvars
```

## Copy-Paste Commands by Environment

### Dev Environment Setup
```bash
cd infra
terraform workspace select dev
terraform plan -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars
```

### Prod Environment Setup
```bash
cd infra
terraform workspace select prod
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```

### Viewing Outputs After Deployment
```bash
# View all outputs for current workspace
terraform output

# View specific output (non-sensitive)
terraform output redis_database_id

# View sensitive output (will be shown)
terraform output redis_rest_url

# Export sensitive outputs to environment variables
export UPSTASH_REDIS_REST_URL=$(terraform output -raw redis_rest_url)
export UPSTASH_REDIS_REST_TOKEN=$(terraform output -raw redis_rest_token)
```

## Workspace Validation

The configuration includes automatic workspace validation that ensures you're in the correct workspace before applying changes:

- **Hard Error Protection**: If your current workspace doesn't match the environment in your `.tfvars` file, Terraform will fail with a clear error message
- **Prevents Accidents**: Impossible to accidentally apply dev changes to prod state or vice versa  
- **Clear Instructions**: Error messages tell you exactly which workspace to switch to

Example error if you're in the wrong workspace:
```
Error: file("ERROR: Terraform workspace 'prod' does not match environment 'dev'. Please switch to the correct workspace with: terraform workspace select dev")
```

## Best Practices

### 1. Always Plan Before Apply
Never run `terraform apply` without first running `terraform plan` to review changes.

### 2. Environment Isolation
Each environment uses:
- Separate AWS accounts/profiles  
- Separate Terraform workspaces with isolated state files
- Environment-specific variable files (`.tfvars`)
- Workspace validation to prevent cross-environment deployments

### 3. Module Reusability
The S3 bucket module can be reused across environments with different configurations by passing different variables.

### 4. State File Management
- State files are automatically isolated per workspace in `terraform.tfstate.d/` directory
- Each workspace maintains its own state file (e.g., `terraform.tfstate.d/dev/terraform.tfstate`)  
- For production use, consider using remote state backends (S3 + DynamoDB)

### 5. Variable Management
- Environment-specific values are stored in `dev.tfvars` and `prod.tfvars`
- Variable definitions are in `variables.tf`  
- Use `-var-file=` flag to specify which environment variables to use
- Never commit sensitive values to version control

### 6. Output Management
- **ALWAYS** define outputs at the root level in `outputs.tf`
- Module outputs should be exposed through the root `outputs.tf` file
- This provides a single place to find all infrastructure outputs
- Use descriptive names and include the resource type (e.g., `redis_database_id`, `s3_bucket_name`)
- Mark sensitive outputs with `sensitive = true` (e.g., tokens, passwords)

## Troubleshooting

### Common Issues

1. **AWS Profile Not Found**
   ```
   Error: No valid credential sources found for AWS Provider
   ```
   **Solution**: Ensure AWS profiles are configured correctly with `aws configure --profile <profile-name>`

2. **Permission Denied**
   ```
   Error: AccessDenied: Access Denied
   ```
   **Solution**: Verify your AWS credentials have the necessary S3 permissions

3. **Bucket Already Exists**
   ```
   Error: BucketAlreadyOwnedByYou: Your previous request to create the named bucket succeeded
   ```
   **Solution**: S3 bucket names must be globally unique. Update the bucket name in your environment's `.tfvars` file

4. **Wrong Workspace Error**
   ```
   Error: file("ERROR: Terraform workspace 'prod' does not match environment 'dev'...")
   ```
   **Solution**: Switch to the correct workspace with `terraform workspace select <env>`

### Getting Help

- Run `terraform --help` for general help
- Run `terraform <command> --help` for command-specific help
- Check the [Terraform AWS Provider documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

## Adding New Resources

To add new AWS resources:

1. Create a new module in `infra/modules/`
2. Update `main.tf` to include the new module
3. Add any required variables to `variables.tf` and environment `.tfvars` files
4. Run `terraform plan -var-file=<env>.tfvars` and `terraform apply -var-file=<env>.tfvars` for each environment

## Security Considerations

- Use separate AWS accounts for each environment
- Apply least privilege principle to IAM roles/policies
- Enable CloudTrail for audit logging
- Use AWS Config for compliance monitoring
- Consider using Terraform Cloud or AWS Systems Manager Parameter Store for sensitive variables