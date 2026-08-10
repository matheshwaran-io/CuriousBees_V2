require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { clerkId: 'user_3ErsjxqSwy01NmHwdYQl6vnMfdg' }
  });
  console.log('User Role:', user.role);
  console.log('User Status:', user.status);
}
main().finally(() => prisma.$disconnect());
