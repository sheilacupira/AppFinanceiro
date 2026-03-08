const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findUnique({
    where: { email: 'sheilacupira@gmail.com' },
    include: { memberships: { include: { tenant: true }, orderBy: { createdAt: 'asc' } } }
  });

  if (!user) { console.log('USER NOT FOUND'); process.exit(1); }

  console.log('=== MEMBERSHIPS ===');
  user.memberships.forEach(function(m, i) {
    console.log('[' + i + '] role=' + m.role + ' tenantId=' + m.tenantId + ' billingPlan=' + m.tenant.billingPlan + ' billingStatus=' + m.tenant.billingStatus);
  });

  const ownerMembership = user.memberships.find(function(m) { return m.role === 'OWNER'; }) || user.memberships[0];
  console.log('\n=== APPLYING PRO TO TENANT: ' + ownerMembership.tenantId + ' ===');
  const giftExpiry = new Date();
  giftExpiry.setDate(giftExpiry.getDate() + 365);
  await prisma.tenant.update({
    where: { id: ownerMembership.tenantId },
    data: { billingPlan: 'pro', billingStatus: 'gift', giftExpiry: giftExpiry }
  });
  console.log('DONE - Pro applied until ' + giftExpiry.toISOString());
  await prisma.$disconnect();
}

run().catch(function(e) { console.error(e.message); process.exit(1); });
