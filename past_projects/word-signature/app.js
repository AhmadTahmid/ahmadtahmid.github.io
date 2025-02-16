// Common English stop words to filter out
const stopWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
    'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
    'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
    'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
    'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'
]);

// Privacy popup functionality
document.addEventListener('DOMContentLoaded', function() {
    const privacyLink = document.getElementById('privacy-link');
    const privacyPopup = document.getElementById('privacy-popup');
    const closePopup = document.querySelector('.close-popup');

    privacyLink.addEventListener('click', function(e) {
        e.preventDefault();
        privacyPopup.style.display = 'block';
    });

    closePopup.addEventListener('click', function() {
        privacyPopup.style.display = 'none';
    });

    window.addEventListener('click', function(e) {
        if (e.target === privacyPopup) {
            privacyPopup.style.display = 'none';
        }
    });
});

// Load analysis results
let analysisResults = null;

async function loadAnalysisResults() {
    try {
        console.log('Fetching analysis results...');
        const response = await fetch('/past_projects/word-signature/analysis_results.json');
        analysisResults = await response.json();
        console.log('Analysis results loaded:', analysisResults);
        updatePermanentAnalysis();
    } catch (error) {
        console.error('Error loading analysis results:', error);
        // Use placeholder data if loading fails
        analysisResults = {
            total_words: 28540,
            unique_words: 171,
            avg_words_per_sentence: 12.01,
            vocabulary_stats: {
                avg_word_length: 6.76
            },
            word_frequencies: [
                ["social", 213],
                ["people", 198],
                ["one", 193],
                ["work", 134],
                ["time", 100],
                ["theory", 83],
                ["ties", 79],
                ["like", 78],
                ["would", 73],
                ["life", 72]
            ],
            readability_metrics: {
                avg_flesch_reading_ease: 12.58,
                avg_gunning_fog: 18.25
            },
            style_analysis: {
                avg_vocabulary_sophistication: 23.08,
                avg_sentence_variety: 18.41
            },
            sentiment_trends: {
                avg_polarity: 0.11,
                avg_subjectivity: 0.50
            }
        };
    }
}

function getReadabilityInterpretation(flesch, fog) {
    let interpretation = '';
    
    // Flesch Reading Ease interpretation
    if (flesch < 30) interpretation += 'Your writing shows academic-level complexity. ';
    else if (flesch < 50) interpretation += 'Your writing is fairly complex, suitable for college level. ';
    else if (flesch < 60) interpretation += 'Your writing is moderately complex. ';
    else interpretation += 'Your writing is accessible to a general audience. ';
    
    // Gunning Fog interpretation
    if (fog > 17) interpretation += 'The text requires post-graduate level education to comprehend. ';
    else if (fog > 14) interpretation += 'The text is suitable for college/university level readers. ';
    else if (fog > 12) interpretation += 'The text is appropriate for high school level. ';
    else interpretation += 'The text is accessible to most readers. ';
    
    return interpretation;
}

function getStyleInterpretation(vocabSophistication, sentenceVariety) {
    let interpretation = '';
    
    // Vocabulary sophistication interpretation
    if (vocabSophistication > 20) interpretation += 'You use a sophisticated vocabulary with many complex words. ';
    else if (vocabSophistication > 15) interpretation += 'Your vocabulary is moderately advanced. ';
    else interpretation += 'Your vocabulary is clear and straightforward. ';
    
    // Sentence variety interpretation
    if (sentenceVariety > 15) interpretation += 'Your writing shows excellent sentence variety, which helps maintain reader engagement. ';
    else if (sentenceVariety > 10) interpretation += 'You maintain good variation in sentence structure. ';
    else interpretation += 'Consider varying your sentence structure more to enhance engagement. ';
    
    return interpretation;
}

function getSentimentInterpretation(polarity, subjectivity) {
    let interpretation = '';
    
    // Polarity interpretation
    if (polarity > 0.3) interpretation += 'Your tone is notably positive. ';
    else if (polarity < -0.3) interpretation += 'Your tone is notably negative. ';
    else interpretation += 'Your tone is neutral to slightly ' + (polarity >= 0 ? 'positive' : 'negative') + '. ';
    
    // Subjectivity interpretation
    if (subjectivity > 0.7) interpretation += 'Your writing style is highly subjective. ';
    else if (subjectivity < 0.3) interpretation += 'Your writing style is highly objective. ';
    else interpretation += 'You maintain a good balance between objective and subjective writing. ';
    
    return interpretation;
}

