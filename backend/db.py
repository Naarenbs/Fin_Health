import os

# If you prefer to hard-code the DB URL, set `DATABASE_URL_CONST` below (leave empty to use env var)
DATABASE_URL_CONST = "postgresql://neondb_owner:npg_m1E8SvzBFVNj@ep-aged-heart-ai0tq3qh-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = DATABASE_URL_CONST or os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("Missing DATABASE_URL. Set DATABASE_URL in `backend/db.py` or as an environment variable.")

engine = create_engine(DATABASE_URL, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    file_count = Column(Integer)
    revenue = Column(Float)
    expenses = Column(Float)
    net_profit = Column(Float)
    margin = Column(Float)
    health_status = Column(String(50))
    ai_analysis = Column(Text)

# Create tables
Base.metadata.create_all(bind=engine)
