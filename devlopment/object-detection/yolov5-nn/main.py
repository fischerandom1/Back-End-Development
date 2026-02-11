from fastapi import FastAPI, File
from starlette.responses import Response
from starlette.responses import StreamingResponse
import io
from PIL import Image, ImageDraw, ImageFont
import json
from fastapi.middleware.cors import CORSMiddleware
import base64
from typing import Iterator
import torch
from PIL import Image, ImageFile
import io


def get_yolov5():
    # local best.pt
    model = torch.hub.load('ultralytics/yolov5', 'yolov5s',device='cpu',force_reload=True)
  # local repo
    model.conf = 0.5
    return model


def get_image_from_bytes(binary_image, max_size=1024):
    input_image = Image.open(io.BytesIO(binary_image)).convert("RGB")
    width, height = input_image.size
    resize_factor = min(max_size / width, max_size / height)
    resized_image = input_image.resize(
        (
            int(input_image.width * resize_factor),
            int(input_image.height * resize_factor),
        )
    )
    return resized_image



model = get_yolov5()

app = FastAPI(
    title="Custom YOLOV5 Machine Learning API",
    description="""Obtain object value out of image
                    and return image and json result""",
    version="0.0.1",
)

origins = [
    "http://localhost",
    "http://localhost:8000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
async def detect_food_return_json_result(file: bytes = File(...)):
    input_image = get_image_from_bytes(file)
    results = model(input_image)
    detect_res = results.pandas().xyxy[0].to_json(
        orient="records")  # JSON img1 predictions
    detect_res = json.loads(detect_res)
    return {"result": detect_res}


@app.post("/object-to-img")
async def detect_food_return_base64_img(file: bytes = File(...)):
    # Assuming this returns an image in RGB mode
    input_image = get_image_from_bytes(file)
    results = model(input_image)
    results.render()  # updates results.imgs with boxes and labels
    detect_res = results.pandas().xyxy[0].to_json(orient="records")
    
    # Create a draw object
    draw = ImageDraw.Draw(input_image)
    
    text_thickness = 1  # Adjust the thickness as needed
    
    # Load the default font
    font = ImageFont.load_default()
    
    # Specify the desired font size
    font_size = 45  # Adjust the size as needed

    # Create a font object with the desired size
    font = font.font_variant(size=font_size)
    
    # Draw boxes on the image
    for item in json.loads(detect_res):
        draw.rectangle([(item['xmin'], item['ymin']), (item['xmax'], item['ymax'])], outline="red",  width=3)
        # add the confidence and class name to the image
        draw.text((item['xmin'], item['ymin']),
                  f"{item['name']} : {item['confidence']:.2f}", fill="red", font=font)
    
    # Save the image to a bytes buffer
    bytes_io = io.BytesIO()
    input_image.save(bytes_io, format="JPEG")
    bytes_io.seek(0)  # Go to the start of the buffer
    
    return Response(content=bytes_io.getvalue(), media_type="image/jpeg")

    

