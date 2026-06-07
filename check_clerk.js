require('dotenv').config();

async function bypassTrust() {
  const email = 'mr9820@srmist.edu.in';
  const clerkKey = process.env.CLERK_SECRET_KEY;
  
  if (!clerkKey) {
    console.error('No clerk key');
    return;
  }
  
  // Get users by email
  const res = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`, {
    headers: { 'Authorization': `Bearer ${clerkKey}` }
  });
  
  const users = await res.json();
  if (users.length === 0) {
    console.log('User not found in Clerk');
    return;
  }
  
  const user = users[0];
  console.log('Setting bypass_client_trust to true...');
  const updateRes = await fetch(`https://api.clerk.com/v1/users/${user.id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${clerkKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      bypass_client_trust: true,
    })
  });
  const updated = await updateRes.json();
  console.log('Update result:', JSON.stringify(updated, null, 2));
}

bypassTrust();
