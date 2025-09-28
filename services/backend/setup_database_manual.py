#!/usr/bin/env python3
"""
Manual database setup script to create tables without Prisma migrations.
This bypasses the shadow database requirement.
"""

import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def setup_database():
    """Set up database tables manually."""
    try:
        from app.database import db
        
        print("🔗 Connecting to database...")
        await db.connect()
        prisma = db.get_client()
        
        print("📋 Creating database tables...")
        
        # Create tables in the correct order (respecting foreign key constraints)
        tables_sql = [
            # Users table
            """
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                "fullName" VARCHAR(255),
                role VARCHAR(50) DEFAULT 'USER',
                "isActive" BOOLEAN DEFAULT TRUE,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            );
            """,
            
            # Documents table
            """
            CREATE TABLE IF NOT EXISTS documents (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "userId" UUID NOT NULL,
                filename VARCHAR(255) NOT NULL,
                "originalFilename" VARCHAR(255) NOT NULL,
                "filePath" VARCHAR(500),
                "fileSize" BIGINT,
                "documentType" VARCHAR(20),
                content TEXT,
                "uploadDate" TIMESTAMP DEFAULT NOW(),
                processed BOOLEAN DEFAULT FALSE,
                "processingStatus" VARCHAR(50) DEFAULT 'PENDING',
                "processingStartedAt" TIMESTAMP,
                "processingCompletedAt" TIMESTAMP,
                "errorMessage" TEXT,
                FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
            );
            """,
            
            # Compliance Requirements table
            """
            CREATE TABLE IF NOT EXISTS compliance_requirements (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "documentId" UUID NOT NULL,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                "requirementType" VARCHAR(50),
                "confidenceScore" DECIMAL(3,2),
                "bertConfidence" DECIMAL(3,2),
                "extractionMethod" VARCHAR(50) DEFAULT 'hybrid',
                "sourceText" TEXT,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                FOREIGN KEY ("documentId") REFERENCES documents(id) ON DELETE CASCADE
            );
            """,
            
            # Legal Entities table
            """
            CREATE TABLE IF NOT EXISTS legal_entities (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "requirementId" UUID NOT NULL,
                text VARCHAR(500) NOT NULL,
                label VARCHAR(50) NOT NULL,
                confidence DECIMAL(3,2),
                "startPos" INTEGER,
                "endPos" INTEGER,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                FOREIGN KEY ("requirementId") REFERENCES compliance_requirements(id) ON DELETE CASCADE
            );
            """,
            
            # Deadlines table
            """
            CREATE TABLE IF NOT EXISTS deadlines (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "requirementId" UUID NOT NULL,
                description TEXT,
                "dueDate" TIMESTAMP,
                frequency VARCHAR(50),
                "isRecurring" BOOLEAN DEFAULT FALSE,
                FOREIGN KEY ("requirementId") REFERENCES compliance_requirements(id) ON DELETE CASCADE
            );
            """,
            
            # Penalties table
            """
            CREATE TABLE IF NOT EXISTS penalties (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "requirementId" UUID NOT NULL,
                description TEXT,
                amount DECIMAL(15,2),
                currency VARCHAR(10),
                "penaltyType" VARCHAR(50),
                FOREIGN KEY ("requirementId") REFERENCES compliance_requirements(id) ON DELETE CASCADE
            );
            """,
            
            # Processing Jobs table
            """
            CREATE TABLE IF NOT EXISTS processing_jobs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "documentId" UUID NOT NULL,
                "jobType" VARCHAR(50),
                status VARCHAR(50) DEFAULT 'PENDING',
                "startedAt" TIMESTAMP,
                "completedAt" TIMESTAMP,
                "errorMessage" TEXT,
                "processingDevice" VARCHAR(20),
                "processingTimeSeconds" INTEGER,
                FOREIGN KEY ("documentId") REFERENCES documents(id) ON DELETE CASCADE
            );
            """,
            
            # Reports table
            """
            CREATE TABLE IF NOT EXISTS reports (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "userId" UUID NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT,
                "reportType" VARCHAR(50),
                "generatedAt" TIMESTAMP DEFAULT NOW(),
                FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
            );
            """
        ]
        
        # Execute each table creation
        for i, sql in enumerate(tables_sql, 1):
            print(f"   📋 Creating table {i}/{len(tables_sql)}...")
            await prisma.query_raw(sql)
        
        print("✅ All tables created successfully!")
        
        # Create indexes for better performance
        print("🔍 Creating indexes...")
        indexes_sql = [
            "CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(\"userId\");",
            "CREATE INDEX IF NOT EXISTS idx_compliance_requirements_document_id ON compliance_requirements(\"documentId\");",
            "CREATE INDEX IF NOT EXISTS idx_legal_entities_requirement_id ON legal_entities(\"requirementId\");",
            "CREATE INDEX IF NOT EXISTS idx_deadlines_requirement_id ON deadlines(\"requirementId\");",
            "CREATE INDEX IF NOT EXISTS idx_penalties_requirement_id ON penalties(\"requirementId\");",
            "CREATE INDEX IF NOT EXISTS idx_processing_jobs_document_id ON processing_jobs(\"documentId\");",
            "CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(\"userId\");"
        ]
        
        for sql in indexes_sql:
            await prisma.query_raw(sql)
        
        print("✅ All indexes created successfully!")
        
        # Test the setup
        print("🧪 Testing database setup...")
        result = await prisma.query_raw("SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';")
        print(f"✅ Database setup complete! Found {result[0]['table_count']} tables.")
        
        await db.disconnect()
        print("🎉 Database setup completed successfully!")
        
    except Exception as e:
        print(f"❌ Database setup failed: {str(e)}")
        print("\n🔧 Troubleshooting steps:")
        print("1. Check if PostgreSQL is running")
        print("2. Verify DATABASE_URL in .env file")
        print("3. Ensure database exists")
        print("4. Check user permissions")

if __name__ == "__main__":
    asyncio.run(setup_database())
