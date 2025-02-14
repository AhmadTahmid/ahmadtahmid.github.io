from PIL import Image
import os

def optimize_images(input_dir, output_dir, max_size=(1200, 1200)):
    """Optimize images for web use."""
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    for filename in os.listdir(input_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir, filename)
            
            # Open image
            with Image.open(input_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                
                # Resize if larger than max_size while maintaining aspect ratio
                if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
                    img.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                # Save with optimization
                img.save(output_path, 'JPEG', 
                        quality=85,  # Good quality but smaller file size
                        optimize=True,
                        progressive=True)  # Progressive loading

if __name__ == "__main__":
    input_dir = "gallery/images"
    output_dir = "gallery/images_optimized"
    optimize_images(input_dir, output_dir) 