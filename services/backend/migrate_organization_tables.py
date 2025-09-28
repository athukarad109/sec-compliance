#!/usr/bin/env python3
"""
Migration script to add organization tables to existing database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def migrate_organization_tables():
    """Add organization tables to the database."""
    try:
        from app.database import db
        
        print("🔄 Starting migration for organization tables...")
        
        await db.connect()
        prisma = db.get_client()
        
        # Test if tables exist by trying to query them
        try:
            # Test RequirementCluster table
            await prisma.requirementcluster.find_many(take=1)
            print("✅ RequirementCluster table exists")
        except Exception:
            print("❌ RequirementCluster table missing - run: prisma migrate dev")
        
        try:
            # Test LLMOrganizedRequirement table
            await prisma.llmorganizedrequirement.find_many(take=1)
            print("✅ LLMOrganizedRequirement table exists")
        except Exception:
            print("❌ LLMOrganizedRequirement table missing - run: prisma migrate dev")
        
        try:
            # Test HarmonizedRequirement table
            await prisma.harmonizedrequirement.find_many(take=1)
            print("✅ HarmonizedRequirement table exists")
        except Exception:
            print("❌ HarmonizedRequirement table missing - run: prisma migrate dev")
        
        try:
            # Test FinalComplianceRequirement table
            await prisma.finalcompliancerequirement.find_many(take=1)
            print("✅ FinalComplianceRequirement table exists")
        except Exception:
            print("❌ FinalComplianceRequirement table missing - run: prisma migrate dev")
        
        await db.disconnect()
        print("✅ Migration check completed")
        
    except Exception as e:
        print(f"❌ Migration error: {e}")

def main():
    """Run migration check."""
    import asyncio
    asyncio.run(migrate_organization_tables())

if __name__ == "__main__":
    main()
