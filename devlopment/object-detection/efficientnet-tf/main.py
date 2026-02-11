from fastapi import FastAPI, File, UploadFile
from starlette.responses import JSONResponse
from fastapi.responses import StreamingResponse
from io import BytesIO
import io
from PIL import Image
import numpy as np
import tensorflow as tf
from fastapi.middleware.cors import CORSMiddleware
import tensorflow_hub as hub
import cv2
import ssl
import logging
import tensorflow as tf

ssl._create_default_https_context = ssl._create_unverified_context

from absl import logging as absl_logging

absl_logging.set_verbosity(absl_logging.ERROR)  # Suppresses warnings, only shows errors
logging.basicConfig(level=logging.ERROR)  # Standard Python logging

app = FastAPI(
    title="Object Detection API",
    description="Detect objects in an image and return results in JSON format",
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

# Load the SSD model from TensorFlow Hub
MODEL_HANDLE = 'https://tfhub.dev/tensorflow/efficientdet/d6/1'
detector = hub.load(MODEL_HANDLE)

# Function to load COCO class labels from a file
def load_coco_labels(file_path):
    with open(file_path, 'r') as file:
        labels = file.read().splitlines()
    return {i + 1: label for i, label in enumerate(labels)}

# Load COCO labels
coco_labels = load_coco_labels("coco-labels-2014_2017.txt") # Replace with the actual path

def load_img(image_bytes):
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode != "RGB":
        img = img.convert("RGB")
    return np.array(img)

def run_detector(detector, img):
    converted_img = tf.image.convert_image_dtype(img, tf.uint8)[tf.newaxis, ...]
    result = detector(converted_img)
    result = {key:value.numpy() for key,value in result.items()}
    return result

def draw_boxes_on_image(image, detections, font_size=1):
    image_with_boxes = image.copy()
    for i in range(len(detections)):
        class_id = detections[i]["class_id"]
        score = detections[i]["score"]
        bbox = detections[i]["bbox"]
        class_name = detections[i]["class_name"]

        y_min, x_min, y_max, x_max = bbox

        # Scale boxes to original image dimensions
        im_height, im_width, _ = image.shape
        (left, right, top, bottom) = (x_min * im_width, x_max * im_width,
                                      y_min * im_height, y_max * im_height)

        # Draw the box
        cv2.rectangle(image_with_boxes, (int(left), int(top)), (int(right), int(bottom)), (0, 255, 0), 2)

        # Label with class name and score (you can adjust the position)
        label = f'{class_name}: {score:.2f}'
        cv2.putText(image_with_boxes, label, (int(left), int(top - 10)), cv2.FONT_HERSHEY_SIMPLEX, font_size, (0, 0, 0), 2)

    return image_with_boxes


@app.post("/object-to-json")
async def predict_json(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        img = load_img(image_bytes)
        result = run_detector(detector, img)

        # Processing the result
        num_detections = int(result["num_detections"][0])

        detections = {}
        
        for i in range(num_detections):
            class_id = int(result["detection_classes"][0][i])
            detection = {
                "xmin": float(result["detection_boxes"][0][i][1]),  # x_min
                "ymin": float(result["detection_boxes"][0][i][0]),  # y_min
                "xmax": float(result["detection_boxes"][0][i][3]),  # x_max
                "ymax": float(result["detection_boxes"][0][i][2]),  # y_max
                "confidence": float(result["detection_scores"][0][i]),
                "class": class_id,
                "name": coco_labels.get(class_id, "Unknown")
            }
            if detection["confidence"] > 0.5:  # Adjust the threshold as needed
                detections[str(i)] = detection

        return JSONResponse(content={"result": detections})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.post("/object-to-img")
async def predict_image(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        img = load_img(image_bytes)
        result = run_detector(detector, img)

        # Process the result for bounding boxes
        num_detections = int(result["num_detections"][0])
        
        detections = []
        for i in range(num_detections):
            class_id = int(result["detection_classes"][0][i])
            detection = {
                "class_id": class_id,
                "score": float(result["detection_scores"][0][i]),
                "bbox": result["detection_boxes"][0][i].tolist(),
                "class_name": coco_labels.get(class_id, "Unknown")
            }
            if detection["score"] > 0.5:  # Adjust the threshold as needed
                detections.append(detection)

        # Draw boxes on the image
        drawn_image = draw_boxes_on_image(img, detections)

        # Convert the image to JPEG format
        _, encoded_image = cv2.imencode('.jpg', cv2.cvtColor(drawn_image, cv2.COLOR_RGB2BGR))

        # Return the JPEG image as a StreamingResponse
        return StreamingResponse(BytesIO(encoded_image.tobytes()), media_type="image/jpeg")
    
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


