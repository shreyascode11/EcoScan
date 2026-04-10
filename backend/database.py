import os
from dotenv import load_dotenv
from sqlalchemy import Column, Integer, Float, String, ForeignKey, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

load_dotenv()

# Database Setup
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ecoscan.db")
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    total_score = Column(Integer, default=0) # [cite: 4]
    cleanup_count = Column(Integer, default=0) # [cite: 4]
    reports = relationship("ReportModel", back_populates="cleaner")

class ReportModel(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    severity = Column(String, nullable=False) 
    status = Column(String, default="reported") # reported, in-progress, pending-proof, cleaned 
    desc = Column(String, nullable=True) 
    
    # Before/After Evidence [cite: 16]
    image_data = Column(String, nullable=True) # BEFORE Photo
    after_image_data = Column(String, nullable=True) # AFTER Photo [cite: 15]
    
    # Volunteer Linking 
    claimed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    cleaner = relationship("User", back_populates="reports")

Base.metadata.create_all(bind=engine)