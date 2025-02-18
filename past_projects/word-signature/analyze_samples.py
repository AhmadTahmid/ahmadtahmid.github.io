import os
import json
from collections import Counter
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.corpus import stopwords
from nltk.util import ngrams
import docx
import re
import math
from datetime import datetime
from textblob import TextBlob
import numpy as np

# Download required NLTK data
print("Downloading NLTK data...")
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('averaged_perceptron_tagger')
nltk.download('punkt_tab')
nltk.download('averaged_perceptron_tagger_eng')

# Extended stop words list
ADDITIONAL_STOP_WORDS = {
    'would', 'could', 'should', 'might', 'must', 'need', 'shall',
    'may', 'also', 'thus', 'therefore', 'however', 'though',
    'although', 'yet', 'still', 'nevertheless', 'nonetheless',
    'meanwhile', 'moreover', 'furthermore', 'additionally',
    'perhaps', 'maybe', 'possibly', 'probably', 'likely',
    'usually', 'generally', 'typically', 'often', 'sometimes',
    'rarely', 'seldom', 'never', 'always', 'ever', 'rather',
    'quite', 'somewhat', 'somehow', 'anyway', 'anyhow',
    'whether', 'whatever', 'whoever', 'whenever', 'wherever',
    'indeed', 'certainly', 'definitely', 'absolutely', 'totally',
    'completely', 'entirely', 'fully', 'simply', 'just', 'really',
    'actually', 'basically', 'essentially', 'virtually'
}

def read_docx(file_path):
    """Read text from a .docx file."""
    try:
        doc = docx.Document(file_path)
        full_text = []
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                # Handle special characters and encoding
                text = paragraph.text.encode('ascii', 'ignore').decode('ascii')
                full_text.append(text)
        return '\n'.join(full_text)
    except Exception as e:
        print(f"Error reading .docx file: {str(e)}")
        return ""

def read_txt(file_path):
    """Read text from a .txt file."""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
            return file.read()
    except Exception as e:
        print(f"Error reading .txt file: {str(e)}")
        return ""

def process_text(text):
    """Process text with improved sentence detection and word tokenization."""
    # Convert to lowercase
    text = text.lower()
    
    # Improve sentence detection by fixing common issues
    text = re.sub(r'([.!?])\s*([a-z])', r'\1\n\2', text)  # Add newline after sentence endings
    text = re.sub(r'(Mr\.|Mrs\.|Dr\.|Prof\.)\s*', r'\1 ', text)  # Handle titles
    
    # Tokenize sentences more accurately
    sentences = [s.strip() for s in sent_tokenize(text) if s.strip()]
    
    # Improved word tokenization
    words = []
    for sentence in sentences:
        # Remove special characters and numbers but keep apostrophes for contractions
        cleaned = re.sub(r'[^a-z\'\s]', ' ', sentence)
        # Handle contractions properly
        cleaned = re.sub(r'\'s\b', '', cleaned)  # Remove possessive 's
        cleaned = re.sub(r'\'ve\b', ' have', cleaned)  # Convert 've to have
        cleaned = re.sub(r'\'re\b', ' are', cleaned)  # Convert 're to are
        cleaned = re.sub(r'\'m\b', ' am', cleaned)  # Convert 'm to am
        cleaned = re.sub(r'\'ll\b', ' will', cleaned)  # Convert 'll to will
        cleaned = re.sub(r'\'t\b', ' not', cleaned)  # Convert n't to not
        cleaned = re.sub(r'\'d\b', ' would', cleaned)  # Convert 'd to would
        
        # Tokenize words
        sentence_words = word_tokenize(cleaned)
        words.extend([w for w in sentence_words if w.isalpha()])
    
    return words, sentences

def calculate_vocabulary_richness(words):
    """Calculate various vocabulary richness metrics."""
    total_words = len(words)
    unique_words = len(set(words))
    
    # Type-Token Ratio (TTR)
    ttr = unique_words / total_words if total_words > 0 else 0
    
    # Hapax Legomena (words that appear only once)
    word_freq = Counter(words)
    hapax = len([word for word, freq in word_freq.items() if freq == 1])
    
    # Guiraud's R (modified TTR)
    guiraud = unique_words / math.sqrt(total_words) if total_words > 0 else 0
    
    return {
        'ttr': ttr,
        'hapax_percentage': (hapax / total_words * 100) if total_words > 0 else 0,
        'guiraud_r': guiraud
    }

