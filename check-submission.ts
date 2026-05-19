import prisma from "./src/db/index.js";

async function checkSubmission() {
  const submissionId = "d3bc7e06-3484-4027-ab3e-4f02144f108b";
  
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId }
  });
  
  if (submission) {
    console.log("Submission found:");
    console.log("ID:", submission.id);
    console.log("Status:", submission.processingStatus);
    console.log("AI Type:", submission.aiType);
    console.log("Overall Score:", submission.overallScore);
    console.log("AI Comment:", submission.aiComment);
    console.log("Created At:", submission.createdAt);
  } else {
    console.log("Submission not found");
  }
  
  await prisma.$disconnect();
}

checkSubmission().catch(console.error);

// Made with Bob
