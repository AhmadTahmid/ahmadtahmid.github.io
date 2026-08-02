const categoryLabels = {
    core: 'Foundations & formal reasoning',
    toolbelt: 'Empirical craft & professional practice',
    specialization: 'Domain methods & specialised models'
};

const careerFrames = {
    'tech-economist': {
        label: 'Marketplaces & technology',
        question: 'What intervention changes behaviour—and can its effect be measured credibly at scale?',
        outputs: 'Experiment designs, marketplace diagnostics, causal estimates, product recommendations',
        note: 'The distinguishing craft is translating an economic mechanism into an operational decision under fast feedback.'
    },
    'central-banker': {
        label: 'Macroeconomic policy',
        question: 'What is happening in the economy, what might happen next, and how should policy respond under uncertainty?',
        outputs: 'Forecasts, briefing notes, scenario models, policy analysis, speeches and reports',
        note: 'Institutional judgment matters alongside models: revisions, communication and asymmetric policy risks are part of the work.'
    },
    'academic-applied': {
        label: 'Applied research',
        question: 'What can be learned that survives scrutiny, changes a literature, and travels beyond one dataset?',
        outputs: 'Working papers, journal articles, seminars, replications, research supervision',
        note: 'Originality and identification matter, but so do research design, transparent inference and the long discipline of revision.'
    },
    'development-economist': {
        label: 'Development & evaluation',
        question: 'Which constraints bind, which interventions work, for whom, and under what institutional conditions?',
        outputs: 'Impact evaluations, field protocols, policy notes, survey instruments, country diagnostics',
        note: 'Field knowledge and implementation fidelity are analytical inputs—not secondary details after the econometrics.'
    },
    'quant-finance': {
        label: 'Markets & quantitative finance',
        question: 'How should uncertainty, dependence and incentives be modelled when decisions are priced continuously?',
        outputs: 'Pricing and risk models, forecasts, execution research, model validation, production code',
        note: 'Mathematical fluency meets engineering discipline; robustness, latency and model risk can matter as much as fit.'
    },
    'labor-economist': {
        label: 'Labour & human capital',
        question: 'How do institutions, firms and policy shape work, wages, mobility and unequal opportunity?',
        outputs: 'Administrative-data studies, programme evaluations, labour forecasts, policy briefs',
        note: 'Measurement is unusually consequential: employment, participation, job quality and skill are not interchangeable outcomes.'
    },
    'io-economist': {
        label: 'Competition & industrial organisation',
        question: 'How do market structure and strategic behaviour shape prices, innovation and welfare?',
        outputs: 'Merger analysis, demand estimates, market simulations, regulatory evidence, expert reports',
        note: 'Institutional detail and credible counterfactuals sit beside game theory and computation.'
    },
    'trade-economist': {
        label: 'Trade & international economics',
        question: 'How do borders, firms and policy transmit shocks across places, industries and households?',
        outputs: 'Trade models, tariff analysis, country studies, gravity estimates, policy scenarios',
        note: 'The work connects aggregate adjustment to heterogeneous firms, workers and regions.'
    }
};

let data;
let focusId = 'all';
let compareId = 'none';
let activeCareer;

document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('skills.json');
    data = await response.json();
    activeCareer = data.careers[0].id;
    document.querySelector('#career-count').textContent = String(data.careers.length).padStart(2, '0');
    document.querySelector('#capability-count').textContent = String(data.skills.length).padStart(2, '0');
    buildSelectors();
    buildMatrix();
    buildCareerTabs();
    renderProfile(activeCareer);
    bindControls();
});

function cleanCareerName(name) {
    return name.replace(/\s*\(JEL [A-Z]\)/, '').replace('Academic (Applied)', 'Applied Academic').replace("Int'l", 'International');
}

function skillLevel(career, skillId) {
    if (career.prerequisites.includes(skillId)) return 3;
    if (career.required.includes(skillId)) return 2;
    if (career.bonus.includes(skillId) || (career.softSkills || []).includes(skillId)) return 1;
    return 0;
}

function relationLabel(level) {
    return ['', 'Adjacent advantage', 'Working command', 'Core foundation'][level];
}

function buildSelectors() {
    const focus = document.querySelector('#career-focus');
    const compare = document.querySelector('#career-compare');
    data.careers.forEach(career => {
        const name = cleanCareerName(career.name);
        focus.add(new Option(name, career.id));
        compare.add(new Option(name, career.id));
    });
}

