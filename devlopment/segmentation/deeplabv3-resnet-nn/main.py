from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from starlette.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import logging
import io
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps
import torch
from torchvision import models, transforms
import cv2
import traceback


# Define the application
app = FastAPI(
    title="Custom DeepLab Segmentation API",
    description="Obtain a segmented image and return image and json result",
    version="0.0.1",
)

# Configure CORS
origins = [
    "http://localhost",
    "http://localhost:9000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the pre-trained DeepLab model
model = models.segmentation.deeplabv3_resnet101(pretrained=True)
model.eval()

def transform_image(image):
    # Resize while maintaining aspect ratio
    base_size = 520
    image_ratio = image.width / image.height
    if image.width < image.height:
        new_height = base_size
        new_width = int(new_height * image_ratio)
    else:
        new_width = base_size
        new_height = int(new_width / image_ratio)
    
    my_transforms = transforms.Compose([
        transforms.Resize((new_height, new_width)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    return my_transforms(image).unsqueeze(0)


def find_contours_and_classes(output_predictions, confidences, num_classes, min_contour_area=100):
    contours_and_classes = []
    # Iterate over all classes except the background
    for class_index in range(1, num_classes):  # start from 1 to exclude background
        class_mask = (output_predictions == class_index).astype(np.uint8)
        contours, _ = cv2.findContours(class_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for contour in contours:
            if cv2.contourArea(contour) >= min_contour_area:
                mask = np.zeros_like(output_predictions)
                cv2.drawContours(mask, [contour], -1, 255, -1)
                mean_confidence = np.mean(confidences[mask == 255])
                contours_and_classes.append((contour, class_index, mean_confidence))
    return contours_and_classes



# Define the endpoint for health check
@app.get("/health")
def health_check():
    return {"msg": "Service is up and running"}


# Assuming you know the number of classes (e.g., 21 for PASCAL VOC)
NUM_CLASSES = 21

# Generate a color palette
def generate_color_palette(num_classes):
    np.random.seed(42)  # For reproducibility
    palette = np.random.randint(0, 255, (num_classes, 3), dtype=np.uint8)
    palette[0] = [0, 0, 0]  # Typically the background class is set to black
    return palette

COLOR_PALETTE = generate_color_palette(NUM_CLASSES)

# Load the pre-trained DeepLab model
model = models.segmentation.deeplabv3_resnet101(pretrained=True)
model.eval()

# Define class names based on the PASCAL VOC dataset
CLASS_NAMES = [
    'background', 'aeroplane', 'bicycle', 'bird', 'boat',
    'bottle', 'bus', 'car', 'cat', 'chair', 'cow',
    'diningtable', 'dog', 'horse', 'motorbike', 'person',
    'pottedplant', 'sheep', 'sofa', 'train', 'tvmonitor'
]


@app.post("/object-to-img")
async def segment(file: UploadFile = File(...)):
    try:
        # Read the image file and convert to bytes
        image_bytes = await file.read()
        original_image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        original_width, original_height = original_image.size
        input_tensor = transform_image(original_image)

        with torch.no_grad():
            output = model(input_tensor)['out'][0]
            output_confidences = torch.nn.functional.softmax(output, dim=0)
            confidences, predictions = torch.max(output_confidences, dim=0)

        confidences = confidences.cpu().numpy()
        output_predictions = predictions.byte().cpu().numpy()

        contours_and_classes = find_contours_and_classes(output_predictions, confidences, NUM_CLASSES)

        new_width, new_height = input_tensor.shape[-1], input_tensor.shape[-2]
        width_scale = original_width / new_width
        height_scale = original_height / new_height

        # Ensure original_image is in 'RGBA' mode before compositing
        original_image = original_image.convert('RGBA')

        # Create a semi-transparent overlay
        overlay = Image.new('RGBA', original_image.size, (255, 255, 255, 0))
        overlay_draw = ImageDraw.Draw(overlay)

        # Use the default font provided by PIL, it will have a fixed size
        font = ImageFont.load_default()
        
        # Specify the desired font size
        font_size = 20  # Adjust the size as needed

        # Create a font object with the desired size
        font = font.font_variant(size=font_size)

        for contour, class_index, confidence in contours_and_classes:
            scaled_contour = [(int(point[0][0] * width_scale), int(point[0][1] * height_scale)) for point in contour]
            if scaled_contour:
                # Draw the tinted shadow
                overlay_draw.polygon(scaled_contour, fill=(*COLOR_PALETTE[class_index], 128))

                # Draw the contour outline and the confidence text on the original image
                draw = ImageDraw.Draw(original_image)
                draw.line(scaled_contour + [scaled_contour[0]], fill=tuple(COLOR_PALETTE[class_index]), width=2)
                text_point = scaled_contour[0]
                draw.text(text_point, f"{CLASS_NAMES[class_index]}: {confidence:.2f}", fill='black', font=font)

        # Apply the overlay
        composite_image = Image.alpha_composite(original_image, overlay)

        # Prepare the buffer to save the image in JPEG format
        bytes_io = io.BytesIO()
        # Make sure to convert the image to 'RGB' mode before saving as JPEG
        composite_image.convert('RGB').save(bytes_io, 'JPEG')
        bytes_io.seek(0)

        # Return the JPEG image as a response
        return Response(content=bytes_io.getvalue(), media_type="image/jpeg")
    except Exception as e:
        logging.error(f'An error occurred: {e}')
        traceback.print_exc()  # This will print the full traceback, which can help in debugging
        return HTTPException(status_code=500, detail=str(e))






@app.post("/object-to-json")
async def segment_json(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        input_tensor = transform_image(image)

        with torch.no_grad():
            output = model(input_tensor)['out'][0]
            output_softmax = torch.nn.functional.softmax(output, dim=0)
            confidences, predictions = torch.max(output_softmax, dim=0)

        predictions = predictions.byte().cpu().numpy()
        confidences = confidences.cpu().numpy()

        contours_and_classes = find_contours_and_classes(predictions, confidences, NUM_CLASSES)

        # Dictionary to hold all the objects
        objects = {}

        for i, (contour, class_index, confidence) in enumerate(contours_and_classes):
            # Get bounding box coordinates from the contour
            x, y, w, h = cv2.boundingRect(contour)
            xmin, ymin, xmax, ymax = x, y, x + w, y + h

            objects[str(i)] = {
                "xmin": float(xmin),
                "ymin": float(ymin),
                "xmax": float(xmax),
                "ymax": float(ymax),
                "confidence": float(confidence),
                "class": int(class_index),
                "name": CLASS_NAMES[class_index]
            }

        return JSONResponse(content={"result": objects})
    except Exception as e:
        logging.error(f'An error occurred: {e}')
        traceback.print_exc()
        return JSONResponse(status_code=500, content={'message': 'Error processing the image'})

