import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iynirubuonhsnxzzmrry.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5bmlydWJ1b25oc254enptcnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2NjYyMSwiZXhwIjoyMDcyMzQyNjIxfQ.wiuunGiaGp9LuYzpBQYO7hTp5lsfT51-ccdFgR56dMk';

const supabase = createClient(supabaseUrl, serviceKey);

// Test connection
const { data, error } = await supabase.from('pets_customers').select('id').limit(1);

if (error && error.code === '42P01') {
  console.log('Tables do not exist yet - need to run schema via Dashboard');
  console.log('\nPaste this SQL in Supabase Dashboard > SQL Editor:');
  console.log('https://supabase.com/dashboard/project/iynirubuonhsnxzzmrry/sql/new');
} else if (error) {
  console.log('Error:', error.message);
} else {
  console.log('Tables already exist!');
}
