import uvicorn
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from contextlib import asynccontextmanager
from database import SessionLocal, ReportModel, engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize app and create tables
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(lifespan=lifespan)

# CRITICAL: CORS setup for Rajdeep's frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Data Models
class ReportCreate(BaseModel):
    lat: float
    lng: float
    severity: str
    desc: Optional[str] = None
    image_data: Optional[str] = None

# 5. Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 6. Endpoints

@app.get("/reports")
def get_reports(db: Session = Depends(get_db)):
    """Returns all spots for the Map View"""
    return db.query(ReportModel).all()

@app.post("/reports")
def create_report(report: ReportCreate, db: Session = Depends(get_db)):
    """Handles 'Report a Spot' flow"""
    new_report = ReportModel(
        lat=report.lat, 
        lng=report.lng, 
        severity=report.severity.lower(),
        status="reported",
        desc=report.desc,
        image_data=report.image_data
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

@app.patch("/reports/{report_id}/claim")
def claim_report(report_id: int, db: Session = Depends(get_db)):
    """Changes status to 'in-progress'"""
    report = db.query(ReportModel).filter(ReportModel.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Spot not found")
    report.status = "in-progress" 
    db.commit()
    db.refresh(report)
    return report

@app.patch("/reports/{report_id}/clean")
def clean_report(report_id: int, db: Session = Depends(get_db)):
    """Marks a spot as fully 'cleaned'"""
    report = db.query(ReportModel).filter(ReportModel.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404)
    report.status = "cleaned"
    db.commit()
    db.refresh(report)
    return report

@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Dashboard counts for authorities"""
    return {
        "total": db.query(ReportModel).count(),
        "in_progress": db.query(ReportModel).filter(ReportModel.status == "in-progress").count(),
        "cleaned": db.query(ReportModel).filter(ReportModel.status == "cleaned").count()
    }

@app.get("/leaderboard")
def get_leaderboard():
    """Gamification for volunteer engagement"""
    return [
        {"name": "Rajdeep", "points": 150},
        {"name": "Tulsi", "points": 120},
        {"name": "Shreyas", "points": 90}
    ]

# 7. RUNNER: This is what keeps the server alive!
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)