function updatePermanentAnalysis() {
    if (!analysisResults) {
        console.error('No analysis results available');
        return;
    }
    console.log('Updating permanent analysis...');

    // Update basic statistics
    document.querySelector('.stat-grid').innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${analysisResults.total_words.toLocaleString()}</div>
            <div class="stat-label">Total Words</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${analysisResults.unique_words.toLocaleString()}</div>
            <div class="stat-label">Unique Words</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${analysisResults.avg_words_per_sentence.toFixed(1)}</div>
            <div class="stat-label">Avg. Words per Sentence</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${analysisResults.vocabulary_stats.avg_word_length.toFixed(1)}</div>
            <div class="stat-label">Avg. Word Length</div>
        </div>
    `;

    // Create word frequency chart
    const wordFrequencyData = {
        labels: analysisResults.word_frequencies.map(([word]) => word),
        frequencies: analysisResults.word_frequencies.map(([, freq]) => freq)
    };
    console.log('Word frequency data:', wordFrequencyData);

    const permanentCtx = document.getElementById('frequencyChart');
    if (!permanentCtx) {
        console.error('frequencyChart canvas not found');
        return;
    }
    console.log('Creating chart...');
    const ctx = permanentCtx.getContext('2d');
    if (window.existingChart) {
        window.existingChart.destroy();
    }
    window.existingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: wordFrequencyData.labels,
            datasets: [{
                label: 'Word Frequency',
                data: wordFrequencyData.frequencies,
                backgroundColor: 'rgba(33, 150, 243, 0.6)',
                borderColor: 'rgba(33, 150, 243, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Frequency'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Distinctive Words'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Most Frequent Distinctive Words',
                    font: {
                        size: 16,
                        family: "'Space Mono', monospace"
                    }
                }
            }
        }
    });

    console.log('Updating metrics...');
    // Update metrics display
    try {
        const metrics = {
            'flesch-score': analysisResults.readability_metrics.avg_flesch_reading_ease.toFixed(2),
            'fog-score': analysisResults.readability_metrics.avg_gunning_fog.toFixed(2),
            'vocab-score': `${analysisResults.style_analysis.avg_vocabulary_sophistication.toFixed(2)}% (percentage of complex words)`,
            'variety-score': analysisResults.style_analysis.avg_sentence_variety.toFixed(2),
            'polarity-score': analysisResults.sentiment_trends.avg_polarity.toFixed(2),
            'subjectivity-score': analysisResults.sentiment_trends.avg_subjectivity.toFixed(2)
        };

        Object.entries(metrics).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                console.log(`Updated ${id} with value ${value}`);
            } else {
                console.error(`Element with id ${id} not found`);
            }
        });

        // Update interpretations
        document.getElementById('flesch-interpretation').textContent = 
            analysisResults.readability_metrics.avg_flesch_reading_ease < 30 ? '(very low, indicating academic/complex text)' : 
            analysisResults.readability_metrics.avg_flesch_reading_ease < 50 ? '(low, indicating complex text)' : 
            '(moderate, indicating general audience text)';

        document.getElementById('fog-interpretation').textContent = 
            analysisResults.readability_metrics.avg_gunning_fog > 17 ? '(high, suggesting advanced reading level)' : 
            analysisResults.readability_metrics.avg_gunning_fog > 14 ? '(moderate, suggesting college level)' : 
            '(suggesting general audience level)';

        document.getElementById('polarity-interpretation').textContent = 
            analysisResults.sentiment_trends.avg_polarity > 0 ? '(slightly positive)' : 
            analysisResults.sentiment_trends.avg_polarity < 0 ? '(slightly negative)' : 
            '(neutral)';

        document.getElementById('subjectivity-interpretation').textContent = 
            analysisResults.sentiment_trends.avg_subjectivity > 0.7 ? '(subjective)' : 
            analysisResults.sentiment_trends.avg_subjectivity < 0.3 ? '(objective)' : 
            '(balanced)';

        console.log('Metrics update complete');
    } catch (error) {
        console.error('Error updating metrics:', error);
    }

    // Remove sentiment chart creation
    const sentimentCtx = document.getElementById('sentimentChart');
    if (sentimentCtx) {
        sentimentCtx.remove();
    }

    // Add vocabulary richness section
    const richnessSummary = document.createElement('div');
    richnessSummary.className = 'content-section';
    richnessSummary.innerHTML = `
        <h3>Vocabulary Richness</h3>
        <div class="stat-grid">
            <div class="stat-card">
                <div class="stat-number">${(analysisResults.vocabulary_richness.ttr * 100).toFixed(1)}%</div>
                <div class="stat-label">Type-Token Ratio</div>
                <div class="stat-description">Unique words relative to total words</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${analysisResults.vocabulary_richness.hapax_percentage.toFixed(1)}%</div>
                <div class="stat-label">Hapax Words</div>
                <div class="stat-description">Words used only once</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${analysisResults.vocabulary_richness.guiraud_r.toFixed(2)}</div>
                <div class="stat-label">Guiraud's R</div>
                <div class="stat-description">Vocabulary richness score</div>
            </div>
        </div>
    `;
    document.querySelector('.visualization-section').appendChild(richnessSummary);

    // Add readability metrics section
    const readabilitySection = document.createElement('div');
    readabilitySection.className = 'content-section';
    readabilitySection.innerHTML = `
        <h3>Readability Analysis</h3>
        <div class="stat-grid">
            <div class="stat-card">
                <div class="stat-number">${analysisResults.readability_metrics.avg_flesch_reading_ease.toFixed(1)}</div>
                <div class="stat-label">Flesch Reading Ease</div>
                <div class="stat-description">Higher scores indicate easier reading (70-80 is ideal for general audience)</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${analysisResults.readability_metrics.avg_gunning_fog.toFixed(1)}</div>
                <div class="stat-label">Gunning Fog Index</div>
                <div class="stat-description">Indicates years of formal education needed to understand the text</div>
            </div>
        </div>
    `;
    document.querySelector('.visualization-section').appendChild(readabilitySection);

    // Add writing style section
    const styleSection = document.createElement('div');
    styleSection.className = 'content-section';
    styleSection.innerHTML = `
        <h3>Writing Style Analysis</h3>
        <div class="stat-grid">
            <div class="stat-card">
                <div class="stat-number">${analysisResults.style_analysis.avg_vocabulary_sophistication.toFixed(1)}%</div>
                <div class="stat-label">Vocabulary Sophistication</div>
                <div class="stat-description">Percentage of complex words used</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${analysisResults.style_analysis.avg_sentence_variety.toFixed(1)}</div>
                <div class="stat-label">Sentence Variety</div>
                <div class="stat-description">Standard deviation in sentence length (higher means more variety)</div>
            </div>
        </div>
    `;
    document.querySelector('.visualization-section').appendChild(styleSection);

    // Add qualitative analysis section
    const readabilityInsight = document.querySelector('.insight-card.readability .insight-content');
    const styleInsight = document.querySelector('.insight-card.style .insight-content');
    const sentimentInsight = document.querySelector('.insight-card.sentiment .insight-content');

    readabilityInsight.innerHTML = getReadabilityInterpretation(
        analysisResults.readability_metrics.avg_flesch_reading_ease,
        analysisResults.readability_metrics.avg_gunning_fog
    );

    styleInsight.innerHTML = getStyleInterpretation(
        analysisResults.style_analysis.avg_vocabulary_sophistication,
        analysisResults.style_analysis.avg_sentence_variety
    );

    sentimentInsight.innerHTML = getSentimentInterpretation(
        analysisResults.sentiment_trends.avg_polarity,
        analysisResults.sentiment_trends.avg_subjectivity
    );

    // Add analysis timestamp
    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'analysis-timestamp';
    timestampDiv.innerHTML = `Last analyzed: ${new Date(analysisResults.analysis_date).toLocaleString()}`;
    document.querySelector('.content-section').appendChild(timestampDiv);
}

// Load analysis results when the page loads
document.addEventListener('DOMContentLoaded', loadAnalysisResults);

// Quick analysis chart (initially hidden)
let quickAnalysisChart = null;

// Tab switching functionality
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Update active button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Show corresponding content
        const tabId = button.dataset.tab;
        tabContents.forEach(content => {
            content.classList.add('hidden');
            if (content.id === tabId) {
                content.classList.remove('hidden');
            }
        });
    });
});

// File upload handling
const fileInput = document.getElementById('document-upload');
const submitButton = document.getElementById('submit-analysis');
const uploadArea = document.querySelector('.upload-area');
const fileList = document.getElementById('file-list');
const processingStatus = document.querySelector('.processing-status');
const quickAnalysisResults = document.querySelector('.quick-analysis-results');
let selectedFiles = new Set();

function updateFileList() {
    fileList.innerHTML = '';
    selectedFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="remove-file" data-name="${file.name}">×</span>
        `;
        fileList.appendChild(fileItem);
    });
    
    submitButton.style.display = selectedFiles.size > 0 ? 'inline-block' : 'none';
}

