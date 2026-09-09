import crypto from 'crypto';
import { db, normalizePhoneNumber } from '../src/lib/db';
import { hasPermission, PERMISSIONS } from '../src/lib/auth/permissions';
import {
  verifyWebhookSignature,
  processRazorpayWebhook,
  RAZORPAY_WEBHOOK_SECRET,
} from '../src/lib/billing/razorpay';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('PIXELLAR REALTY CRM - AUTOMATED VERIFICATION TEST SUITE');
  console.log('Product Owner: K. Yeswanth Kumar Reddy | Digital Pixellar');
  console.log('================================================================\n');

  // Reset db state to clean seed
  db.resetToSeed();

  const companyA = db.getCompany('skyline-developers')!;
  const companyB = db.getCompany('greenfield-estates')!;

  // -------------------------------------------------------------
  // TEST SUITE 1: TENANT DATA ISOLATION
  // -------------------------------------------------------------
  console.log('TEST SUITE 1: Multi-Tenant Data Isolation');

  const leadsA = db.getLeads(companyA.id);
  const leadsB = db.getLeads(companyB.id);

  assert(leadsA.length > 0, 'Company A has active leads');
  assert(leadsB.length > 0, 'Company B has active leads');

  const crossLeakAtoB = leadsA.some((l) => l.company_id === companyB.id);
  const crossLeakBtoA = leadsB.some((l) => l.company_id === companyA.id);

  assert(!crossLeakAtoB, 'Company A query contains ZERO Company B leads');
  assert(!crossLeakBtoA, 'Company B query contains ZERO Company A leads');

  // Units Isolation
  const unitsA = db.getUnits(companyA.id);
  const unitsB = db.getUnits(companyB.id);
  const unitLeak = unitsA.some((u) => u.company_id === companyB.id);
  assert(!unitLeak, 'Company A inventory contains ZERO Company B property units');

  // Direct Attempt to fetch Company B lead using Company A tenant context
  const targetLeadB = leadsB[0];
  const unauthorizedAccess = db.getLead(companyA.id, targetLeadB.id);
  assert(unauthorizedAccess === null, 'Company A cannot access Company B lead via direct ID query');

  console.log('');

  // -------------------------------------------------------------
  // TEST SUITE 2: CONCURRENCY & ANTI-DOUBLE-BOOKING ENGINE
  // -------------------------------------------------------------
  console.log('TEST SUITE 2: Concurrency & Anti-Double-Booking Guard');

  // Find an available unit in Company A
  const availableUnit = db.getUnits(companyA.id).find((u) => u.status === 'available')!;
  assert(Boolean(availableUnit), `Found available unit for test: ${availableUnit?.unit_number}`);

  // Customer 1 books the unit
  const booking1 = db.bookUnitAtomic(companyA.id, availableUnit.id, {
    customerId: 'cust-manish-01',
    salesMemberId: 'mem-arjun-04',
    baseQuotedAmount: availableUnit.total_price,
    discountAmount: 0,
    bookingAmount: 100000,
  });

  assert(booking1.unit.status === 'booked', 'First booking succeeds and atomically updates unit to "booked"');

  // Customer 2 attempts simultaneous double-booking of the SAME unit
  let doubleBookingCaught = false;
  try {
    db.bookUnitAtomic(companyA.id, availableUnit.id, {
      customerId: 'cust-manish-01',
      salesMemberId: 'mem-arjun-04',
      baseQuotedAmount: availableUnit.total_price,
      discountAmount: 0,
      bookingAmount: 100000,
    });
  } catch (err: any) {
    doubleBookingCaught = true;
    assert(err.message.includes('Double-Booking Prevention Error'), 'Simultaneous booking collision triggers double-booking error');
  }

  assert(doubleBookingCaught, 'Anti-double-booking constraint blocks second simultaneous booking attempt');

  // Test Expiring Hold Release
  const holdUnit = db.getUnits(companyA.id).find((u) => u.status === 'available')!;
  if (holdUnit) {
    // Place hold expiring 1 hour ago
    holdUnit.status = 'on_hold';
    holdUnit.hold_expires_at = new Date(Date.now() - 3600000).toISOString();
    const released = db.releaseExpiredHolds(companyA.id);
    assert(released > 0, `Expired hold successfully cleaned and released back to available (released: ${released})`);
  }

  console.log('');

  // -------------------------------------------------------------
  // TEST SUITE 3: ROLE-BASED ACCESS CONTROL (RBAC) & OWNER PROTECTION
  // -------------------------------------------------------------
  console.log('TEST SUITE 3: Role-Based Access Control & Owner Protection');

  assert(!hasPermission('telecaller', PERMISSIONS.VIEW_FINANCIALS), 'Telecaller is denied access to financial ledgers');
  assert(!hasPermission('sales_executive', PERMISSIONS.MANAGE_BILLING), 'Sales Agent is denied access to SaaS billing');
  assert(hasPermission('company_owner', PERMISSIONS.MANAGE_COMPANY_SETTINGS), 'Company Owner has permission to edit company settings');
  assert(hasPermission('accounts', PERMISSIONS.RECONCILE_PAYMENT), 'Accounts role has permission to reconcile payments');

  // Test: Final Company Owner Deletion Protection
  const ownerA = db.getCompanyMembers(companyA.id).find((m) => m.role === 'company_owner')!;
  let ownerProtectionCaught = false;
  try {
    db.deleteMember(ownerA.id, companyA.id);
  } catch (err: any) {
    ownerProtectionCaught = true;
    assert(err.message.includes('final active Company Owner'), 'System blocks removing the final active Company Owner');
  }
  assert(ownerProtectionCaught, 'Final Company Owner deletion protection enforced');

  console.log('');

  // -------------------------------------------------------------
  // TEST SUITE 4: EXPIRING TEAM INVITATIONS
  // -------------------------------------------------------------
  console.log('TEST SUITE 4: Single-Use Team Invitations');

  const invEmail = 'new-agent@skylinedev.com';
  const invitation = db.createInvitation(companyA.id, ownerA.id, invEmail, 'sales_executive');

  assert(invitation.status === 'pending', 'Invitation created in pending state');
  assert(Boolean(invitation.token), 'Cryptographically secure invitation token generated');

  // Accept invitation
  const acceptedMember = db.acceptInvitation(invitation.token, 'Rohith Sharma', 'usr-test-01');
  assert(acceptedMember.email === invEmail, 'Invited employee joined with invited email');
  assert(acceptedMember.role === 'sales_executive', 'Invited employee assigned correct sales_executive role');
  assert(acceptedMember.company_id === companyA.id, 'Invited employee attached to correct company workspace');

  // Attempt replay with consumed invitation token
  let replayBlocked = false;
  try {
    db.acceptInvitation(invitation.token, 'Impostor User', 'usr-fake');
  } catch (err: any) {
    replayBlocked = true;
  }
  assert(replayBlocked, 'Replay of accepted invitation token rejected');

  console.log('');

  // -------------------------------------------------------------
  // TEST SUITE 5: RAZORPAY WEBHOOK SIGNATURE & IDEMPOTENCY
  // -------------------------------------------------------------
  console.log('TEST SUITE 5: Razorpay Webhooks & Idempotency');

  const sampleEventId = `evt_test_${Date.now()}`;
  const webhookPayload = JSON.stringify({
    event_id: sampleEventId,
    event: 'subscription.charged',
    payload: {
      payment: {
        entity: {
          id: `pay_${Date.now()}`,
          amount: 1999900,
          currency: 'INR',
          notes: { company_id: companyA.id, plan_id: 'plan-business-03' },
        },
      },
      subscription: {
        entity: {
          id: 'sub_RP1029384756',
          notes: { company_id: companyA.id },
        },
      },
    },
  });

  const validSignature = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(webhookPayload)
    .digest('hex');

  // 1. Valid Signature Test
  const sigValid = verifyWebhookSignature(webhookPayload, validSignature, RAZORPAY_WEBHOOK_SECRET);
  assert(sigValid, 'HMAC SHA-256 webhook signature verified successfully');

  // 2. Forged Signature Test
  const forgedSig = 'forged_fake_signature_hex_1234567890abcdef1234567890abcdef';
  const sigForged = verifyWebhookSignature(webhookPayload, forgedSig, RAZORPAY_WEBHOOK_SECRET);
  assert(!sigForged, 'Forged webhook signature correctly rejected');

  // 3. Webhook Execution
  const processResult1 = await processRazorpayWebhook(webhookPayload, validSignature);
  assert(processResult1.success, 'Valid Razorpay webhook processed and subscription activated');

  // 4. Duplicate Replay Test (Idempotency)
  const processResult2 = await processRazorpayWebhook(webhookPayload, validSignature);
  assert(processResult2.duplicate === true, 'Duplicate webhook replay detected and safely handled idempotently');

  console.log('');

  // -------------------------------------------------------------
  // TEST SUITE 6: IN-COMPANY DUPLICATE PHONE NORMALIZATION
  // -------------------------------------------------------------
  console.log('TEST SUITE 6: Lead Normalization & Duplicate Detection');

  const rawPhone1 = '+91 91234 99887';
  const rawPhone2 = '9123499887'; // 10 digit Indian format without country code

  const normalized1 = normalizePhoneNumber(rawPhone1);
  const normalized2 = normalizePhoneNumber(rawPhone2);

  assert(normalized1 === '+919123499887', 'Normalized phone format 1 matches standard E.164');
  assert(normalized2 === '+919123499887', 'Normalized phone format 2 matches standard E.164');

  // Create lead with phone in Company A
  const lead1 = db.createLead(companyA.id, {
    first_name: 'Harish',
    phone: rawPhone1,
    stage_id: db.getPipelineStages(companyA.id)[0].id,
    priority: 'medium',
    temperature: 'warm',
    buying_timeline: '1_month',
    source: 'Website',
    tags: [],
    custom_fields: {},
  });

  // Ingest second lead with alternate representation of same phone in Company A
  const lead2 = db.createLead(companyA.id, {
    first_name: 'Harish Dup',
    phone: rawPhone2,
    stage_id: db.getPipelineStages(companyA.id)[0].id,
    priority: 'medium',
    temperature: 'warm',
    buying_timeline: '1_month',
    source: 'Meta Ads',
    tags: [],
    custom_fields: {},
  });

  assert(lead2.is_duplicate, 'Duplicate lead flagged in Company A on normalized phone match');
  assert(lead2.merged_into_lead_id === lead1.id, 'Duplicate lead linked to primary lead ID');

  // Ingest SAME phone in Company B: Should NOT be flagged as duplicate across different companies
  const leadInCompanyB = db.createLead(companyB.id, {
    first_name: 'Harish In Company B',
    phone: rawPhone1,
    stage_id: db.getPipelineStages(companyB.id)[0].id,
    priority: 'medium',
    temperature: 'warm',
    buying_timeline: '1_month',
    source: 'Website',
    tags: [],
    custom_fields: {},
  });

  assert(!leadInCompanyB.is_duplicate, 'Duplicate check does NOT reveal or link customer records from another company');

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
