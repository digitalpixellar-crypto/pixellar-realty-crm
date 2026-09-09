import crypto from 'crypto';
import { db } from '@/lib/db';
import { Company, SubscriptionPlan } from '@/types';

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_pixellar_mock_key';
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_pixellar_mock_secret';
export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_pixellar_razorpay_2026';

/**
 * Validates HMAC SHA-256 signature for inbound Razorpay Webhooks
 */
export function verifyWebhookSignature(rawBody: string, signature: string, secret: string = RAZORPAY_WEBHOOK_SECRET): boolean {
  if (!signature || !rawBody) return false;
  try {
    const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch (err) {
    console.error('Error verifying Razorpay webhook signature:', err);
    return false;
  }
}

/**
 * Validates payment signature for Razorpay Checkout completion
 */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string, secret: string = RAZORPAY_KEY_SECRET): boolean {
  if (!orderId || !paymentId || !signature) return false;
  try {
    const text = `${orderId}|${paymentId}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(text).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}

/**
 * Idempotent Razorpay Webhook Event Processor
 */
export async function processRazorpayWebhook(rawBody: string, signature: string): Promise<{ success: boolean; message: string; duplicate?: boolean }> {
  const isValid = verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    return { success: false, message: 'Invalid Razorpay webhook signature.' };
  }

  const payload = JSON.parse(rawBody);
  const eventId = payload.event_id || payload.id || `evt_${Date.now()}`;
  const eventName = payload.event;

  // Idempotency check: Ignore duplicate deliveries
  const { isDuplicate } = db.recordRazorpayEvent(eventId, eventName, payload);
  if (isDuplicate) {
    return { success: true, message: 'Event already processed (idempotent ignore).', duplicate: true };
  }

  try {
    switch (eventName) {
      case 'subscription.charged':
      case 'payment.captured': {
        const payment = payload.payload?.payment?.entity;
        const subEntity = payload.payload?.subscription?.entity;
        const notes = payment?.notes || subEntity?.notes || {};
        const companyId = notes.company_id;
        const planId = notes.plan_id;

        if (companyId) {
          const company = db.getCompany(companyId);
          if (company) {
            // Update company status to active
            db.updateCompany(company.id, {
              status: 'active',
              plan_id: planId || company.plan_id,
            });

            // Update subscription period
            const currentSub = db.getCompanySubscription(company.id);
            if (currentSub) {
              currentSub.status = 'active';
              currentSub.current_period_start = new Date().toISOString();
              currentSub.current_period_end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
              currentSub.razorpay_subscription_id = subEntity?.id || currentSub.razorpay_subscription_id;
            }

            // Record SaaS invoice
            const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
            db.getSubscriptionInvoices().push({
              id: `inv-${Date.now()}`,
              company_id: company.id,
              subscription_id: currentSub?.id || `sub-${company.id}`,
              razorpay_payment_id: payment?.id || `pay_${Date.now()}`,
              razorpay_order_id: payment?.order_id,
              amount_inr: (payment?.amount || 999900) / 100,
              currency: 'INR',
              status: 'paid',
              invoice_number: invoiceNumber,
              period_start: new Date().toISOString(),
              period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              paid_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            });
          }
        }
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.paused': {
        const subEntity = payload.payload?.subscription?.entity;
        const companyId = subEntity?.notes?.company_id;
        if (companyId) {
          const currentSub = db.getCompanySubscription(companyId);
          if (currentSub) {
            currentSub.status = 'canceled';
            currentSub.cancel_at_period_end = true;
          }
        }
        break;
      }

      case 'payment.failed': {
        const payment = payload.payload?.payment?.entity;
        const companyId = payment?.notes?.company_id;
        if (companyId) {
          const currentSub = db.getCompanySubscription(companyId);
          if (currentSub) {
            currentSub.status = 'past_due';
            currentSub.grace_period_ends_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          }
        }
        break;
      }

      default:
        console.log(`Unhandled Razorpay webhook event: ${eventName}`);
    }

    db.markRazorpayEventProcessed(eventId);
    return { success: true, message: 'Webhook processed successfully.' };
  } catch (err: any) {
    console.error('Failed to process Razorpay webhook:', err);
    return { success: false, message: err.message || 'Webhook processing failed.' };
  }
}

/**
 * Backend Entitlement and Quota Verification
 */
export function checkCompanyEntitlement(company: Company, featureKey: keyof SubscriptionPlan['features']): boolean {
  const plans = db.getSubscriptionPlans();
  const plan = plans.find((p) => p.id === company.plan_id);
  if (!plan) return false;
  return plan.features[featureKey] ?? false;
}

export function checkCompanyQuota(company: Company, quotaType: 'users' | 'projects' | 'leads'): { allowed: boolean; current: number; max: number } {
  const plans = db.getSubscriptionPlans();
  const plan = plans.find((p) => p.id === company.plan_id);
  if (!plan) return { allowed: false, current: 0, max: 0 };

  if (quotaType === 'users') {
    const current = db.getCompanyMembers(company.id).filter((m) => m.is_active).length;
    return { allowed: current < plan.max_users, current, max: plan.max_users };
  }

  if (quotaType === 'projects') {
    const current = db.getProjects(company.id).length;
    return { allowed: current < plan.max_projects, current, max: plan.max_projects };
  }

  if (quotaType === 'leads') {
    const current = db.getLeads(company.id).length;
    return { allowed: current < plan.max_leads_per_month, current, max: plan.max_leads_per_month };
  }

  return { allowed: true, current: 0, max: Infinity };
}
