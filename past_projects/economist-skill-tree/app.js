/**
 * The Economist's Skill Tree - V2
 * Search, Compare Mode, JEL Specializations
 */

// State
let data = null;
let selectedCareer = null;
let compareMode = false;
let compareCareers = [];
let svg, rootsGroup, linesGroup;
let allSkillPositions = new Map();

const careerFrames = {
    'tech-economist': { practice: 'Marketplace and product economics', question: 'What intervention changes behaviour, and can its effect be measured credibly at scale?', outputs: 'Experiment designs, marketplace diagnostics, causal estimates and product recommendations' },
    'central-banker': { practice: 'Macroeconomic policy', question: 'What is happening in the economy, what might happen next, and how should policy respond under uncertainty?', outputs: 'Forecasts, briefing notes, scenario models and policy analysis' },
    'academic-applied': { practice: 'Applied research', question: 'What can be learned that survives scrutiny, changes a literature and travels beyond one dataset?', outputs: 'Working papers, journal articles, seminars and replications' },
    'development-economist': { practice: 'Development and evaluation', question: 'Which constraints bind, which interventions work, for whom, and under what institutional conditions?', outputs: 'Impact evaluations, field protocols, survey instruments and policy notes' },
    'quant-finance': { practice: 'Markets and quantitative finance', question: 'How should uncertainty, dependence and incentives be modelled when decisions are priced continuously?', outputs: 'Pricing and risk models, forecasts, model validation and production code' },
    'labor-economist': { practice: 'Labour and human capital', question: 'How do institutions, firms and policy shape work, wages, mobility and unequal opportunity?', outputs: 'Administrative-data studies, programme evaluations, forecasts and policy briefs' },
    'io-economist': { practice: 'Competition and industrial organisation', question: 'How do market structure and strategic behaviour shape prices, innovation and welfare?', outputs: 'Merger analysis, demand estimates, market simulations and regulatory evidence' },
    'trade-economist': { practice: 'Trade and international economics', question: 'How do borders, firms and policy transmit shocks across places, industries and households?', outputs: 'Trade models, tariff analysis, gravity estimates and policy scenarios' }
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        data = await loadData();
        createForest();
        setupSVG();
        renderAllSkills();
        setupTooltip();
        setupSearch();
        setupCompareMode();
    } catch (error) {
        console.error('Failed to initialize:', error);
    }
}

// Data loading
async function loadData() {
    const response = await fetch('skills.json');
    if (!response.ok) throw new Error('Failed to load skills data');
    return response.json();
}

// Create the forest of career trees
function createForest() {
    const forest = document.getElementById('forest');

    data.careers.forEach((career, index) => {
        const tree = document.createElement('div');
        tree.className = 'tree';
        tree.dataset.careerId = career.id;
        tree.style.animationDelay = `${index * 0.1}s`;
        tree.tabIndex = 0;
        tree.setAttribute('role', 'button');
        tree.setAttribute('aria-label', `Trace the ${career.name} path`);

        tree.innerHTML = `
            <div class="tree-crown" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
            <div class="tree-trunk"></div>
            <div class="tree-label">${career.name}</div>
            <div class="tree-code">${career.jel ? `JEL ${career.jel}` : careerFrames[career.id].practice}</div>
        `;

        tree.addEventListener('click', () => handleTreeClick(career.id));
        tree.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleTreeClick(career.id);
            }
        });
        forest.appendChild(tree);
    });
}

// Handle tree click (normal or compare mode)
function handleTreeClick(careerId) {
    if (compareMode) {
        toggleCompareCareer(careerId);
    } else {
        selectCareer(careerId);
    }
}

// Setup SVG for roots
function setupSVG() {
    const container = document.getElementById('underground');
    const rect = container.getBoundingClientRect();

    svg = d3.select('#roots-svg')
        .attr('width', rect.width || 1200)
        .attr('height', rect.height || 400);

    linesGroup = svg.append('g').attr('class', 'root-lines');
    rootsGroup = svg.append('g').attr('class', 'root-nodes');

    window.addEventListener('resize', debounce(() => {
        const newRect = container.getBoundingClientRect();
        svg.attr('width', newRect.width).attr('height', newRect.height);
        allSkillPositions.clear();
        renderAllSkills();
        if (compareMode && compareCareers.length === 2) {
            highlightComparison();
        } else if (selectedCareer) {
            highlightCareerPath(selectedCareer);
        }
    }, 250));
}