fileInput.addEventListener('change', (e) => {
    Array.from(e.target.files).forEach(file => selectedFiles.add(file));
    updateFileList();
});

fileList.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-file')) {
        const fileName = e.target.dataset.name;
        selectedFiles.forEach(file => {
            if (file.name === fileName) selectedFiles.delete(file);
        });
        updateFileList();
    }
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    Array.from(e.dataTransfer.files).forEach(file => {
        if (file.name.match(/\.(txt|docx|pdf)$/i)) {
            selectedFiles.add(file);
        }
    });
    updateFileList();
});

submitButton.addEventListener('click', async () => {
    if (selectedFiles.size === 0) {
        alert('Please select at least one file');
        return;
    }

    processingStatus.classList.remove('hidden');
    submitButton.disabled = true;
    quickAnalysisResults.classList.add('hidden');
    
    try {
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('files[]', file);
        });
        
        const response = await fetch('http://localhost:5000/analyze', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Analysis failed');
        }
        
        displayQuickAnalysisResults(data);
    } catch (error) {
        console.error('Analysis error:', error);
        alert('Error analyzing documents: ' + error.message);
        quickAnalysisResults.classList.add('hidden');
    } finally {
        processingStatus.classList.add('hidden');
        submitButton.disabled = false;
    }
});

