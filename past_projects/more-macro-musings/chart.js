// Load and process the data
async function loadData() {
    const response = await fetch('data/processed_inactivity.json');
    return await response.json();
}

// Initialize the total participation rate chart
async function initTotalParticipationChart() {
    const data = await loadData();
    const ctx = document.getElementById('totalParticipationChart').getContext('2d');
    
    const chartData = {
        labels: data.timePoints,
        datasets: [{
            label: 'Total Labor Force Participation',
            data: data.series.total['15-64'] || [],
            borderColor: 'rgba(52, 152, 219, 0.8)',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            fill: true
        }]
    };

    const chart = new Chart(ctx, {
        type: 'line',
        data: chartData,
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
                    text: 'Italian Labor Force Participation Rate (Ages 15-64)',
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
                            return `Participation Rate: ${context.raw.toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' },
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' },
                        callback: function(value) {
                            return value.toFixed(1) + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Labor Force Participation Rate (%)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' }
                    }
                }
            }
        }
    });
}

// Initialize the gender participation rate chart
async function initGenderParticipationChart() {
    const data = await loadData();
    const ctx = document.getElementById('genderParticipationChart').getContext('2d');
    
    const chartData = {
        labels: data.timePoints,
        datasets: [
            {
                label: 'Male',
                data: data.series.male['15-64'] || [],
                borderColor: 'rgba(52, 152, 219, 0.8)', // Blue
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                hidden: false
            },
            {
                label: 'Female',
                data: data.series.female['15-64'] || [],
                borderColor: 'rgba(231, 76, 60, 0.8)', // Red
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                hidden: false
            }
        ]
    };

    const chart = new Chart(ctx, {
        type: 'line',
        data: chartData,
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
                    text: 'Labor Force Participation Rate by Gender (Ages 15-64)',
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
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { family: 'Space Mono' },
                    bodyFont: { family: 'Space Mono' },
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' },
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' },
                        callback: function(value) {
                            return value.toFixed(1) + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Labor Force Participation Rate (%)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' }
                    }
                }
            }
        }
    });
}

// Initialize the age group participation rate chart
async function initAgeParticipationChart() {
    const data = await loadData();
    const ctx = document.getElementById('ageParticipationChart').getContext('2d');
    
    // Select key age groups for clearer visualization
    const keyAgeGroups = ['15-24', '25-54', '55-64', '65-74'];
    const colors = [
        'rgba(52, 152, 219, 0.8)',   // Blue
        'rgba(46, 204, 113, 0.8)',   // Green
        'rgba(241, 196, 15, 0.8)',   // Yellow
        'rgba(231, 76, 60, 0.8)'     // Red
    ];

    const chartData = {
        labels: data.timePoints,
        datasets: keyAgeGroups.map((age, index) => ({
            label: `Ages ${age}`,
            data: data.series.total[age],
            borderColor: colors[index],
            backgroundColor: colors[index].replace('0.8', '0.1'),
            hidden: false
        }))
    };

    const chart = new Chart(ctx, {
        type: 'line',
        data: chartData,
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
                    text: 'Labor Force Participation Rate by Age Group',
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
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { family: 'Space Mono' },
                    bodyFont: { family: 'Space Mono' },
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' },
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' },
                        callback: function(value) {
                            return value.toFixed(1) + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Labor Force Participation Rate (%)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' }
                    }
                }
            }
        }
    });
}

// Initialize the Beveridge curve chart
async function initBeveridgeChart() {
    const response = await fetch('data/beveridge_curve.json');
    const data = await response.json();
    
    const ctx = document.getElementById('beveridgeChart').getContext('2d');
    
    const chartData = {
        datasets: [{
            label: 'Beveridge Curve',
            data: data.points.map(point => ({
                x: point.unemployment,
                y: point.vacancy,
                year: point.year
            })),
            borderColor: 'rgba(52, 152, 219, 0.8)',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            pointBackgroundColor: 'rgba(52, 152, 219, 0.8)',
            pointRadius: 6,
            pointHoverRadius: 8,
            showLine: true // Connect points with a line
        }]
    };

    const chart = new Chart(ctx, {
        type: 'scatter',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: true,
                mode: 'point'
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Italian Beveridge Curve (2016-2023)',
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
                            const point = context.raw;
                            return [
                                `Year: ${point.year}`,
                                `Unemployment Rate: ${point.x.toFixed(1)}%`,
                                `Vacancy Rate: ${point.y.toFixed(1)}%`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Unemployment Rate (%)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' },
                        callback: function(value) {
                            return value.toFixed(1) + '%';
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Job Vacancy Rate (%)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { family: 'Space Mono' },
                        callback: function(value) {
                            return value.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
}

// Add download functionality
function initDownloadButtons() {
    document.getElementById('downloadParticipationData').addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = 'data/eurostat_inactivity_rates.tsv';
        link.download = 'eurostat_inactivity_rates.tsv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    document.getElementById('downloadBeveridgeData').addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = 'data/Long-term unemployment rate.tsv';
        link.download = 'Long-term unemployment rate.tsv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initTotalParticipationChart();
    initGenderParticipationChart();
    initAgeParticipationChart();
    initBeveridgeChart();
    initDownloadButtons();
}); 