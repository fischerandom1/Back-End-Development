from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import io
import cv2
import logging
import traceback
import random
import ssl

# SSL and Logging Configuration
ssl._create_default_https_context = ssl._create_unverified_context
logging.basicConfig(level=logging.ERROR)

# Initialize FastAPI app
app = FastAPI(
    title="Custom HRNet Segmentation API",
    description="Obtain a segmented image and return image and json result",
    version="0.0.1",
)

# Set CORS policies
origins = ["http://localhost", "http://localhost:3000", "*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the HRNet model from TensorFlow Hub
MODEL_HANDLE = 'https://tfhub.dev/google/HRNet/coco-hrnetv2-w48/1'
model = hub.load(MODEL_HANDLE)

# Function to load COCO class labels from a file
def load_coco_labels(file_path):
    with open(file_path, 'r') as file:
        labels = file.read().splitlines()
    return {i + 2: label for i, label in enumerate(labels)}

# Load COCO labels
coco_labels = load_coco_labels("coco-labels-2014_2017.txt") # Replace with the actual path

# Generate a fixed color map
def generate_fixed_color_map(labels):
    random.seed(42)  # Fixed seed for consistency
    color_map = {}
    for idx, label in enumerate(labels):
        color = [random.randint(0, 255) for _ in range(3)]

        # Check if the generated color is close to white (e.g., within a certain threshold)
        while all(abs(c - 255) < 50 for c in color):
            color = [random.randint(0, 255) for _ in range(3)]

        color_map[idx] = color

    return color_map


fixed_color_map = generate_fixed_color_map(coco_labels.values())

def transform_image(image):
    image = image.resize((520, 520))
    image = np.array(image) / 255.0
    return tf.convert_to_tensor(image, dtype=tf.float32)



@app.post("/object-to-img")
async def segment(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        original_image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        original_size = original_image.size  # Store original image size

        input_tensor = transform_image(original_image)
        input_tensor = tf.expand_dims(input_tensor, 0)

        output = model(input_tensor)
        segmentation_mask = tf.argmax(output, axis=-1)
        segmentation_mask = segmentation_mask[0].numpy()

        # Resize segmentation mask to match the original image size
        resized_mask = cv2.resize(segmentation_mask, original_size, interpolation=cv2.INTER_NEAREST)

        outlined_image = np.array(original_image)
        overlay_image = np.zeros_like(outlined_image, dtype=np.uint8)

        for class_id in np.unique(resized_mask):
            if class_id in coco_labels:
                mask = resized_mask == class_id
                color = np.array(fixed_color_map[class_id], dtype=np.uint8)

                # Create an overlay mask for this class with the same color as the outline
                overlay_mask = (mask[:, :, None] * color[None, None, :])

                # Blend it with the previous overlays
                overlay_image = cv2.addWeighted(overlay_image, 1, overlay_mask, 0.5, 0)

        # Merge the overlay with the original image
        outlined_image = cv2.addWeighted(outlined_image, 1, overlay_image, 0.5, 0)

        # Convert to PIL Image for drawing text
        outlined_image_pil = Image.fromarray(outlined_image)
        draw = ImageDraw.Draw(outlined_image_pil)
        
        # Use the default font provided by PIL, it will have a fixed size
        font = ImageFont.load_default()
        
        # Specify the desired font size
        font_size = 25  # Adjust the size as needed

        # Create a font object with the desired size
        font = font.font_variant(size=font_size)

        for class_id in np.unique(resized_mask):
            if class_id in coco_labels:
                mask = resized_mask == class_id
                
                # Find contours for individual objects within the same class
                contours, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
                for contour in contours:
                    # Calculate confidence for each object separately
                    object_mask = np.zeros(mask.shape, dtype=np.uint8)
                    cv2.drawContours(object_mask, [contour], -1, 1, thickness=cv2.FILLED)
                    confidence = np.mean(object_mask)
                    
                    # Get bounding box coordinates for the object
                    x, y, _, _ = cv2.boundingRect(contour)
                    
                    # Get the first point of the contour
                    first_point = contour[0][0]
                    first_point_x, first_point_y = first_point[0], first_point[1]
                    
                    # Create label text with individual confidence
                    label_text = f"{coco_labels[class_id]}: {confidence:.2f}"
                    
                    # Draw the label text for each object at the first point of the contour
                    draw.text((first_point_x, first_point_y), label_text, fill=(0, 0, 0), font=font)

        bytes_io = io.BytesIO()
        # Convert the image to 'RGB' mode before saving as JPEG
        outlined_image_pil.convert('RGB').save(bytes_io, 'JPEG')
        bytes_io.seek(0)

        # Return the JPEG image as a response
        return Response(content=bytes_io.getvalue(), media_type="image/jpeg")
    except Exception as e:
        logging.error(f'An error occurred: {e}')
        traceback.print_exc()
        return HTTPException(status_code=500, detail=str(e))


@app.post("/object-to-json")
async def segment_json(file: UploadFile = File(...)):
    try:
        # Read and preprocess the image
        image_bytes = await file.read()
        original_image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        input_tensor = transform_image(original_image)
        input_tensor = tf.expand_dims(input_tensor, 0)  # Add batch dimension

        # Perform inference
        output = model(input_tensor)
        segmentation_mask = tf.argmax(output, axis=-1)
        segmentation_mask = segmentation_mask[0].numpy()  # Remove batch dimension

        # Prepare JSON response with segment details
        objects_info = []
        for class_id in np.unique(segmentation_mask):
            if class_id in coco_labels:  # Check if class_id is in coco_labels
                mask = segmentation_mask == class_id
                contours, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
                for contour in contours:
                    # Create a mask for the individual object
                    object_mask = np.zeros(mask.shape, dtype=np.uint8)  # Ensure correct data type
                    cv2.drawContours(object_mask, [contour], -1, 1, thickness=cv2.FILLED)

                    # Calculate confidence as the mean value of the object mask
                    confidence = np.mean(object_mask)

                    objects_info.append({
                        "xmin": int(contour[:, 0, 0].min()),
                        "ymin": int(contour[:, 0, 1].min()),
                        "xmax": int(contour[:, 0, 0].max()),
                        "ymax": int(contour[:, 0, 1].max()),
                        "confidence": float(confidence),
                        "class": int(class_id),
                        "name": coco_labels[class_id]
                    })

        # Create the final JSON response format
        response_data = {"result": {}}
        for idx, obj_info in enumerate(objects_info):
            response_data["result"][str(idx)] = obj_info

        return JSONResponse(content=response_data)
    except Exception as e:
        logging.error(f'An error occurred: {e}')
        traceback.print_exc()
        return HTTPException(status_code=500, detail=str(e))



