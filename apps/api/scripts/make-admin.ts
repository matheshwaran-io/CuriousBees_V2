import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'mr9820@srmist.edu.in';
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (user) {
    await prisma.user.update({
      where: { email },
      data: {
        role: 'INSTITUTION_ADMIN',
        status: 'APPROVED',
        approved: true
      }
    });
    console.log(`Updated ${email} to INSTITUTION_ADMIN`);
  } else {
    console.log(`User ${email} not found in DB. They will be created as INSTITUTION_ADMIN on next login.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
