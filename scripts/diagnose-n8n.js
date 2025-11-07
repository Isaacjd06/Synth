#!/usr/bin/env node

/**
 * n8n Configuration Diagnostics
 * 
 * This script helps diagnose why n8n is showing a login screen
 * despite setting N8N_USER_MANAGEMENT_DISABLED=true and N8N_BASIC_AUTH_ACTIVE=false
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== n8n Configuration Diagnostics ===\n');

// 1. Check for .env files in common locations
console.log('1. Checking for .env files...');
const envLocations = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), 'n8n', '.env'),
  path.join(process.cwd(), 'n8n', '.env.local'),
  path.join(process.env.HOME || process.env.USERPROFILE || '', '.n8n', '.env'),
];

const foundEnvFiles = [];
envLocations.forEach(loc => {
  try {
    if (fs.existsSync(loc)) {
      foundEnvFiles.push(loc);
      console.log(`   ✓ Found: ${loc}`);
    }
  } catch (e) {
    // Ignore
  }
});

if (foundEnvFiles.length === 0) {
  console.log('   ✗ No .env files found in common locations');
} else {
  console.log(`\n   Found ${foundEnvFiles.length} .env file(s). Checking n8n variables...\n`);
  
  foundEnvFiles.forEach(envFile => {
    console.log(`   Reading: ${envFile}`);
    try {
      const content = fs.readFileSync(envFile, 'utf8');
      const n8nVars = content.split('\n')
        .filter(line => line.trim().startsWith('N8N_'))
        .map(line => line.trim());
      
      if (n8nVars.length > 0) {
        console.log(`   n8n variables in ${envFile}:`);
        n8nVars.forEach(v => {
          // Don't print full values for security, just show if they're set
          const [key, ...valueParts] = v.split('=');
          const value = valueParts.join('=');
          const isSet = value && value.trim() !== '';
          const preview = isSet ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : 'NOT SET';
          console.log(`     ${key}=${preview}`);
        });
      } else {
        console.log(`     No N8N_ variables found in this file`);
      }
    } catch (e) {
      console.log(`     Error reading file: ${e.message}`);
    }
    console.log('');
  });
}

// 2. Check environment variables in current process
console.log('2. Checking current process environment variables...');
const n8nEnvVars = Object.keys(process.env)
  .filter(key => key.startsWith('N8N_'))
  .sort();

if (n8nEnvVars.length === 0) {
  console.log('   ✗ No N8N_ environment variables found in current process');
} else {
  console.log(`   Found ${n8nEnvVars.length} N8N_ variable(s):`);
  n8nEnvVars.forEach(key => {
    const value = process.env[key];
    const preview = value && value.length > 30 ? value.substring(0, 30) + '...' : value;
    console.log(`     ${key}=${preview || '(empty)'}`);
  });
}

// 3. Check for n8n config files
console.log('\n3. Checking for n8n configuration files...');
const configLocations = [
  'config/n8n.config.js',
  'n8n.config.js',
  '.n8n/config.json',
  path.join(process.env.HOME || process.env.USERPROFILE || '', '.n8n', 'config'),
];

configLocations.forEach(loc => {
  try {
    if (fs.existsSync(loc)) {
      console.log(`   ✓ Found config: ${loc}`);
      try {
        const stats = fs.statSync(loc);
        console.log(`     Modified: ${stats.mtime}`);
      } catch (e) {
        // Ignore
      }
    }
  } catch (e) {
    // Ignore
  }
});

// 4. Check if n8n is running and what port
console.log('\n4. Checking if n8n process is running...');
try {
  const isWindows = process.platform === 'win32';
  const command = isWindows 
    ? 'tasklist /FI "IMAGENAME eq node.exe" /FO CSV'
    : 'ps aux | grep n8n | grep -v grep';
  
  const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  if (output.trim()) {
    console.log('   ✓ n8n/node process found:');
    console.log(`     ${output.split('\n').filter(l => l.trim()).join('\n     ')}`);
  } else {
    console.log('   ✗ No n8n process found running');
  }
} catch (e) {
  console.log('   ? Could not check for running processes');
}

// 5. Check for database and owner account
console.log('\n5. Database and Owner Account Check...');
console.log('   Note: This requires access to n8n database.');
console.log('   To check manually:');
console.log('   - If using SQLite: Check ~/.n8n/database.sqlite');
console.log('   - If using PostgreSQL: Check users table for owner account');
console.log('   - If using MySQL: Check users table for owner account');

// 6. Critical n8n variables checklist
console.log('\n6. Critical n8n Environment Variables Checklist:');
const criticalVars = [
  { name: 'N8N_USER_MANAGEMENT_DISABLED', expected: 'true', description: 'Disables user management (no login required)' },
  { name: 'N8N_BASIC_AUTH_ACTIVE', expected: 'false', description: 'Disables basic auth' },
  { name: 'N8N_HOST', description: 'Host where n8n is accessible' },
  { name: 'N8N_PORT', description: 'Port n8n runs on (default: 5678)' },
  { name: 'N8N_PROTOCOL', description: 'Protocol (http or https)' },
];

criticalVars.forEach(({ name, expected, description }) => {
  const value = process.env[name];
  const isSet = value !== undefined;
  const matches = expected ? value === expected : isSet;
  const status = matches ? '✓' : '✗';
  console.log(`   ${status} ${name}: ${isSet ? value : 'NOT SET'} ${expected ? `(expected: ${expected})` : ''}`);
  if (description) {
    console.log(`      ${description}`);
  }
});

// 7. Common issues and solutions
console.log('\n7. Common Issues and Solutions:');
console.log(`
   Issue 1: Environment variables not loaded
   - Solution: Ensure .env file is in the same directory where n8n is started
   - Solution: Use docker-compose.yml or systemd service file to load env vars
   - Solution: Export variables before starting: export N8N_USER_MANAGEMENT_DISABLED=true

   Issue 2: Owner account already exists in database
   - Solution: Even with USER_MANAGEMENT_DISABLED=true, if an owner exists, login may be required
   - Solution: Delete owner account from database or set N8N_OWNER_EMAIL and N8N_OWNER_PASSWORD

   Issue 3: n8n config file overrides environment variables
   - Solution: Check config/n8n.config.js or .n8n/config.json
   - Solution: Remove conflicting settings from config file

   Issue 4: Docker/container environment
   - Solution: Pass env vars via docker-compose.yml or -e flags
   - Solution: Check if .env file is mounted correctly in container

   Issue 5: Multiple .env files loading in wrong order
   - Solution: n8n loads: .env.local > .env.production/.env.development > .env
   - Solution: Ensure variables are in the correct .env file
`);

console.log('\n=== End Diagnostics ===\n');

