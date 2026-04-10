import os
from dotenv import load_dotenv
from sqlalchemy import Column, Integer, Float, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load variables from the .env file
load_dotenv()

# Fetch the URL from the environment
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("CRITICAL: DATABASE_URL not found in .env file. Check your /backend/.env")

# Initialize the engine and session
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ReportModel(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    
    # Coordinates for Leaflet Map
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    
    # Metadata for filtering and priority
    severity = Column(String, nullable=False) # low, medium, high
    status = Column(String, default="reported") # reported, in-progress, cleaned
    desc = Column(String, nullable=True) 
    image_data = Column(String, nullable=True) # Base64 string for photo requirement

# Ensure tables are created
Base.metadata.create_all(bind=engine)