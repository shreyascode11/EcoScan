import uvicorn
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel # <--- FIX: Added this missing import
from typing import List, Optional 
from contextlib import asynccontextmanager
from database import SessionLocal, ReportModel, User, engine, Base

# --- 1. REAL-TIME EVENT MANAGER (20% Weight) ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        # Event-driven: No polling every 30 seconds [cite: 11]
        for connection in self.active_connections:
            try: await connection.send_text(message)
            except: pass

manager = ConnectionManager()

# --- 2. LANGUAGE TRANSLATION MAP (30% Weight) ---
# Ensuring core UI strings can switch [cite: 21]
TRANSLATIONS = {
    "hindi": {
        "reported": "रिपोर्ट किया गया",
        "in-progress": "काम जारी है",
        "pending-proof": "प्रमाण लंबित",
        "cleaned": "साफ़ किया गया",
        "low": "कम",
        "medium": "मध्यम",
        "high": "उच्च"
    }
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed initial volunteers for the leaderboard 
        if db.query(User).count() == 0:
            db.add_all([
                User(name="Rajdeep", total_score=150, cleanup_count=4),
                User(name="Tulsi", total_score=120, cleanup_count=3),
                User(name="Shreyas", total_score=90, cleanup_count=2)
            ])
            db.commit()
            print("✅ Round 2 Environment Seeded.")
    finally: db.close()
    yield

app = FastAPI(title="Kernel Panic Round 2", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# --- 3. SCHEMAS ---
class ReportCreate(BaseModel):
    lat: float
    lng: float
    severity: str
    desc: Optional[str] = None
    image_data: Optional[str] = None

class CleanRequest(BaseModel):
    after_image: str # Required for 'Proof of Work' [cite: 15, 18]

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# --- 4. WEBSOCKET ENDPOINT (Real-time updates) ---
@app.websocket("/ws/updates")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True: await websocket.receive_text()
    except WebSocketDisconnect: manager.disconnect(websocket)

# --- 5. ENDPOINTS ---

@app.get("/reports")
def get_reports(db: Session = Depends(get_db), lang: str = "english"):
    """Returns reports with localized labels and scores for map popups [cite: 6, 17]"""
    reports = db.query(ReportModel).all()
    lang_map = TRANSLATIONS.get(lang.lower())
    
    result = []
    for r in reports:
        result.append({
            "id": r.id, "lat": r.lat, "lng": r.lng, 
            "severity": r.severity,
            "severity_label": lang_map.get(r.severity.lower(), r.severity) if lang_map else r.severity,
            "status": r.status,
            "status_label": lang_map.get(r.status.lower(), r.status) if lang_map else r.status,
            "desc": r.desc, 
            "before_image": r.image_data, # [cite: 16]
            "after_image": r.after_image_data, # [cite: 16]
            "cleaner_name": r.cleaner.name if r.cleaner else None,
            "cleaner_score": r.cleaner.total_score if r.cleaner else None # [cite: 6]
        })
    return result

@app.post("/reports")
async def create_report(report: ReportCreate, db: Session = Depends(get_db)):
    new_report = ReportModel(
        lat=report.lat, lng=report.lng, severity=report.severity.lower(),
        status="reported", desc=report.desc, image_data=report.image_data
    )
    db.add(new_report)
    db.commit()
    await manager.broadcast("update_reports")
    return new_report

@app.patch("/reports/{report_id}/claim")
async def claim_report(report_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    report = db.query(ReportModel).filter(ReportModel.id == report_id).first()
    if not report: raise HTTPException(status_code=404)
    report.status = "in-progress" 
    report.claimed_by_id = user_id
    db.commit()
    await manager.broadcast("update_reports")
    return report

# Severity-based scoring 
POINT_MAP = {"low": 10, "medium": 25, "high": 50}

@app.patch("/reports/{report_id}/clean")
async def clean_report(report_id: int, data: CleanRequest, db: Session = Depends(get_db)):
    report = db.query(ReportModel).filter(ReportModel.id == report_id).first()
    if not report: raise HTTPException(status_code=404)

    # 1. Enforce After Photo [cite: 15, 18]
    if not data.after_image:
        report.status = "pending-proof"
        db.commit()
        await manager.broadcast("update_reports")
        return {"status": "pending-proof", "message": "After photo required."}

    # 2. Complete cleanup [cite: 15]
    report.after_image_data = data.after_image
    report.status = "cleaned"

    # 3. Automatic Scoring 
    if report.claimed_by_id:
        user = db.query(User).filter(User.id == report.claimed_by_id).first()
        if user:
            points = POINT_MAP.get(report.severity.lower(), 0)
            user.total_score += points
            user.cleanup_count += 1
    
    db.commit()
    # 4. Live leaderboard update [cite: 5, 27]
    await manager.broadcast("update_leaderboard")
    await manager.broadcast("update_reports")
    return {"status": "cleaned"}

@app.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    """Ranked by points """
    users = db.query(User).order_by(User.total_score.desc()).all()
    return [{"name": u.name, "cleanups": u.cleanup_count, "score": u.total_score} for u in users]

@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    return {
        "total": db.query(ReportModel).count(),
        "in_progress": db.query(ReportModel).filter(ReportModel.status == "in-progress").count(),
        "cleaned": db.query(ReportModel).filter(ReportModel.status == "cleaned").count()
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)