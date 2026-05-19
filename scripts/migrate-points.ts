import prisma from '../src/db/index.js';

async function migratePoints() {
  console.log('Starting point migration...');
  
  // Get all users
  const users = await prisma.user.findMany({
    include: {
      submissions: {
        where: {
          processingStatus: 'completed',
          submissionMode: 'final'
        }
      }
    }
  });

  for (const user of users) {
    let deskPoints = 0;
    let drawingPoints = 0;

    // Calculate points from submissions
    for (const submission of user.submissions) {
      const score = submission.overallScore || 0;
      if (submission.aiType === 'desk') {
        deskPoints += score;
      } else if (submission.aiType === 'drawing') {
        drawingPoints += score;
      }
    }

    // Update user with calculated points
    await prisma.user.update({
      where: { id: user.id },
      data: {
        deskPoints,
        drawingPoints
      }
    });

    console.log(`Updated ${user.email}: desk=${deskPoints}, drawing=${drawingPoints}`);
  }

  console.log('Migration complete!');
  await prisma.$disconnect();
}

migratePoints().catch(console.error);

// Made with Bob
