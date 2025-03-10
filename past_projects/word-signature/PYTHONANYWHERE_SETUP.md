# Setting up WordSignature on PythonAnywhere

Follow these steps to deploy your WordSignature analysis tool on PythonAnywhere's free tier.

## Step 1: Create a PythonAnywhere Account

1. Go to [PythonAnywhere.com](https://www.pythonanywhere.com/) and sign up for a free account
2. Complete the registration process

## Step 2: Upload Your Files

1. Log in to your PythonAnywhere account
2. Click on "Files" in the top navigation
3. Create a new directory called `word-signature`
4. Upload the following files to this directory:
   - `analyze_samples.py`
   - `server_pythonanywhere.py` (rename it to `flask_app.py`)
   - `requirements.txt`

## Step 3: Install Dependencies

1. Go to "Consoles" in the top navigation
2. Start a new Bash console
3. In the console, run:
   ```bash
   cd word-signature
   pip install --user -r requirements.txt
   python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('averaged_perceptron_tagger')"
   ```

## Step 4: Set Up a Web App

1. Go to the "Web" tab in the top navigation
2. Click "Add a new web app"
3. Choose "Manual configuration"
4. Select Python 3.10 (or the latest available version)
5. Click "Next"
6. In the "Code" section, set the source code directory to `/home/yourusername/word-signature`
7. Set the WSGI configuration file path (it should be automatically filled)
8. Click on the WSGI configuration file link to edit it
9. Replace the content with:

```python
import sys
import os

# Add your project directory to the sys.path
path = '/home/yourusername/word-signature'
if path not in sys.path:
    sys.path.append(path)

# Import your Flask app
from flask_app import app as application
```

10. Save the file
11. Click the "Reload" button for your web app

## Step 5: Update Your Website Code

1. In your GitHub repository, edit the `app.js` file
2. Find the line with `fetch('http://localhost:5000/analyze', {`
3. Replace it with `fetch('https://yourusername.pythonanywhere.com/analyze', {`
4. Commit and push the changes to GitHub

## Step 6: Test Your Deployment

1. Visit your website and try the Word Signature analysis tool
2. If you encounter any issues, check the error logs in the "Web" tab on PythonAnywhere

## Notes

- The free tier of PythonAnywhere has CPU and bandwidth limitations, but it should be sufficient for occasional use
- Your web app will be available at `https://yourusername.pythonanywhere.com`
- PythonAnywhere free accounts require you to log in and use your app at least once every 3 months to keep it active 