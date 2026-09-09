import { db } from '../src/lib/db';

async function main() {
  console.log('=====================================================');
  console.log('PIXELLAR REALTY CRM - DEVELOPMENT SEED SCRIPT');
  console.log('=====================================================');
  console.log('Notice: This resets and populates the local development database with:');
  console.log(' - Platform Owner: K. Yeswanth Kumar Reddy (owner@digitalpixellar.com)');
  console.log(' - Company A: Skyline Developers & Builders (skyline-developers)');
  console.log(' - Company B: Greenfield Estates (greenfield-estates)');
  console.log(' - 4 Subscription Plans (Starter, Growth, Business, Enterprise)');
  console.log(' - Projects: Skyline Meadows, Skyline Heights, Greenfield Serenity');
  console.log(' - Units, Leads, Site Visits, Bookings, Payments, Broker Commissions\n');

  const state = db.resetToSeed();

  console.log(`[OK] Loaded ${state.companies.length} Companies`);
  console.log(`[OK] Loaded ${state.subscription_plans.length} Subscription Plans`);
  console.log(`[OK] Loaded ${state.projects.length} Real Estate Projects`);
  console.log(`[OK] Loaded ${state.project_units.length} Units (Plots & Apartments)`);
  console.log(`[OK] Loaded ${state.leads.length} Leads`);
  console.log(`[OK] Loaded ${state.bookings.length} Property Bookings`);
  console.log(`[OK] Loaded ${state.customer_payments.length} Payments`);
  console.log(`[OK] Loaded ${state.channel_partners.length} Channel Partners`);

  console.log('\nSeed completed successfully.');
  console.log('=====================================================');
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
