import os
from PIL import Image, ImageDraw

os.makedirs("sample_images", exist_ok=True)

# Image 1: Sunny beach landscape with sun, sea, and sand
img1 = Image.new("RGB", (400, 300), color=(135, 206, 235)) # sky
draw1 = ImageDraw.Draw(img1)
draw1.ellipse([300, 30, 370, 100], fill=(255, 223, 0)) # yellow sun
draw1.rectangle([0, 180, 400, 240], fill=(30, 144, 255)) # blue ocean
draw1.rectangle([0, 240, 400, 300], fill=(238, 214, 175)) # sand
img1.save("sample_images/beach_landscape.jpg", "JPEG", quality=95)

# Image 2: Green field with blue sky and a white dog/cat shape
img2 = Image.new("RGB", (400, 300), color=(135, 206, 250))
draw2 = ImageDraw.Draw(img2)
draw2.rectangle([0, 170, 400, 300], fill=(34, 139, 34)) # green grass
draw2.ellipse([140, 180, 260, 250], fill=(245, 245, 245)) # animal body
draw2.ellipse([120, 150, 180, 210], fill=(245, 245, 245)) # head
draw2.polygon([(130, 150), (140, 120), (150, 150)], fill=(200, 100, 100)) # ear
draw2.polygon([(155, 150), (165, 120), (175, 150)], fill=(200, 100, 100)) # ear
img2.save("sample_images/field_animal.png", "PNG")

print("Sample images created in sample_images/")
