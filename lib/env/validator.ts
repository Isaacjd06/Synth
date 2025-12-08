// lib/env/validator.ts

export type EnvValidationResult =
  | { ok: true }
  | { ok: false; missing: string[]; warnings: string[] };

interface EnvVar {
  name: string;
  required: boolean;
  description?: string;
}

const REQUIRED_ENV_VARS: EnvVar[] = [
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'Neon PostgreSQL database connection string',
  },
  {
    name: 'AUTH_SECRET',
    required: true,
    description: 'NextAuth secret for session encryption (generate with: openssl rand -base64 32)',
  },
  {
    name: 'GOOGLE_CLIENT_ID',
    required: true,
    description: 'Google OAuth client ID from Google Cloud Console',
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    required: true,
    description: 'Google OAuth client secret from Google Cloud Console',
  },
  {
    name: 'PIPEDREAM_API_KEY',
    required: true,
    description: 'Pipedream API key for workflow execution',
  },
  {
    name: 'PIPEDREAM_USER_ID',
    required: true,
    description: 'Pipedream workspace/user ID for creating workflows',
  },
  {
    name: 'STRIPE_SECRET_KEY',
    required: true,
    description: 'Stripe secret key for payment processing',
  },
  {
    name: 'UPSTASH_REDIS_REST_URL',
    required: false, // Checked separately based on NODE_ENV
    description: 'Upstash Redis REST URL for rate limiting (required in production)',
  },
  {
    name: 'UPSTASH_REDIS_REST_TOKEN',
    required: false, // Checked separately based on NODE_ENV
    description: 'Upstash Redis REST token for rate limiting (required in production)',
  },
];

const OPTIONAL_ENV_VARS: EnvVar[] = [
  {
    name: 'AUTH_URL',
    required: false,
    description: 'NextAuth base URL (required in production, e.g., https://yourdomain.com)',
  },
  {
    name: 'PIPEDREAM_API_URL',
    required: false,
    description: 'Pipedream API base URL (defaults to https://api.pipedream.com/v1)',
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: false,
    description: 'Stripe webhook secret for verifying webhook signatures (required for production)',
  },
  {
    name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    required: false,
    description: 'Stripe publishable key for client-side use (falls back to STRIPE_PUBLISHABLE_KEY)',
  },
  {
    name: 'STRIPE_PUBLISHABLE_KEY',
    required: false,
    description: 'Stripe publishable key (fallback if NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not set)',
  },
];

/**
 * Validate required environment variables at startup
 *
 * Throws an error if any required variables are missing.
 * This prevents the app from starting with invalid configuration.
 */
export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar.name];

    // Special handling for Redis - only required in production
    if (envVar.name.startsWith('UPSTASH_REDIS')) {
      if (process.env.NODE_ENV === 'production' && (!value || value.trim() === '')) {
        missing.push(envVar.name);
      } else if (!value || value.trim() === '') {
        warnings.push(`${envVar.name} is not set (rate limiting disabled in development)`);
      }
      continue;
    }

    if (!value || value.trim() === '') {
      missing.push(envVar.name);
    }
  }

  // Check optional variables (warn if missing but don't fail)
  for (const envVar of OPTIONAL_ENV_VARS) {
    const value = process.env[envVar.name];
    if (!value || value.trim() === '') {
      warnings.push(`${envVar.name} is not set (using default)`);
    }
  }

  if (missing.length > 0) {
    return {
      ok: false,
      missing,
      warnings,
    };
  }

  return {
    ok: true,
  };
}

/**
 * Validate and throw if required environment variables are missing
 * 
 * Use this at module load time to prevent the app from starting
 * with invalid configuration.
 */
export function validateEnvOrThrow(): void {
  const result = validateEnv();
  
  if (!result.ok) {
    const missingList = result.missing.map(name => `  - ${name}`).join('\n');
    const errorMessage = `Missing required environment variables:\n${missingList}\n\nPlease set these variables in your .env.local file.`;
    
    throw new Error(errorMessage);
  }
}

