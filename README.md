
🌍 EcoScan
Connecting Citizens, Volunteers, and Authorities to Clean Our Cities.

EcoScan is a high-speed reporting tool developed for GDG DevFest: Kernel Panic Round 1. It maps urban garbage dumping sites in real-time and coordinates community-led cleanup efforts through a seamless, data-driven interface.

🚀 The Challenge
Urban neighborhoods often suffer from rampant garbage dumping with no clear data on severity or location. EcoScan bridges this gap by providing:

Citizens: A fast, geolocation-based tool to report waste.

Volunteers: A real-time map to claim, track, and clean spots.

Authorities: A comprehensive dashboard to monitor urban hygiene trends and progress.

✨ Key Features
📍 Report a Spot: Pin waste locations via the browser's Geolocation API, upload photo evidence, and rate severity (Low/Medium/High).

🗺️ Interactive Map View: A dynamic map rendering real-world coordinates with color-coded markers based on urgency.

🤝 Volunteer Action: Volunteers can "claim" spots, updating the status to In Progress in real-time to prevent overlapping efforts.

📊 Live Dashboard: A status monitor showing live counts for Total Reported, In Progress, and Cleaned spots.

🏆 Leaderboard: Gamified participation tracking to encourage and reward top community volunteers.

🛠️ Tech Stack
Backend

FastAPI: High-performance Python framework for asynchronous API handling.

PostgreSQL: Relational database for structured data and spatial integrity.

SQLAlchemy: ORM for database modeling and seamless migrations.

Pydantic: Strict data validation ensuring high-quality, schema-compliant reporting.

Frontend

React + Vite: For a blazing-fast, responsive user interface.

Tailwind CSS: For rapid, utility-first UI development.

Leaflet.js: Real-world coordinate mapping and interactive spatial visualization.

🏗️ Architecture Decisions
Modular API: Built using FastAPI's APIRouter to isolate "rolling requirements" from core MVP logic, ensuring scalability.

Stateless Design: Utilizes PATCH requests that return updated objects, allowing the frontend to reflect state changes instantly without reloads.

Strict Geospatial Constraints: Enforced use of the Geolocation API for coordinate accuracy, preventing manual text-box "spoofing" and ensuring data reliability.

📦 Installation & Setup
Backend
Navigate to the backend directory:

Bash```
cd backend
```
Install dependencies:

Bash```
pip install -r requirements.txt
```
Run the development server:

Bash```
uvicorn main:app --reload
```
Frontend
Navigate to the frontend directory:

Bash```
cd frontend
```
Install dependencies:

Bash ```
npm install
```

Run the development server:

Bash```
npm run dev
```

👥 The Team

Shreyas (@shreyascode11) – Backend & Database Architect

Rajdeep (@rajdeep-pixel) – Frontend & UI/UX Engineer

Tulsi – (@itsTulsi) - Pitch & Presentation Lead