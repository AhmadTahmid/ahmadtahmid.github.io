// Global variables
let rainfallData = null;
let currentTab = 'overview';

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Set end date to today
    document.getElementById('endDate').valueAsDate = new Date();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Fetch data
    fetchData();
});

// Initialize event listeners
function initializeEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            currentTab = item.dataset.tab;
            updateDashboard();
        });
    });

    // Filter controls
    document.getElementById('startDate').addEventListener('change', updateDashboard);
    document.getElementById('endDate').addEventListener('change', updateDashboard);
    document.getElementById('seasonFilter').addEventListener('change', updateDashboard);
    
    // Threshold slider
    const thresholdSlider = document.getElementById('thresholdSlider');
    const thresholdValue = document.getElementById('thresholdValue');
    thresholdSlider.addEventListener('input', (e) => {
        thresholdValue.textContent = `${e.target.value} mm`;
        updateDashboard();
    });
}

// Fetch data from API with pagination
async function fetchData() {
    try {
        const response = await fetch('https://opendata.comune.bologna.it/api/explore/v2.1/catalog/datasets/precipitazioni_bologna/records?limit=10000&timezone=UTC');
        const data = await response.json();

        if (!data.results) {
            throw new Error('Invalid data format');
        }

        // Process the data
        const processedData = data.results.map(record => ({
            date: new Date(record.data),
            rainfall: parseFloat(record.precipitazioni_mm || 0)
        })).filter(record => !isNaN(record.rainfall));

        // Sort by date
        processedData.sort((a, b) => a.date - b.date);

        createPlots(processedData);
    } catch (error) {
        console.error('Error fetching data:', error);
        document.querySelectorAll('.plot-container').forEach(container => {
            container.innerHTML = 'Error loading data. Please try again later.';
        });
    }
}

// Update dashboard based on current tab and filters
function updateDashboard() {
    const filteredData = filterData();
    
    switch (currentTab) {
        case 'overview':
            createOverviewPlots(filteredData);
            break;
        case 'seasonal':
            createSeasonalPlots(filteredData);
            break;
        case 'outliers':
            createOutlierPlots(filteredData);
            break;
        case 'trends':
            createTrendPlot(filteredData);
            break;
    }
    
    updateStats(filteredData);
}

// Filter data based on user selections
function filterData() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    const selectedSeasons = Array.from(document.getElementById('seasonFilter').selectedOptions)
        .map(option => option.value);
    
    return rainfallData.filter(record => {
        return record.date >= startDate &&
               record.date <= endDate &&
               selectedSeasons.includes(record.season);
    });
}

// Create overview plots
function createOverviewPlots(data) {
    const plotDiv = document.getElementById('plot');
    
    // Annual rainfall
    const annualData = groupDataByYear(data);
    const years = Object.keys(annualData);
    const values = Object.values(annualData);
    
    // Calculate color gradient based on rainfall amounts
    const normalizedValues = values.map(v => (v - Math.min(...values)) / (Math.max(...values) - Math.min(...values)));
    const colors = normalizedValues.map(v => interpolateColor('#e3f2fd', '#1565c0', v));
    
    const traces = [
        {
            x: years,
            y: values,
            type: 'bar',
            name: 'Annual Rainfall',
            marker: {
                color: colors
            }
        }
    ];
    
    const layout = {
        title: 'Total Annual Rainfall in Bologna',
        showlegend: false,
        xaxis: {
            title: 'Year',
            tickangle: -45
        },
        yaxis: {
            title: 'Total Rainfall (mm)'
        },
        plot_bgcolor: '#fff',
        paper_bgcolor: '#fff'
    };
    
    Plotly.newPlot(plotDiv, traces, layout);
}

