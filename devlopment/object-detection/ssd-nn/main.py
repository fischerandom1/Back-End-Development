import torch
from torchvision.models.detection import ssd300_vgg16
from torchvision.transforms import functional as F
from PIL import Image, ImageDraw, ImageFont
import io
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, File, UploadFile
from starlette.responses import StreamingResponse, Response

# Load the SSD300 model structure
model = ssd300_vgg16(weights='DEFAULT')
model.eval()

app = FastAPI(
    title="SSD Model",
    description="""Obtain object value out of image
                    and return image and json result""",
    version="0.0.1",
)

origins = [
    "http://localhost",
    "http://localhost:5000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# COCO class labels
COCO_LABELS = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
    'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog',
    'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella',
    'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball', 'kite',
    'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket', 'bottle',
    'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich',
    'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
    'potted plant', 'bed', 'dining table', 'toilet', 'TV', 'laptop', 'mouse', 'remote',
    'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book',
    'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
]

def draw_boxes(image, boxes, labels, scores):
    draw = ImageDraw.Draw(image)
    # Use the default font provided by PIL, it will have a fixed size
    font = ImageFont.load_default()
        
    # Specify the desired font size

    font_size = 20  # Adjust the size as needed

    # Create a font object with the desired size
    font = font.font_variant(size=font_size)
    for box, label, score in zip(boxes, labels, scores):
        if score > 0.5:  # Confidence threshold
            class_name = COCO_LABELS[label - 1]  # Subtract 1 as COCO labels start from 1
            draw.rectangle(box, outline="blue", width=3)
            draw.text((box[0], box[1]), f"{class_name}: {score:.2f}", fill="black", font = font)
    return image

@app.post("/object-to-json")
async def detect_objects(file: UploadFile = File(...)):
    # Read and preprocess the image
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data)).convert("RGB")

    # Transform the image
    image = F.to_tensor(image)
    image = F.normalize(image, mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    image = image.unsqueeze(0)  # Add batch dimension

    # Predict using the model
    with torch.no_grad():
        predictions = model(image)

    # Process predictions with a confidence threshold
    confidence_threshold = 0.5  # Adjust if necessary
    processed_predictions = {}
    for idx, (box, label, score) in enumerate(zip(predictions[0]['boxes'], predictions[0]['labels'], predictions[0]['scores'])):
        if score.item() > confidence_threshold:
            xmin, ymin, xmax, ymax = box.tolist()
            processed_predictions[str(idx)] = {
                "xmin": xmin,
                "ymin": ymin,
                "xmax": xmax,
                "ymax": ymax,
                "confidence": score.item(),
                "class": label.item(),
                "name": COCO_LABELS[label - 1]  # Subtract 1 as COCO labels start from 1
            }

    return {"result": processed_predictions}


@app.post("/object-to-img")
async def detect_and_show_objects(file: UploadFile = File(...)):
    # Read and preprocess the image
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    image_for_draw = image.copy()

    # Transform the image
    image = F.to_tensor(image)
    image = F.normalize(image, mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    image = image.unsqueeze(0)  # Add batch dimension

    # Predict using the model
    with torch.no_grad():
        predictions = model(image)

    # Draw bounding boxes
    boxes = predictions[0]['boxes'].tolist()
    labels = predictions[0]['labels'].tolist()
    scores = predictions[0]['scores'].tolist()

    processed_image = draw_boxes(image_for_draw, boxes, labels, scores)

    # # Convert PIL image to byte array
    # img_byte_arr = io.BytesIO()
    # processed_image.save(img_byte_arr, format='JPEG')
    # img_byte_arr = img_byte_arr.getvalue()

    # return StreamingResponse(io.BytesIO(img_byte_arr), media_type="image/jpeg")

    # Save the image to a bytes buffer
    bytes_io = io.BytesIO()
    processed_image.save(bytes_io, format="JPEG")
    bytes_io.seek(0)  # Go to the start of the buffer
    
    return Response(content=bytes_io.getvalue(), media_type="image/jpeg")

# Run the server
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)