def calculate_readability_metrics(words, sentences):
    """Calculate various readability metrics."""
    if not words or not sentences:
        return {}
    
    total_words = len(words)
    total_sentences = len(sentences)
    total_syllables = sum(count_syllables(word) for word in words)
    
    # Flesch Reading Ease
    if total_words > 0 and total_sentences > 0:
        flesch = 206.835 - 1.015 * (total_words / total_sentences) - 84.6 * (total_syllables / total_words)
    else:
        flesch = 0
    
    # Gunning Fog Index
    complex_words = len([word for word in words if count_syllables(word) >= 3])
    if total_words > 0 and total_sentences > 0:
        fog = 0.4 * ((total_words / total_sentences) + 100 * (complex_words / total_words))
    else:
        fog = 0
    
    return {
        'flesch_reading_ease': flesch,
        'gunning_fog_index': fog,
        'avg_syllables_per_word': total_syllables / total_words if total_words > 0 else 0,
        'complex_word_percentage': (complex_words / total_words * 100) if total_words > 0 else 0
    }

def count_syllables(word):
    """Estimate number of syllables in a word."""
    word = word.lower()
    count = 0
    vowels = 'aeiouy'
    
    # Handle special cases
    if word.endswith('e'):
        word = word[:-1]
    
    # Count vowel groups
    prev_char_is_vowel = False
    for char in word:
        is_vowel = char in vowels
        if is_vowel and not prev_char_is_vowel:
            count += 1
        prev_char_is_vowel = is_vowel
    
    return max(1, count)  # Every word has at least one syllable

def analyze_writing_style(words, sentences, pos_tags):
    """Analyze writing style patterns."""
    # Sentence variety
    sentence_lengths = [len(word_tokenize(sent)) for sent in sentences]
    sentence_variety = {
        'min_length': min(sentence_lengths) if sentence_lengths else 0,
        'max_length': max(sentence_lengths) if sentence_lengths else 0,
        'std_dev': np.std(sentence_lengths) if sentence_lengths else 0
    }
    
    # Vocabulary sophistication
    long_words = len([w for w in words if len(w) > 6])
    vocabulary_sophistication = (long_words / len(words) * 100) if words else 0
    
    # Sentence beginnings variety
    sentence_starts = [sent.split()[0].lower() if sent.split() else '' for sent in sentences]
    start_variety = len(set(sentence_starts)) / len(sentences) if sentences else 0
    
    # Parts of speech patterns
    pos_patterns = Counter([tag for _, tag in pos_tags])
    total_pos = sum(pos_patterns.values())
    
    style_metrics = {
        'sentence_variety': sentence_variety,
        'vocabulary_sophistication': vocabulary_sophistication,
        'sentence_starts_variety': start_variety,
        'grammar_patterns': {
            'noun_percentage': (pos_patterns.get('NN', 0) + pos_patterns.get('NNS', 0)) / total_pos * 100 if total_pos > 0 else 0,
            'verb_percentage': sum(pos_patterns.get(tag, 0) for tag in ['VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ']) / total_pos * 100 if total_pos > 0 else 0,
            'adjective_percentage': sum(pos_patterns.get(tag, 0) for tag in ['JJ', 'JJR', 'JJS']) / total_pos * 100 if total_pos > 0 else 0
        }
    }
    
    return style_metrics

