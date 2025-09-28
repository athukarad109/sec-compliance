#!/usr/bin/env python3
"""
Check if organization tables exist
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def check_tables():
    """Check if organization tables exist."""
    try:
        from app.database import db
        
        print("Checking organization tables...")
        
        await db.connect()
        prisma = db.get_client()
        
        # Check each table
        tables = [
            ("RequirementCluster", "requirementcluster"),
            ("LLMOrganizedRequirement", "llmorganizedrequirement"),
            ("HarmonizedRequirement", "harmonizedrequirement"),
            ("FinalComplianceRequirement", "finalcompliancerequirement")
        ]
        
        for table_name, prisma_name in tables:
            try:
                await getattr(prisma, prisma_name).find_many(take=1)
                print(f"OK: {table_name} table exists")
            except Exception as e:
                print(f"ERROR: {table_name} table missing - {e}")
        
        await db.disconnect()
        
    except Exception as e:
        print(f"Database error: {e}")

def main():
    """Run table check."""
    import asyncio
    asyncio.run(check_tables())

if __name__ == "__main__":
    main()


