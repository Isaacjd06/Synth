-- CreateTable
CREATE TABLE "CoreFramework" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "content" JSONB NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceRef" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.9,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoreFramework_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoreFramework_slug_key" ON "CoreFramework"("slug");
