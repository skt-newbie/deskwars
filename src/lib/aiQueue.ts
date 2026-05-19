import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import prisma from "../db/index.js";

const AI_CONFIG = {
  MODEL: "gemini-2.5-flash-lite",
  COOLDOWN_MS: 4500,
  PROMPTS: {
    DRAWING: `You are an AI Drawing Judge for office carnival art competitions. Be playful, dramatic, meme-worthy, and entertaining but fair. Never insult harshly or be toxic.

Judge: skill, originality, creativity, effort, humor.

Scoring: Skill 30%, Originality 30%, Creativity 20%, Effort 10%, Humor 10%.

Return ONLY valid JSON with EXACTLY these category names:
{
  "overall_score": 0-100,
  "categories": {
    "skill": 0-100,
    "originality": 0-100,
    "creativity": 0-100,
    "effort": 0-100,
    "humor": 0-100
  },
  "remark": "Short, punchy verdict with a chaos title (e.g., 'Picasso of Panic', 'Doodle Overlord', 'CEO of Crayons'). Keep it under 20 words."
}`,
    DESK: `You are an AI Desk Decor Judge for office carnival competitions. Be playful, funny, meme-worthy, dramatic, and office-safe. Never judge wealth or insult harshly.

Judge workspace transformation from base setup. Reward: creativity, theme consistency, props, storytelling, organized chaos, commitment to the bit.

Scoring: Creativity/Transformation 30%, Decor Effort 25%, Theme/Story 20%, Chaos Energy 15%, Integration 10%.

Return ONLY valid JSON:
{
  "overall_score": 0-100,
  "categories": {
    "creativity": 0-100,
    "cleanliness": 0-100,
    "humor": 0-100,
    "theme_match": 0-100,
    "effort": 0-100
  },
  "remark": "Short, punchy verdict with a chaos title (e.g., 'Lord of the Cubicles', 'Workspace Wizard', 'Chaos Architect', 'Desk Dungeon Master'). Keep it under 20 words."
}`
  }
};

const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
const aiKeys = rawKeys.split(",").map(k => k.trim()).filter(k => k.length > 0);
let currentAiKeyIndex = 0;

function getAiClient() {
  if (aiKeys.length === 0) throw new Error("No Gemini API keys found.");
  const key = aiKeys[currentAiKeyIndex];
  currentAiKeyIndex = (currentAiKeyIndex + 1) % aiKeys.length;
  return new GoogleGenAI({ apiKey: key });
}

export class AIQueueManager {
  private queue: string[] = [];
  private isProcessing = false;
  private cooldownMs = AI_CONFIG.COOLDOWN_MS;

  constructor() {
    // Load any pending/queued submissions on startup
    this.loadPendingSubmissions();
  }

  private async loadPendingSubmissions() {
    try {
      const pendingSubmissions = await prisma.submission.findMany({
        where: {
          processingStatus: {
            in: ['pending', 'queued']
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      if (pendingSubmissions.length > 0) {
        console.log(`[AI Queue] Found ${pendingSubmissions.length} pending submissions, adding to queue`);
        for (const submission of pendingSubmissions) {
          this.queue.push(submission.id);
          await prisma.submission.update({
            where: { id: submission.id },
            data: { processingStatus: 'queued' }
          });
        }
        this.process();
      }
    } catch (err) {
      console.error('[AI Queue] Error loading pending submissions:', err);
    }
  }

  add(submissionId: string) {
    console.log(`Adding ${submissionId} to AI queue`);
    this.queue.push(submissionId);
    prisma.submission.update({
      where: { id: submissionId },
      data: { processingStatus: 'queued' }
    }).catch(console.error);
    this.process();
  }

  private async process() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const submissionId = this.queue.shift();
    if (!submissionId) {
      this.isProcessing = false;
      return;
    }

    try {
      await this.processSubmission(submissionId);
    } catch (err) {
      console.error(`Error processing submission ${submissionId}:`, err);
      await prisma.submission.update({
        where: { id: submissionId },
        data: { processingStatus: 'failed' }
      }).catch(console.error);
    }

    setTimeout(() => {
      this.isProcessing = false;
      this.process();
    }, this.cooldownMs);
  }

  private async processSubmission(id: string) {
    const submission = await prisma.submission.findUnique({ where: { id } });
    if (!submission) return;

    console.log(`AI Processing submission ${id} (${submission.aiType})`);
    await prisma.submission.update({
      where: { id },
      data: { processingStatus: 'processing' }
    });

    const ai = getAiClient();
    const model = AI_CONFIG.MODEL;

    const fullPath = path.join(process.cwd(), submission.imagePath);
    const imageData = fs.readFileSync(fullPath).toString("base64");

    const prompt = submission.aiType === 'drawing' 
      ? AI_CONFIG.PROMPTS.DRAWING 
      : AI_CONFIG.PROMPTS.DESK;

    let result;
    try {
      result = await ai.models.generateContent({
        model,
        contents: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageData,
            },
          },
          { text: prompt },
        ],
      });
    } catch (err: any) {
      const isBusy = 
        err.status === 503 || 
        err.message?.includes("503") ||
        err.message?.includes("high demand") || 
        err.message?.includes("UNAVAILABLE") ||
        err.message?.includes("busy");

      if (isBusy) {
        console.warn(`[AI] Busy/503 caught for ${id}: ${err.message}`);
        await prisma.submission.update({
          where: { id },
          data: {
            processingStatus: 'failed',
            aiComment: 'AI is currently busy due to high demand. Your entry was recorded, but please retry judging later!'
          }
        });
        return;
      }
      throw err;
    }

    const text = result.text;
    if (!text) throw new Error("No response from AI");
    
    console.log(`[AI] Raw response for ${id}:`, text);
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI response did not contain a JSON object");
    
    let jsonStr = jsonMatch[0];
    jsonStr = jsonStr
      .replace(/\/\/.*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/,(\s*[\]}])/g, '$1');
      
    let aiData;
    try {
      aiData = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error(`[AI] JSON Parse Fail for ${id}. Raw substring:`, jsonStr);
      throw parseErr;
    }

    await prisma.submission.update({
      where: { id },
      data: {
        processingStatus: 'completed',
        overallScore: aiData.overall_score || 0,
        categoriesJson: JSON.stringify(aiData.categories || {}),
        aiComment: aiData.remark || ""
      }
    });

    if (submission.submissionMode === 'final') {
      const pointField = submission.aiType === 'drawing' ? 'drawingPoints' : 'deskPoints';
      await prisma.user.update({
        where: { id: submission.userId },
        data: {
          totalPoints: { increment: aiData.overall_score || 0 },
          [pointField]: { increment: aiData.overall_score || 0 }
        }
      });
    }
      
    console.log(`AI Completion success for ${id} (Mode: ${submission.submissionMode})`);
  }
}

// Made with Bob
