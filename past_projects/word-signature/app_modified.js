// This is a modified version of app.js that points to the PythonAnywhere server
// Replace the fetch URL in the original app.js with this one

// Function to handle quick analysis form submission
document.getElementById('quick-analysis-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('file-upload');
    if (fileInput.files.length === 0) {
        alert('Please select at least one file to analyze.');
        return;
    }
    
    const formData = new FormData();
    for (let i = 0; i < fileInput.files.length; i++) {
        formData.append('files[]', fileInput.files[i]);
    }
    
    // Show loading indicator
    document.getElementById('quick-analysis-loading').style.display = 'block';
    document.getElementById('quick-analysis-results').style.display = 'none';
    
    try {
        // Replace this URL with your PythonAnywhere username
        const response = await fetch('https://yourusername.pythonanywhere.com/analyze', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        
        const results = await response.json();
        displayQuickAnalysisResults(results);
    } catch (error) {
        console.error('Error during analysis:', error);
        document.getElementById('quick-analysis-loading').style.display = 'none';
        alert(`Error analyzing document: ${error.message}`);
    }
}); 