// API endpoint URL (change this to your FastAPI server URL)
const API_URL = 'http://localhost:8000';

// DOM elements
const scorecardForm = document.getElementById('scorecard-form');
const scorecardsContainer = document.getElementById('scorecards-container');
const modal = document.getElementById('scorecard-modal');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.getElementById('cancel-btn');
const modalTitle = document.getElementById('modal-title');
const newRoundBtn = document.getElementById('new-round-btn');
const toast = document.getElementById('toast');
const themeToggle = document.getElementById('theme-toggle');
const dateToday = document.getElementById('date-today');

// Chart elements
const scoreTrendChart = document.getElementById('score-trend-chart');
const coursesChart = document.getElementById('courses-chart');

// Filter elements
const courseFilter = document.getElementById('course-filter');
const dateFilter = document.getElementById('date-filter');
const searchInput = document.getElementById('search-input');

// Statistics elements
const totalRoundsEl = document.getElementById('total-rounds');
const avgScoreEl = document.getElementById('avg-score');
const bestScoreEl = document.getElementById('best-score');
const coursesPlayedEl = document.getElementById('courses-played');

// Score totals elements
const outParEl = document.getElementById('out-par');
const outScoreEl = document.getElementById('out-score');
const inParEl = document.getElementById('in-par');
const inScoreEl = document.getElementById('in-score');
const totalParEl = document.getElementById('total-par');
const totalScoreEl = document.getElementById('total-score');
const relativeToParEl = document.getElementById('relative-to-par');

// Scorecards data
let scorecards = [];
let filteredScorecards = [];

// Initialize date picker
flatpickr("#date-played", {
    dateFormat: "Y-m-d",
    maxDate: "today",
});

// Set current date
const today = new Date();
dateToday.textContent = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
});

// Theme toggle
themeToggle.addEventListener('change', function() {
    if (this.checked) {
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
    }
});

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
    themeToggle.checked = true;
}

