#!/usr/bin/env python3
"""
Migration script to transition from in-memory storage to PostgreSQL database.
This script will help migrate existing data and update the API endpoints.
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, List
from app.database import db
from app.api.parser.models_v2 import (
    DocumentCreate, ComplianceRequirementCreate, 
    LegalEntityCreate, DeadlineCreate, PenaltyCreate
)

class DatabaseMigrator:
    def __init__(self):
        self.migrated_documents = 0
        self.migrated_requirements = 0
        self.migrated_entities = 0
        self.migrated_deadlines = 0
        self.migrated_penalties = 0
    
    async def migrate_from_memory(self, documents_storage: Dict, rules_storage: Dict):
        """Migrate data from in-memory storage to database."""
        print("🚀 Starting migration from in-memory storage to database...")
        
        # Connect to database
        await db.connect()
        prisma = db.get_client()
        
        try:
            # Create a default user for migration
            default_user = await prisma.user.create({
                "email": "migration@sec-compliance.com",
                "password": "migrated_user_password",
                "fullName": "Migration User",
                "role": "ADMIN"
            })
            print(f"✅ Created default user: {default_user.id}")
            
            # Migrate documents
            await self._migrate_documents(prisma, documents_storage, default_user.id)
            
            # Migrate compliance requirements
            await self._migrate_requirements(prisma, rules_storage)
            
            print(f"\n🎉 Migration completed successfully!")
            print(f"   📄 Documents migrated: {self.migrated_documents}")
            print(f"   📋 Requirements migrated: {self.migrated_requirements}")
            print(f"   🏷️  Entities migrated: {self.migrated_entities}")
            print(f"   ⏰ Deadlines migrated: {self.migrated_deadlines}")
            print(f"   💰 Penalties migrated: {self.migrated_penalties}")
            
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            raise
        finally:
            await db.disconnect()
    
    async def _migrate_documents(self, prisma, documents_storage: Dict, user_id: str):
        """Migrate documents from in-memory storage."""
        print("📄 Migrating documents...")
        
        for doc_id, document in documents_storage.items():
            try:
                # Create document in database
                db_document = await prisma.document.create({
                    "id": document.id,
                    "userId": user_id,
                    "filename": document.filename,
                    "originalFilename": document.filename,
                    "fileSize": document.file_size,
                    "documentType": document.document_type.value,
                    "content": document.content,
                    "uploadDate": document.upload_date,
                    "processed": document.processed,
                    "processingStatus": "COMPLETED" if document.processed else "PENDING"
                })
                
                self.migrated_documents += 1
                print(f"   ✅ Migrated document: {document.filename}")
                
            except Exception as e:
                print(f"   ❌ Failed to migrate document {document.filename}: {str(e)}")
    
    async def _migrate_requirements(self, prisma, rules_storage: Dict):
        """Migrate compliance requirements from in-memory storage."""
        print("📋 Migrating compliance requirements...")
        
        for rule_id, rule in rules_storage.items():
            try:
                # Find the document for this rule
                document = await prisma.document.find_first(
                    where={"filename": rule.source_document}
                )
                
                if not document:
                    print(f"   ⚠️  Document not found for rule: {rule.title}")
                    continue
                
                # Create compliance requirement
                db_requirement = await prisma.compliancerequirement.create({
                    "id": rule.rule_id,
                    "documentId": document.id,
                    "title": rule.title,
                    "description": rule.description,
                    "requirementType": rule.rule_type.value,
                    "confidenceScore": rule.confidence_score,
                    "bertConfidence": getattr(rule, 'bert_confidence', None),
                    "extractionMethod": getattr(rule, 'extraction_method', 'hybrid'),
                    "sourceText": rule.source_text
                })
                
                self.migrated_requirements += 1
                print(f"   ✅ Migrated requirement: {rule.title[:50]}...")
                
                # Migrate legal entities if they exist
                if hasattr(rule, 'legal_entities') and rule.legal_entities:
                    await self._migrate_entities(prisma, rule.legal_entities, rule.rule_id)
                
                # Migrate deadlines if they exist
                if hasattr(rule, 'deadlines') and rule.deadlines:
                    await self._migrate_deadlines(prisma, rule.deadlines, rule.rule_id)
                
                # Migrate penalties if they exist
                if hasattr(rule, 'penalties') and rule.penalties:
                    await self._migrate_penalties(prisma, rule.penalties, rule.rule_id)
                
            except Exception as e:
                print(f"   ❌ Failed to migrate requirement {rule.title}: {str(e)}")
    
    async def _migrate_entities(self, prisma, entities: List, requirement_id: str):
        """Migrate legal entities."""
        for entity in entities:
            try:
                await prisma.legalentity.create({
                    "requirementId": requirement_id,
                    "text": entity.text,
                    "label": entity.label.value,
                    "confidence": entity.confidence,
                    "startPos": entity.start_pos,
                    "endPos": entity.end_pos
                })
                self.migrated_entities += 1
            except Exception as e:
                print(f"   ❌ Failed to migrate entity: {str(e)}")
    
    async def _migrate_deadlines(self, prisma, deadlines: List, requirement_id: str):
        """Migrate deadlines."""
        for deadline in deadlines:
            try:
                await prisma.deadline.create({
                    "requirementId": requirement_id,
                    "description": deadline.description,
                    "dueDate": deadline.due_date,
                    "frequency": deadline.frequency,
                    "isRecurring": deadline.is_recurring
                })
                self.migrated_deadlines += 1
            except Exception as e:
                print(f"   ❌ Failed to migrate deadline: {str(e)}")
    
    async def _migrate_penalties(self, prisma, penalties: List, requirement_id: str):
        """Migrate penalties."""
        for penalty in penalties:
            try:
                await prisma.penalty.create({
                    "requirementId": requirement_id,
                    "description": penalty.description,
                    "amount": penalty.amount,
                    "currency": penalty.currency,
                    "penaltyType": penalty.penalty_type.value
                })
                self.migrated_penalties += 1
            except Exception as e:
                print(f"   ❌ Failed to migrate penalty: {str(e)}")

async def main():
    """Main migration function."""
    print("🔄 SEC Compliance Database Migration")
    print("=" * 50)
    
    # Import current in-memory storage
    try:
        from app.api.parser.routes import documents_storage, rules_storage
        print(f"📊 Found {len(documents_storage)} documents and {len(rules_storage)} rules in memory")
    except ImportError:
        print("❌ Could not import in-memory storage. Make sure the server is not running.")
        return
    
    # Run migration
    migrator = DatabaseMigrator()
    await migrator.migrate_from_memory(documents_storage, rules_storage)
    
    print("\n🎯 Next steps:")
    print("1. Update API endpoints to use database")
    print("2. Test all functionality")
    print("3. Remove in-memory storage code")
    print("4. Deploy to production")

if __name__ == "__main__":
    asyncio.run(main())
