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
    name: 'PIPEDREAM_API_KEY',
    required: true,
    description: 'Pipedream API key for workflow execution',
  },
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'Neon PostgreSQL database connection string',
  },
];

const OPTIONAL_ENV_VARS: EnvVar[] = [
  {
    name: 'PIPEDREAM_API_URL',
    required: false,
    description: 'Pipedream API base URL (defaults to https://api.pipedream.com/v1)',
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