// Render ALL skills (always visible)
function renderAllSkills() {
    rootsGroup.selectAll('*').remove();

    const container = document.getElementById('underground');
    const rect = container.getBoundingClientRect();
    const width = rect.width || 1200;
    const height = rect.height || 400;

    const layerDepths = {
        core: { minY: height * 0.6, maxY: height * 0.85 },
        toolbelt: { minY: height * 0.3, maxY: height * 0.55 },
        specialization: { minY: height * 0.08, maxY: height * 0.28 }
    };

    const skillsByLayer = {
        core: data.skills.filter(s => s.layer === 'core'),
        toolbelt: data.skills.filter(s => s.layer === 'toolbelt'),
        specialization: data.skills.filter(s => s.layer === 'specialization')
    };

    const positioned = [];

    Object.entries(skillsByLayer).forEach(([layer, skills]) => {
        const depth = layerDepths[layer];
        const count = skills.length;
        const spacing = (width - 120) / (count + 1);

        skills.forEach((skill, i) => {
            let pos = allSkillPositions.get(skill.id);
            if (!pos) {
                const x = 60 + spacing * (i + 1);
                const stagger = count > 2 ? (i % 3) / 2 : 0.5;
                const y = depth.minY + (depth.maxY - depth.minY) * (0.22 + stagger * 0.56);
                pos = { x, y };
                allSkillPositions.set(skill.id, pos);
            }

            positioned.push({ ...skill, x: pos.x, y: pos.y });
        });
    });

    const nodes = rootsGroup.selectAll('.root-node')
        .data(positioned)
        .enter()
        .append('g')
        .attr('class', d => `root-node layer-${d.layer}`)
        .attr('data-skill-id', d => d.id)
        .attr('transform', d => `translate(${d.x}, ${d.y})`);

    nodes.append('circle')
        .attr('r', d => d.layer === 'core' ? 26 : d.layer === 'toolbelt' ? 22 : 18);

    nodes.append('text')
        .attr('dy', d => (d.layer === 'core' ? 26 : d.layer === 'toolbelt' ? 22 : 18) + 14)
        .text(d => d.name);

    nodes.on('mouseenter', function (event, d) {
        showTooltip(event, d);
    })
        .on('mousemove', function (event) {
            moveTooltip(event);
        })
        .on('mouseleave', function () {
            hideTooltip();
        });
}

// --- SEARCH FUNCTIONALITY ---
function setupSearch() {
    const searchInput = document.getElementById('skill-search');
    searchInput.addEventListener('input', debounce((e) => {
        const query = e.target.value.toLowerCase().trim();
        handleSearch(query);
    }, 150));
}

function handleSearch(query) {
    rootsGroup.selectAll('.root-node').each(function (d) {
        const node = d3.select(this);
        const searchable = `${d.name} ${d.description} ${(d.jel || []).join(' ')}`.toLowerCase();
        const matches = query && searchable.includes(query);
        node.classed('search-match', matches);
        node.classed('dimmed', query && !matches);
    });

    // Clear lines when searching
    if (query) {
        linesGroup.selectAll('*').remove();
    }
}

// --- COMPARE MODE ---
function setupCompareMode() {
    const compareBtn = document.getElementById('compare-btn');
    const clearBtn = document.getElementById('clear-compare');
    const comparisonInfo = document.getElementById('comparison-info');

    compareBtn.addEventListener('click', () => {
        compareMode = !compareMode;
        compareBtn.classList.toggle('active', compareMode);
        compareBtn.setAttribute('aria-pressed', String(compareMode));
        comparisonInfo.classList.toggle('active', compareMode);

        if (!compareMode) {
            clearComparison();
        } else {
            // Clear single selection when entering compare mode
            selectedCareer = null;
            document.querySelectorAll('.tree').forEach(t => t.classList.remove('selected'));
            clearHighlights();
            hideInfoPanel();
        }
    });

    clearBtn.addEventListener('click', clearComparison);
}

