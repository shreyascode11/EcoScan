import uvicorn
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from contextlib import asynccontextmanager

# Local imports
from database import SessionLocal, ReportModel

# 1. Modern Lifespan Handler for Startup/Shutdown tasks
@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        # MVE Requirement: Seed 5 reports if database is empty
        if db.query(ReportModel).count() == 0:
            dummy_spots = [
                ReportModel(lat=12.8231, lng=80.0442, severity="high", status="reported", desc="Large pile near Main Gate"),
                ReportModel(lat=12.8250, lng=80.0410, severity="medium", status="in-progress", desc="Littering on sidewalk"),
                ReportModel(lat=12.8210, lng=80.0450, severity="low", status="reported", desc="Small plastic waste"),
                ReportModel(lat=12.8265, lng=80.0435, severity="high", status="reported", desc="Industrial dumping"),
                ReportModel(lat=12.8242, lng=80.0461, severity="medium", status="cleaned", desc="Overflowing dumpster"),
            ]
            db.add_all(dummy_spots)
            db.commit()
            print("✅ Database Seeded successfully with 5 reports.")
    finally:
        db.close()
    yield
    print("🛑 Shutting down Kernel Panic API...")

app = FastAPI(title="Kernel Panic API", lifespan=lifespan)

# 2. CORS Setup (Crucial for Rajdeep's Frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Data Schemas
class ReportCreate(BaseModel):
    lat: float
    lng: float
    severity: str
    desc: Optional[str] = None
    image_data: Optional[str] = None

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 4. Endpoints

@app.get("/reports")
def get_reports(db: Session = Depends(get_db)):
    return db.query(ReportModel).all()

@app.post("/reports")
def create_report(report: ReportCreate, db: Session = Depends(get_db)):
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
    report = db.query(ReportModel).filter(ReportModel.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Spot not found")
    report.status = "in-progress" 
    db.commit()
    db.refresh(report)
    return report

@app.patch("/reports/{report_id}/clean")
def clean_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(ReportModel).filter(ReportModel.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404)
    report.status = "cleaned"
    db.commit()
    db.refresh(report)
    return report

@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    return {
        "total": db.query(ReportModel).count(),
        "in_progress": db.query(ReportModel).filter(ReportModel.status == "in-progress").count(),
        "cleaned": db.query(ReportModel).filter(ReportModel.status == "cleaned").count()
    }

@app.get("/leaderboard")
def get_leaderboard():
    return [
        {"name": "Rajdeep", "points": 150},
        {"name": "Tulsi", "points": 120},
        {"name": "Shreyas", "points": 90}
    ]

if __name__ == "__main__":
    print("🚀 Kernel Panic API is starting...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)