def analyze_document(file_path):
    """Analyze a single document with improved metrics."""
    try:
        # Read document content with proper encoding handling
        if file_path.endswith('.docx'):
            try:
                doc = docx.Document(file_path)
                text = '\n'.join([paragraph.text for paragraph in doc.paragraphs])
            except Exception as e:
                print(f"Error reading docx file: {str(e)}")
                return None
        else:  # .txt files
            try:
                # Try different encodings
                encodings = ['utf-8', 'latin-1', 'cp1252']
                text = None
                for encoding in encodings:
                    try:
                        with open(file_path, 'r', encoding=encoding) as f:
                            text = f.read()
                        break
                    except UnicodeDecodeError:
                        continue
                
                if text is None:
                    print("Could not decode file with any supported encoding")
                    return None
            except Exception as e:
                print(f"Error reading text file: {str(e)}")
                return None
        
        # Basic tokenization with error handling
        try:
            sentences = sent_tokenize(text)
            words = word_tokenize(text.lower())
        except Exception as e:
            print(f"Error in tokenization: {str(e)}")
            return None
        
        # Filter stop words and non-alphabetic tokens
        stop_words = set(stopwords.words('english'))
        words = [word for word in words if word.isalpha() and word not in stop_words]
        
        if not words:
            print("No valid words found in document")
            return None
        
        # Calculate word frequencies
        word_freq = Counter(words)
        
        # Calculate word lengths
        word_lengths = Counter([len(word) for word in words])
        
        # Parts of speech tagging
        try:
            pos_tags = nltk.pos_tag(words)
            pos_counts = Counter([tag for word, tag in pos_tags])
        except Exception as e:
            print(f"Error in POS tagging: {str(e)}")
            pos_counts = Counter()
        
        # TextBlob analysis for sentiment
        try:
            blob = TextBlob(text)
            sentiment = {
                'polarity': blob.sentiment.polarity,
                'subjectivity': blob.sentiment.subjectivity
            }
        except Exception as e:
            print(f"Error in sentiment analysis: {str(e)}")
            sentiment = {'polarity': 0, 'subjectivity': 0}
        
        # Calculate sentence length variety
        sentence_lengths = [len(word_tokenize(sent)) for sent in sentences]
        sent_length_std = np.std(sentence_lengths) if sentence_lengths else 0
        
        # Calculate vocabulary sophistication (percentage of words > 8 letters)
        long_words = sum(1 for word in words if len(word) > 8)
        vocab_sophistication = (long_words / len(words) * 100) if words else 0
        
        # Calculate readability scores
        words_per_sent = len(words) / len(sentences) if sentences else 0
        syllables = sum([count_syllables(word) for word in words])
        syllables_per_word = syllables / len(words) if words else 0
        
        # Flesch Reading Ease
        flesch = 206.835 - 1.015 * words_per_sent - 84.6 * syllables_per_word
        
        # Gunning Fog Index
        complex_words = sum(1 for word in words if count_syllables(word) >= 3)
        fog = 0.4 * (words_per_sent + 100 * (complex_words / len(words)) if words else 0)
        
        return {
            'word_count': len(words),
            'sentence_count': len(sentences),
            'word_frequencies': word_freq.most_common(20),
            'word_length_distribution': dict(word_lengths),
            'pos_distribution': dict(pos_counts),
            'readability_metrics': {
                'flesch_reading_ease': flesch,
                'gunning_fog_index': fog
            },
            'style_metrics': {
                'sentence_variety': {
                    'mean': np.mean(sentence_lengths) if sentence_lengths else 0,
                    'std_dev': sent_length_std
                },
                'vocabulary_sophistication': vocab_sophistication
            },
            'sentiment_analysis': sentiment
        }
    except Exception as e:
        print(f"Error in analyze_document: {str(e)}")
        return None

