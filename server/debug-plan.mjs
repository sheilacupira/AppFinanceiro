import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const user = await prisma.user.findUnique({
  where: { email: 'sheilacupira@gmail.com' },
  include: { memberships: { include: { tenant: true }, orderBy: { createdAt: 'asc' } } }
});

if (!user) { console.log('USER NOT FOUND'); process.exit(1); }

console.log('=== MEMBERSHIPS ===');
user.memberships.forEach((m, i) => {
  console.log(`[${i}] role=${m.role} tenantId=${m.tenantId} billingPlan=${m.tenant.billingPlan} billingStatus=${m.tenant.billingStatus} giftExpiry=${m.tenant.giftExpiry}`);
});

// Force fix: apply pro to OWNER tenant
const ownerMembership = user.memberships.find(m => m.role === 'OWNER') ?? user.memberships[0];
console.log('\n=== APPLYING PRO TO OWNER TENANT:', ownerMembership.tenantId, '===');
const giftExpiry = new Date();
giftExpiry.setDate(giftExpiry.getDate() + 365);
await prisma.tenant.update({
  where: { id: ownerMembership.tenantId },
  data: { billingPlan: 'pro', billingStatus: 'gift', giftExpiry }
});
console.log('DONE - Pro applied until', giftExpiry.toISOString());

await prisma.$disconnect();
