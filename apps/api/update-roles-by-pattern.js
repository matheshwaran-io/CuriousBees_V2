const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function detectRoleFromEmail(email) {
  const username = email.split('@')[0].toLowerCase();
  
  if (username.includes('.')) {
    return { role: 'INSTITUTION_ADMIN', approved: true };
  } else if (/[a-zA-Z]/.test(username) && /[0-9]/.test(username)) {
    return { role: 'RESEARCH_SCHOLAR', approved: false };
  } else if (/^[a-zA-Z]+$/.test(username)) {
    return { role: 'RESEARCH_SUPERVISOR', approved: true };
  }
  
  return { role: 'RESEARCH_SCHOLAR', approved: false };
}

async function main() {
  console.log('--- Updating user roles based on new patterns ---');
  
  const users = await prisma.user.findMany();

  for (const user of users) {
    const { role: newRole, approved: newApproved } = detectRoleFromEmail(user.email);
    
    if (user.role !== newRole || user.approved !== newApproved) {
      await prisma.$executeRawUnsafe(`UPDATE "User" SET role = $1, approved = $2 WHERE id = $3`, newRole, newApproved, user.id);
      console.log(`Updated ${user.email} -> ${newRole} (approved: ${newApproved})`);
    } else {
      console.log(`Skipped ${user.email} -> Already ${newRole} (approved: ${newApproved})`);
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
