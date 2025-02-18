// Check for browser support
if (!('webkitSpeechRecognition' in window) || !('speechSynthesis' in window)) {
    document.body.innerHTML = '<div class="error-message">Your browser doesn\'t support speech recognition and synthesis. Please use Chrome or Edge.</div>';
}

// Common Italian words array
const commonItalianWords = [
    // Greetings and Basics
    'Ciao', 'Arrivederci', 'Per favore', 'Grazie', 'Prego', 'Buongiorno',
    'Buonasera', 'A presto', 'Come stai', 'Piacere', 'Sì', 'No',
    // Common Verbs
    'Essere', 'Avere', 'Fare', 'Andare', 'Dire', 'Vedere', 'Sapere', 'Potere',
    'Volere', 'Venire', 'Prendere', 'Parlare', 'Amare', 'Mangiare', 'Bere',
    // Common Nouns
    'Tempo', 'Giorno', 'Anno', 'Volta', 'Uomo', 'Donna', 'Bambino', 'Amico',
    'Casa', 'Cosa', 'Mondo', 'Vita', 'Mano', 'Occhi', 'Testa',
    // Common Adjectives
    'Buono', 'Grande', 'Piccolo', 'Nuovo', 'Giovane', 'Vecchio', 'Bello', 'Bene',
    'Stesso', 'Tutto', 'Altro', 'Primo', 'Ultimo', 'Importante',
    // Time-related
    'Oggi', 'Domani', 'Ieri', 'Adesso', 'Sempre', 'Mai',
    'Mattina', 'Sera', 'Notte', 'Ora', 'Minuto', 'Settimana', 'Mese',
    // Numbers
    'Uno', 'Due', 'Tre', 'Quattro', 'Cinque', 'Sei', 'Sette', 'Otto', 'Nove', 'Dieci',
    // Question Words
    'Chi', 'Che cosa', 'Dove', 'Quando', 'Come', 'Perché', 'Quale',
    // Common Phrases
    'Vorrei', 'Non lo so', 'Capisco', 'Scusi',
    'Come si dice', 'Può ripetere', 'Non capisco',
    // More Common Words
    'Con', 'Senza', 'Per', 'In', 'Su', 'Sotto', 'Prima', 'Dopo',
    'Molto', 'Poco', 'Troppo', 'Abbastanza', 'Più', 'Meno'
];

// Function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Function to update word buttons
function updateWordButtons() {
    const wordList = document.querySelector('.word-list');
    const shuffledWords = shuffleArray([...commonItalianWords]).slice(0, 6); // Get 6 random words
    
    wordList.innerHTML = shuffledWords.map(word => 
        `<button class="word-button">${word}</button>`
    ).join('');
    
    // Reattach event listeners to new buttons
    document.querySelectorAll('.word-button').forEach(button => {
        button.addEventListener('click', () => {
            currentText = button.textContent;
            customInput.value = currentText;
            updateStatus('Word selected: ' + currentText);
        });
    });
}

// Initialize speech recognition
const recognition = new webkitSpeechRecognition();
recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = 'it-IT';

// Initialize speech synthesis
const synthesis = window.speechSynthesis;
const utterance = new SpeechSynthesisUtterance();
utterance.lang = 'it-IT';

// DOM elements
const wordButtons = document.querySelectorAll('.word-button');
const customInput = document.querySelector('.custom-input');
const listenButton = document.querySelector('.listen-button');
const recordButton = document.querySelector('.record-button');
const statusText = document.querySelector('.status-text');
const feedbackSection = document.querySelector('.feedback-section');
const scoreElement = document.getElementById('pronunciation-score');
const feedbackText = document.querySelector('.feedback-text');

let currentText = '';

// Event listeners for word buttons
wordButtons.forEach(button => {
    button.addEventListener('click', () => {
        currentText = button.textContent;
        customInput.value = currentText;
        updateStatus('Word selected: ' + currentText);
    });
});

