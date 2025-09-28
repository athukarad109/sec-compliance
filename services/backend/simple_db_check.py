#!/usr/bin/env python3
"""
Simple database check without Unicode
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def main():
    """Check database status."""
    print("Database Status Check")
    print("=" * 40)
    
    try:
        from app.database import db
        import asyncio
        
        async def check_data():
            try:
                await db.connect()
                prisma = db.get_client()
                
                # Check documents
                doc_count = await prisma.document.count()
                print(f"Documents in database: {doc_count}")
                
                # Check requirements
                req_count = await prisma.compliancerequirement.count()
                print(f"Compliance requirements in database: {req_count}")
                
                # Check users
                user_count = await prisma.user.count()
                print(f"Users in database: {user_count}")
                
                if doc_count > 0:
                    print("\nSample documents:")
                    docs = await prisma.document.find_many(take=3)
                    for doc in docs:
                        print(f"   - {doc.filename} (ID: {doc.id})")
                
                if req_count > 0:
                    print("\nSample requirements:")
                    reqs = await prisma.compliancerequirement.find_many(take=3)
                    for req in reqs:
                        print(f"   - {req.title} (ID: {req.id})")
                
                await db.disconnect()
                return doc_count, req_count
                
            except Exception as e:
                print(f"Database error: {e}")
                return 0, 0
        
        doc_count, req_count = asyncio.run(check_data())
        
        if doc_count == 0:
            print("\nNo documents found in database!")
            print("Solution: Upload a document first")
        elif req_count == 0:
            print("\nNo requirements found in database!")
            print("Solution: Extract requirements from uploaded document")
        else:
            print(f"\nDatabase has {doc_count} documents and {req_count} requirements")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