// Create seasonal plots
function createSeasonalPlots(data) {
    const plotDiv = document.getElementById('plot');
    
    // Calculate average seasonal rainfall across all years
    const seasonalAverages = calculateSeasonalAverages(data);
    const seasons = ['Winter', 'Spring', 'Summer', 'Fall'];
    
    // Create seasonal data by year
    const yearlySeasonalData = groupDataByYearAndSeason(data);
    const years = Object.keys(yearlySeasonalData);
    
    // Create dropdown for year selection
    const yearSelect = document.createElement('select');
    yearSelect.id = 'yearSelect';
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.text = year;
        yearSelect.appendChild(option);
    });
    yearSelect.value = years[years.length - 1]; // Set most recent year as default
    
    // Add dropdown to control group
    const controlGroup = document.querySelector('.filter-controls');
    const yearControl = document.createElement('div');
    yearControl.className = 'filter-control';
    yearControl.innerHTML = '<label for="yearSelect">Select Year</label>';
    yearControl.appendChild(yearSelect);
    controlGroup.appendChild(yearControl);
    
    // Create traces for both plots
    const averageTrace = {
        x: seasons,
        y: seasons.map(s => seasonalAverages[s]),
        type: 'bar',
        name: 'Average Seasonal Rainfall',
        marker: {
            color: ['#2196f3', '#4caf50', '#f44336', '#ff9800']
        }
    };
    
    const selectedYearTrace = {
        x: seasons,
        y: seasons.map(s => yearlySeasonalData[yearSelect.value][s]),
        type: 'bar',
        name: `${yearSelect.value} Seasonal Rainfall`,
        marker: {
            color: ['#90caf9', '#a5d6a7', '#ef9a9a', '#ffcc80']
        }
    };
    
    const layout = {
        title: 'Seasonal Rainfall Distribution',
        barmode: 'group',
        xaxis: {
            title: 'Season'
        },
        yaxis: {
            title: 'Rainfall (mm)'
        },
        plot_bgcolor: '#fff',
        paper_bgcolor: '#fff'
    };
    
    Plotly.newPlot(plotDiv, [averageTrace, selectedYearTrace], layout);
    
    // Update plot when year changes
    yearSelect.addEventListener('change', () => {
        const newData = {
            x: seasons,
            y: seasons.map(s => yearlySeasonalData[yearSelect.value][s])
        };
        Plotly.update(plotDiv, {y: [null, newData.y]}, {}, [1]);
    });
}

// Create outlier analysis plots
function createOutlierPlots(data) {
    const plotDiv = document.getElementById('plot');
    
    // Calculate outliers by year
    const outliersByYear = calculateOutliersByYear(data);
    const years = Object.keys(outliersByYear);
    
    const trace1 = {
        x: years,
        y: years.map(year => outliersByYear[year].count),
        type: 'bar',
        name: 'Number of Outliers',
        marker: {
            color: '#e74c3c'
        }
    };
    
    const layout = {
        title: 'Frequency of Outlier Rainfall by Year',
        xaxis: {
            title: 'Year',
            tickangle: -45
        },
        yaxis: {
            title: 'Number of Outliers'
        },
        plot_bgcolor: '#fff',
        paper_bgcolor: '#fff'
    };
    
    Plotly.newPlot(plotDiv, [trace1], layout);
}

// Create trend plot
function createTrendPlot(data) {
    const plotDiv = document.getElementById('plot');
    
    const trace1 = {
        x: data.map(record => record.date),
        y: data.map(record => record.rainfall),
        type: 'scatter',
        mode: 'markers',
        name: 'Daily Rainfall',
        marker: {
            color: '#3498db',
            size: 4
        }
    };
    
    // Calculate trend line
    const trend = calculateTrend(data);
    
    const trace2 = {
        x: [data[0].date, data[data.length - 1].date],
        y: [trend.start, trend.end],
        type: 'scatter',
        mode: 'lines',
        name: 'Trend',
        line: {
            color: '#e74c3c'
        }
    };
    
    const layout = {
        title: 'Rainfall Trend Analysis',
        xaxis: {
            title: 'Date'
        },
        yaxis: {
            title: 'Rainfall (mm)'
        },
        plot_bgcolor: '#fff',
        paper_bgcolor: '#fff'
    };
    
    Plotly.newPlot(plotDiv, [trace1, trace2], layout);
}

