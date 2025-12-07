/* eslint-disable @typescript-eslint/no-require-imports */
// Script to apply the migration SQL directly to the database
const { readFileSync } = require('fs');
const { join } = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  let databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  // Clean up the URL (remove quotes, trim whitespace)
  databaseUrl = databaseUrl.trim().replace(/^["']|["']$/g, '');
  
  console.log('🔗 Database URL format:', databaseUrl.substring(0, 20) + '...');

  console.log('📖 Reading migration file...');
  const migrationSql = readFileSync(
    join(__dirname, '../prisma/migrations/20250101000000_add_execution_and_workflow_fields/migration.sql'),
    'utf-8'
  );

  console.log('🔌 Connecting to database...');
  
  // Parse connection string and ensure SSL is enabled for Neon
  const clientConfig = {
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false, // Neon uses SSL certificates
    },
  };
  
  // If URL already has sslmode, use it as-is
  if (databaseUrl.includes('sslmode=')) {
    clientConfig.connectionString = databaseUrl;
    delete clientConfig.ssl;
  }
  
  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('✅ Connected to database');

    console.log('🚀 Applying migration...');
    await client.query(migrationSql);
    
    console.log('✅ Migration applied successfully!');
    
    // Verify the changes
    console.log('🔍 Verifying changes...');
    const executionCheck = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'Execution' 
      AND column_name IN ('status', 'pipedream_execution_id')
    `);
    
    const workflowCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'workflows' 
      AND column_name = 'updated_at'
    `);

    console.log('\n📊 Verification Results:');
    console.log('Execution table fields:', executionCheck.rows.length === 2 ? '✅ Both fields exist' : '⚠️  Some fields missing');
    console.log('Workflows updated_at:', workflowCheck.rows.length === 1 ? '✅ Field exists' : '⚠️  Field missing');
    
    if (executionCheck.rows.length > 0) {
      console.log('\nExecution fields:');
      executionCheck.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'none'})`);
      });
    }
    
    if (workflowCheck.rows.length > 0) {
      console.log('\nWorkflows fields:');
      workflowCheck.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
    }

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log('ℹ️  Some fields may already exist. This is okay.');
    } else {
      process.exit(1);
    }
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

applyMigration().catch(console.error);

