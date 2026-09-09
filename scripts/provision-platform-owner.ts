import { db } from '../src/lib/db';

async function main() {
  const email = process.env.PLATFORM_OWNER_EMAIL || 'owner@digitalpixellar.com';
  const name = process.env.PLATFORM_OWNER_NAME || 'K. Yeswanth Kumar Reddy';

  console.log('=====================================================');
  console.log('PIXELLAR REALTY CRM - PLATFORM OWNER PROVISIONING');
  console.log('=====================================================');

  const state = db.resetToSeed();
  const existing = state.platform_admins.find((a) => a.email.toLowerCase() === email.toLowerCase());

  if (existing) {
    console.log(`[SUCCESS] Platform Owner already provisioned: ${existing.full_name} (${existing.email})`);
    console.log(`Admin ID: ${existing.id}`);
    console.log(`Role: ${existing.role}`);
  } else {
    state.platform_admins.push({
      id: `admin-${Date.now()}`,
      user_id: `usr-${Date.now()}`,
      email,
      full_name: name,
      role: 'superadmin',
      is_active: true,
      created_at: new Date().toISOString(),
    });
    console.log(`[PROVISIONED] Successfully created Platform Owner superadmin account for: ${name} (${email})`);
  }

  console.log('\nPlatform Owner Dashboard URL: /platform/dashboard');
  console.log('=====================================================');
}

main().catch((err) => {
  console.error('Provisioning failed:', err);
  process.exit(1);
});