// Charts
function initCharts(scorecardsData) {
    if (scorecardsData.length === 0) return;
    
    // Score Trend Chart
    const chartData = [];
    
    // Sort scorecards by date
    const sortedScorecards = [...scorecardsData].sort((a, b) => 
        new Date(a.date_played) - new Date(b.date_played)
    );
    
    sortedScorecards.forEach(card => {
        const totalPar = card.holes.reduce((sum, hole) => sum + hole.par, 0);
        const totalScore = card.holes.reduce((sum, hole) => sum + hole.score, 0);
        const relativeToPar = totalScore - totalPar;
        
        chartData.push({
            date: card.date_played,
            relativeToPar: relativeToPar,
            courseName: card.course_name
        });
    });
    
    new Chart(scoreTrendChart, {
        type: 'line',
        data: {
            labels: chartData.map(item => formatDate(item.date)),
            datasets: [{
                label: 'Score Relative to Par',
                data: chartData.map(item => item.relativeToPar),
                fill: false,
                borderColor: '#2e7d32',
                tension: 0.1,
                pointBackgroundColor: '#2e7d32',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Strokes Relative to Par'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: (tooltipItems) => {
                            const index = tooltipItems[0].dataIndex;
                            return chartData[index].courseName;
                        },
                        label: (context) => {
                            const value = context.parsed.y;
                            return value > 0 ? `+${value}` : value;
                        }
                    }
                }
            }
        }
    });
    
    // Courses Played Chart
    const courses = {};
    
    scorecardsData.forEach(card => {
        if (courses[card.course_name]) {
            courses[card.course_name]++;
        } else {
            courses[card.course_name] = 1;
        }
    });
    
    const courseLabels = Object.keys(courses);
    const courseValues = Object.values(courses);
    
    // Generate a color array for each course
    const colors = generateGreenPalette(courseLabels.length);
    
    new Chart(coursesChart, {
        type: 'pie',
        data: {
            labels: courseLabels,
            datasets: [{
                data: courseValues,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Generate green color palette
function generateGreenPalette(count) {
    const colors = [];
    const baseHue = 120; // Green hue
    
    for (let i = 0; i < count; i++) {
        const hue = (baseHue + (i * 15)) % 360;
        const saturation = 60 + (i * 3) % 30;
        const lightness = 40 + (i * 5) % 30;
        
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    
    return colors;
}

// Update statistics
function updateStats(scorecardsData) {
    const totalRounds = scorecardsData.length;
    totalRoundsEl.textContent = totalRounds;
    
    if (totalRounds === 0) {
        avgScoreEl.textContent = '0';
        bestScoreEl.textContent = 'N/A';
        coursesPlayedEl.textContent = '0';
        return;
    }
    
    // Calculate average relative to par
    let totalRelativeToPar = 0;
    let bestRelativeToPar = Infinity;
    let bestRoundCourse = '';
    
    // Get unique courses
    const uniqueCourses = new Set();
    
    scorecardsData.forEach(card => {
        uniqueCourses.add(card.course_name);
        
        const totalPar = card.holes.reduce((sum, hole) => sum + hole.par, 0);
        const totalScore = card.holes.reduce((sum, hole) => sum + hole.score, 0);
        const relativeToPar = totalScore - totalPar;
        
        totalRelativeToPar += relativeToPar;
        
        if (relativeToPar < bestRelativeToPar) {
            bestRelativeToPar = relativeToPar;
            bestRoundCourse = card.course_name;
        }
    });
    
    const avgRelativeToPar = totalRelativeToPar / totalRounds;
    
    // Format the average score
    const formattedAvg = avgRelativeToPar > 0 
        ? `+${avgRelativeToPar.toFixed(1)}` 
        : avgRelativeToPar.toFixed(1);
    
    // Format the best score
    const formattedBest = bestRelativeToPar > 0 
        ? `+${bestRelativeToPar}` 
        : bestRelativeToPar.toString();
    
    avgScoreEl.textContent = formattedAvg;
    bestScoreEl.textContent = formattedBest;
    coursesPlayedEl.textContent = uniqueCourses.size;
}

// Fetch all scorecards from the API
async function fetchScorecards() {
    try {
        const response = await fetch(`${API_URL}/scorecards/`);
        if (!response.ok) {
            throw new Error('Failed to fetch scorecards');
        }
        scorecards = await response.json();
        
        // Initially set filtered scorecards to all scorecards
        filteredScorecards = [...scorecards];
        
        // Update UI
        updateStats(scorecards);
        displayScorecards(filteredScorecards);
        
        // Initialize charts
        if (Chart.getChart(scoreTrendChart)) {
            Chart.getChart(scoreTrendChart).destroy();
        }
        if (Chart.getChart(coursesChart)) {
            Chart.getChart(coursesChart).destroy();
        }
        initCharts(scorecards);
        
        // Update course filter options
        updateCourseFilter(scorecards);
        
        // Fetch statistics from API
        fetchScorecardStats();
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to fetch scorecards. Please try again later.', 'error');
    }
}

// Update course filter dropdown
function updateCourseFilter(scorecardsData) {
    // Clear existing options except 'All Courses'
    while (courseFilter.options.length > 1) {
        courseFilter.remove(1);
    }
    
    // Get unique courses
    const uniqueCourses = new Set();
    scorecardsData.forEach(card => uniqueCourses.add(card.course_name));
    
    // Add options for each course
    uniqueCourses.forEach(course => {
        const option = document.createElement('option');
        option.value = course;
        option.textContent = course;
        courseFilter.appendChild(option);
    });
}

// Fetch scorecard statistics
async function fetchScorecardStats() {
    try {
        const response = await fetch(`${API_URL}/scorecards/stats`);
        if (!response.ok) {
            throw new Error('Failed to fetch scorecard statistics');
        }
        const stats = await response.json();
        
        // You can use these stats to update the charts if needed
        console.log('Scorecard statistics:', stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

// Filter scorecards based on user selections
function filterScorecards() {
    const courseValue = courseFilter.value;
    const dateValue = dateFilter.value;
    const searchValue = searchInput.value.toLowerCase();
    
    filteredScorecards = scorecards.filter(scorecard => {
        // Course filter
        if (courseValue !== 'all' && scorecard.course_name !== courseValue) {
            return false;
        }
        
        // Date filter
        if (dateValue !== 'all') {
            const scorecardDate = new Date(scorecard.date_played);
            const now = new Date();
            
            if (dateValue === 'last-month') {
                const lastMonth = new Date(now);
                lastMonth.setMonth(now.getMonth() - 1);
                if (scorecardDate < lastMonth) {
                    return false;
                }
            } else if (dateValue === 'last-3-months') {
                const last3Months = new Date(now);
                last3Months.setMonth(now.getMonth() - 3);
                if (scorecardDate < last3Months) {
                    return false;
                }
            } else if (dateValue === 'last-year') {
                const lastYear = new Date(now);
                lastYear.setFullYear(now.getFullYear() - 1);
                if (scorecardDate < lastYear) {
                    return false;
                }
            }
        }
        
        // Search filter
        if (searchValue && 
            !scorecard.course_name.toLowerCase().includes(searchValue) && 
            !(scorecard.notes && scorecard.notes.toLowerCase().includes(searchValue))) {
            return false;
        }
        
        return true;
    });
    
    displayScorecards(filteredScorecards);
}

// Add event listeners to filters
courseFilter.addEventListener('change', filterScorecards);
dateFilter.addEventListener('change', filterScorecards);
searchInput.addEventListener('input', filterScorecards);

// Display scorecards in the UI
function displayScorecards(scorecardsToDisplay) {
    scorecardsContainer.innerHTML = '';
    
    if (scorecardsToDisplay.length === 0) {
        scorecardsContainer.innerHTML = '<div class="no-scorecards"><p>No scorecards found. Add a new round to get started!</p></div>';
        return;
    }
    
    // Sort scorecards by date (newest first)
    const sortedScorecards = [...scorecardsToDisplay].sort((a, b) => 
        new Date(b.date_played) - new Date(a.date_played)
    );
    
    sortedScorecards.forEach(scorecard => {
        // Calculate totals
        const totalPar = scorecard.holes.reduce((sum, hole) => sum + hole.par, 0);
        const totalScore = scorecard.holes.reduce((sum, hole) => sum + hole.score, 0);
        const relativeToPar = totalScore - totalPar;
        
        // Format relative to par string
        const relativeToParStr = relativeToPar === 0 
            ? 'E' 
            : (relativeToPar > 0 ? `+${relativeToPar}` : relativeToPar.toString());
        
        // Determine score class
        let scoreClass = 'score-even-par';
        if (relativeToPar < 0) {
            scoreClass = 'score-under-par';
        } else if (relativeToPar > 0 && relativeToPar <= 5) {
            scoreClass = 'score-over-par';
        } else if (relativeToPar > 5) {
            scoreClass = 'score-over-par high';
        }
        
        const scorecardCard = document.createElement('div');
        scorecardCard.className = 'scorecard-card';
        scorecardCard.dataset.id = scorecard.id;
        
        scorecardCard.innerHTML = `
            <div class="scorecard-header">
                <div>
                    <div class="scorecard-title">${scorecard.course_name}</div>
                    <div class="scorecard-date">
                        <i class="fas fa-calendar-alt"></i> ${formatDate(scorecard.date_played)}
                    </div>
                </div>
                <div class="scorecard-score ${scoreClass}">
                    ${relativeToParStr}
                </div>
            </div>
            
            <div class="scorecard-details">
                <div class="detail-item">
                    <span class="detail-label">Total Score:</span>
                    <span>${totalScore}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Course Par:</span>
                    <span>${totalPar}</span>
                </div>
                ${scorecard.weather ? `
                <div class="detail-item">
                    <span class="detail-label">Weather:</span>
                    <span>${scorecard.weather}</span>
                </div>
                ` : ''}
            </div>
            
            ${scorecard.notes ? `
            <div class="scorecard-notes">
                <i class="fas fa-quote-left"></i> ${scorecard.notes}
            </div>
            ` : ''}
            
            <div class="scorecard-actions">
                <button class="action-btn view" data-id="${scorecard.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit" data-id="${scorecard.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" data-id="${scorecard.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        
        scorecardsContainer.appendChild(scorecardCard);
    });
    
    // Add event listeners
    document.querySelectorAll('.action-btn.view').forEach(button => {
        button.addEventListener('click', handleViewClick);
    });
    
    document.querySelectorAll('.action-btn.edit').forEach(button => {
        button.addEventListener('click', handleEditClick);
    });
    
    document.querySelectorAll('.action-btn.delete').forEach(button => {
        button.addEventListener('click', handleDeleteClick);
    });
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Handle view button click (similar to edit but readonly)
function handleViewClick(e) {
    const scorecardId = e.currentTarget.dataset.id;
    const scorecard = scorecards.find(s => s.id === scorecardId);
    
    if (!scorecard) return;
    
    // Clone the scorecard and show it in read-only mode
    modalTitle.textContent = 'View Scorecard';
    document.getElementById('scorecard-id').value = scorecardId;
    document.getElementById('course-name').value = scorecard.course_name;
    document.getElementById('course-name').disabled = true;
    
    document.getElementById('date-played').value = scorecard.date_played;
    document.getElementById('date-played').disabled = true;
    
    document.getElementById('weather').value = scorecard.weather || '';
    document.getElementById('weather').disabled = true;
    
    document.getElementById('notes').value = scorecard.notes || '';
    document.getElementById('notes').disabled = true;
    
    // Fill in hole scores and pars
    scorecard.holes.forEach(hole => {
        const parInput = document.querySelector(`.par-input[data-hole="${hole.number}"]`);
        const scoreInput = document.querySelector(`.score-input[data-hole="${hole.number}"]`);
        
        if (parInput && scoreInput) {
            parInput.value = hole.par;
            parInput.disabled = true;
            scoreInput.value = hole.score;
            scoreInput.disabled = true;
        }
    });
    
    // Update totals
    updateScorecardTotals();
    
    // Change save button to close button
    document.getElementById('save-btn').style.display = 'none';
    document.getElementById('cancel-btn').textContent = 'Close';
    
    showModal();
}

// Handle edit button click
function handleEditClick(e) {
    const scorecardId = e.currentTarget.dataset.id;
    const scorecard = scorecards.find(s => s.id === scorecardId);
    
    if (!scorecard) return;
    
    modalTitle.textContent = 'Edit Scorecard';
    document.getElementById('scorecard-id').value = scorecardId;
    document.getElementById('course-name').value = scorecard.course_name;
    document.getElementById('course-name').disabled = false;
    
    document.getElementById('date-played').value = scorecard.date_played;
    document.getElementById('date-played').disabled = false;
    
    document.getElementById('weather').value = scorecard.weather || '';
    document.getElementById('weather').disabled = false;
    
    document.getElementById('notes').value = scorecard.notes || '';
    document.getElementById('notes').disabled = false;
    
    // Fill in hole scores and pars
    scorecard.holes.forEach(hole => {
        const parInput = document.querySelector(`.par-input[data-hole="${hole.number}"]`);
        const scoreInput = document.querySelector(`.score-input[data-hole="${hole.number}"]`);
        
        if (parInput && scoreInput) {
            parInput.value = hole.par;
            parInput.disabled = false;
            scoreInput.value = hole.score;
            scoreInput.disabled = false;
        }
    });
    
    // Update totals
    updateScorecardTotals();
    
    // Restore save button
    document.getElementById('save-btn').style.display = 'block';
    document.getElementById('save-btn').textContent = 'Save Changes';
    document.getElementById('cancel-btn').textContent = 'Cancel';
    
    showModal();
}

// Handle delete button click
async function handleDeleteClick(e) {
    const scorecardId = e.currentTarget.dataset.id;
    const scorecard = scorecards.find(s => s.id === scorecardId);
    
    if (confirm(`Are you sure you want to delete the scorecard for ${scorecard.course_name}?`)) {
        try {
            const response = await fetch(`${API_URL}/scorecards/${scorecardId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete scorecard');
            }
            
            // Remove from local data
            scorecards = scorecards.filter(s => s.id !== scorecardId);
            filteredScorecards = filteredScorecards.filter(s => s.id !== scorecardId);
            
            // Refresh UI
            displayScorecards(filteredScorecards);
            updateStats(scorecards);
            
            // Update charts
            if (Chart.getChart(scoreTrendChart)) {
                Chart.getChart(scoreTrendChart).destroy();
            }
            if (Chart.getChart(coursesChart)) {
                Chart.getChart(coursesChart).destroy();
            }
            initCharts(scorecards);
            
            showToast('Scorecard deleted successfully');
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to delete scorecard', 'error');
        }
    }
}

// Show new scorecard modal
newRoundBtn.addEventListener('click', function() {
    modalTitle.textContent = 'Add New Round';
    document.getElementById('scorecard-id').value = '';
    scorecardForm.reset();
    
    // Enable all inputs
    Array.from(scorecardForm.elements).forEach(element => {
        element.disabled = false;
    });
    
    // Set default date to today
    const datepicker = document.getElementById('date-played')._flatpickr;
    datepicker.setDate(new Date());
    
    // Restore default par values and empty scores
    document.querySelectorAll('.par-input').forEach(input => {
        // Default par values based on typical course
        const holeNumber = parseInt(input.dataset.hole);
        let defaultPar = 4;
        
        // Typical par-3 holes
        if ([3, 6, 12, 16].includes(holeNumber)) {
            defaultPar = 3;
        }
        // Typical par-5 holes
        else if ([5, 7, 13, 18].includes(holeNumber)) {
            defaultPar = 5;
        }
        
        input.value = defaultPar;
    });
    
    document.querySelectorAll('.score-input').forEach(input => {
        const holeNumber = parseInt(input.dataset.hole);
        const parInput = document.querySelector(`.par-input[data-hole="${holeNumber}"]`);
        // Default score = par
        input.value = parInput ? parInput.value : 4;
    });
    
    // Update totals
    updateScorecardTotals();
    
    // Restore save button
    document.getElementById('save-btn').style.display = 'block';
    document.getElementById('save-btn').textContent = 'Save Scorecard';
    document.getElementById('cancel-btn').textContent = 'Cancel';
    
    showModal();
});

// Calculate and update scorecard totals
function updateScorecardTotals() {
    // Front nine
    let outPar = 0;
    let outScore = 0;
    
    for (let i = 1; i <= 9; i++) {
        const parInput = document.querySelector(`.par-input[data-hole="${i}"]`);
        const scoreInput = document.querySelector(`.score-input[data-hole="${i}"]`);
        
        if (parInput && scoreInput) {
            outPar += parseInt(parInput.value) || 0;
            outScore += parseInt(scoreInput.value) || 0;
        }
    }
    
    // Back nine
    let inPar = 0;
    let inScore = 0;
    
    for (let i = 10; i <= 18; i++) {
        const parInput = document.querySelector(`.par-input[data-hole="${i}"]`);
        const scoreInput = document.querySelector(`.score-input[data-hole="${i}"]`);
        
        if (parInput && scoreInput) {
            inPar += parseInt(parInput.value) || 0;
            inScore += parseInt(scoreInput.value) || 0;
        }
    }
    
    // Update totals
    outParEl.textContent = outPar;
    outScoreEl.textContent = outScore;
    inParEl.textContent = inPar;
    inScoreEl.textContent = inScore;
    
    const totalPar = outPar + inPar;
    const totalScore = outScore + inScore;
    const relativeToPar = totalScore - totalPar;
    
    totalParEl.textContent = totalPar;
    totalScoreEl.textContent = totalScore;
    
    // Format relative to par
    const relativeToParStr = relativeToPar === 0 
        ? 'Even' 
        : (relativeToPar > 0 ? `+${relativeToPar}` : relativeToPar.toString());
    
    relativeToParEl.textContent = relativeToParStr;
}

// Add event listeners to par and score inputs
document.querySelectorAll('.par-input, .score-input').forEach(input => {
    input.addEventListener('change', updateScorecardTotals);
});

// Handle form submission
scorecardForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const scorecardId = document.getElementById('scorecard-id').value;
    const courseName = document.getElementById('course-name').value;
    const datePlayed = document.getElementById('date-played').value;
    const weather = document.getElementById('weather').value;
    const notes = document.getElementById('notes').value;
    
    // Collect holes data
    const holes = [];
    
    for (let i = 1; i <= 18; i++) {
        const parInput = document.querySelector(`.par-input[data-hole="${i}"]`);
        const scoreInput = document.querySelector(`.score-input[data-hole="${i}"]`);
        
        if (parInput && scoreInput) {
            holes.push({
                number: i,
                par: parseInt(parInput.value) || 4,
                score: parseInt(scoreInput.value) || 4
            });
        }
    }
    
    const scorecardData = {
        course_name: courseName,
        date_played: datePlayed,
        weather: weather || null,
        notes: notes || null,
        holes: holes
    };
    
    try {
        let response;
        
        if (scorecardId) {
            // Update existing scorecard
            response = await fetch(`${API_URL}/scorecards/${scorecardId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(scorecardData)
            });
        } else {
            // Create new scorecard
            response = await fetch(`${API_URL}/scorecards/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(scorecardData)
            });
        }
        
        if (!response.ok) {
            throw new Error(scorecardId ? 'Failed to update scorecard' : 'Failed to create scorecard');
        }
        
        // Hide modal
        hideModal();
        
        // Refresh scorecards
        fetchScorecards();
        
        showToast(scorecardId ? 'Scorecard updated successfully' : 'Scorecard created successfully');
    } catch (error) {
        console.error('Error:', error);
        showToast(error.message, 'error');
    }
});

// Modal functions
function showModal() {
    modal.classList.add('show');
}

function hideModal() {
    modal.classList.remove('show');
    
    // Reset form state
    Array.from(scorecardForm.elements).forEach(element => {
        element.disabled = false;
    });
}

// Close modal with close button or cancel button
closeBtn.addEventListener('click', hideModal);
cancelBtn.addEventListener('click', hideModal);

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    if (e.target === modal) {
        hideModal();
    }
});

// Toast notification
function showToast(message, type = 'success') {
    const toastIcon = toast.querySelector('i');
    const toastMessage = toast.querySelector('.toast-message');
    const toastProgress = toast.querySelector('.toast-progress');
    
    // Set icon and color based on type
    if (type === 'success') {
        toastIcon.className = 'fas fa-check-circle';
        toastIcon.style.color = 'var(--success)';
        toastProgress.style.backgroundColor = 'var(--success)';
    } else if (type === 'error') {
        toastIcon.className = 'fas fa-exclamation-circle';
        toastIcon.style.color = 'var(--danger)';
        toastProgress.style.backgroundColor = 'var(--danger)';
    } else if (type === 'warning') {
        toastIcon.className = 'fas fa-exclamation-triangle';
        toastIcon.style.color = 'var(--warning)';
        toastProgress.style.backgroundColor = 'var(--warning)';
    }
    
    toastMessage.textContent = message;
    
    // Show toast
    toast.classList.add('show');
    
    // Animate progress bar
    toastProgress.style.animation = 'none';
    toastProgress.offsetHeight; // Trigger reflow
    toastProgress.style.animation = 'progress 3s linear forwards';
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Animation for toast progress bar
if (!document.querySelector('style#toast-style')) {
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.textContent = `
        @keyframes progress {
            0% { transform: scaleX(1); }
            100% { transform: scaleX(0); }
        }
    `;
    document.head.appendChild(style);
}

// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get navigation elements
    const dashboardLink = document.querySelector('.sidebar-menu a:nth-child(1)');
    const scoreHistoryLink = document.querySelector('.sidebar-menu a:nth-child(2)');
    const statisticsLink = document.querySelector('.sidebar-menu a:nth-child(3)');
    const coursesLink = document.querySelector('.sidebar-menu a:nth-child(4)');
    
    // Get content sections
    const dashboardStats = document.querySelector('.dashboard-stats');
    const chartsContainer = document.querySelector('.charts-container');
    const scorecardFilters = document.querySelector('.scorecard-filters');
    const scorecardList = document.querySelector('.scorecard-list');
    
    // Show dashboard, hide others
    function showDashboard() {
        // Remove active class from all links
        document.querySelectorAll('.sidebar-menu a').forEach(link => link.classList.remove('active'));
        // Add active class to dashboard link
        dashboardLink.classList.add('active');
        
        // Show dashboard elements
        dashboardStats.style.display = 'grid';
        chartsContainer.style.display = 'grid';
        scorecardFilters.style.display = 'flex';
        scorecardList.style.display = 'block';
        
        // Update header title
        document.querySelector('.header-title h1').textContent = 'Golf Scorecard Dashboard';
    }
    
    // Show score history, hide others
    function showScoreHistory() {
        // Remove active class from all links
        document.querySelectorAll('.sidebar-menu a').forEach(link => link.classList.remove('active'));
        // Add active class to score history link
        scoreHistoryLink.classList.add('active');
        
        // Hide dashboard charts, show scorecard list
        dashboardStats.style.display = 'none';
        chartsContainer.style.display = 'none';
        scorecardFilters.style.display = 'flex';
        scorecardList.style.display = 'block';
        
        // Update header title
        document.querySelector('.header-title h1').textContent = 'Score History';
    }
    
    // Show statistics, hide others
    function showStatistics() {
        // Remove active class from all links
        document.querySelectorAll('.sidebar-menu a').forEach(link => link.classList.remove('active'));
        // Add active class to statistics link
        statisticsLink.classList.add('active');
        
        // Show charts, hide scorecard list
        dashboardStats.style.display = 'grid';
        chartsContainer.style.display = 'grid';
        scorecardFilters.style.display = 'none';
        scorecardList.style.display = 'none';
        
        // Update header title
        document.querySelector('.header-title h1').textContent = 'Performance Statistics';
    }
    
    // Show courses, hide others
    function showCourses() {
        // Remove active class from all links
        document.querySelectorAll('.sidebar-menu a').forEach(link => link.classList.remove('active'));
        // Add active class to courses link
        coursesLink.classList.add('active');
        
        // Show specific chart for courses
        dashboardStats.style.display = 'none';
        chartsContainer.style.display = 'grid';
        // Adjust to show only course chart
        document.querySelectorAll('.chart-card').forEach((card, index) => {
            if (index === 1) { // Courses chart is the second chart
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
        scorecardFilters.style.display = 'flex';
        scorecardList.style.display = 'block';
        
        // Update header title
        document.querySelector('.header-title h1').textContent = 'Golf Courses';
    }
    
    // Add event listeners to navigation links
    dashboardLink.addEventListener('click', function(e) {
        e.preventDefault();
        showDashboard();
    });
    
    scoreHistoryLink.addEventListener('click', function(e) {
        e.preventDefault();
        showScoreHistory();
    });
    
    statisticsLink.addEventListener('click', function(e) {
        e.preventDefault();
        showStatistics();
    });
    
    coursesLink.addEventListener('click', function(e) {
        e.preventDefault();
        showCourses();
    });
    
    // Initialize with dashboard view
    showDashboard();
});

// Initial fetch of scorecards
document.addEventListener('DOMContentLoaded', fetchScorecards);