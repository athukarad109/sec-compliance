#!/usr/bin/env python3
"""
Test database connection to diagnose Prisma issues
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_database_connection():
    """Test database connection."""
    try:
        from app.database import db
        print("✅ Database module imported successfully")
        
        # Test Prisma client
        import asyncio
        async def test_connection():
            try:
                await db.connect()
                print("✅ Database connection successful")
                
                # Test a simple query
                prisma = db.get_client()
                user_count = await prisma.user.count()
                print(f"✅ Database query successful - Users: {user_count}")
                
                await db.disconnect()
                print("✅ Database disconnection successful")
                return True
            except Exception as e:
                print(f"❌ Database connection failed: {e}")
                return False
        
        # Run the async test
        result = asyncio.run(test_connection())
        return result
        
    except Exception as e:
        print(f"❌ Database import failed: {e}")
        return False

def check_environment():
    """Check environment variables."""
    print("\n🔍 Checking environment variables...")
    
    # Check if .env file exists
    env_file = ".env"
    if os.path.exists(env_file):
        print(f"✅ .env file found: {env_file}")
        
        # Read .env file
        with open(env_file, 'r') as f:
            content = f.read()
            if 'DATABASE_URL' in content:
                print("✅ DATABASE_URL found in .env")
            else:
                print("❌ DATABASE_URL not found in .env")
                
            if 'OPENAI_API_KEY' in content:
                print("✅ OPENAI_API_KEY found in .env")
            else:
                print("❌ OPENAI_API_KEY not found in .env")
    else:
        print(f"❌ .env file not found: {env_file}")
        print("   Create .env file with:")
        print("   DATABASE_URL=postgresql://user:password@localhost:5432/compliance_db")
        print("   OPENAI_API_KEY=your_openai_api_key_here")

def main():
    """Run database connection test."""
    print("🧪 Database Connection Test")
    print("=" * 40)
    
    # Check environment
    check_environment()
    
    # Test database connection
    print("\n🔍 Testing database connection...")
    success = test_database_connection()
    
    if success:
        print("\n✅ Database connection is working!")
    else:
        print("\n❌ Database connection failed!")
        print("\n🔧 Troubleshooting steps:")
        print("1. Check if PostgreSQL is running")
        print("2. Verify DATABASE_URL in .env file")
        print("3. Check if database exists")
        print("4. Verify user permissions")

if __name__ == "__main__":
    main()