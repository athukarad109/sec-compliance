-- CreateTable
CREATE TABLE "public"."gap_analyses" (
    "id" TEXT NOT NULL,
    "companyData" JSONB NOT NULL,
    "requirementsData" JSONB NOT NULL,
    "analysisResults" JSONB NOT NULL,
    "findings" JSONB NOT NULL,
    "tasks" JSONB NOT NULL,
    "complianceScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gap_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."gap_findings" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirementId" TEXT,
    "currentState" JSONB NOT NULL,
    "expectedState" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "priority" INTEGER NOT NULL,
    "estimatedEffort" TEXT NOT NULL,
    "responsibleParty" TEXT NOT NULL,
    "deadline" TEXT,
    "businessImpact" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gap_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."gap_tasks" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "assignedTo" TEXT NOT NULL,
    "dueDate" TEXT,
    "dependencies" JSONB NOT NULL,
    "effortEstimate" TEXT NOT NULL,
    "businessValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gap_tasks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."gap_findings" ADD CONSTRAINT "gap_findings_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "public"."gap_analyses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gap_tasks" ADD CONSTRAINT "gap_tasks_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "public"."gap_analyses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