function displayQuickAnalysisResults(results) {
    // Show the results container
    quickAnalysisResults.classList.remove('hidden');
    
    // Update statistics
    document.getElementById('quick-word-count').textContent = results.word_count.toLocaleString();
    document.getElementById('quick-unique-words').textContent = results.unique_words.toLocaleString();
    document.getElementById('quick-avg-length').textContent = results.avg_sentence_length.toFixed(1);
    
    // Create word frequency chart
    const ctx = document.getElementById('quickAnalysisChart').getContext('2d');
    const topWords = results.word_frequencies.slice(0, 10);
    
    // Destroy existing chart if it exists
    if (quickAnalysisChart instanceof Chart) {
        quickAnalysisChart.destroy();
    }
    
    // Create new chart
    quickAnalysisChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topWords.map(([word]) => word),
            datasets: [{
                label: 'Word Frequency',
                data: topWords.map(([_, freq]) => freq),
                backgroundColor: 'rgba(33, 150, 243, 0.6)',
                borderColor: 'rgba(33, 150, 243, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Frequency'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Most Frequent Words'
                }
            }
        }
    });

    // Update readability metrics
    document.getElementById('quick-flesch-score').textContent = results.readability.flesch_reading_ease.toFixed(2);
    document.getElementById('quick-flesch-interpretation').textContent = 
        results.readability.flesch_reading_ease < 30 ? '(very low, indicating academic/complex text)' : 
        results.readability.flesch_reading_ease < 50 ? '(low, indicating complex text)' : 
        '(moderate, indicating general audience text)';

    document.getElementById('quick-fog-score').textContent = results.readability.gunning_fog_index.toFixed(2);
    document.getElementById('quick-fog-interpretation').textContent = 
        results.readability.gunning_fog_index > 17 ? '(high, suggesting advanced reading level)' : 
        results.readability.gunning_fog_index > 14 ? '(moderate, suggesting college level)' : 
        '(suggesting general audience level)';

    // Update style metrics
    document.getElementById('quick-vocab-score').textContent = 
        `${results.style.vocabulary_sophistication.toFixed(2)}% (percentage of complex words)`;
    document.getElementById('quick-variety-score').textContent = 
        results.style.sentence_variety.toFixed(2);

    // Update sentiment metrics
    document.getElementById('quick-polarity-score').textContent = 
        results.sentiment.polarity.toFixed(2);
    document.getElementById('quick-polarity-interpretation').textContent = 
        results.sentiment.polarity > 0.3 ? '(notably positive)' : 
        results.sentiment.polarity < -0.3 ? '(notably negative)' : 
        results.sentiment.polarity >= 0 ? '(slightly positive)' : '(slightly negative)';

    document.getElementById('quick-subjectivity-score').textContent = 
        results.sentiment.subjectivity.toFixed(2);
    document.getElementById('quick-subjectivity-interpretation').textContent = 
        results.sentiment.subjectivity > 0.7 ? '(subjective)' : 
        results.sentiment.subjectivity < 0.3 ? '(objective)' : 
        '(balanced)';
} 