def analyze_all_samples():
    """Analyze all samples with improved metrics and time tracking."""
    samples_dir = 'samples'
    total_stats = {
        'total_words': 0,
        'total_sentences': 0,
        'total_unique_words': set(),
        'word_frequencies': Counter(),
        'word_length_distribution': Counter(),
        'pos_distribution': Counter(),
        'common_phrases': Counter(),
        'documents_analyzed': 0,
        'analysis_date': datetime.now().isoformat(),
        'readability_metrics': {
            'total_flesch': 0,
            'total_fog': 0
        },
        'style_metrics': {
            'total_variety': 0,
            'total_sophistication': 0
        },
        'sentiment_metrics': {
            'total_polarity': 0,
            'total_subjectivity': 0
        }
    }
    
    # Process each document
    files = [f for f in os.listdir(samples_dir) if f.endswith(('.txt', '.docx'))]
    print(f"Found {len(files)} documents to analyze")
    
    successful_docs = 0
    for i, filename in enumerate(files, 1):
        print(f"Processing document {i}/{len(files)}: {filename}")
        try:
            file_path = os.path.join(samples_dir, filename)
            doc_stats = analyze_document(file_path)
            
            # Update total statistics
            total_stats['total_words'] += doc_stats['word_count']
            total_stats['total_sentences'] += doc_stats['sentence_count']
            total_stats['total_unique_words'].update(word for word, _ in doc_stats['word_frequencies'])
            total_stats['word_frequencies'].update(dict(doc_stats['word_frequencies']))
            total_stats['word_length_distribution'].update(doc_stats['word_length_distribution'])
            total_stats['pos_distribution'].update(doc_stats['pos_distribution'])
            
            # Update readability metrics
            total_stats['readability_metrics']['total_flesch'] += doc_stats['readability_metrics']['flesch_reading_ease']
            total_stats['readability_metrics']['total_fog'] += doc_stats['readability_metrics']['gunning_fog_index']
            
            # Update style metrics
            total_stats['style_metrics']['total_variety'] += doc_stats['style_metrics']['sentence_variety']['std_dev']
            total_stats['style_metrics']['total_sophistication'] += doc_stats['style_metrics']['vocabulary_sophistication']
            
            # Update sentiment metrics
            total_stats['sentiment_metrics']['total_polarity'] += doc_stats['sentiment_analysis']['polarity']
            total_stats['sentiment_metrics']['total_subjectivity'] += doc_stats['sentiment_analysis']['subjectivity']
            
            total_stats['documents_analyzed'] += 1
            successful_docs += 1
            print(f"  Words: {doc_stats['word_count']}, Sentences: {doc_stats['sentence_count']}")
        except Exception as e:
            print(f"Error processing {filename}: {str(e)}")
    
    if successful_docs == 0:
        print("No documents were successfully processed")
        return
    
    print("\nCalculating final statistics...")
    # Calculate averages and prepare final results
    avg_words_per_sentence = (total_stats['total_words'] / total_stats['total_sentences'] 
                            if total_stats['total_sentences'] > 0 else 0)
    
    results = {
        'total_words': total_stats['total_words'],
        'total_sentences': total_stats['total_sentences'],
        'unique_words': len(total_stats['total_unique_words']),
        'avg_words_per_sentence': avg_words_per_sentence,
        'documents_analyzed': total_stats['documents_analyzed'],
        'analysis_date': total_stats['analysis_date'],
        'word_frequencies': total_stats['word_frequencies'].most_common(20),
        'word_length_distribution': dict(total_stats['word_length_distribution']),
        'pos_distribution': dict(total_stats['pos_distribution']),
        'vocabulary_stats': {
            'avg_word_length': sum(length * count 
                                 for length, count in total_stats['word_length_distribution'].items()) 
                            / total_stats['total_words'] if total_stats['total_words'] > 0 else 0,
            'most_common_lengths': dict(Counter(total_stats['word_length_distribution']).most_common(5))
        },
        'readability_metrics': {
            'avg_flesch_reading_ease': total_stats['readability_metrics']['total_flesch'] / successful_docs,
            'avg_gunning_fog': total_stats['readability_metrics']['total_fog'] / successful_docs
        },
        'style_analysis': {
            'avg_sentence_variety': total_stats['style_metrics']['total_variety'] / successful_docs,
            'avg_vocabulary_sophistication': total_stats['style_metrics']['total_sophistication'] / successful_docs
        },
        'sentiment_trends': {
            'avg_polarity': total_stats['sentiment_metrics']['total_polarity'] / successful_docs,
            'avg_subjectivity': total_stats['sentiment_metrics']['total_subjectivity'] / successful_docs
        }
    }
    
    print("Saving results...")
    # Save results to JSON
    with open('analysis_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    
    print("\nAnalysis complete!")
    print(f"Processed {results['documents_analyzed']} documents")
    print(f"Total words: {results['total_words']}")
    print(f"Unique words: {results['unique_words']}")
    print(f"Average words per sentence: {results['avg_words_per_sentence']:.2f}")
    print(f"\nReadability Metrics:")
    print(f"Flesch Reading Ease: {results['readability_metrics']['avg_flesch_reading_ease']:.2f}")
    print(f"Gunning Fog Index: {results['readability_metrics']['avg_gunning_fog']:.2f}")
    print(f"\nWriting Style:")
    print(f"Vocabulary Sophistication: {results['style_analysis']['avg_vocabulary_sophistication']:.2f}%")
    print(f"Sentence Variety: {results['style_analysis']['avg_sentence_variety']:.2f}")
    print(f"\nSentiment Analysis:")
    print(f"Average Polarity: {results['sentiment_trends']['avg_polarity']:.2f}")
    print(f"Average Subjectivity: {results['sentiment_trends']['avg_subjectivity']:.2f}")

if __name__ == '__main__':
    analyze_all_samples() 