from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import tempfile
from analyze_samples import analyze_document
from collections import Counter

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

ALLOWED_EXTENSIONS = {'txt', 'docx', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'files[]' not in request.files:
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.files.getlist('files[]')
    if not files or all(file.filename == '' for file in files):
        return jsonify({'error': 'No files selected'}), 400
    
    results = []
    temp_files = []
    
    try:
        for file in files:
            if not allowed_file(file.filename):
                continue
            
            # Create a temporary file to store the upload
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1])
            temp_files.append(temp_file)
            file.save(temp_file.name)
            temp_file.close()  # Close the file before analysis
            
            # Analyze the document
            doc_results = analyze_document(temp_file.name)
            
            if doc_results:
                results.append(doc_results)
        
        if not results:
            return jsonify({'error': 'No valid documents to analyze'}), 400

        # Aggregate results from all documents
        total_words = sum(r.get('word_count', 0) for r in results)
        total_sentences = sum(r.get('sentence_count', 0) for r in results)
        all_words = []
        for r in results:
            all_words.extend(word for word, _ in r.get('word_frequencies', []))
        
        # Calculate averages
        avg_flesch = sum(r.get('readability_metrics', {}).get('flesch_reading_ease', 0) for r in results) / len(results)
        avg_fog = sum(r.get('readability_metrics', {}).get('gunning_fog_index', 0) for r in results) / len(results)
        avg_sent_variety = sum(r.get('style_metrics', {}).get('sentence_variety', {}).get('std_dev', 0) for r in results) / len(results)
        avg_vocab = sum(r.get('style_metrics', {}).get('vocabulary_sophistication', 0) for r in results) / len(results)
        avg_polarity = sum(r.get('sentiment_analysis', {}).get('polarity', 0) for r in results) / len(results)
        avg_subjectivity = sum(r.get('sentiment_analysis', {}).get('subjectivity', 0) for r in results) / len(results)

        # Format combined results
        formatted_results = {
            'word_count': total_words,
            'unique_words': len(set(all_words)),
            'avg_sentence_length': total_words / total_sentences if total_sentences > 0 else 0,
            'word_frequencies': Counter(all_words).most_common(20),
            'readability': {
                'flesch_reading_ease': avg_flesch,
                'gunning_fog_index': avg_fog
            },
            'style': {
                'sentence_variety': avg_sent_variety,
                'vocabulary_sophistication': avg_vocab
            },
            'sentiment': {
                'polarity': avg_polarity,
                'subjectivity': avg_subjectivity
            }
        }
        
        return jsonify(formatted_results)
    
    except Exception as e:
        print(f"Error in analyze_document: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        # Clean up all temporary files
        for temp_file in temp_files:
            if os.path.exists(temp_file.name):
                try:
                    os.unlink(temp_file.name)
                except Exception as e:
                    print(f"Error cleaning up temporary file: {str(e)}")

if __name__ == '__main__':
    app.run(port=5000, debug=True)