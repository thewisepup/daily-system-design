# Terraform Infrastructure Setup

This document provides step-by-step instructions for managing multi-environment AWS infrastructure using Terraform with a **Single Root Config + Environment Variables** approach.

## Project Structure

```
src/infra/
├── main.tf                    # Main Terraform configuration
├── variables.tf               # Variable definitions
├── provider.tf                # AWS provider configuration
├── dev.tfvars                 # Development environment variables
├── prod.tfvars                # Production environment variables
└── modules/
    └── s3-bucket/             # Reusable S3 bucket module
        ├── main.tf           # S3 bucket resource definition
        ├── variables.tf      # Module input variables
        └── outputs.tf        # Module outputs (bucket name, ARN)
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

| Environment | AWS Profile                    | Region      | Bucket Name                          |
|-------------|--------------------------------|-------------|--------------------------------------|
| Dev         | `daily-system-design-dev`      | `us-west-2` | `daily-system-design-bucket-dev`     |
| Prod        | `daily-system-design-prod`     | `us-west-2` | `daily-system-design-bucket-prod`    |

## Common Terraform Commands

### Development Environment

```bash
# Navigate to dev environment
cd src/infra/envs/dev

# Initialize Terraform (first time only)
terraform init

# Plan infrastructure changes
terraform plan

# Apply infrastructure changes
terraform apply

# Destroy infrastructure (careful!)
terraform destroy
```

### Beta Environment

```bash
# Navigate to beta environment
cd src/infra/envs/beta

# Initialize Terraform (first time only)
terraform init

# Plan infrastructure changes
terraform plan

# Apply infrastructure changes
terraform apply

# Destroy infrastructure (careful!)
terraform destroy
```

### Production Environment

```bash
# Navigate to prod environment
cd src/infra/envs/prod

# Initialize Terraform (first time only)
terraform init

# Plan infrastructure changes
terraform plan

# Apply infrastructure changes
terraform apply

# Destroy infrastructure (careful!)
terraform destroy
```

## Copy-Paste Commands by Environment

### Dev Environment Setup
```bash
cd src/infra/envs/dev
terraform init
terraform plan
terraform apply -auto-approve
```

### Beta Environment Setup
```bash
cd src/infra/envs/beta
terraform init
terraform plan
terraform apply -auto-approve
```

### Prod Environment Setup
```bash
cd src/infra/envs/prod
terraform init
terraform plan
terraform apply -auto-approve
```

## Best Practices

### 1. Always Plan Before Apply
Never run `terraform apply` without first running `terraform plan` to review changes.

### 2. Environment Isolation
Each environment uses:
- Separate AWS accounts/profiles
- Separate Terraform state files
- Environment-specific variable values

### 3. Module Reusability
The S3 bucket module can be reused across environments with different configurations by passing different variables.

### 4. State File Management
- State files are stored locally in each environment directory
- For production use, consider using remote state backends (S3 + DynamoDB)

### 5. Variable Management
- Environment-specific values are stored in `terraform.tfvars`
- Variable definitions are in `variables.tf`
- Never commit sensitive values to version control

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
   **Solution**: S3 bucket names must be globally unique. Update the bucket name in `terraform.tfvars`

### Getting Help

- Run `terraform --help` for general help
- Run `terraform <command> --help` for command-specific help
- Check the [Terraform AWS Provider documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

## Adding New Resources

To add new AWS resources:

1. Create a new module in `src/infra/modules/`
2. Update each environment's `main.tf` to include the new module
3. Add any required variables to `variables.tf` and `terraform.tfvars`
4. Run `terraform plan` and `terraform apply` for each environment

## Security Considerations

- Use separate AWS accounts for each environment
- Apply least privilege principle to IAM roles/policies
- Enable CloudTrail for audit logging
- Use AWS Config for compliance monitoring
- Consider using Terraform Cloud or AWS Systems Manager Parameter Store for sensitive variables