function toggleCompareCareer(careerId) {
    const career = data.careers.find(c => c.id === careerId);
    if (!career) return;

    const index = compareCareers.findIndex(c => c.id === careerId);

    if (index >= 0) {
        // Remove from comparison
        compareCareers.splice(index, 1);
    } else if (compareCareers.length < 2) {
        // Add to comparison
        compareCareers.push(career);
    } else {
        // Replace oldest
        compareCareers.shift();
        compareCareers.push(career);
    }

    updateCompareUI();

    if (compareCareers.length === 2) {
        highlightComparison();
        updateCompareInfoPanel();
    } else if (compareCareers.length === 1) {
        highlightCareerPath(compareCareers[0]);
        updateInfoPanel(compareCareers[0]);
    } else {
        clearHighlights();
        hideInfoPanel();
    }
}

function updateCompareUI() {
    const badges = document.getElementById('compare-badges');
    const hint = document.querySelector('.compare-hint');

    badges.innerHTML = compareCareers.map((c, i) =>
        `<span class="compare-badge career-${i + 1}">${c.name}</span>`
    ).join('');

    hint.textContent = compareCareers.length < 2
        ? `Select ${2 - compareCareers.length} more career${compareCareers.length === 1 ? '' : 's'}`
        : 'Comparing:';

    // Update tree visual selection
    document.querySelectorAll('.tree').forEach(t => {
        const isSelected = compareCareers.some(c => c.id === t.dataset.careerId);
        t.classList.toggle('selected', isSelected);
    });
}

function highlightComparison() {
    linesGroup.selectAll('*').remove();

    const career1 = compareCareers[0];
    const career2 = compareCareers[1];

    const skills1 = new Set([
        ...career1.prerequisites,
        ...career1.required,
        ...career1.bonus,
        ...(career1.softSkills || [])
    ]);

    const skills2 = new Set([
        ...career2.prerequisites,
        ...career2.required,
        ...career2.bonus,
        ...(career2.softSkills || [])
    ]);

    const overlap = new Set([...skills1].filter(s => skills2.has(s)));
    const only1 = new Set([...skills1].filter(s => !skills2.has(s)));
    const only2 = new Set([...skills2].filter(s => !skills1.has(s)));

    rootsGroup.selectAll('.root-node').each(function (d) {
        const node = d3.select(this);
        const skillId = d.id;

        // Clear previous classes
        node.classed('dimmed highlighted prereq required bonus soft overlap career-1-only career-2-only', false);

        if (overlap.has(skillId)) {
            node.classed('overlap', true);
        } else if (only1.has(skillId)) {
            node.classed('career-1-only', true);
        } else if (only2.has(skillId)) {
            node.classed('career-2-only', true);
        } else {
            node.classed('dimmed', true);
        }
    });

    // Draw lines from both trees
    drawCompareLines(career1, skills1, '#f472b6');
    drawCompareLines(career2, skills2, '#38bdf8');
}

function drawCompareLines(career, skillIds, color) {
    const container = document.getElementById('underground');
    const containerRect = container.getBoundingClientRect();
    const selectedTree = document.querySelector(`.tree[data-career-id="${career.id}"]`);
    const treeRect = selectedTree.getBoundingClientRect();
    const startX = treeRect.left + treeRect.width / 2 - containerRect.left;
    const startY = 0;

    skillIds.forEach(skillId => {
        const pos = allSkillPositions.get(skillId);
        if (pos) {
            const midY = pos.y * 0.35;
            const path = `M ${startX} ${startY} 
                          Q ${startX + (pos.x - startX) * 0.25} ${midY},
                            ${pos.x} ${pos.y}`;

            linesGroup.append('path')
                .attr('class', 'root-line')
                .attr('d', path)
                .style('stroke', color)
                .style('stroke-opacity', 0.6)
                .style('filter', `drop-shadow(0 0 4px ${color})`)
                .style('opacity', 0)
                .transition()
                .duration(400)
                .style('opacity', 1);
        }
    });
}

