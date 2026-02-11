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
