export interface User {
  id: string;
  username: string;
  email?: string;
  total_points: number;
  qr_hunt_step?: number;
  is_admin?: number; // Legacy snake_case for compatibility
  isAdmin?: boolean; // Prisma camelCase
  last_activity?: string;
  created_at: string;
}

export interface Submission {
  id: string;
  user_id: string;
  userId?: string; // Prisma camelCase
  image_path: string;
  imagePath?: string; // Prisma camelCase
  overall_score: number | null;
  overallScore?: number | null; // Prisma camelCase
  ai_comment: string | null;
  aiComment?: string | null; // Prisma camelCase
  categories_json: string | null;
  categoriesJson?: string | null; // Prisma camelCase
  ai_type?: 'desk' | 'drawing';
  aiType?: 'desk' | 'drawing'; // Prisma camelCase
  submission_mode?: 'trial' | 'final';
  submissionMode?: 'trial' | 'final'; // Prisma camelCase
  processing_status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
  processingStatus?: 'pending' | 'queued' | 'processing' | 'completed' | 'failed'; // Prisma camelCase
  created_at: string;
  createdAt?: string; // Prisma camelCase
  username?: string;
}

export interface AIResult {
  overall_score: number;
  categories: {
    creativity: number;
    cleanliness: number;
    humor: number;
    theme_match: number;
    effort: number;
  };
  remark: string;
}
