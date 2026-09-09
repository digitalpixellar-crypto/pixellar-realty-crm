import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { Company, CompanyMember, PlatformAdmin, MemberRole } from '@/types';
import { hasPermission, Permission } from './permissions';

export interface TenantContext {
  user: {
    id: string;
    email: string;
    name: string;
  };
  company: Company;
  member: CompanyMember;
  role: MemberRole;
  isPlatformAdmin: boolean;
  can: (permission: Permission) => boolean;
}

export async function getTenantContext(companySlug: string): Promise<TenantContext | null> {
  const cookieStore = await cookies();
  const activeMemberId = cookieStore.get('pixellar_active_member_id')?.value;
  const platformAdminId = cookieStore.get('pixellar_platform_admin_id')?.value;

  const company = db.getCompany(companySlug);
  if (!company) return null;

  // If a specific member session cookie is set
  let member: CompanyMember | null = null;
  if (activeMemberId) {
    member = db.getMember(activeMemberId);
    if (member && member.company_id !== company.id) {
      // Cross-tenant mismatch! Do NOT leak Company A member to Company B!
      member = null;
    }
  }

  // If no valid member session found in cookie, default to the primary owner of this company
  if (!member) {
    const members = db.getCompanyMembers(company.id);
    member = members.find((m) => m.role === 'company_owner' && m.is_active) || members[0] || null;
  }

  if (!member) return null;

  const isPlatformAdmin = Boolean(platformAdminId);

  return {
    user: {
      id: member.user_id,
      email: member.email,
      name: member.name,
    },
    company,
    member,
    role: member.role,
    isPlatformAdmin,
    can: (permission: Permission) => hasPermission(member?.role, permission),
  };
}

export async function getPlatformAdminSession(): Promise<PlatformAdmin | null> {
  const cookieStore = await cookies();
  const adminId = cookieStore.get('pixellar_platform_admin_id')?.value;

  const admins = db.getPlatformAdmins();
  if (adminId) {
    const found = admins.find((a) => a.id === adminId && a.is_active);
    if (found) return found;
  }

  // Default to seeded primary owner if none explicitly set
  return admins.find((a) => a.role === 'superadmin' && a.is_active) || admins[0] || null;
}
