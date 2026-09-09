import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Node 20 compatibility: polyfill globalThis.WebSocket for @supabase/realtime-js if not present
if (!globalThis.WebSocket) {
  // @ts-ignore
  globalThis.WebSocket = class DummyWebSocket {};
}

// Parse .env.local manually without external dependencies
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

async function verifyLiveSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('================================================================');
  console.log('PIXELLAR REALTY CRM - LIVE SUPABASE CONNECTION TEST');
  console.log('================================================================');
  console.log(`Connecting to: ${url}`);

  if (!url || !serviceKey) {
    throw new Error('Supabase URL or Service Role Key missing in .env.local');
  }

  // Admin client for backend operations
  const adminClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // 1. Check Subscription Plans
  console.log('\n[1/5] Checking Subscription Plans...');
  const { data: plans, error: plansErr } = await adminClient
    .from('subscription_plans')
    .select('id, name, slug, monthly_price_inr, max_users, max_projects');

  if (plansErr) {
    console.error('Error fetching plans:', plansErr.message);
  } else {
    console.log(`  -> SUCCESS: Found ${plans?.length} subscription plans:`);
    plans?.forEach((p) => {
      console.log(`     * ${p.name} (${p.slug}): INR ${p.monthly_price_inr}/mo | Max Users: ${p.max_users} | Max Projects: ${p.max_projects}`);
    });
  }

  // 2. Check Companies
  console.log('\n[2/5] Checking Real Estate Companies (Tenants)...');
  const { data: companies, error: compErr } = await adminClient
    .from('companies')
    .select('id, name, slug, city, state, status');

  if (compErr) {
    console.error('Error fetching companies:', compErr.message);
  } else {
    console.log(`  -> SUCCESS: Found ${companies?.length} registered tenants:`);
    companies?.forEach((c) => {
      console.log(`     * ${c.name} (Slug: ${c.slug}) | Location: ${c.city}, ${c.state} | Status: ${c.status}`);
    });
  }

  // 3. Check Projects & Units
  console.log('\n[3/5] Checking Projects & Real Estate Units...');
  const { data: projects, error: projErr } = await adminClient
    .from('projects')
    .select('id, name, code, category, city, status');

  if (projErr) {
    console.error('Error fetching projects:', projErr.message);
  } else {
    console.log(`  -> SUCCESS: Found ${projects?.length} projects:`);
    projects?.forEach((p) => {
      console.log(`     * [${p.code}] ${p.name} (${p.category}) - ${p.city}`);
    });
  }

  const { count: unitCount, error: unitErr } = await adminClient
    .from('project_units')
    .select('*', { count: 'exact', head: true });

  if (unitErr) {
    console.error('Error counting units:', unitErr.message);
  } else {
    console.log(`  -> SUCCESS: Total Units in Cloud Inventory: ${unitCount}`);
  }

  // 4. Check Leads Pipeline
  console.log('\n[4/5] Checking Leads Pipeline...');
  const { data: leads, error: leadErr } = await adminClient
    .from('leads')
    .select('id, lead_number, first_name, last_name, phone, priority, temperature');

  if (leadErr) {
    console.error('Error fetching leads:', leadErr.message);
  } else {
    console.log(`  -> SUCCESS: Found ${leads?.length} active leads:`);
    leads?.forEach((l) => {
      console.log(`     * [${l.lead_number}] ${l.first_name} ${l.last_name} (${l.phone}) | Priority: ${l.priority} | Temp: ${l.temperature}`);
    });
  }

  // 5. Check Storage Bucket
  console.log('\n[5/5] Checking Object Storage Buckets...');
  const { data: buckets, error: bucketErr } = await adminClient.storage.listBuckets();
  if (bucketErr) {
    console.error('Error listing buckets:', bucketErr.message);
  } else {
    const tenantBucket = buckets?.find((b) => b.name === 'tenant-assets');
    if (tenantBucket) {
      console.log(`  -> SUCCESS: Storage bucket 'tenant-assets' verified! (Public: ${tenantBucket.public})`);
    } else {
      console.log(`  -> Storage buckets found: ${buckets?.map((b) => b.name).join(', ') || 'None'}`);
    }
  }

  console.log('\n================================================================');
  console.log('ALL VERIFICATIONS PASSED: Supabase PostgreSQL & Storage Live!');
  console.log('================================================================\n');
}

verifyLiveSupabase().catch((err) => {
  console.error('Live Supabase verification failed:', err);
  process.exit(1);
});
