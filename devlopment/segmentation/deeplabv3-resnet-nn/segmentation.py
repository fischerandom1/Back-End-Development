import torch
from torchvision import models
from PIL import Image
import io
from torchvision.transforms import functional as F

def get_segmentation_model():
    # Load a pre-trained DeepLabV3 model
    model = models.segmentation.deeplabv3_resnet101(pretrained=True)
    model.eval()  # Set the model to evaluation mode
    return model

def get_image_from_bytes(binary_image, max_size=1024):
    input_image = Image.open(io.BytesIO(binary_image)).convert("RGB")
    width, height = input_image.size
    resize_factor = min(max_size / width, max_size / height)
    resized_image = input_image.resize(
        (
            int(input_image.width * resize_factor),
            int(input_image.height * resize_factor),
        ),
        Image.BILINEAR
    )
    return resized_image

def segment_image(model, binary_image):
    # Convert the binary image data to a PIL image
    image = get_image_from_bytes(binary_image)
    
    # Transform the image to a tensor and normalize it
    input_tensor = F.to_tensor(image).unsqueeze(0)
    
    # Perform the segmentation
    with torch.no_grad():
        output = model(input_tensor)['out'][0]
    return output.argmax(0)