// Event listener for custom input
customInput.addEventListener('input', (e) => {
    currentText = e.target.value;
    updateStatus(currentText ? 'Custom text entered' : 'Ready to start...');
});

// Listen button functionality
listenButton.addEventListener('click', () => {
    if (!currentText) {
        updateStatus('Please select a word or enter custom text first');
        return;
    }

    utterance.text = currentText;
    synthesis.speak(utterance);
    updateStatus('Playing pronunciation...');
});

// Record button functionality
let isRecording = false;

recordButton.addEventListener('click', () => {
    if (!currentText) {
        updateStatus('Please select a word or enter custom text first');
        return;
    }

    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
});

function startRecording() {
    isRecording = true;
    recordButton.querySelector('.status-indicator').classList.add('status-recording');
    recordButton.textContent = 'Stop';
    updateStatus('Recording...');
    
    recognition.start();
}

function stopRecording() {
    isRecording = false;
    recordButton.querySelector('.status-indicator').classList.remove('status-recording');
    recordButton.textContent = 'Record';
    
    recognition.stop();
}

// Speech recognition results
recognition.onresult = (event) => {
    const spokenText = event.results[0][0].transcript.toLowerCase();
    const targetText = currentText.toLowerCase();
    
    // Calculate similarity score
    const score = calculateSimilarity(spokenText, targetText);
    
    // Show feedback
    feedbackSection.style.display = 'block';
    scoreElement.textContent = Math.round(score * 100);
    
    // Generate feedback text
    if (score > 0.9) {
        feedbackText.textContent = 'Eccellente! Your pronunciation is spot on!';
    } else if (score > 0.7) {
        feedbackText.textContent = 'Molto bene! Focus on the rhythm and intonation.';
    } else if (score > 0.5) {
        feedbackText.textContent = 'Continua così! Pay attention to each syllable.';
    } else {
        feedbackText.textContent = 'Riprova! Listen to the correct pronunciation and repeat.';
    }
    
    updateStatus('Recognition complete');
};

// Error handling
recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    updateStatus('Error: ' + event.error);
    stopRecording();
};

// Helper functions
function updateStatus(message) {
    statusText.textContent = message;
}

