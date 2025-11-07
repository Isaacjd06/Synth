#!/usr/bin/env node

/**
 * Check n8n database for owner account
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const dbPath = path.join(os.homedir(), '.n8n', 'database.sqlite');

console.log('=== n8n Database Check ===\n');
console.log(`Database path: ${dbPath}\n`);

if (!fs.existsSync(dbPath)) {
  console.log('❌ Database file not found');
  console.log('   This might mean n8n is using PostgreSQL or MySQL instead of SQLite');
  process.exit(1);
}

console.log('✅ Database file exists\n');

// Try to use better-sqlite3 if available, otherwise provide instructions
try {
  const Database = require('better-sqlite3');
  const db = new Database(dbPath, { readonly: true });
  
  console.log('Checking for owner account...\n');
  
  try {
    const owner = db.prepare("SELECT id, email, role, firstName, lastName, createdAt FROM user WHERE role = 'owner' LIMIT 1").get();
    
    if (owner) {
      console.log('❌ OWNER ACCOUNT FOUND - This is likely why login is required!\n');
      console.log('Owner details:');
      console.log(`  ID: ${owner.id}`);
      console.log(`  Email: ${owner.email || '(no email)'}`);
      console.log(`  Role: ${owner.role}`);
      console.log(`  Name: ${owner.firstName || ''} ${owner.lastName || ''}`.trim() || '(no name)');
      console.log(`  Created: ${owner.createdAt || '(unknown)'}`);
      console.log('\n⚠️  Even with N8N_USER_MANAGEMENT_DISABLED=true,');
      console.log('   if an owner account exists, n8n may still require login.');
      console.log('\nTo fix: Delete the owner account from the database.');
      console.log('  Option 1: Delete database (fresh start)');
      console.log('  Option 2: Use SQLite to delete owner: DELETE FROM user WHERE role = "owner";');
    } else {
      console.log('✅ No owner account found');
      console.log('   This is good - the issue is likely environment variables not loading.');
    }
    
    // Check total user count
    const userCount = db.prepare("SELECT COUNT(*) as count FROM user").get();
    console.log(`\nTotal users in database: ${userCount.count}`);
    
  } catch (e) {
    if (e.message.includes('no such table')) {
      console.log('✅ No user table found - database might be empty or using different schema');
    } else {
      console.log(`❌ Error querying database: ${e.message}`);
    }
  }
  
  db.close();
  
} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    console.log('⚠️  better-sqlite3 not installed');
    console.log('   Install it with: npm install better-sqlite3');
    console.log('\n   Or use sqlite3 CLI:');
    console.log(`   sqlite3 "${dbPath}" "SELECT * FROM user WHERE role = 'owner';"`);
  } else {
    console.log(`❌ Error: ${e.message}`);
  }
}

console.log('\n=== End Database Check ===\n');

