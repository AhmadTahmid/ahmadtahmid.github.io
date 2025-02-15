// ISTAT API Configuration
const ISTAT_BASE_URL = 'http://sdmx.istat.it/SDMXWS/rest/data/';
const WAGE_DATASET = '115_362'; // Example dataset ID for wages
const PRODUCTIVITY_DATASET = '120_376'; // Example dataset ID for productivity

// Sample data for wages
const wageData = {
    labels: ['1950', '1955', '1960', '1965', '1970', '1975', '1980', '1985', '1990', '1995', '2000', '2005', '2010', '2015', '2020', '2025'],
    datasets: [{
        label: 'Real Wage Index (2015=100)',
        data: [25, 30, 38, 45, 55, 65, 75, 82, 88, 92, 95, 98, 99, 100, 98, 97],
        borderColor: 'rgba(255, 255, 255, 0.8)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
    }]
};

// Productivity data from ISTAT Table 2
const productivityData = {
    // Group the data into meaningful categories
    longTerm: {
        periods: ['1995-2023', '1995-2022', '1995-2019', '1995-2014', '1995-2009', '1995-2000'],
        values: [0.419, -0.365, 0.960, 0.481, 1.011, -2.524],
        color: 'rgba(52, 152, 219, 0.8)' // Blue
    },
    mediumTerm: {
        periods: ['2000-2023', '2000-2022', '2000-2019', '2000-2014', '2000-2009'],
        values: [0.907, -0.238, -0.281, 1.663, 6.248],
        color: 'rgba(46, 204, 113, 0.8)' // Green
    },
    recentTerm: {
        periods: ['2009-2023', '2009-2022', '2009-2019', '2009-2014', '2014-2023', '2014-2022', '2014-2019'],
        values: [0.167, 0.486, 0.127, -1.229, 1.176, 5.237, 2.691],
        color: 'rgba(241, 196, 15, 0.8)' // Yellow
    }
};

// Real Income data from Eurostat
const realIncomeData = {
    labels: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
    datasets: [{
        label: 'Real Income Index (2010=100)',
        data: [90.53, 92.74, 94.45, 94.93, 95.54, 99.94, 97.12, 101.00, 99.03, null],
        borderColor: 'rgba(255, 99, 132, 0.8)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
    }]
};

// Combined visualization data
const combinedData = {
    labels: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
    datasets: [
        {
            label: 'Real Income Index (2010=100)',
            data: [90.53, 92.74, 94.45, 94.93, 95.54, 99.94, 97.12, 101.00, 99.03, null],
            borderColor: 'rgba(255, 99, 132, 0.8)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            yAxisID: 'y'
        },
        {
            label: 'Recent Growth (2014-2023)',
            data: Array(9).fill(1.176), // Fill with the growth rate for this period
            borderColor: 'rgba(241, 196, 15, 0.3)',
            backgroundColor: 'rgba(241, 196, 15, 0.1)',
            borderWidth: 1,
            fill: true,
            tension: 0,
            yAxisID: 'y1'
        },
        {
            label: 'Medium-term Growth (2009-2023)',
            data: Array(9).fill(0.167), // Fill with the growth rate for this period
            borderColor: 'rgba(46, 204, 113, 0.3)',
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            borderWidth: 1,
            fill: true,
            tension: 0,
            yAxisID: 'y1'
        },
        {
            label: 'Long-term Growth (1995-2023)',
            data: Array(9).fill(0.419), // Fill with the growth rate for this period
            borderColor: 'rgba(52, 152, 219, 0.3)',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            borderWidth: 1,
            fill: true,
            tension: 0,
            yAxisID: 'y1'
        }
    ]
};

// Chart state
let currentView = 'all';

