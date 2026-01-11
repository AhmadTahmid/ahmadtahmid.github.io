/**
 * THE ECONOMIST'S SKILL TREE V3
 * Gamified Character Builder
 */

// ========== STATE ==========
let gameState = {
    availablePoints: 0,
    pathways: {
        theory: 0,
        math: 0,
        software: 0
    }
};

let gameData = null;

// ========== CONSTANTS ==========
const MAX_PATHWAY_POINTS = 10;
const PATHWAY_COLORS = {
    theory: '#818cf8',
    math: '#4ade80',
    software: '#fbbf24'
};

// ========== INITIALIZATION ==========
async function init() {
    try {
        // Load game data
        const response = await fetch('data.json');
        gameData = await response.json();

        // Render initial UI
        renderPathways();
        renderClasses();
        updatePointsDisplay();

        // Set up event listeners
        setupEventListeners();

        console.log('🎮 Economist Skill Tree V3 initialized!');
    } catch (error) {
        console.error('Failed to load game data:', error);
    }
}

function setupEventListeners() {
    // Add point button
    document.getElementById('add-point-btn').addEventListener('click', addPoint);

    // Reset button
    document.getElementById('reset-btn').addEventListener('click', resetGame);

    // Modal close
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    // Keyboard escape to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

// ========== POINT MANAGEMENT ==========
function addPoint() {
    gameState.availablePoints++;
    updatePointsDisplay();

    // Visual feedback
    const pointsValue = document.getElementById('available-points');
    pointsValue.classList.add('point-added');
    setTimeout(() => pointsValue.classList.remove('point-added'), 500);

    // Re-render to update button states
    renderPathways();
}

function allocatePoint(pathway) {
    if (gameState.availablePoints <= 0) return;
    if (gameState.pathways[pathway] >= MAX_PATHWAY_POINTS) return;

    gameState.availablePoints--;
    gameState.pathways[pathway]++;

    updatePointsDisplay();
    renderPathways();
    renderClasses();

    // Check for newly unlocked classes
    checkUnlocks();
}

function resetGame() {
    gameState = {
        availablePoints: 0,
        pathways: {
            theory: 0,
            math: 0,
            software: 0
        }
    };

    updatePointsDisplay();
    renderPathways();
    renderClasses();
}

// ========== RENDERING ==========
function updatePointsDisplay() {
    document.getElementById('available-points').textContent = gameState.availablePoints;
}

function renderPathways() {
    const grid = document.getElementById('pathways-grid');
    grid.innerHTML = '';

    Object.entries(gameData.pathways).forEach(([key, pathway]) => {
        const points = gameState.pathways[key];
        const percentage = (points / MAX_PATHWAY_POINTS) * 100;
        const canAllocate = gameState.availablePoints > 0 && points < MAX_PATHWAY_POINTS;

        const card = document.createElement('div');
        card.className = 'pathway-card';
        card.style.setProperty('--pathway-color', PATHWAY_COLORS[key]);

        card.innerHTML = `
            <div class="pathway-header">
                <div class="pathway-name">
                    <span class="pathway-icon">${pathway.icon}</span>
                    <span class="pathway-title">${pathway.name}</span>
                </div>
                <span class="pathway-points">${points}/${MAX_PATHWAY_POINTS}</span>
            </div>
            <div class="pathway-bar-container">
                <div class="pathway-bar" style="width: ${percentage}%"></div>
            </div>
            <div class="pathway-actions">
                <button class="allocate-btn" ${!canAllocate ? 'disabled' : ''} data-pathway="${key}">
                    + Allocate Point
                </button>
                <button class="view-skills-btn" data-pathway="${key}">
                    View Skills →
                </button>
            </div>
        `;

        // Event listeners
        card.querySelector('.allocate-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            allocatePoint(key);
        });

        card.querySelector('.view-skills-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            showPathwayDetails(key);
        });

        grid.appendChild(card);
    });
}

function renderClasses() {
    const grid = document.getElementById('classes-grid');
    grid.innerHTML = '';

    gameData.classes.forEach(cls => {
        const status = getClassStatus(cls);
        const card = document.createElement('div');
        card.className = `class-card ${status.unlocked ? 'unlocked' : 'locked'}`;

        card.innerHTML = `
            <div class="class-header">
                <span class="class-icon">${cls.icon}</span>
                <div class="class-info">
                    <div class="class-name">${cls.name}</div>
                    <div class="class-tagline">${cls.tagline}</div>
                </div>
            </div>
            <div class="class-requirements">
                ${renderRequirements(cls.requirements)}
            </div>
        `;

        card.addEventListener('click', () => showClassDetails(cls));

        grid.appendChild(card);
    });
}

