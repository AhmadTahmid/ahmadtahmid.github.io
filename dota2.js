// Configuration
const config = {
    steamId: '1470057077'      // Steam32 ID
};

// API Endpoints
const OPENDOTA_API_BASE = 'https://api.opendota.com/api';

// Fetch options - Remove CORS headers as they're causing issues
const fetchOptions = {
    headers: {
        'Accept': 'application/json'
    }
};

// Hero data mapping
const heroData = {};

// DOM Elements
const elements = {
    playerName: document.getElementById('player-name'),
    playerRank: document.getElementById('player-rank'),
    playerAvatar: document.getElementById('player-avatar'),
    winRate: document.getElementById('win-rate'),
    totalMatches: document.getElementById('total-matches'),
    favoriteHero: document.getElementById('favorite-hero'),
    bestWinrate: document.getElementById('best-winrate'),
    matchesList: document.getElementById('matches-list'),
    heroStatsGrid: document.getElementById('hero-stats-grid'),
    performanceChart: document.getElementById('performance-chart')
};

// Loading indicator
function showLoading() {
    const loader = document.createElement('div');
    loader.className = 'loading-indicator';
    loader.innerHTML = `
        <span class="loading-spinner"></span>
        Loading Dota 2 Stats...
    `;
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.querySelector('.loading-indicator');
    if (loader) {
        loader.remove();
    }
}

// Initialize hero data
async function initializeHeroData() {
    try {
        const response = await fetch(`${OPENDOTA_API_BASE}/constants/heroes`);
        if (!response.ok) throw new Error('Failed to fetch hero data');
        const heroes = await response.json();
        Object.values(heroes).forEach(hero => {
            heroData[hero.id] = {
                name: hero.localized_name,
                icon: `https://api.opendota.com/apps/dota2/images/heroes/${hero.name.replace('npc_dota_hero_', '')}_full.png`
            };
        });
    } catch (error) {
        console.error('Error loading hero data:', error);
        // Fallback to empty hero data rather than failing completely
        Object.assign(heroData, {});
    }
}

// Get hero name from ID
function getHeroName(heroId) {
    return heroData[heroId]?.name || 'Unknown Hero';
}

// Get hero icon URL
function getHeroIcon(heroId) {
    return heroData[heroId]?.icon || '';
}

// Find favorite hero from stats
function getFavoriteHero(heroStats) {
    if (!heroStats || heroStats.length === 0) return { name: 'None', games: 0 };
    const sorted = [...heroStats].sort((a, b) => b.games - a.games);
    const favorite = sorted[0];
    return {
        name: getHeroName(favorite.hero_id),
        games: favorite.games
    };
}

// Find best hero (by winrate, minimum 10 games)
function getBestHero(heroStats) {
    if (!heroStats || heroStats.length === 0) return { name: 'None', winRate: 0 };
    const qualified = heroStats.filter(hero => hero.games >= 10);
    if (qualified.length === 0) return { name: 'None', winRate: 0 };
    const sorted = [...qualified].sort((a, b) => (b.win / b.games) - (a.win / a.games));
    const best = sorted[0];
    return {
        name: getHeroName(best.hero_id),
        winRate: ((best.win / best.games) * 100).toFixed(1)
    };
}

// Update hero stats section
function updateHeroStats(heroStats) {
    if (!heroStats || heroStats.length === 0) {
        elements.heroStatsGrid.innerHTML = '<p>No hero statistics available</p>';
        return;
    }

    elements.heroStatsGrid.innerHTML = '';
    
    const topHeroes = [...heroStats]
        .sort((a, b) => b.games - a.games)
        .slice(0, 8);
        
    topHeroes.forEach(hero => {
        const winRate = ((hero.win / hero.games) * 100).toFixed(1);
        const heroCard = document.createElement('div');
        heroCard.className = 'hero-card';
        heroCard.innerHTML = `
            <img src="${getHeroIcon(hero.hero_id)}" alt="${getHeroName(hero.hero_id)}">
            <h4>${getHeroName(hero.hero_id)}</h4>
            <p>${hero.games} games</p>
            <p>${winRate}% win rate</p>
        `;
        elements.heroStatsGrid.appendChild(heroCard);
    });
}

// Fetch player data
async function fetchOpenDotaPlayerData() {
    const response = await fetch(`https://api.opendota.com/api/players/${config.steamId}`);
    if (!response.ok) throw new Error('Failed to fetch OpenDota player data');
    return response.json();
}

