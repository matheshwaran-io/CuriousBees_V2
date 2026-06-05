import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const SRM_DEPARTMENTS = [
  { name: 'Computing Technologies (CSE / IT / Swe)', code: 'CSE' },
  { name: 'Electronics & Communication Engineering (ECE)', code: 'ECE' },
  { name: 'Electrical & Electronics Engineering (EEE)', code: 'EEE' },
  { name: 'Biotechnology & Bioengineering', code: 'BIOTECH' },
  { name: 'Mechanical Engineering', code: 'MECH' },
  { name: 'Civil Engineering', code: 'CIVIL' },
  { name: 'Chemical Engineering', code: 'CHEM' },
  { name: 'Physics & Nanotechnology', code: 'PHYS' },
  { name: 'Chemistry & Materials Science', code: 'CHEMISTRY' },
  { name: 'Mathematics & Actuarial Science', code: 'MATHS' },
  { name: 'School of Management (SOM)', code: 'SOM' },
  { name: 'Health Sciences & Research', code: 'HEALTH' }
];

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean database
  await prisma.workspaceAnnouncement.deleteMany({});
  await prisma.workspaceFile.deleteMany({});
  await prisma.workspaceMilestone.deleteMany({});
  await prisma.workspaceMember.deleteMany({});
  await prisma.workspace.deleteMany({});
  await prisma.collaborationRequest.deleteMany({});
  await prisma.userInterest.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.thread.deleteMany({});
  await prisma.opportunity.deleteMany({});
  await prisma.researchInterest.deleteMany({});
  await prisma.notificationToken.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  console.log('🧹 Database cleaned.');

  // 2. Seed Departments
  const deptMap: Record<string, any> = {};
  for (const dept of SRM_DEPARTMENTS) {
    const d = await prisma.department.create({
      data: {
        name: dept.name,
        code: dept.code,
        description: `${dept.name} department at SRMIST.`
      }
    });
    deptMap[dept.name] = d;
  }
  console.log(`✅ Seeded ${SRM_DEPARTMENTS.length} departments.`);

  // 3. Create Research Interests
  const interestsData = [
    'Generative AI & LLMs',
    'Quantum Computing',
    'Silicon Photonics',
    'Nanomaterials & Thin Films',
    'Cancer Immunotherapy',
    '5G/6G Wireless Networks',
    'VLSI System Design',
    'Reinforcement Learning',
    'Bioinformatics',
    'Structural Health Monitoring',
    'Blockchains & Smart Contracts'
  ];

  const interestsMap: Record<string, any> = {};
  for (const name of interestsData) {
    const interest = await prisma.researchInterest.create({
      data: { name }
    });
    interestsMap[name] = interest;
  }
  console.log(`✅ Created ${Object.keys(interestsMap).length} research interests.`);

  // 4. Create Users (Faculty, Scholars, and Admins)
  const users = [
    {
      name: 'Dr. Anand Ramachandran',
      email: 'dr.anand@srmist.edu.in',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      role: Role.RESEARCH_SUPERVISOR,
      department: 'Computing Technologies (CSE / IT / Swe)',
      bio: 'Professor of Computer Science. Researching distributed systems, edge computing, and large language model optimizations for low-resource environments.',
      interests: ['Generative AI & LLMs', 'Reinforcement Learning', 'Blockchains & Smart Contracts']
    },
    {
      name: 'Dr. Priya Subramanian',
      email: 'dr.priya@srmist.edu.in',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      role: Role.RESEARCH_SUPERVISOR,
      department: 'Biotechnology & Bioengineering',
      bio: 'Associate Professor of Bioengineering. Focused on genomic sequencing algorithms, targeted drug delivery, and computational oncology.',
      interests: ['Cancer Immunotherapy', 'Bioinformatics', 'Nanomaterials & Thin Films']
    },
    {
      name: 'Dr. Ramesh Kumar',
      email: 'dr.ramesh@srmist.edu.in',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      role: Role.RESEARCH_SUPERVISOR,
      department: 'Electronics & Communication Engineering (ECE)',
      bio: 'Professor & Head of ECE Dept. Researching high-speed transceiver design, silicon-photonic modulators, and 6G cellular networks.',
      interests: ['Silicon Photonics', '5G/6G Wireless Networks', 'VLSI System Design']
    },
    {
      name: 'Suresh Karthik',
      email: 'scholar.suresh@srmist.edu.in',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      role: Role.RESEARCH_SCHOLAR,
      department: 'Computing Technologies (CSE / IT / Swe)',
      bio: 'PhD Candidate supervised by Dr. Anand. Working on parameter-efficient fine-tuning (PEFT) methods for vision-language models.',
      interests: ['Generative AI & LLMs', 'Reinforcement Learning']
    },
    {
      name: 'Divya Nambiar',
      email: 'scholar.divya@srmist.edu.in',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      role: Role.RESEARCH_SCHOLAR,
      department: 'Biotechnology & Bioengineering',
      bio: 'PhD Scholar researching nano-carriers in bioinformatics under Dr. Priya. Exploring molecular modeling using graph neural networks.',
      interests: ['Bioinformatics', 'Cancer Immunotherapy', 'Nanomaterials & Thin Films']
    },
    {
      name: 'CuriousBees Admin',
      email: 'admin@srmist.edu.in',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      role: Role.INSTITUTION_ADMIN,
      department: 'Computing Technologies (CSE / IT / Swe)',
      bio: 'SRMIST System Administrator for CuriousBees platform.',
      interests: []
    }
  ];

  const createdUsers: Record<string, any> = {};
  for (const u of users) {
    const deptRef = deptMap[u.department];
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        image: u.image,
        role: u.role,
        department: u.department,
        departmentId: deptRef ? deptRef.id : null,
        bio: u.bio,
        approved: u.role === Role.RESEARCH_SUPERVISOR || u.role === Role.INSTITUTION_ADMIN ? true : false,
        status: u.role === Role.RESEARCH_SUPERVISOR || u.role === Role.INSTITUTION_ADMIN ? 'APPROVED' : 'ONBOARDING'
      }
    });
    createdUsers[u.email] = user;

    // Link interests
    for (const interestName of u.interests) {
      const interest = interestsMap[interestName];
      if (interest) {
        await prisma.userInterest.create({
          data: {
            userId: user.id,
            interestId: interest.id
          }
        });
      }
    }
  }
  console.log(`✅ Created ${Object.keys(createdUsers).length} user profiles with department references and interests.`);

  // Link supervisor relationship
  await prisma.user.update({
    where: { id: createdUsers['scholar.suresh@srmist.edu.in'].id },
    data: {
      supervisorId: createdUsers['dr.anand@srmist.edu.in'].id,
      supervisorEmail: 'dr.anand@srmist.edu.in',
      status: 'APPROVED',
      approved: true
    }
  });

  await prisma.user.update({
    where: { id: createdUsers['scholar.divya@srmist.edu.in'].id },
    data: {
      supervisorId: createdUsers['dr.priya@srmist.edu.in'].id,
      supervisorEmail: 'dr.priya@srmist.edu.in',
      status: 'APPROVED',
      approved: true
    }
  });
  console.log('✅ Scholar supervisor associations resolved.');

  // 5. Create Threads
  const t1 = await prisma.thread.create({
    data: {
      title: 'Call for Collaboration: GPGPU Resource Sharing for LLM Fine-Tuning',
      content: `Hello Colleagues, Our lab in the Computing Technologies department has set up a cluster of 4x NVIDIA H100 GPUs for fine-tuning custom models...`,
      authorId: createdUsers['dr.anand@srmist.edu.in'].id,
      tags: ['GPU Cluster', 'Generative AI', 'Bioinformatics']
    }
  });

  const t2 = await prisma.thread.create({
    data: {
      title: 'Interdisciplinary Study on Silicon Photonics-based Genomic Sequencing Chips',
      content: `Hi everyone, I am drafting a proposal for the upcoming DST-SERB Core Research Grant...`,
      authorId: createdUsers['dr.priya@srmist.edu.in'].id,
      tags: ['Silicon Photonics', 'Bioinformatics', 'Research Grant']
    }
  });
  console.log('✅ Created research discussion threads.');

  // 6. Create Comments
  await prisma.comment.create({
    data: {
      content: `This is incredibly timely, Dr. Priya! Adaptations to silicon photonic ring modulators would be awesome.`,
      threadId: t2.id,
      authorId: createdUsers['dr.ramesh@srmist.edu.in'].id
    }
  });

  await prisma.comment.create({
    data: {
      content: `Dr. Anand, my PhD scholar Divya Nambiar is currently running molecular modeling using GNNs, access to your H100 cluster would be a major accelerator.`,
      threadId: t1.id,
      authorId: createdUsers['dr.priya@srmist.edu.in'].id
    }
  });
  console.log('✅ Created comments.');

  // 7. Create Opportunities
  await prisma.opportunity.create({
    data: {
      title: 'PhD Position: Reinforcement Learning for Smart Grid Optimization',
      description: `We are seeking an outstanding PhD candidate to join the EEE department. Funding is ₹38,000/month.`,
      department: 'Electrical & Electronics Engineering (EEE)',
      researchDomain: 'Reinforcement Learning',
      authorId: createdUsers['dr.anand@srmist.edu.in'].id
    }
  });
  console.log('✅ Created research opportunities.');

  // 8. Create Workspaces
  const ws1 = await prisma.workspace.create({
    data: {
      title: 'Genomic Sequencing & Waveguide Photonic Modulators',
      description: 'Collaborative interdisciplinary sandbox for silicon photonics bio-sensor research.'
    }
  });

  // Workspace Members
  await prisma.workspaceMember.createMany({
    data: [
      { workspaceId: ws1.id, userId: createdUsers['dr.priya@srmist.edu.in'].id, role: 'OWNER' },
      { workspaceId: ws1.id, userId: createdUsers['dr.ramesh@srmist.edu.in'].id, role: 'MEMBER' },
      { workspaceId: ws1.id, userId: createdUsers['scholar.divya@srmist.edu.in'].id, role: 'MEMBER' }
    ]
  });

  // Workspace File
  await prisma.workspaceFile.create({
    data: {
      workspaceId: ws1.id,
      name: 'DST_SERB_Grant_Draft.pdf',
      url: 'https://example.com/files/dst_serb_draft.pdf',
      size: 4096000,
      uploadedById: createdUsers['dr.priya@srmist.edu.in'].id
    }
  });

  // Workspace Milestones
  await prisma.workspaceMilestone.createMany({
    data: [
      { workspaceId: ws1.id, title: 'Draft Review Submission', completed: true, dueDate: new Date(Date.now() + 86400000 * 7) },
      { workspaceId: ws1.id, title: 'Full Proposal Submission', completed: false, dueDate: new Date(Date.now() + 86400000 * 30) }
    ]
  });

  // Workspace Announcement
  await prisma.workspaceAnnouncement.create({
    data: {
      workspaceId: ws1.id,
      title: 'Kickoff Proposal Sync',
      content: 'Let us meet in ECE conference room next Tuesday at 10 AM to finalize the proposal draft.',
      authorId: createdUsers['dr.priya@srmist.edu.in'].id
    }
  });
  console.log('✅ Created collaborative workspaces and sub-resources.');

  // 9. Create Events
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  await prisma.event.create({
    data: {
      title: 'PhD Viva Defense: GPGPU Virtualization & LLM Tuning',
      date: new Date(today),
      time: '10:00 AM',
      venue: 'ECE Seminar Hall (PG Block)',
      status: 'PUBLISHED',
      eventType: 'Defense',
      priority: 'HIGH'
    }
  });

  await prisma.event.create({
    data: {
      title: 'Seminar: DNA-functionalized Silicon Photonics Ring Resonators',
      date: new Date(tomorrow),
      time: '02:30 PM',
      venue: 'Biotech Conference Room',
      status: 'PUBLISHED',
      eventType: 'Seminar',
      priority: 'MEDIUM'
    }
  });
  console.log('✅ Created events.');

  // 10. Notifications
  await prisma.notification.create({
    data: {
      userId: createdUsers['scholar.suresh@srmist.edu.in'].id,
      title: 'Welcome to CuriousBees',
      body: 'Your supervisor Dr. Anand Ramachandran has approved your portal access.',
      sentStatus: true
    }
  });

  await prisma.notificationToken.create({
    data: {
      userId: createdUsers['scholar.suresh@srmist.edu.in'].id,
      token: 'mock-fcm-token-suresh-123456789'
    }
  });
  console.log('✅ Seeded notification items and push subscription logs.');

  console.log('🌟 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
