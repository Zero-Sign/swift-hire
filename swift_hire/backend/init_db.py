#!/usr/bin/env python3
"""
Database initialization script for Swift Hire
This script creates all database tables on the production database
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from models import Base

def init_database():
    """Initialize the database with all required tables"""
    try:
        # Load environment variables
        load_dotenv()

        # Get database URL - prioritize Railway production URL
        DATABASE_URL = os.getenv('DATABASE_URL')

        # If we're using SQLite (local), switch to Railway production
        if not DATABASE_URL or 'sqlite' in DATABASE_URL:
            # Use Railway production database URL directly
            DATABASE_URL = "postgresql://postgres:bDCgCdBGgfEGEGCGdGGGGGGGGGGGGGGG@junction.proxy.rlwy.net:47470/railway"
            print("🔄 Using Railway production database")

        if not DATABASE_URL:
            print("❌ DATABASE_URL not found in environment variables")
            return False
            
        print(f"🔗 Connecting to database...")
        
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
        
        # Create all tables
        print("📋 Creating database tables...")
        Base.metadata.create_all(bind=engine)
        
        # Verify tables were created
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = [row[0] for row in result]
            
        print(f"✅ Successfully created {len(tables)} tables:")
        for table in tables:
            print(f"   - {table}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Swift Hire Database Initialization")
    print("=" * 40)
    
    success = init_database()
    
    if success:
        print("\n🎉 Database initialization completed successfully!")
        sys.exit(0)
    else:
        print("\n💥 Database initialization failed!")
        sys.exit(1)
