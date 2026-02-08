const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugTables() {
  console.log('=== USERS TABLE ===');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  if (usersError) console.error('users error:', usersError);
  else console.log('users rows:', users?.length, JSON.stringify(users, null, 2));

  console.log('\n=== VENDORS TABLE ===');
  const { data: vendors, error: vendorsError } = await supabase
    .from('vendors')
    .select('*')
    .order('created_at', { ascending: false });
  if (vendorsError) console.error('vendors error:', vendorsError);
  else console.log('vendors rows:', vendors?.length, JSON.stringify(vendors, null, 2));

  console.log('\n=== SUBSCRIBER_APPLICATIONS TABLE ===');
  const { data: apps, error: appsError } = await supabase
    .from('subscriber_applications')
    .select('id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  if (appsError) console.error('apps error:', appsError);
  else console.log('recent apps:', apps?.length, JSON.stringify(apps, null, 2));
}

debugTables().catch(console.error);
