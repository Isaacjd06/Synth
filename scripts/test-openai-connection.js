/**
 * Simple script to test OpenAI API connection
 * Run with: node scripts/test-openai-connection.js
 */

require('dotenv').config({ path: '.env.local' });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is not set in your .env.local file');
  console.log('\n📝 To fix this:');
  console.log('1. Open your .env.local file');
  console.log('2. Add: OPENAI_API_KEY=sk-your-key-here');
  console.log('3. Get your API key from: https://platform.openai.com/api-keys');
  process.exit(1);
}

console.log('🔍 Testing OpenAI API connection...');
console.log(`✅ API Key found: ${OPENAI_API_KEY.substring(0, 7)}...${OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 4)}`);

async function testConnection() {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: 'Say "Hello, connection successful!" if you can read this.' }
        ],
        max_tokens: 20,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('\n❌ Connection failed!');
      console.error(`Status: ${response.status} ${response.statusText}`);
      
      if (errorData.error?.message) {
        console.error(`Error: ${errorData.error.message}`);
        
        if (errorData.error.message.includes('Invalid API key') || response.status === 401) {
          console.log('\n💡 Your API key appears to be invalid. Please check:');
          console.log('   - The key starts with "sk-"');
          console.log('   - There are no extra spaces or quotes');
          console.log('   - The key is from: https://platform.openai.com/api-keys');
        } else if (errorData.error.message.includes('rate limit') || response.status === 429) {
          console.log('\n💡 Rate limit exceeded. Please try again in a moment.');
        } else if (errorData.error.message.includes('insufficient_quota')) {
          console.log('\n💡 Your OpenAI account has insufficient quota. Please check billing:');
          console.log('   https://platform.openai.com/account/billing');
        }
      }
      process.exit(1);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content;
    
    console.log('\n✅ Connection successful!');
    console.log(`📨 Response: ${message}`);
    console.log('\n🎉 Your OpenAI API is properly configured and working!');
    
  } catch (error) {
    console.error('\n❌ Connection error:', error.message);
    
    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Network error. Please check:');
      console.log('   - Your internet connection');
      console.log('   - Firewall settings');
      console.log('   - VPN settings (if using one)');
    }
    
    process.exit(1);
  }
}

testConnection();

