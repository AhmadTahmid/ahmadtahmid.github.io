// Bologna Open Data API Configuration
const API_BASE_URL = 'https://dati.comune.bologna.it/api/3/action/datastore_search';
const RESOURCE_ID = '18c27ad3-f07e-4c5c-9c55-4d9b0b2f7e5f';

// Color configuration
const RAINBOW_COLORS = [
    '#FF0000', '#FF7F00', '#FFFF00', '#00FF00',
    '#0000FF', '#4B0082', '#8B00FF', '#FF0000',
    '#FF7F00', '#FFFF00', '#00FF00', '#0000FF'
];

const SEASON_COLORS = {
    'Winter': 'rgba(0, 191, 255, 0.8)',   // Deep blue
    'Spring': 'rgba(124, 252, 0, 0.8)',   // Green
    'Summer': 'rgba(255, 165, 0, 0.8)',   // Orange
    'Autumn': 'rgba(139, 69, 19, 0.8)'    // Brown
};

// Fetch data from Bologna Open Data API
async function fetchRainfallData() {
    try {
        const response = await fetch(`${API_BASE_URL}?resource_id=${RESOURCE_ID}&limit=1000`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        return data.result.records;
    } catch (error) {
        console.error('Error fetching rainfall data:', error);
        return [];
    }
}

// Process data for monthly median rainfall
function processMonthlyMedians(data) {
    const monthlyData = Array(12).fill().map(() => []);
    
    data.forEach(record => {
        const date = new Date(record.data);
        const month = date.getMonth();
        const rainfall = parseFloat(record.pioggia);
        if (!isNaN(rainfall)) {
            monthlyData[month].push(rainfall);
        }
    });

    return monthlyData.map(monthRainfall => {
        const sorted = monthRainfall.sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    });
}

// Process data for outlier events
function processOutliers(data) {
    const yearlyOutliers = {};
    const monthlyData = Array(12).fill().map(() => []);

    // Group data by month
    data.forEach(record => {
        const date = new Date(record.data);
        const month = date.getMonth();
        const rainfall = parseFloat(record.pioggia);
        if (!isNaN(rainfall)) {
            monthlyData[month].push(rainfall);
        }
    });

    // Calculate IQR thresholds for each month
    const monthlyThresholds = monthlyData.map(values => {
        const sorted = values.sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        return q3 + (1.5 * iqr);
    });

    // Count outliers by year
    data.forEach(record => {
        const date = new Date(record.data);
        const year = date.getFullYear();
        const month = date.getMonth();
        const rainfall = parseFloat(record.pioggia);

        if (!isNaN(rainfall) && rainfall > monthlyThresholds[month]) {
            yearlyOutliers[year] = (yearlyOutliers[year] || 0) + 1;
        }
    });

    return yearlyOutliers;
}

// Process data for seasonal averages
function processSeasonalAverages(data) {
    const seasons = {
        'Winter': [11, 0, 1],    // Dec, Jan, Feb
        'Spring': [2, 3, 4],     // Mar, Apr, May
        'Summer': [5, 6, 7],     // Jun, Jul, Aug
        'Autumn': [8, 9, 10]     // Sep, Oct, Nov
    };

    const seasonalData = {
        'Winter': [],
        'Spring': [],
        'Summer': [],
        'Autumn': []
    };

    data.forEach(record => {
        const date = new Date(record.data);
        const month = date.getMonth();
        const rainfall = parseFloat(record.pioggia);

        if (!isNaN(rainfall)) {
            for (const [season, months] of Object.entries(seasons)) {
                if (months.includes(month)) {
                    seasonalData[season].push(rainfall);
                    break;
                }
            }
        }
    });

    return Object.fromEntries(
        Object.entries(seasonalData).map(([season, values]) => [
            season,
            values.length ? values.reduce((a, b) => a + b) / values.length : 0
        ])
    );
}

// Initialize charts
async function initializeCharts() {
    const data = await fetchRainfallData();
    if (!data.length) {
        console.error('No data available');
        return;
    }

    // Monthly Median Chart
    const monthlyMedians = processMonthlyMedians(data);
    const monthlyCtx = document.getElementById('monthlyMedianChart').getContext('2d');
    new Chart(monthlyCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Median Rainfall (mm)',
                data: monthlyMedians,
                backgroundColor: RAINBOW_COLORS,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Median Monthly Rainfall in Bologna',
                    color: 'rgba(255, 255, 255, 0.8)',
                    font: { family: 'Space Mono', size: 16 }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' }
                    }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' }
                    }
                }
            }
        }
    });

    // Outliers Chart
    const outliers = processOutliers(data);
    const years = Object.keys(outliers).sort();
    const outliersCtx = document.getElementById('outliersChart').getContext('2d');
    new Chart(outliersCtx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [{
                label: 'Number of Extreme Rainfall Events',
                data: years.map(year => outliers[year]),
                backgroundColor: 'rgba(255, 0, 0, 0.6)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Extreme Rainfall Events by Year',
                    color: 'rgba(255, 255, 255, 0.8)',
                    font: { family: 'Space Mono', size: 16 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' }
                    }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' },
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });

    // Seasonal Chart
    const seasonalAverages = processSeasonalAverages(data);
    const seasonalCtx = document.getElementById('seasonalChart').getContext('2d');
    new Chart(seasonalCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(seasonalAverages),
            datasets: [{
                label: 'Average Rainfall (mm)',
                data: Object.values(seasonalAverages),
                backgroundColor: Object.keys(seasonalAverages).map(season => SEASON_COLORS[season]),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Average Seasonal Rainfall',
                    color: 'rgba(255, 255, 255, 0.8)',
                    font: { family: 'Space Mono', size: 16 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' }
                    }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' }
                    }
                }
            }
        }
    });
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCharts); 