function updateCompareInfoPanel() {
    const panel = document.getElementById('info-panel');
    const career1 = compareCareers[0];
    const career2 = compareCareers[1];

    const skills1 = new Set([...career1.prerequisites, ...career1.required, ...career1.bonus]);
    const skills2 = new Set([...career2.prerequisites, ...career2.required, ...career2.bonus]);
    const overlap = [...skills1].filter(s => skills2.has(s)).map(id => getSkillName(id));
    const only1 = [...skills1].filter(s => !skills2.has(s)).map(id => getSkillName(id));
    const only2 = [...skills2].filter(s => !skills1.has(s)).map(id => getSkillName(id));

    panel.innerHTML = `
        <div class="panel-content">
            <p class="panel-kicker">Shared roots and divergence</p>
            <h2 class="panel-title">Comparing Careers</h2>
            <p class="panel-employers" style="color: #f472b6">${career1.name}</p>
            <p class="panel-employers" style="color: #38bdf8">vs ${career2.name}</p>
            
            <div class="panel-section">
                <h3 class="panel-section-title">Overlapping capabilities (${overlap.length})</h3>
                <div class="skill-tags">
                    ${overlap.map(s => `<span class="skill-tag" style="border-color:#fbbf24;color:#fbbf24">${s}</span>`).join('')}
                </div>
            </div>
            
            <div class="panel-section">
                <h3 class="panel-section-title" style="color:#f472b6">${career1.name} Only (${only1.length})</h3>
                <div class="skill-tags">
                    ${only1.map(s => `<span class="skill-tag" style="border-color:#f472b6;color:#f472b6">${s}</span>`).join('')}
                </div>
            </div>
            
            <div class="panel-section">
                <h3 class="panel-section-title" style="color:#38bdf8">${career2.name} Only (${only2.length})</h3>
                <div class="skill-tags">
                    ${only2.map(s => `<span class="skill-tag" style="border-color:#38bdf8;color:#38bdf8">${s}</span>`).join('')}
                </div>
            </div>
        </div>
    `;
}

function clearComparison() {
    compareCareers = [];
    updateCompareUI();
    clearHighlights();
    hideInfoPanel();
}

// --- SINGLE CAREER SELECTION ---
function selectCareer(careerId) {
    const career = data.careers.find(c => c.id === careerId);
    if (!career) return;

    // Clear search
    document.getElementById('skill-search').value = '';
    handleSearch('');

    if (selectedCareer && selectedCareer.id === careerId) {
        selectedCareer = null;
        document.querySelectorAll('.tree').forEach(t => t.classList.remove('selected'));
        clearHighlights();
        hideInfoPanel();
        return;
    }

    selectedCareer = career;

    document.querySelectorAll('.tree').forEach(t => {
        t.classList.toggle('selected', t.dataset.careerId === careerId);
    });

    updateInfoPanel(career);
    highlightCareerPath(career);
}

function highlightCareerPath(career) {
    linesGroup.selectAll('*').remove();

    const prereqIds = new Set(career.prerequisites);
    const requiredIds = new Set(career.required);
    const bonusIds = new Set(career.bonus);
    const softIds = new Set(career.softSkills || []);
    const allRelevant = new Set([...prereqIds, ...requiredIds, ...bonusIds, ...softIds]);

    const container = document.getElementById('underground');
    const containerRect = container.getBoundingClientRect();
    const selectedTree = document.querySelector(`.tree[data-career-id="${career.id}"]`);
    const treeRect = selectedTree.getBoundingClientRect();
    const startX = treeRect.left + treeRect.width / 2 - containerRect.left;
    const startY = 0;

    rootsGroup.selectAll('.root-node').each(function (d) {
        const node = d3.select(this);
        const skillId = d.id;
        const isRelevant = allRelevant.has(skillId);

        let type = 'dimmed';
        if (prereqIds.has(skillId)) type = 'prereq';
        else if (requiredIds.has(skillId)) type = 'required';
        else if (bonusIds.has(skillId)) type = 'bonus';
        else if (softIds.has(skillId)) type = 'soft';

        node.classed('dimmed highlighted prereq required bonus soft search-match overlap career-1-only career-2-only', false);
        node.classed('dimmed', !isRelevant);
        node.classed('highlighted', isRelevant);
        node.classed(type, type !== 'dimmed');

        if (isRelevant) {
            const pos = allSkillPositions.get(skillId);
            if (pos) {
                const midY = pos.y * 0.35;
                const path = `M ${startX} ${startY} 
                              Q ${startX + (pos.x - startX) * 0.25} ${midY},
                                ${pos.x} ${pos.y}`;

                linesGroup.append('path')
                    .attr('class', `root-line ${type}`)
                    .attr('d', path)
                    .style('opacity', 0)
                    .transition()
                    .duration(400)
                    .style('opacity', 1);
            }
        }
    });
}

