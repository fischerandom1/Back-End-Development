from fastapi import FastAPI, HTTPException, Form, File, UploadFile
from transformers import OwlViTProcessor, OwlViTForObjectDetection
from PIL import Image
import torch
import io
import requests
from PIL import ImageDraw, ImageFont
from fastapi.responses import JSONResponse, StreamingResponse

# Initialize the FastAPI app
app = FastAPI()

# Load the model and processor
processor = OwlViTProcessor.from_pretrained("google/owlvit-base-patch32")
model = OwlViTForObjectDetection.from_pretrained("google/owlvit-base-patch32")



def draw_boxes_on_image(image, predictions):
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()  # Loads a default font
    font_size = 20
    font = font.font_variant(size=font_size)

    for prediction in predictions:
        box = prediction["location"]
        label = prediction["label"]
        confidence = prediction["confidence"]

        # Draw rectangle to frame the detected object
        draw.rectangle(((box[0], box[1]), (box[2], box[3])), outline="red", width=3)

        # Prepare text
        text = f"{label} ({confidence:.2f})"
        
        # Draw text
        draw.text((box[0] + 10, box[1] + 10), text, fill="red", font=font)

    return image

def non_max_suppression(predictions, iou_threshold=0.5):
    """
    Performs Non-Maximum Suppression on the predictions.
    :param predictions: List of predictions containing 'box' and 'confidence'.
    :param iou_threshold: Intersection Over Union threshold to filter overlapping boxes.
    :return: Filtered predictions.
    """
    if len(predictions) == 0:
        return []

    # Sort by confidence
    predictions.sort(key=lambda x: x['confidence'], reverse=True)

    filtered_predictions = []
    while predictions:
        # Select the prediction with highest confidence and remove it from the list
        best_prediction = predictions.pop(0)
        filtered_predictions.append(best_prediction)

        # Compare the best prediction with the rest of the predictions
        predictions = [pred for pred in predictions if not iou(best_prediction['location'], pred['location']) > iou_threshold]

    return filtered_predictions

def iou(box1, box2):
    """
    Calculate the Intersection Over Union (IOU) of two bounding boxes.
    :param box1: [x1, y1, x2, y2] coordinates of the first box.
    :param box2: [x1, y1, x2, y2] coordinates of the second box.
    :return: IOU value.
    """
    # Calculate intersection area
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    intersection_area = max(0, x2 - x1) * max(0, y2 - y1)

    # Calculate union area
    box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
    box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union_area = box1_area + box2_area - intersection_area

    # Compute IOU
    iou = intersection_area / union_area if union_area else 0

    return iou


@app.get('/')
# testing
def get_health():
    """
    Usage on K8S
    readinessProbe:
        httpGet:
            path: /notify/v1/health
            port: 80
    livenessProbe:
        httpGet:
            path: /notify/v1/health
            port: 80
    :return:
        dict(msg='OK')
    """
    return dict(msg='OK')


@app.get('/notify/v1/health')
def get_health():
    """
    Usage on K8S
    readinessProbe:
        httpGet:
            path: /notify/v1/health
            port: 80
    livenessProbe:
        httpGet:
            path: /notify/v1/health
            port: 80
    :return:
        dict(msg='OK')
    """
    return dict(msg='OK')


@app.post("/object-to-json")
async def predict(file: UploadFile = File(...), text_queries: str = Form(default="")):
    # Read image file
    if file.content_type.startswith('image/'):
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        image = image.convert("RGB")  # Convert image to RGB format
    else:
        raise HTTPException(status_code=400, detail="Invalid file format")

    # Preprocess text queries
    texts = [text_queries.split(",")]
    print(texts)

    # Process and predict
    inputs = processor(text=texts, images=image, return_tensors="pt")
    outputs = model(**inputs)

    target_sizes = torch.Tensor([image.size[::-1]])
    results = processor.post_process_object_detection(outputs=outputs, target_sizes=target_sizes)
    
    # Retrieve predictions
    response = []
    for i, text in enumerate(texts):
        boxes, scores, labels = results[i]["boxes"], results[i]["scores"], results[i]["labels"]
        for box, score, label in zip(boxes, scores, labels):
            box = [round(b, 2) for b in box.tolist()]
            response.append({
                "label": text[label],
                "confidence": round(score.item(), 3),
                "location": box
            })
            
    # Apply Non-Maximum Suppression to filter out duplicate detections
    response = non_max_suppression(response)
    print(response)
    
    # Restructure the response
    structured_response = {}
    for i, prediction in enumerate(response):
        box = prediction["location"]
        structured_response[str(i)] = {
            "xmin": box[0],
            "ymin": box[1],
            "xmax": box[2],
            "ymax": box[3],
            "confidence": prediction["confidence"],
            "class": 0,  # Assuming class 0, modify as needed
            "name": prediction["label"]
        }
        
    print(structured_response)

    return JSONResponse({"result": structured_response})



@app.post("/object-to-img")
async def predict_and_show(file: UploadFile = File(...), text_queries: str = Form(default="")):
    if file.content_type.startswith('image/'):
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        image = image.convert("RGB")  # Convert image to RGB format
    else:
        raise HTTPException(status_code=400, detail="Invalid file format")

    texts = [text_queries.split(",")]
    print(texts)
    inputs = processor(text=texts, images=image, return_tensors="pt")
    outputs = model(**inputs)
    target_sizes = torch.Tensor([image.size[::-1]])
    results = processor.post_process_object_detection(outputs=outputs, target_sizes=target_sizes)

    response = []
    for i, text in enumerate(texts):
        boxes, scores, labels = results[i]["boxes"], results[i]["scores"], results[i]["labels"]
        for box, score, label in zip(boxes, scores, labels):
            box = [round(b, 2) for b in box.tolist()]
            response.append({
                "label": text[label],
                "confidence": round(score.item(), 3),
                "location": box
            })

    # Apply Non-Maximum Suppression to filter out duplicate detections
    response = non_max_suppression(response)
    print(response)

    # Draw boxes and labels on the image
    predicted_image = draw_boxes_on_image(image, response)

    # Convert the PIL image to byte array to send as response
    img_byte_arr = io.BytesIO()
    predicted_image.save(img_byte_arr, format='JPEG')
    img_byte_arr = img_byte_arr.getvalue()

    return StreamingResponse(io.BytesIO(img_byte_arr), media_type="image/jpeg")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
