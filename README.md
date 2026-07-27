# E-Commerce Storefront & Admin Panel Starter Template

This package contains the fully functional storefront (website) and admin panel codebases. It is configured to run out of the box with any standard Supabase instance.

## 🚀 Getting Started

### 1. Database Setup
1. Log in to your **Supabase Dashboard** (https://supabase.com).
2. Go to **SQL Editor** -> **New Query**.
3. Copy the contents of the `DATABASE_SETUP.sql` file in the root of this template.
4. Paste and click **Run**. This will create all 28 tables, relationships, indexes, and seeded roles.
5. Create your first admin user profile by inviting your email under **Authentication** -> **Users**, copying the user's UUID, and executing the admin role assignment block located at the bottom of the SQL script.

### 2. Environment Configurations
1. Copy `.env.example` to `.env` in the **root directory** (Storefront).
2. Copy `admin/.env.example` to `admin/.env` in the **admin directory**.
3. Fill in your newly created Supabase Project URL and Anon API key in both files.

### 3. Installation
Open your terminal and run:
```bash
# Install Storefront dependencies
npm install

# Install Admin Panel dependencies
cd admin
npm install
```

### 4. Running Locally
```bash
# Run Storefront local development server
npm run dev

# Run Admin Panel local development server
cd admin
npm run dev
```

### 5. Custom Edge Functions
If you plan to use automated Steadfast Courier dispatch or Live Status Updates, install the Supabase CLI and deploy the edge functions:
```bash
supabase login
supabase functions deploy courier-api --project-ref YOUR_SUPABASE_PROJECT_REF
supabase functions deploy courier-status --project-ref YOUR_SUPABASE_PROJECT_REF
supabase functions deploy courier-ratio-check --project-ref YOUR_SUPABASE_PROJECT_REF
supabase functions deploy fraud-actions --project-ref YOUR_SUPABASE_PROJECT_REF
```

All credit credentials, brand colors, and assets can be customized by searching for the placeholders or editing the brand settings inside the `site_settings` and `system_configs` tables.