// Update statistics with better error handling
function updateStats(data) {
    const statsDiv = document.getElementById('stats');
    
    if (!data || data.length === 0) {
        statsDiv.innerHTML = `
            <div class="stat-card">
                <h4>Status</h4>
                <p>No data available</p>
            </div>
        `;
        return;
    }

    const rainfallValues = data.map(d => d.rainfall).filter(v => !isNaN(v));
    
    const stats = {
        'Total Days': data.length,
        'Total Rainfall': `${sum(rainfallValues).toFixed(1)} mm`,
        'Average Daily Rainfall': `${(rainfallValues.length > 0 ? mean(rainfallValues).toFixed(1) : 0)} mm`,
        'Maximum Daily Rainfall': `${(rainfallValues.length > 0 ? max(rainfallValues).toFixed(1) : 0)} mm`,
        'Rainy Days': rainfallValues.filter(v => v > 0).length
    };
    
    statsDiv.innerHTML = Object.entries(stats)
        .map(([key, value]) => `
            <div class="stat-card">
                <h4>${key}</h4>
                <p>${value}</p>
            </div>
        `).join('');
}

// Helper functions
function getSeason(date) {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
}

function groupDataByYear(data) {
    const years = {};
    data.forEach(record => {
        const year = record.date.getFullYear();
        years[year] = (years[year] || 0) + record.rainfall;
    });
    return years;
}

function groupDataByYearAndSeason(data) {
    const yearlyData = {};
    
    data.forEach(record => {
        const year = record.date.getFullYear();
        if (!yearlyData[year]) {
            yearlyData[year] = {
                Winter: 0,
                Spring: 0,
                Summer: 0,
                Fall: 0
            };
        }
        yearlyData[year][record.season] += record.rainfall;
    });
    
    return yearlyData;
}

function calculateSeasonalAverages(data) {
    const seasonalSums = {};
    const seasonalCounts = {};
    
    data.forEach(record => {
        if (!seasonalSums[record.season]) {
            seasonalSums[record.season] = 0;
            seasonalCounts[record.season] = 0;
        }
        seasonalSums[record.season] += record.rainfall;
        seasonalCounts[record.season]++;
    });
    
    return Object.keys(seasonalSums).reduce((acc, season) => {
        acc[season] = seasonalSums[season] / seasonalCounts[season];
        return acc;
    }, {});
}

function calculateTrend(data) {
    const x = data.map(d => d.date.getTime());
    const y = data.map(d => d.rainfall);
    
    const n = x.length;
    const sumX = sum(x);
    const sumY = sum(y);
    const sumXY = sum(x.map((x, i) => x * y[i]));
    const sumXX = sum(x.map(x => x * x));
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return {
        slope: slope,
        intercept: intercept,
        start: slope * x[0] + intercept,
        end: slope * x[x.length - 1] + intercept
    };
}

// Basic math helpers
const sum = arr => arr.reduce((a, b) => a + b, 0);
const mean = arr => sum(arr) / arr.length;
const max = arr => Math.max(...arr);

function showError(message) {
    const plotDiv = document.getElementById('plot');
    plotDiv.innerHTML = `<div class="error">${message}</div>`;
}

function calculateOutliersByYear(data) {
    const yearlyData = {};
    
    // Group data by year
    data.forEach(record => {
        const year = record.date.getFullYear();
        if (!yearlyData[year]) {
            yearlyData[year] = [];
        }
        yearlyData[year].push(record.rainfall);
    });
    
    // Calculate outliers for each year
    return Object.keys(yearlyData).reduce((acc, year) => {
        const values = yearlyData[year].sort((a, b) => a - b);
        const q1 = quantile(values, 0.25);
        const q3 = quantile(values, 0.75);
        const iqr = q3 - q1;
        const threshold = q3 + 1.5 * iqr;
        
        acc[year] = {
            count: values.filter(v => v > threshold).length,
            threshold: threshold
        };
        
        return acc;
    }, {});
}

function quantile(arr, q) {
    const sorted = [...arr].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    
    if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
        return sorted[base];
    }
}

function interpolateColor(color1, color2, factor) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    
    const r = Math.round(c1.r + factor * (c2.r - c1.r));
    const g = Math.round(c1.g + factor * (c2.g - c1.g));
    const b = Math.round(c1.b + factor * (c2.b - c1.b));
    
    return `rgb(${r},${g},${b})`;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function useBackupData() {
    // Implement the logic to use backup data
    console.log('Using backup data');
    // Placeholder for backup data
}

