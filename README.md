# Daily System Design Newsletter

AI-generated newsletter system for daily system design topics. Future phases will include multiple subjects (DevOps, QA, AI etc.) and subscriptions.

Design Doc:
https://app.eraser.io/workspace/CESxzJix7EVY02wGacn2?origin=share

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Landing Page  │    │  Admin Dashboard │    │   Email Service │
│   (Waitlist)    │    │  (Content Mgmt)  │    │   (Delivery)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ├── Next.js App Router ─┼─── tRPC API Routes ───┤
         │                       │                       │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  PostgreSQL DB  │    │   OpenAI/Claude  │    │ Cron Jobs/Tasks │
│  (Drizzle ORM)  │    │  (Content Gen)   │    │  (Scheduling)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Core Workflows
1. **Syllabus Generation**: Generate 150+ ordered topics for System Design
2. **Newsletter Generation**: Create markdown content for each topic with AI
3. **Daily Delivery**: Automated cron job (9am PT) sends next newsletter in sequence  
4. **Admin Management**: Review, approve, regenerate, and manually send newsletters

## Tech Stack

- **Frontend**: Next.js 15 with React 19, Tailwind CSS
- **Backend**: Next.js API routes with tRPC
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based admin authentication
- **Email**: AWS SES for delivery
- **AI**: OpenAI/Claude for content generation
- **Infrastructure**: AWS (S3, SES, IAM) via Terraform

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm
- PostgreSQL database
- AWS account for infrastructure

### 1. Clone and Install
```bash
git clone <repository-url>
cd daily-system-design
pnpm install
```

### 2. Environment Setup
Create `.env` file with required variables:
Refer to `src/env.js` for all required environment variables.


### 3. Database Setup
```bash
pnpm db:migrate

# Optional: Open database studio
pnpm db:studio
```

### 4. Run Development Server
```bash
pnpm dev
```

Visit:
- **Landing page**: http://localhost:3000
- **Admin dashboard**: http://localhost:3000/admin

## Database Schema

### Core Tables
- **`subjects`** - Newsletter subjects (System Design, etc.)
- **`topics`** - Individual topics within subjects (ordered sequence)
- **`issues`** - Generated newsletter content for each topic
- **`users`** - Waitlist signups and subscriber management
- **`subscriptions`** - User subscriptions to subjects with progress tracking  
- **`deliveries`** - Email delivery logs and status tracking

### Schema Management
```bash
pnpm db:generate    # Generate migrations from schema changes
pnpm db:push        # Push schema directly to database (dev)
pnpm db:studio      # Open visual database editor
```

## Infrastructure Setup (AWS + Terraform)

The project uses Terraform to manage AWS infrastructure with workspace-based environments.

### Prerequisites
1. **Install Terraform**
   ```bash
   brew install terraform
   ```

2. **Configure AWS Profiles**
   ```bash
   aws configure --profile daily-system-design-dev
   aws configure --profile daily-system-design-prod
   ```

### Initial Setup
```bash
cd src/infra

# Initialize Terraform
terraform init

# Create workspaces
terraform workspace new dev
terraform workspace new prod
```

### Deploy to Development
```bash
cd src/infra
terraform workspace select dev
terraform plan -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars
```

### Deploy to Production  
```bash
cd src/infra
terraform workspace select prod
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```

### Infrastructure Components
- **S3 Buckets** - File storage and static assets
- **SES Email Identity** - Admin email verification
- **SES Domain Identity** - Custom domain email sending
- **IAM User & Policies** - Next.js application permissions

## Development Commands

### Application
```bash
pnpm dev          # Start development server
pnpm build        # Build for production  
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript checks
```

### Database
```bash
pnpm db:generate  # Generate Drizzle migrations
pnpm db:push      # Push schema to database
pnpm db:studio    # Open Drizzle Studio
```

### Infrastructure
```bash
cd src/infra
terraform plan -var-file=<env>.tfvars    # Plan infrastructure changes
terraform apply -var-file=<env>.tfvars   # Apply infrastructure changes
```


## Project Structure
```
src/
├── app/                    # Next.js app router pages
│   ├── admin/             # Admin dashboard  
│   ├── api/               # API routes
│   └── _components/       # Reusable components
├── server/
│   ├── api/               # tRPC routers
│   ├── db/                # Database schema & repos
│   ├── llm/               # AI integration
│   └── email/             # Email service
├── lib/                   # Shared utilities
└── infra/                 # Terraform infrastructure
```