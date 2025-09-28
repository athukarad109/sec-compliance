#!/usr/bin/env python3
"""
Check database status and requirements
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def check_database_status():
    """Check if database has any data."""
    try:
        from app.database import db
        import asyncio
        
        async def check_data():
            try:
                await db.connect()
                prisma = db.get_client()
                
                # Check documents
                doc_count = await prisma.document.count()
                print(f"📄 Documents in database: {doc_count}")
                
                # Check requirements
                req_count = await prisma.compliancerequirement.count()
                print(f"📋 Compliance requirements in database: {req_count}")
                
                # Check users
                user_count = await prisma.user.count()
                print(f"👤 Users in database: {user_count}")
                
                if doc_count > 0:
                    print("\n📄 Sample documents:")
                    docs = await prisma.document.find_many(take=3)
                    for doc in docs:
                        print(f"   - {doc.filename} (ID: {doc.id})")
                
                if req_count > 0:
                    print("\n📋 Sample requirements:")
                    reqs = await prisma.compliancerequirement.find_many(take=3)
                    for req in reqs:
                        print(f"   - {req.title} (ID: {req.id})")
                
                await db.disconnect()
                return doc_count, req_count
                
            except Exception as e:
                print(f"❌ Database error: {e}")
                return 0, 0
        
        return asyncio.run(check_data())
        
    except Exception as e:
        print(f"❌ Import error: {e}")
        return 0, 0

def check_environment():
    """Check environment setup."""
    print("🔍 Checking environment...")
    
    # Check .env file
    if os.path.exists(".env"):
        print("✅ .env file exists")
        with open(".env", "r") as f:
            content = f.read()
            if "DATABASE_URL" in content:
                print("✅ DATABASE_URL found")
            else:
                print("❌ DATABASE_URL missing")
    else:
        print("❌ .env file missing")

def main():
    """Check database status."""
    print("🧪 Database Status Check")
    print("=" * 40)
    
    check_environment()
    
    print("\n🔍 Checking database data...")
    doc_count, req_count = check_database_status()
    
    if doc_count == 0:
        print("\n❌ No documents found in database!")
        print("   Solution: Upload a document first")
    elif req_count == 0:
        print("\n❌ No requirements found in database!")
        print("   Solution: Extract requirements from uploaded document")
    else:
        print(f"\n✅ Database has {doc_count} documents and {req_count} requirements")

if __name__ == "__main__":
    main()
