#!/usr/bin/env python3
"""
Simple database connection test
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_db_connection():
    """Test database connection."""
    try:
        from app.database import db
        
        print("Testing database connection...")
        
        await db.connect()
        prisma = db.get_client()
        
        # Test simple query
        user_count = await prisma.user.count()
        print(f"Database connected - Users: {user_count}")
        
        # Test LLM table
        llm_count = await prisma.llmorganizedrequirement.count()
        print(f"LLM organized requirements: {llm_count}")
        
        await db.disconnect()
        print("Database connection successful")
        return True
        
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False

def main():
    """Run database test."""
    import asyncio
    asyncio.run(test_db_connection())

if __name__ == "__main__":
    main()


