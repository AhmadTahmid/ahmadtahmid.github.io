// Check for browser support
if (!('webkitSpeechRecognition' in window) || !('speechSynthesis' in window)) {
    document.body.innerHTML = '<div class="error-message">Your browser doesn\'t support speech recognition and synthesis. Please use Chrome or Edge.</div>';
}

// Common French words array (500 most common words - showing a subset here)
const commonFrenchWords = [
    // Greetings and Basics
    'Bonjour', 'Au revoir', 'S\'il vous plaît', 'Merci', 'De rien', 'Bonsoir',
    'Salut', 'À bientôt', 'Comment allez-vous', 'Enchanté', 'Oui', 'Non',
    // Common Verbs
    'Être', 'Avoir', 'Faire', 'Aller', 'Dire', 'Voir', 'Savoir', 'Pouvoir',
    'Vouloir', 'Venir', 'Prendre', 'Parler', 'Aimer', 'Manger', 'Boire',
    // Common Nouns
    'Temps', 'Jour', 'Année', 'Fois', 'Homme', 'Femme', 'Enfant', 'Ami',
    'Maison', 'Chose', 'Monde', 'Vie', 'Main', 'Yeux', 'Tête',
    // Common Adjectives
    'Bon', 'Grand', 'Petit', 'Nouveau', 'Jeune', 'Vieux', 'Beau', 'Bien',
    'Même', 'Tout', 'Autre', 'Premier', 'Dernier', 'Important',
    // Time-related
    'Aujourd\'hui', 'Demain', 'Hier', 'Maintenant', 'Toujours', 'Jamais',
    'Matin', 'Soir', 'Nuit', 'Heure', 'Minute', 'Semaine', 'Mois',
    // Numbers
    'Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf', 'Dix',
    // Question Words
    'Qui', 'Quoi', 'Où', 'Quand', 'Comment', 'Pourquoi', 'Quel', 'Quelle',
    // Common Phrases
    'Je voudrais', 'Je ne sais pas', 'Je comprends', 'Excusez-moi',
    'Comment dit-on', 'Pouvez-vous répéter', 'Je ne comprends pas',
    // More Common Words
    'Avec', 'Sans', 'Pour', 'Dans', 'Sur', 'Sous', 'Avant', 'Après',
    'Beaucoup', 'Peu', 'Très', 'Trop', 'Assez', 'Plus', 'Moins'
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
    const shuffledWords = shuffleArray([...commonFrenchWords]).slice(0, 6); // Get 6 random words
    
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
recognition.lang = 'fr-FR';

// Initialize speech synthesis
const synthesis = window.speechSynthesis;
const utterance = new SpeechSynthesisUtterance();
utterance.lang = 'fr-FR';

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
    
    // Calculate similarity score (simple string comparison for now)
    const score = calculateSimilarity(spokenText, targetText);
    
    // Show feedback
    feedbackSection.style.display = 'block';
    scoreElement.textContent = Math.round(score * 100);
    
    // Generate feedback text
    if (score > 0.9) {
        feedbackText.textContent = 'Excellent pronunciation! Keep it up!';
    } else if (score > 0.7) {
        feedbackText.textContent = 'Good attempt! Try to focus on the accent and intonation.';
    } else if (score > 0.5) {
        feedbackText.textContent = 'Keep practicing! Pay attention to each syllable.';
    } else {
        feedbackText.textContent = 'Try again! Listen to the correct pronunciation and repeat.';
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