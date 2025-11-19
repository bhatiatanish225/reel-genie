#!/usr/bin/env python3
"""
Initialize database with sample data
"""
from app.db.base import SessionLocal, engine, Base
from app.models import User, Reel
from app.core.security import get_password_hash
import sys

def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if user exists
        existing_user = db.query(User).filter(User.email == "demo@example.com").first()
        if existing_user:
            print("Demo user already exists")
            return
        
        # Create demo user
        print("Creating demo user...")
        user = User(
            username="demo",
            email="demo@example.com",
            password_hash=get_password_hash("demo123"),
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        print(f"✓ Demo user created: demo@example.com / demo123")
        print(f"  User ID: {user.id}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()
    
    print("\n✓ Database initialized successfully!")

if __name__ == "__main__":
    init_db()