// Fetch data from ISTAT API
async function fetchIstatData(datasetId, startYear = '1950', endYear = '2025') {
    try {
        const response = await fetch(`${ISTAT_BASE_URL}/${datasetId}/.....${startYear}/${endYear}`);
        if (!response.ok) throw new Error('Data fetch failed');
        const data = await response.json();
        return processIstatData(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// Process ISTAT data into chart format
function processIstatData(rawData) {
    // Process the SDMX-JSON format from ISTAT
    // This will need to be adjusted based on actual API response structure
    return {
        labels: [], // Years
        values: []  // Corresponding values
    };
}

// Initialize charts
document.addEventListener('DOMContentLoaded', () => {
    // Initialize productivity chart
    const prodCtx = document.getElementById('productivityChart').getContext('2d');
    
    // Create datasets for the productivity chart
    const prodDatasets = [
        {
            label: 'Long-term Growth (1995+)',
            data: productivityData.longTerm.values,
            backgroundColor: productivityData.longTerm.color,
            categoryPercentage: 0.8,
            barPercentage: 0.9
        },
        {
            label: 'Medium-term Growth (2000+)',
            data: Array(6).fill(null).concat(productivityData.mediumTerm.values),
            backgroundColor: productivityData.mediumTerm.color,
            categoryPercentage: 0.8,
            barPercentage: 0.9
        },
        {
            label: 'Recent Growth (2009+)',
            data: Array(11).fill(null).concat(productivityData.recentTerm.values),
            backgroundColor: productivityData.recentTerm.color,
            categoryPercentage: 0.8,
            barPercentage: 0.9
        }
    ];

    // Combine all periods for productivity x-axis
    const allPeriods = [
        ...productivityData.longTerm.periods,
        ...productivityData.mediumTerm.periods,
        ...productivityData.recentTerm.periods
    ];

    const prodChart = new Chart(prodCtx, {
        type: 'bar',
        data: {
            labels: allPeriods,
            datasets: prodDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Italian Labor Productivity Growth Rates by Time Period',
                    color: 'rgba(255, 255, 255, 0.8)',
                    font: {
                        family: 'Space Mono',
                        size: 16
                    },
                    padding: 20
                },
                subtitle: {
                    display: true,
                    text: 'Grouped by long-term, medium-term, and recent periods',
                    color: 'rgba(255, 255, 255, 0.6)',
                    font: {
                        family: 'Space Mono',
                        size: 12
                    },
                    padding: 10
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' },
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { family: 'Space Mono' },
                    bodyFont: { family: 'Space Mono' },
                    callbacks: {
                        label: function(context) {
                            if (context.raw === null) return '';
                            return `Growth Rate: ${context.raw.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' },
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' },
                        callback: function(value) {
                            return value.toFixed(1) + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Average Growth Rate (%)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' }
                    }
                }
            }
        }
    });

    // Initialize real income chart
    const incomeCtx = document.getElementById('incomeChart').getContext('2d');
    const incomeChart = new Chart(incomeCtx, {
        type: 'line',
        data: realIncomeData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Italian Real Income Index (2010=100)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    font: {
                        family: 'Space Mono',
                        size: 16
                    },
                    padding: 20
                },
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { family: 'Space Mono' },
                    bodyFont: { family: 'Space Mono' },
                    callbacks: {
                        label: function(context) {
                            if (context.raw === null) return 'No data';
                            return `Index: ${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' }
                    }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' }
                    },
                    title: {
                        display: true,
                        text: 'Index (2010=100)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' }
                    }
                }
            }
        }
    });

    // Initialize combined chart
    const combinedCtx = document.getElementById('combinedChart').getContext('2d');
    const combinedChart = new Chart(combinedCtx, {
        type: 'line',
        data: combinedData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Real Income vs Productivity Growth',
                    color: 'rgba(255, 255, 255, 0.8)',
                    font: {
                        family: 'Space Mono',
                        size: 16
                    },
                    padding: 20
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' },
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { family: 'Space Mono' },
                    bodyFont: { family: 'Space Mono' },
                    callbacks: {
                        label: function(context) {
                            if (context.raw === null) return 'No data';
                            if (context.dataset.yAxisID === 'y') {
                                return `Income Index: ${context.raw.toFixed(2)}`;
                            } else {
                                return `Growth Rate: ${context.raw.toFixed(2)}%`;
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' }
                    }
                },
                y: {
                    position: 'left',
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' }
                    },
                    title: {
                        display: true,
                        text: 'Real Income Index (2010=100)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' }
                    }
                },
                y1: {
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' }
                    },
                    title: {
                        display: true,
                        text: 'Productivity Growth Rate (%)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' }
                    }
                }
            }
        }
    });

    // Download functionality for real income data
    document.getElementById('downloadIncomeData').addEventListener('click', () => {
        // Create a link to download the Eurostat Excel file
        const link = document.createElement("a");
        link.setAttribute("href", "data/eurostat_real_income_2013_2015.xlsx");
        link.setAttribute("download", "eurostat_real_income_2013_2015.xlsx");
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Download functionality for productivity data
    document.getElementById('downloadProdData').addEventListener('click', () => {
        // Create a link to download the ISTAT Excel file
        const link = document.createElement("a");
        link.setAttribute("href", "data/Tavole_misure_di_produttivita_Rel24b-Diffusione.xlsx");
        link.setAttribute("download", "Tavole_misure_di_produttivita_Rel24b-Diffusione.xlsx");
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Initialize methodology chart (dual-axis approach)
    const methodologyCtx = document.getElementById('methodologyChart').getContext('2d');
    const methodologyChart = new Chart(methodologyCtx, {
        type: 'line',
        data: {
            labels: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'],
            datasets: [
                {
                    label: 'Real Income Index',
                    data: [90.53, 92.74, 94.45, 94.93, 95.54, 99.94, 97.12, 101.00, 99.03],
                    borderColor: 'rgba(255, 192, 203, 0.8)',
                    backgroundColor: 'rgba(255, 192, 203, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    yAxisID: 'y',
                    type: 'line'
                },
                {
                    label: '1995-2023 Growth',
                    data: Array(9).fill(0.419),
                    borderColor: 'rgba(52, 152, 219, 0.4)',
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderWidth: 1,
                    fill: true,
                    yAxisID: 'y1'
                },
                {
                    label: '2009-2023 Growth',
                    data: Array(9).fill(0.167),
                    borderColor: 'rgba(46, 204, 113, 0.4)',
                    backgroundColor: 'rgba(46, 204, 113, 0.2)',
                    borderWidth: 1,
                    fill: true,
                    yAxisID: 'y1'
                },
                {
                    label: '2014-2023 Growth',
                    data: Array(9).fill(1.176),
                    borderColor: 'rgba(241, 196, 15, 0.4)',
                    backgroundColor: 'rgba(241, 196, 15, 0.2)',
                    borderWidth: 1,
                    fill: true,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Real Income vs Productivity Growth Periods',
                    color: 'rgba(255, 255, 255, 0.8)',
                    font: {
                        family: 'Space Mono',
                        size: 16
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    callbacks: {
                        label: function(context) {
                            if (context.dataset.yAxisID === 'y') {
                                return `Income Index: ${context.raw.toFixed(2)}`;
                            } else {
                                return `Growth Rate: ${context.raw.toFixed(3)}%`;
                            }
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Real Income Index (2010=100)',
                        color: 'rgba(255, 255, 255, 0.8)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Productivity Growth Rate (%)',
                        color: 'rgba(255, 255, 255, 0.8)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });

    // Initialize timeline visualization
    const timelineCtx = document.getElementById('timelineChart').getContext('2d');
    const timelineChart = new Chart(timelineCtx, {
        type: 'line',
        data: {
            labels: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'],
            datasets: [
                {
                    label: 'Real Income Index',
                    data: [90.53, 92.74, 94.45, 94.93, 95.54, 99.94, 97.12, 101.00, 99.03],
                    borderColor: 'rgba(255, 192, 203, 0.8)',
                    backgroundColor: 'rgba(255, 192, 203, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    type: 'line',
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Timeline: Real Income and Productivity Growth Periods',
                    color: 'rgba(255, 255, 255, 0.8)',
                    font: {
                        family: 'Space Mono',
                        size: 16
                    }
                },
                annotation: {
                    annotations: {
                        box1: {
                            type: 'box',
                            xMin: '2014',
                            xMax: '2023',
                            backgroundColor: 'rgba(241, 196, 15, 0.1)',
                            borderColor: 'rgba(241, 196, 15, 0.4)',
                            label: {
                                content: '2014-2023: +1.176%',
                                position: 'start'
                            }
                        },
                        box2: {
                            type: 'box',
                            xMin: '2009',
                            xMax: '2023',
                            backgroundColor: 'rgba(46, 204, 113, 0.1)',
                            borderColor: 'rgba(46, 204, 113, 0.4)',
                            label: {
                                content: '2009-2023: +0.167%',
                                position: 'start'
                            }
                        },
                        box3: {
                            type: 'box',
                            xMin: '1995',
                            xMax: '2023',
                            backgroundColor: 'rgba(52, 152, 219, 0.1)',
                            borderColor: 'rgba(52, 152, 219, 0.4)',
                            label: {
                                content: '1995-2023: +0.419%',
                                position: 'start'
                            }
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Real Income Index (2010=100)',
                        color: 'rgba(255, 255, 255, 0.8)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}); 