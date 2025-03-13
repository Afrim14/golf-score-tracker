# Golf Score Tracker

## Overview
Golf Score Tracker is a comprehensive web application that helps golfers record, analyze, and visualize their performance across multiple courses. The application features a modern, responsive interface with golf-themed design and powerful statistical analysis tools.

## Features
- **Score Management**
  - Record detailed scorecards with hole-by-hole scores
  - Track par values for each hole
  - Add weather conditions and personal notes
  - Calculate scores relative to par

- **Data Visualization**
  - Score trend line chart to track improvement over time
  - Course distribution pie chart 
  - Performance statistics dashboard
  - Color-coded score indicators (under par, even, over par)

- **Course Tracking**
  - Record scores from multiple golf courses
  - Filter scorecards by specific courses
  - Compare performance across different courses

- **User Experience**
  - Responsive design for desktop and mobile devices
  - Light/dark theme toggle with persistent settings
  - Interactive scorecard input with automatic calculations
  - Filter and search functionality

## Installation

### Prerequisites
- Python 3.7+
- Web browser (Chrome, Firefox, Safari, etc.)

### Backend Setup
1. Clone the repository
   ```bash
   git clone https://github.com/your-username/golf-score-tracker.git
   cd golf-score-tracker
   ```

2. Install required packages
   ```bash
   pip install fastapi uvicorn pydantic
   ```

3. Run the FastAPI server
   ```bash
   cd backend
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup
1. Open a new terminal window
2. Navigate to the frontend directory
   ```bash
   cd golf-score-tracker/frontend
   ```
3. Serve the frontend files (optional)
   ```bash
   python -m http.server
   ```
   Or simply open `index.html` in your browser

## Usage Guide

### Adding a New Round
1. Click the "New Round" button in the top right corner
2. Enter the course name, date played, and weather conditions
3. Input scores for each hole (front nine and back nine)
4. Add optional notes about your round
5. Click "Save Scorecard"

### Viewing Statistics
1. Navigate to "Statistics" in the sidebar
2. View your average score relative to par
3. See your best round performance
4. Analyze your score trends over time

### Filtering Scorecards
1. Use the course dropdown to filter by specific golf courses
2. Filter by date range (last month, last 3 months, last year)
3. Use the search bar to find specific notes or course names

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /scorecards/ | Get all scorecards |
| POST | /scorecards/ | Create a new scorecard |
| GET | /scorecards/{scorecard_id} | Get a specific scorecard |
| PUT | /scorecards/{scorecard_id} | Update a scorecard |
| DELETE | /scorecards/{scorecard_id} | Delete a scorecard |
| GET | /scorecards/stats | Get performance statistics |

## Technologies Used
- **Backend**: FastAPI, Python, Pydantic
- **Frontend**: HTML5, CSS3, JavaScript
- **Charts**: Chart.js
- **Date Picker**: Flatpickr
- **Icons**: Font Awesome

## Project Structure
```
golf-score-tracker/
├── backend/
│   ├── main.py            # FastAPI application
│   └── requirements.txt   # Python dependencies
├── frontend/
│   ├── index.html         # HTML structure
│   ├── styles.css         # CSS styling
│   └── script.js          # JavaScript functionality
└── README.md              # Project documentation
```


## Future Enhancements
- User authentication system
- Persistent database storage 
- Multiple player scorecards
- Statistics for fairways hit, greens in regulation, and putts
- GPS course mapping
- Handicap calculation
- Social sharing features

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements
- Golf course data based on real courses including Augusta National and Pebble Beach
- Designed for educational purposes as part of a FastAPI learning project
