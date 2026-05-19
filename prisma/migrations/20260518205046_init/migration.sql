-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "qr_hunt_step" INTEGER NOT NULL DEFAULT 1,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "last_activity" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "image_path" TEXT NOT NULL,
    "overall_score" INTEGER,
    "ai_comment" TEXT,
    "categories_json" TEXT,
    "ai_type" TEXT NOT NULL DEFAULT 'desk',
    "submission_mode" TEXT NOT NULL DEFAULT 'final',
    "processing_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "future_qr_scans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "qr_id" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "prize_claimed" TEXT,
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "future_qr_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_definitions" (
    "qr_id" TEXT NOT NULL,
    "riddle" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "next_clue" TEXT NOT NULL,
    "guaranteed_prize_id" TEXT,

    CONSTRAINT "qr_definitions_pkey" PRIMARY KEY ("qr_id")
);

-- CreateTable
CREATE TABLE "qr_riddle_attempts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "qr_id" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "is_solved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "qr_riddle_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_configs" (
    "game_id" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "game_configs_pkey" PRIMARY KEY ("game_id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "digital_fallback_points" INTEGER NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mystery_nodes" (
    "id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reward_text" TEXT NOT NULL,

    CONSTRAINT "mystery_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_mystery_claims" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,

    CONSTRAINT "user_mystery_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tick_boom_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_played" TIMESTAMP(3),

    CONSTRAINT "tick_boom_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "tick_boom_sessions_user_id_key" ON "tick_boom_sessions"("user_id");

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "future_qr_scans" ADD CONSTRAINT "future_qr_scans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_riddle_attempts" ADD CONSTRAINT "qr_riddle_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