function buildMatrix() {
    const head = document.querySelector('#matrix-head');
    const body = document.querySelector('#matrix-body');
    head.querySelectorAll('th:not(:first-child)').forEach(node => node.remove());
    body.innerHTML = '';

    data.careers.forEach(career => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.dataset.career = career.id;
        th.textContent = cleanCareerName(career.name);
        head.appendChild(th);
    });

    Object.keys(categoryLabels).forEach(category => {
        const group = data.skills.filter(skill => skill.layer === category);
        const categoryRow = document.createElement('tr');
        categoryRow.className = 'category-row';
        categoryRow.innerHTML = `<th scope="rowgroup">${categoryLabels[category]}</th><td colspan="${data.careers.length}"></td>`;
        body.appendChild(categoryRow);

        group.forEach(skill => {
            const row = document.createElement('tr');
            row.className = 'skill-row';
            row.dataset.search = `${skill.name} ${skill.description} ${(skill.jel || []).join(' ')}`.toLowerCase();
            const label = document.createElement('th');
            label.scope = 'row';
            label.textContent = skill.name;
            row.appendChild(label);

            data.careers.forEach(career => {
                const level = skillLevel(career, skill.id);
                const cell = document.createElement('td');
                cell.dataset.career = career.id;
                if (level) {
                    const dot = document.createElement('i');
                    dot.className = `matrix-dot level-${level}`;
                    dot.tabIndex = 0;
                    dot.setAttribute('aria-label', `${skill.name}: ${relationLabel(level)} for ${cleanCareerName(career.name)}`);
                    dot.dataset.note = `${relationLabel(level)} · ${skill.description}`;
                    cell.appendChild(dot);
                }
                row.appendChild(cell);
            });
            body.appendChild(row);
        });
    });
    bindTooltips();
}

function buildCareerTabs() {
    const tabs = document.querySelector('#career-tabs');
    data.careers.forEach((career, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.role = 'tab';
        button.dataset.career = career.id;
        button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
        button.textContent = cleanCareerName(career.name);
        button.addEventListener('click', () => {
            activeCareer = career.id;
            tabs.querySelectorAll('button').forEach(tab => tab.setAttribute('aria-selected', String(tab === button)));
            renderProfile(career.id);
        });
        tabs.appendChild(button);
    });
}

function renderProfile(careerId) {
    const career = data.careers.find(item => item.id === careerId);
    const frame = careerFrames[careerId];
    const relevant = data.skills
        .map(skill => ({ skill, level: skillLevel(career, skill.id) }))
        .filter(item => item.level >= 2)
        .sort((a, b) => b.level - a.level);
    const institutions = career.employers.join(' · ');
    document.querySelector('#career-profile').innerHTML = `
        <div>
            <p class="profile-kicker">${frame.label}${career.jel ? ` · JEL ${career.jel}` : ''}</p>
            <h3>${cleanCareerName(career.name)}</h3>
            <p class="profile-description">${career.description} ${frame.note}</p>
            <p class="profile-question">“${frame.question}”</p>
        </div>
        <div class="profile-side">
            <div class="profile-block"><h4>Characteristic outputs</h4><p>${frame.outputs}</p></div>
            <div class="profile-block"><h4>Illustrative settings</h4><p>${institutions}</p></div>
            <div class="profile-block"><h4>Concentrated capabilities</h4><div class="capability-list">${relevant.map(item => `<span>${item.skill.name}</span>`).join('')}</div></div>
        </div>`;
}

function bindControls() {
    const search = document.querySelector('#skill-search');
    const focus = document.querySelector('#career-focus');
    const compare = document.querySelector('#career-compare');
    search.addEventListener('input', applyView);
    focus.addEventListener('change', () => {
        focusId = focus.value;
        if (focusId !== 'all' && compareId === focusId) {
            compare.value = 'none';
            compareId = 'none';
        }
        applyView();
    });
    compare.addEventListener('change', () => { compareId = compare.value; applyView(); });
    document.querySelector('#reset-map').addEventListener('click', () => {
        search.value = '';
        focus.value = 'all';
        compare.value = 'none';
        focusId = 'all';
        compareId = 'none';
        applyView();
    });
}

function applyView() {
    const query = document.querySelector('#skill-search').value.trim().toLowerCase();
    let visibleRows = 0;
    document.querySelectorAll('.skill-row').forEach(row => {
        const visible = !query || row.dataset.search.includes(query);
        row.hidden = !visible;
        if (visible) visibleRows += 1;
    });
    document.querySelector('#empty-state').hidden = visibleRows !== 0;

    document.querySelectorAll('#capability-matrix [data-career]').forEach(cell => {
        cell.classList.remove('focus-dim', 'focus-col', 'compare-col');
        if (focusId !== 'all') {
            if (cell.dataset.career === focusId) cell.classList.add('focus-col');
            else if (cell.dataset.career === compareId) cell.classList.add('compare-col');
            else cell.classList.add('focus-dim');
        }
    });

    document.querySelectorAll('.category-row').forEach(categoryRow => {
        let next = categoryRow.nextElementSibling;
        let hasVisibleSkill = false;
        while (next && !next.classList.contains('category-row')) {
            if (!next.hidden) hasVisibleSkill = true;
            next = next.nextElementSibling;
        }
        categoryRow.hidden = !hasVisibleSkill;
    });
}

function bindTooltips() {
    const tooltip = document.querySelector('#cell-note');
    document.querySelectorAll('.matrix-dot').forEach(dot => {
        const show = event => {
            tooltip.textContent = dot.dataset.note;
            tooltip.hidden = false;
            const x = event.clientX || dot.getBoundingClientRect().left;
            const y = event.clientY || dot.getBoundingClientRect().bottom;
            tooltip.style.left = `${Math.min(x + 14, window.innerWidth - 280)}px`;
            tooltip.style.top = `${Math.min(y + 14, window.innerHeight - 100)}px`;
        };
        dot.addEventListener('mouseenter', show);
        dot.addEventListener('mousemove', show);
        dot.addEventListener('focus', show);
        ['mouseleave', 'blur'].forEach(type => dot.addEventListener(type, () => { tooltip.hidden = true; }));
    });
}
