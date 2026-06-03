const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Updating test user roles ---');
  
  const testUsers = [
    { email: 'mrmatheshwaran17@gmail.com', role: 'RESEARCH_SCHOLAR', approved: false },
    { email: 'maddybgmistoreog@gmail.com', role: 'RESEARCH_SUPERVISOR', approved: true },
    { email: 'r.matheshwaran.io@gmail.com', role: 'INSTITUTION_ADMIN', approved: true },
  ];

  for (const t of testUsers) {
    const user = await prisma.user.findUnique({ where: { email: t.email } });
    if (user) {
      await prisma.user.update({
        where: { email: t.email },
        data: { role: t.role, approved: t.approved }
      });
      console.log(`Updated ${t.email} to ${t.role} (approved: ${t.approved})`);
    } else {
      console.log(`${t.email} not found in DB yet.`);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