// Fetch recent matches
async function fetchRecentMatches() {
    const response = await fetch(`https://api.opendota.com/api/players/${config.steamId}/recentMatches`);
    if (!response.ok) throw new Error('Failed to fetch recent matches');
    return response.json();
}

// Fetch hero stats
async function fetchHeroStats() {
    const response = await fetch(`https://api.opendota.com/api/players/${config.steamId}/heroes`);
    if (!response.ok) throw new Error('Failed to fetch hero stats');
    return response.json();
}

// Update player profile section
function updatePlayerProfile(playerData) {
    if (!playerData || !playerData.profile) {
        elements.playerName.textContent = 'Player Not Found';
        elements.playerRank.textContent = 'Rank: Unknown';
        return;
    }

    elements.playerName.textContent = playerData.profile.personaname;
    elements.playerRank.textContent = `Rank: ${getMedalName(playerData.rank_tier)}`;
    
    if (playerData.profile.avatarfull) {
        const avatarImg = document.createElement('img');
        avatarImg.src = playerData.profile.avatarfull;
        avatarImg.alt = 'Player Avatar';
        elements.playerAvatar.innerHTML = '';
        elements.playerAvatar.appendChild(avatarImg);
    }
}

// Update quick stats section
function updateQuickStats(playerData, heroStats) {
    if (!playerData) {
        elements.winRate.textContent = '0%';
        elements.totalMatches.textContent = '0';
        elements.favoriteHero.textContent = 'None';
        elements.bestWinrate.textContent = 'None';
        return;
    }

    const totalGames = (playerData.win || 0) + (playerData.lose || 0);
    const winRate = totalGames > 0 ? ((playerData.win / totalGames) * 100).toFixed(1) : 0;

    elements.winRate.textContent = `${winRate}%`;
    elements.totalMatches.textContent = totalGames;

    const favoriteHero = getFavoriteHero(heroStats);
    const bestHero = getBestHero(heroStats);

    elements.favoriteHero.textContent = favoriteHero.name;
    elements.bestWinrate.textContent = `${bestHero.name} (${bestHero.winRate}%)`;
}

// Update recent matches section
function updateRecentMatches(matches) {
    if (!matches || matches.length === 0) {
        elements.matchesList.innerHTML = '<p>No recent matches found</p>';
        return;
    }

    elements.matchesList.innerHTML = '';
    
    matches.slice(0, 10).forEach(match => {
        const matchCard = createMatchCard(match);
        elements.matchesList.appendChild(matchCard);
    });
}

// Create a match card element
function createMatchCard(match) {
    const card = document.createElement('div');
    card.className = `match-card ${match.player_slot < 128 ? 'radiant' : 'dire'}`;
    
    const result = ((match.player_slot < 128 && match.radiant_win) || 
                   (match.player_slot >= 128 && !match.radiant_win));
    
    card.innerHTML = `
        <span class="match-result ${result ? 'victory' : 'defeat'}">
            ${result ? 'Victory' : 'Defeat'}
        </span>
        <span class="hero-name">${getHeroName(match.hero_id)}</span>
        <span class="kda">${match.kills}/${match.deaths}/${match.assists}</span>
        <span class="duration">${formatDuration(match.duration)}</span>
    `;

    return card;
}

// Create performance chart
function createPerformanceChart(matches) {
    if (!matches || matches.length === 0) return;

    const ctx = elements.performanceChart.getContext('2d');
    
    const data = {
        labels: matches.slice(0, 10).map((_, index) => `Game ${index + 1}`).reverse(),
        datasets: [{
            label: 'KDA Ratio',
            data: matches.slice(0, 10).map(match => 
                ((match.kills + match.assists) / Math.max(1, match.deaths)).toFixed(2)
            ).reverse(),
            borderColor: 'rgba(255, 255, 255, 0.8)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            tension: 0.4
        }]
    };

    new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    }
                }
            }
        }
    });
}

// Helper functions
function getMedalName(rankTier) {
    if (!rankTier) return 'Unranked';
    
    const medals = [
        'Herald', 'Guardian', 'Crusader', 
        'Archon', 'Legend', 'Ancient', 'Divine', 'Immortal'
    ];
    
    const medal = Math.floor(rankTier / 10);
    const stars = rankTier % 10;
    
    return `${medals[medal - 1]} ${stars}`;
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Update error handling to be more informative
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        Failed to load Dota 2 statistics: ${message}<br>
        Please make sure your Steam ID is correct and your profile is public.
    `;
    document.querySelector('.stats-container').prepend(errorDiv);
}

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage); 