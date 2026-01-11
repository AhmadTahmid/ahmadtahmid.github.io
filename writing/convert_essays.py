import os
import markdown
import shutil
from pathlib import Path

# HTML template for essays
ESSAY_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - Ahmad Tahmid</title>
    <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600&family=Space+Mono:ital@0;1&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../../styles.css">
    <link rel="stylesheet" href="../writing.css">
    <link rel="stylesheet" href="essay.css">
    <script data-goatcounter="https://shalcueva.goatcounter.com/count"
        async src="//gc.zgo.at/count.js"></script>
</head>
<body>
    <div class="container essay-container">
        <header>
            <a href="../" class="back-link">← Back to Writing</a>
        </header>

        <article class="essay-content">
            <h1>{title}</h1>
            <div class="essay-body">
                {content}
            </div>
        </article>

        <footer class="essay-footer">
            <div class="essay-nav">
                <a href="../" class="prev-essay">← Back to Essays</a>
            </div>
        </footer>
    </div>
</body>
</html>"""

def get_title(filename):
    """Get proper title from filename."""
    titles = {
        'why-not-muslim': 'Why I Am Not a Muslim',
        'stagnation': 'My Years of Stagnation',
        'san-benedetto': 'San Benedetto Val di Sambro',
        'পতনের পরবর্তী প্রহর': 'পতনের পরবর্তী প্রহর'
    }
    return titles.get(filename, filename.replace('-', ' ').title())

def get_output_dir_name(filename):
    """Get the output directory name for a given filename."""
    dir_names = {
        'পতনের পরবর্তী প্রহর': 'after-the-fall',
        'why-not-muslim': 'why-not-muslim',
        'stagnation': 'stagnation',
        'san-benedetto': 'san-benedetto'
    }
    return dir_names.get(filename, filename)

def copy_images(markdown_dir, output_dir, essay_name):
    """Copy images from markdown directory to output directory."""
    source_img_dir = markdown_dir / essay_name / 'images'
    dest_img_dir = output_dir / 'images'
    
    if source_img_dir.exists():
        # Create the destination directory if it doesn't exist
        dest_img_dir.mkdir(exist_ok=True)
        
        # Copy all images
        for img_file in source_img_dir.glob('*'):
            if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif']:
                shutil.copy2(img_file, dest_img_dir / img_file.name)

def convert_markdown_to_html(markdown_path):
    """Convert a markdown file to HTML using the template."""
    md = markdown.Markdown(extensions=['meta'])
    
    with open(markdown_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Update image paths in markdown
    text = text.replace('](images/', '](./images/')
    
    html_content = md.convert(text)
    
    # Get proper title from filename
    filename = Path(markdown_path).stem
    title = get_title(filename)
    
    # Fill the template
    html = ESSAY_TEMPLATE.format(
        title=title,
        content=html_content
    )
    
    return html

def process_all_essays():
    """Process all markdown files in the markdown directory."""
    markdown_dir = Path('writing/markdown')
    
    for md_file in markdown_dir.glob('*.md'):
        # Get the output directory name
        output_dir_name = get_output_dir_name(md_file.stem)
        output_dir = Path('writing') / output_dir_name
        output_dir.mkdir(exist_ok=True)
        
        # Copy images if they exist
        copy_images(markdown_dir, output_dir, md_file.stem)
        
        # Convert markdown to HTML
        html = convert_markdown_to_html(md_file)
        
        # Write the HTML file
        with open(output_dir / 'index.html', 'w', encoding='utf-8') as f:
            f.write(html)
        
        # Copy the essay.css file if it doesn't exist
        css_source = Path('writing/why-not-muslim/essay.css')
        css_dest = output_dir / 'essay.css'
        if css_source.exists() and not css_dest.exists():
            with open(css_source, 'r', encoding='utf-8') as source:
                with open(css_dest, 'w', encoding='utf-8') as dest:
                    dest.write(source.read())

if __name__ == "__main__":
    process_all_essays() 