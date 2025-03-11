from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timedelta

app = FastAPI(title="Golf Score Tracker API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ScoreCard model
class Hole(BaseModel):
    number: int
    par: int
    score: int

class ScoreCard(BaseModel):
    id: str
    date_played: str
    course_name: str
    holes: List[Hole]
    notes: Optional[str] = None
    weather: Optional[str] = None

# ScoreCard creation model (without ID, as it will be generated)
class ScoreCardCreate(BaseModel):
    date_played: str
    course_name: str
    holes: List[Hole]
    notes: Optional[str] = None
    weather: Optional[str] = None

# ScoreCard update model
class ScoreCardUpdate(BaseModel):
    date_played: Optional[str] = None
    course_name: Optional[str] = None
    holes: Optional[List[Hole]] = None
    notes: Optional[str] = None
    weather: Optional[str] = None

# In-memory database (a simple list as specified in the requirements)
scorecards_db = []

# CRUD operations
@app.post("/scorecards/", response_model=ScoreCard)
async def create_scorecard(scorecard: ScoreCardCreate):
    scorecard_id = str(uuid.uuid4())  # Generate a unique ID
    new_scorecard = ScoreCard(id=scorecard_id, **scorecard.dict())
    scorecards_db.append(new_scorecard)
    return new_scorecard

@app.get("/scorecards/", response_model=List[ScoreCard])
async def read_scorecards():
    return scorecards_db

@app.get("/scorecards/{scorecard_id}", response_model=ScoreCard)
async def read_scorecard(scorecard_id: str):
    for scorecard in scorecards_db:
        if scorecard.id == scorecard_id:
            return scorecard
    raise HTTPException(status_code=404, detail="Scorecard not found")

@app.put("/scorecards/{scorecard_id}", response_model=ScoreCard)
async def update_scorecard(scorecard_id: str, scorecard_update: ScoreCardUpdate):
    for i, scorecard in enumerate(scorecards_db):
        if scorecard.id == scorecard_id:
            # Update the scorecard with new values
            update_data = scorecard_update.dict(exclude_unset=True)
            updated_scorecard = scorecard.dict()
            
            # Special handling for holes list to ensure we properly update
            if 'holes' in update_data:
                updated_scorecard['holes'] = update_data.pop('holes')
            
            updated_scorecard.update(update_data)
            scorecards_db[i] = ScoreCard(**updated_scorecard)
            return scorecards_db[i]
    raise HTTPException(status_code=404, detail="Scorecard not found")

@app.delete("/scorecards/{scorecard_id}")
async def delete_scorecard(scorecard_id: str):
    for i, scorecard in enumerate(scorecards_db):
        if scorecard.id == scorecard_id:
            scorecards_db.pop(i)
            return {"message": "Scorecard deleted successfully"}
    raise HTTPException(status_code=404, detail="Scorecard not found")

# Get scorecard statistics
@app.get("/scorecards/stats")
async def get_scorecard_stats():
    if not scorecards_db:
        return {
            "total_rounds": 0,
            "avg_score": 0,
            "best_round": None,
            "courses_played": []
        }
        
    total_rounds = len(scorecards_db)
    
    # Calculate average score relative to par
    total_relative_to_par = 0
    for scorecard in scorecards_db:
        total_par = sum(hole.par for hole in scorecard.holes)
        total_score = sum(hole.score for hole in scorecard.holes)
        total_relative_to_par += (total_score - total_par)
    
    avg_relative_to_par = total_relative_to_par / total_rounds if total_rounds > 0 else 0
    
    # Find best round (lowest score relative to par)
    best_round = None
    best_relative_to_par = float('inf')
    
    for scorecard in scorecards_db:
        total_par = sum(hole.par for hole in scorecard.holes)
        total_score = sum(hole.score for hole in scorecard.holes)
        relative_to_par = total_score - total_par
        
        if relative_to_par < best_relative_to_par:
            best_relative_to_par = relative_to_par
            best_round = {
                "date": scorecard.date_played,
                "course": scorecard.course_name,
                "score": total_score,
                "par": total_par,
                "relative_to_par": relative_to_par
            }
    
    # Count rounds per course
    courses_played = {}
    for scorecard in scorecards_db:
        if scorecard.course_name in courses_played:
            courses_played[scorecard.course_name] += 1
        else:
            courses_played[scorecard.course_name] = 1
    
    return {
        "total_rounds": total_rounds,
        "avg_relative_to_par": avg_relative_to_par,
        "best_round": best_round,
        "courses_played": courses_played
    }

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to the Golf Score Tracker API"}

# Add some sample scorecards if running in development
@app.on_event("startup")
async def startup_event():
    if not scorecards_db:
        # Sample data for Augusta National Golf Club
        augusta_holes = [
            Hole(number=1, par=4, score=5),  # Hole 1: Tea Olive
            Hole(number=2, par=5, score=5),  # Hole 2: Pink Dogwood
            Hole(number=3, par=4, score=4),  # Hole 3: Flowering Peach
            Hole(number=4, par=3, score=3),  # Hole 4: Flowering Crab Apple
            Hole(number=5, par=4, score=5),  # Hole 5: Magnolia
            Hole(number=6, par=3, score=4),  # Hole 6: Juniper
            Hole(number=7, par=4, score=4),  # Hole 7: Pampas
            Hole(number=8, par=5, score=6),  # Hole 8: Yellow Jasmine
            Hole(number=9, par=4, score=4),  # Hole 9: Carolina Cherry
            Hole(number=10, par=4, score=5), # Hole 10: Camellia
            Hole(number=11, par=4, score=5), # Hole 11: White Dogwood
            Hole(number=12, par=3, score=4), # Hole 12: Golden Bell
            Hole(number=13, par=5, score=6), # Hole 13: Azalea
            Hole(number=14, par=4, score=4), # Hole 14: Chinese Fir
            Hole(number=15, par=5, score=5), # Hole 15: Firethorn
            Hole(number=16, par=3, score=3), # Hole 16: Redbud
            Hole(number=17, par=4, score=4), # Hole 17: Nandina
            Hole(number=18, par=4, score=5)  # Hole 18: Holly
        ]
        
        # Sample data for Pebble Beach Golf Links
        pebble_holes = [
            Hole(number=1, par=4, score=4),
            Hole(number=2, par=5, score=6),
            Hole(number=3, par=4, score=4),
            Hole(number=4, par=4, score=5),
            Hole(number=5, par=3, score=3),
            Hole(number=6, par=5, score=5),
            Hole(number=7, par=3, score=2),
            Hole(number=8, par=4, score=4),
            Hole(number=9, par=4, score=4),
            Hole(number=10, par=4, score=5),
            Hole(number=11, par=4, score=4),
            Hole(number=12, par=3, score=3),
            Hole(number=13, par=4, score=4),
            Hole(number=14, par=5, score=5),
            Hole(number=15, par=4, score=4),
            Hole(number=16, par=4, score=5),
            Hole(number=17, par=3, score=4),
            Hole(number=18, par=5, score=6)
        ]
        
        # Create sample scorecards
        scorecards_db.append(ScoreCard(
            id=str(uuid.uuid4()),
            date_played="2025-02-15",
            course_name="Augusta National Golf Club",
            holes=augusta_holes,
            notes="First time playing Augusta. Beautiful course!",
            weather="Sunny, 75°F"
        ))
        
        scorecards_db.append(ScoreCard(
            id=str(uuid.uuid4()),
            date_played="2025-03-01",
            course_name="Pebble Beach Golf Links",
            holes=pebble_holes,
            notes="Amazing ocean views. Wind was a challenge.",
            weather="Partly cloudy, windy, 68°F"
        ))