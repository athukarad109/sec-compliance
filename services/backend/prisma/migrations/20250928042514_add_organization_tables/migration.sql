-- CreateTable
CREATE TABLE "requirement_clusters" (
    "id" TEXT NOT NULL,
    "clusterId" TEXT NOT NULL,
    "policy" TEXT NOT NULL,
    "requirements" JSONB NOT NULL,
    "count" INTEGER NOT NULL,
    "averageConfidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requirement_clusters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harmonized_requirements" (
    "id" TEXT NOT NULL,
    "policy" TEXT NOT NULL,
    "harmonizedDescription" TEXT NOT NULL,
    "requirementCount" INTEGER NOT NULL,
    "averageConfidence" DOUBLE PRECISION NOT NULL,
    "sourceRequirements" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "harmonized_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llm_organized_requirements" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "groupDescription" TEXT NOT NULL,
    "requirements" JSONB NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_organized_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "final_compliance_requirements" (
    "id" TEXT NOT NULL,
    "policy" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "requirement" TEXT NOT NULL,
    "triggerCondition" TEXT NOT NULL,
    "deadline" TEXT,
    "penalty" TEXT,
    "mappedControls" JSONB NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "sourceRequirementIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "final_compliance_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "requirement_clusters_clusterId_key" ON "requirement_clusters"("clusterId");

-- CreateIndex
CREATE UNIQUE INDEX "llm_organized_requirements_groupId_key" ON "llm_organized_requirements"("groupId");