function calculateSimilarity(str1, str2) {
    // Levenshtein distance implementation
    const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));
    
    for (let i = 0; i <= str1.length; i++) {
        matrix[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j++) {
        matrix[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            if (str1[i-1] === str2[j-1]) {
                matrix[j][i] = matrix[j-1][i-1];
            } else {
                matrix[j][i] = Math.min(
                    matrix[j-1][i-1] + 1,  // substitution
                    matrix[j][i-1] + 1,    // insertion
                    matrix[j-1][i] + 1     // deletion
                );
            }
        }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    const distance = matrix[str2.length][str1.length];
    
    return 1 - (distance / maxLength);
}

// Add shuffle button event listener
document.querySelector('.shuffle-button').addEventListener('click', updateWordButtons);

// Database entries
const entries = [
    {
        type: 'false-friend',
        word: 'Attualmente',
        looksLike: 'Actually',
        realMeaning: 'Currently, At present',
        correctForm: 'In realtà',
        example: 'Attualmente vivo a Bologna = I currently live in Bologna'
    },
    {
        type: 'false-friend',
        word: 'Pretendere',
        looksLike: 'To pretend',
        realMeaning: 'To demand, to claim',
        correctForm: 'Fingere',
        example: 'Non puoi pretendere che io sappia tutto = You can\'t demand that I know everything'
    },
    {
        type: 'common-mistake',
        word: 'Essere vs. Stare',
        explanation: 'Both mean "to be" but are used differently:\n- Essere: permanent conditions, essential characteristics\n- Stare: temporary states, locations, health conditions',
        example: 'Sono italiano (permanent) vs. Sto male (temporary)'
    },
    {
        type: 'idiom',
        word: 'Non avere peli sulla lingua',
        literal: 'To have no hair on one\'s tongue',
        meaning: 'To speak one\'s mind, to be frank/direct',
        example: 'Marco non ha peli sulla lingua, dice sempre quello che pensa = Marco speaks his mind, he always says what he thinks'
    },
    {
        type: 'idiom',
        word: 'In bocca al lupo',
        literal: 'Into the wolf\'s mouth',
        meaning: 'Good luck! (Similar to "break a leg")',
        response: 'Crepi! (May it die!)',
        example: 'Hai un esame domani? In bocca al lupo! = You have an exam tomorrow? Good luck!',
        note: 'This is one of the most common expressions you\'ll hear in Italy!'
    }
];

// DOM Elements
const searchInput = document.querySelector('.search-input');
const filterButtons = document.querySelectorAll('.filter-button');
const databaseSection = document.querySelector('.database-section');

// Current filter state
let currentFilter = 'all';

// Search and filter functionality
function filterEntries(searchTerm = '') {
    const normalizedSearch = searchTerm.toLowerCase();
    
    return entries.filter(entry => {
        // Apply type filter
        if (currentFilter !== 'all' && entry.type !== currentFilter) {
            return false;
        }
        
        // Apply search filter
        if (searchTerm) {
            const searchableText = [
                entry.word,
                entry.looksLike,
                entry.realMeaning,
                entry.correctForm,
                entry.example,
                entry.meaning,
                entry.literal,
                entry.explanation
            ].filter(Boolean).join(' ').toLowerCase();
            
            return searchableText.includes(normalizedSearch);
        }
        
        return true;
    });
}

// Render entries
function renderEntries(filteredEntries) {
    const sections = {
        'false-friend': {
            title: 'False Friends (Falsi Amici)',
            entries: []
        },
        'common-mistake': {
            title: 'Common Mistakes',
            entries: []
        },
        'idiom': {
            title: 'Colorful Idioms',
            entries: []
        }
    };
    
    // Group entries by type
    filteredEntries.forEach(entry => {
        sections[entry.type].entries.push(entry);
    });
    
    // Build HTML
    let html = '';
    
    Object.entries(sections).forEach(([type, section]) => {
        if (section.entries.length > 0 && (currentFilter === 'all' || currentFilter === type)) {
            html += `<h2>${section.title}</h2>`;
            
            section.entries.forEach(entry => {
                html += `
                    <div class="entry ${type}">
                        <span class="tag ${type}">${type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                        <div class="word">${entry.word}</div>
                `;
                
                if (type === 'false-friend') {
                    html += `
                        <div class="meaning">
                            <strong>Looks like:</strong> "${entry.looksLike}"<br>
                            <strong>Really means:</strong> "${entry.realMeaning}"<br>
                            <strong>Correct Italian for "${entry.looksLike}":</strong> ${entry.correctForm}
                        </div>
                    `;
                } else if (type === 'common-mistake') {
                    html += `
                        <div class="meaning">
                            ${entry.explanation.split('\n').join('<br>')}
                        </div>
                    `;
                } else if (type === 'idiom') {
                    html += `
                        <div class="meaning">
                            <strong>Literal:</strong> "${entry.literal}"<br>
                            <strong>Means:</strong> ${entry.meaning}
                            ${entry.response ? `<br><strong>Response:</strong> ${entry.response}` : ''}
                        </div>
                    `;
                }
                
                html += `
                    <div class="example">${entry.example}</div>
                    ${entry.note ? `<div class="note">${entry.note}</div>` : ''}
                    </div>
                `;
            });
        }
    });
    
    databaseSection.innerHTML = html || '<p>No entries found matching your criteria.</p>';
}

// Event Listeners
searchInput.addEventListener('input', (e) => {
    renderEntries(filterEntries(e.target.value));
});

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Update active state
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update filter and re-render
        currentFilter = button.dataset.filter;
        renderEntries(filterEntries(searchInput.value));
    });
});

// Initial render
renderEntries(entries); 