function clearHighlights() {
    linesGroup.selectAll('*').remove();

    rootsGroup.selectAll('.root-node')
        .classed('dimmed highlighted prereq required bonus soft search-match overlap career-1-only career-2-only', false);
}

function hideInfoPanel() {
    const panel = document.getElementById('info-panel');
    panel.classList.add('hidden');
}

function showInfoPanel() {
    const panel = document.getElementById('info-panel');
    panel.classList.remove('hidden');
}

function updateInfoPanel(career) {
    const panel = document.getElementById('info-panel');
    const frame = careerFrames[career.id];
    const prereqSkills = career.prerequisites.map(id => getSkillName(id));
    const requiredSkills = career.required.map(id => getSkillName(id));
    const adjacentSkills = career.bonus.map(id => getSkillName(id));
    const softSkills = (career.softSkills || []).map(id => getSkillName(id));

    panel.innerHTML = `
        <div class="panel-content">
            <p class="panel-kicker">${frame.practice}${career.jel ? ` / JEL ${career.jel}` : ''}</p>
            <h2 class="panel-title">${career.name}</h2>
            <p class="panel-employers">${career.employers.join(' / ')}</p>
            <p class="panel-description">${career.description}</p>
            <p class="panel-question">${frame.question}</p>

            <div class="panel-section">
                <h3 class="panel-section-title">Characteristic outputs</h3>
                <p class="panel-description">${frame.outputs}</p>
            </div>
            <div class="panel-section">
                <h3 class="panel-section-title">Prerequisites</h3>
                <div class="skill-tags">${prereqSkills.map(s => `<span class="skill-tag prerequisite">${s}</span>`).join('')}</div>
            </div>
            <div class="panel-section">
                <h3 class="panel-section-title">Working command</h3>
                <div class="skill-tags">${requiredSkills.map(s => `<span class="skill-tag required">${s}</span>`).join('')}</div>
            </div>
            ${adjacentSkills.length ? `<div class="panel-section"><h3 class="panel-section-title">Adjacent advantage</h3><div class="skill-tags">${adjacentSkills.map(s => `<span class="skill-tag bonus">${s}</span>`).join('')}</div></div>` : ''}
            ${softSkills.length ? `<div class="panel-section"><h3 class="panel-section-title">Professional craft</h3><div class="skill-tags">${softSkills.map(s => `<span class="skill-tag soft">${s}</span>`).join('')}</div></div>` : ''}
        </div>`;
    showInfoPanel();
}

function getSkillName(id) {
    const skill = data.skills.find(s => s.id === id);
    return skill ? skill.name : id;
}

// Tooltip
let tooltip;

function setupTooltip() {
    tooltip = document.getElementById('tooltip');
}

function showTooltip(event, d) {
    const layerName = data.layers[d.layer] ? data.layers[d.layer].name : d.layer;

    tooltip.innerHTML = `
        <div class="tooltip-title">${d.name}</div>
        <div class="tooltip-layer">${layerName}</div>
        <div class="tooltip-description">${d.description}</div>
    `;
    tooltip.classList.add('visible');
    moveTooltip(event);
}

function moveTooltip(event) {
    const x = event.pageX + 15;
    const y = event.pageY + 15;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
}

function hideTooltip() {
    tooltip.classList.remove('visible');
}

// Utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