// Create all plots
function createPlots(data) {
    createAnnualRainfallPlot(data);
    createSeasonalRainfallPlot(data);
    createMonthlyRainfallPlot(data);
    createOutlierPlot(data);
}

// Create annual rainfall plot
function createAnnualRainfallPlot(data) {
    const annualData = {};
    data.forEach(record => {
        const year = record.date.getFullYear();
        annualData[year] = (annualData[year] || 0) + record.rainfall;
    });

    const years = Object.keys(annualData);
    const values = Object.values(annualData);

    const trace = {
        x: years,
        y: values,
        type: 'bar',
        marker: {
            color: '#3498db'
        }
    };

    const layout = {
        title: 'Total Annual Rainfall in Bologna',
        xaxis: {
            title: 'Year',
            tickangle: -45
        },
        yaxis: {
            title: 'Total Rainfall (mm)'
        },
        showlegend: false
    };

    Plotly.newPlot('annualPlot', [trace], layout);
}

// Create seasonal rainfall plot
function createSeasonalRainfallPlot(data) {
    const seasonalData = {
        Winter: [], Spring: [], Summer: [], Fall: []
    };

    data.forEach(record => {
        const month = record.date.getMonth();
        const season = getSeason(month);
        seasonalData[season].push(record.rainfall);
    });

    const seasons = Object.keys(seasonalData);
    const averages = seasons.map(season => 
        mean(seasonalData[season])
    );

    const trace = {
        x: seasons,
        y: averages,
        type: 'bar',
        marker: {
            color: ['#2196f3', '#4caf50', '#f44336', '#ff9800']
        }
    };

    const layout = {
        title: 'Average Seasonal Rainfall',
        xaxis: {
            title: 'Season'
        },
        yaxis: {
            title: 'Average Rainfall (mm)'
        },
        showlegend: false
    };

    Plotly.newPlot('seasonalPlot', [trace], layout);
}

// Create monthly rainfall plot
function createMonthlyRainfallPlot(data) {
    const monthlyData = Array(12).fill().map(() => []);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    data.forEach(record => {
        const month = record.date.getMonth();
        monthlyData[month].push(record.rainfall);
    });

    const medians = monthlyData.map(values => median(values));

    const trace = {
        x: monthNames,
        y: medians,
        type: 'bar',
        marker: {
            color: monthNames.map((_, i) => 
                `hsl(${(i * 360 / 12)}, 70%, 50%)`
            )
        }
    };

    const layout = {
        title: 'Median Monthly Rainfall',
        xaxis: {
            title: 'Month'
        },
        yaxis: {
            title: 'Median Rainfall (mm)'
        },
        showlegend: false
    };

    Plotly.newPlot('monthlyPlot', [trace], layout);
}

// Create outlier plot
function createOutlierPlot(data) {
    const yearlyOutliers = {};
    
    // Group data by year
    data.forEach(record => {
        const year = record.date.getFullYear();
        if (!yearlyOutliers[year]) {
            yearlyOutliers[year] = [];
        }
        yearlyOutliers[year].push(record.rainfall);
    });

    // Calculate outliers for each year
    const outlierCounts = {};
    Object.entries(yearlyOutliers).forEach(([year, values]) => {
        const q1 = quantile(values, 0.25);
        const q3 = quantile(values, 0.75);
        const iqr = q3 - q1;
        const threshold = q3 + 1.5 * iqr;
        
        outlierCounts[year] = values.filter(v => v > threshold).length;
    });

    const trace = {
        x: Object.keys(outlierCounts),
        y: Object.values(outlierCounts),
        type: 'bar',
        marker: {
            color: '#e74c3c'
        }
    };

    const layout = {
        title: 'Frequency of Outlier Rainfall Events by Year',
        xaxis: {
            title: 'Year',
            tickangle: -45
        },
        yaxis: {
            title: 'Number of Outliers'
        },
        showlegend: false
    };

    Plotly.newPlot('outliersPlot', [trace], layout);
}

// Helper functions
function getSeason(month) {
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
}

function mean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
        ? (sorted[mid - 1] + sorted[mid]) / 2 
        : sorted[mid];
}

function quantile(arr, q) {
    const sorted = [...arr].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    
    if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
        return sorted[base];
    }
} 