function renderRequirements(requirements) {
    return Object.entries(requirements).map(([pathway, required]) => {
        const current = gameState.pathways[pathway];
        const met = current >= required;
        const icon = gameData.pathways[pathway]?.icon || '📊';

        return `
            <span class="req-badge ${met ? 'met' : 'unmet'}">
                <span class="req-icon">${icon}</span>
                ${current}/${required}
            </span>
        `;
    }).join('');
}

function getClassStatus(cls) {
    const reqs = cls.requirements;
    const unlocked = Object.entries(reqs).every(([pathway, required]) => {
        return gameState.pathways[pathway] >= required;
    });

    return { unlocked };
}

// ========== UNLOCK CHECKING ==========
let previouslyUnlocked = new Set();

function checkUnlocks() {
    gameData.classes.forEach(cls => {
        const status = getClassStatus(cls);

        if (status.unlocked && !previouslyUnlocked.has(cls.id)) {
            // Newly unlocked!
            previouslyUnlocked.add(cls.id);
            celebrateUnlock(cls);
        }
    });
}

function celebrateUnlock(cls) {
    // Find the card and add animation
    const cards = document.querySelectorAll('.class-card');
    cards.forEach(card => {
        if (card.querySelector('.class-name').textContent === cls.name) {
            card.classList.add('just-unlocked');
            setTimeout(() => card.classList.remove('just-unlocked'), 3000);
        }
    });
}

// ========== MODALS ==========
function showClassDetails(cls) {
    const status = getClassStatus(cls);
    const content = document.getElementById('modal-content');

    content.innerHTML = `
        <div class="modal-class-header">
            <span class="modal-class-icon">${cls.icon}</span>
            <div>
                <div class="modal-class-name">${cls.name}</div>
                <div class="modal-class-tagline">${cls.tagline}</div>
            </div>
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">Description</div>
            <p class="modal-description">${cls.description}</p>
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">Top Employers</div>
            <div class="modal-employers">
                ${cls.employers.map(e => `<span class="employer-tag">${e}</span>`).join('')}
            </div>
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">Salary Range</div>
            <div class="modal-salary">
                <span class="salary-badge us">🇺🇸 ${cls.salaryUS}</span>
                <span class="salary-badge eu">🇪🇺 ${cls.salaryEU}</span>
            </div>
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">Key Skills Needed</div>
            <div class="modal-employers">
                ${cls.keySkills.map(s => `<span class="employer-tag">${s}</span>`).join('')}
            </div>
        </div>
        
        ${status.unlocked ? `
            <div class="modal-section">
                <div class="modal-section-title">🎯 Special Abilities Unlocked</div>
                <ul class="modal-abilities">
                    ${cls.specialAbilities.map(a => `<li>${a}</li>`).join('')}
                </ul>
            </div>
        ` : `
            <div class="modal-section">
                <div class="modal-section-title">🔒 Special Abilities (Locked)</div>
                <p class="modal-description" style="opacity: 0.5;">
                    Meet the pathway requirements to unlock ${cls.specialAbilities.length} special abilities.
                </p>
            </div>
        `}
        
        <div class="modal-section">
            <div class="modal-section-title">⚠️ The Hidden Requirement</div>
            <div class="hidden-requirement">${cls.hiddenRequirement}</div>
        </div>
    `;

    openModal();
}

function showPathwayDetails(pathwayKey) {
    const pathway = gameData.pathways[pathwayKey];
    const content = document.getElementById('modal-content');

    content.innerHTML = `
        <div class="modal-pathway-header" style="--pathway-color: ${PATHWAY_COLORS[pathwayKey]}">
            <span class="modal-pathway-icon">${pathway.icon}</span>
            <div>
                <div class="modal-pathway-name">${pathway.name}</div>
                <div class="modal-pathway-desc">${pathway.description}</div>
            </div>
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">Skills in This Pathway</div>
            <div class="skill-list">
                ${pathway.skills.map(skill => `
                    <div class="skill-item" style="--pathway-color: ${PATHWAY_COLORS[pathwayKey]}">
                        <div class="skill-header">
                            <span class="skill-name">${skill.name}</span>
                            <span class="skill-level">Level ${skill.level}</span>
                        </div>
                        <p class="skill-description">${skill.description}</p>
                        <div class="skill-tip">💡 ${skill.tip}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    openModal();
}

function openModal() {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.body.style.overflow = '';
}

// ========== START ==========
document.addEventListener('DOMContentLoaded', init);
