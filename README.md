# Synth AI

Synth is an AI-powered workflow automation platform that helps users build, deploy, and manage intelligent automations with ease.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: NextAuth.js v5 with Google OAuth
- **UI**: Tailwind CSS + shadcn/ui components
- **Workflow Engine**: Pipedream (MVP phase)

## Prerequisites

- Node.js 20+ installed
- PostgreSQL database (local or hosted via Neon, Supabase, etc.)
- Google Cloud Console project with OAuth credentials
- Pipedream account and API key

## Environment Setup

1. **Clone the repository** (if applicable)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

4. **Configure your `.env` file** with the following required variables:

   ```bash
   # Database
   DATABASE_URL="postgresql://user:password@host:5432/synth"

   # NextAuth - Generate with: openssl rand -base64 32
   AUTH_SECRET="your-generated-secret"

   # Google OAuth - Get from Google Cloud Console
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"

   # Pipedream API
   PIPEDREAM_API_KEY="your-pipedream-api-key"
   ```

5. **Set up the database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

## Getting Started

1. **Run the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

3. **Sign in** with Google OAuth to access the protected dashboard

## Project Structure

```
synth/
├── app/                      # Next.js App Router pages
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── dashboard/        # Main dashboard
│   │   ├── chat/             # AI chat interface
│   │   ├── workflows/        # Workflow management
│   │   ├── executions/       # Execution history
│   │   └── settings/         # User settings
│   ├── api/                  # API routes
│   │   ├── auth/             # NextAuth handlers
│   │   ├── chat/             # Chat API
│   │   └── workflows/        # Workflow API
│   ├── waitlist/             # Public waitlist page
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Landing page
│   └── globals.css           # Global styles
├── components/               # React components
│   ├── ui/                   # shadcn/ui components
│   ├── chat/                 # Chat components
│   ├── dashboard/            # Dashboard components
│   └── workflows/            # Workflow components
├── lib/                      # Utility libraries
│   ├── auth.ts               # NextAuth configuration
│   ├── prisma.ts             # Prisma client
│   ├── ai.ts                 # AI utilities
│   ├── pipedream.ts          # Pipedream integration
│   └── env/                  # Environment validation
├── prisma/                   # Database schema
│   └── schema.prisma         # Prisma schema
├── types/                    # TypeScript type definitions
└── middleware.ts             # Route protection middleware
```

## Authentication & Authorization

- **Authentication**: Google OAuth via NextAuth.js v5
- **Session Strategy**: Database sessions (stored in PostgreSQL)
- **Protected Routes**: `/dashboard`, `/chat`, `/workflows`, `/executions`, `/settings`
- **Public Routes**: `/`, `/waitlist`, `/api/auth/*`
- **Admin Access**: Only the system user (ID: `00000000-0000-0000-0000-000000000000`) can access protected routes during MVP

## Key Features

### Phase 1 (Current)
- ✅ Google OAuth authentication
- ✅ Database session management
- ✅ Route protection middleware
- ✅ shadcn/ui component library
- ✅ Responsive dark theme UI
- ✅ Environment variable validation

### Planned Features
- AI-powered workflow generation
- Natural language workflow builder
- Pipedream workflow execution
- Real-time execution monitoring
- Memory and context management
- Knowledge base integration

## Development Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | NextAuth session encryption key |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `PIPEDREAM_API_KEY` | Yes | Pipedream API key |
| `AUTH_URL` | No | Base URL (required in production) |
| `PIPEDREAM_API_URL` | No | Pipedream API base URL (default: https://api.pipedream.com/v1) |

## Known Issues & Considerations

### NextAuth v5 Beta
This project uses **NextAuth.js v5.0.0-beta.30**. This is a beta version and may have:
- Potential bugs or stability issues
- Breaking changes in future updates
- Limited community documentation

**Recommendation**: Plan to migrate to a stable v5 release when available.

**Migration Path**:
1. Monitor NextAuth v5 release notes
2. Test migration in a staging environment
3. Update type definitions if interfaces change
4. Review breaking changes in auth callbacks

## Troubleshooting

### Database Connection Issues
```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Test Prisma connection
npx prisma db push
```

### Authentication Errors
```bash
# Verify AUTH_SECRET is set
echo $AUTH_SECRET

# Regenerate AUTH_SECRET
openssl rand -base64 32

# Check Google OAuth credentials in Google Cloud Console
```

### Environment Variable Validation
The app validates required environment variables on startup. If any are missing, you'll see an error message listing them.

## Contributing

This is an internal Synth AI project. Please follow the established code standards and architecture patterns.

## License

Proprietary - Synth AI

---

Built with Next.js and powered by AI automation.
