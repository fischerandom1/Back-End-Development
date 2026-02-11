from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Response
from fastsam import FastSAM, FastSAMPrompt
import torch
from PIL import Image
import io
import uvicorn
import cv2
import numpy as np
from starlette.responses import StreamingResponse
from fastapi.responses import JSONResponse
import math

app = FastAPI()
model = FastSAM('FastSAM.pt')
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def process_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes))
    return image.convert("RGB")

@app.post("/object-to-img")
async def create_prediction(file: UploadFile = File(...), text_queries: str = Form(...)):
    try:
        # Read and process the image file
        image_bytes = await file.read()
        image = process_image(image_bytes)

        # Generate prediction using FastSAMPrompt
        everything_results = model.predict(image, device=device)
        prompt_processor = FastSAMPrompt(image, everything_results, device=device)
        annotations, bbox, score = prompt_processor.text_prompt(text=text_queries)

        # Generate the image data using plot_to_result method
        image_data = prompt_processor.plot_to_result(
            annotations=annotations,
            mask_random_color=True,
            better_quality=True,
            retina=False,
            withContours=True
        )

        # Convert image data to byte stream
        _, encoded_image = cv2.imencode('.jpg', image_data)
        byte_stream = io.BytesIO(encoded_image.tobytes())

        # Return the image as a byte stream
        return StreamingResponse(byte_stream, media_type="image/jpeg")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/object-to-json")
async def create_prediction_json(file: UploadFile = File(...), text_queries: str = Form(...)):
    try:
        # Read and process the image file
        image_bytes = await file.read()
        image = process_image(image_bytes)

        # Generate prediction using FastSAMPrompt
        everything_results = model.predict(image, device=device)
        prompt_processor = FastSAMPrompt(image, everything_results, device=device)
        annotations, bbox, score = prompt_processor.text_prompt(text=text_queries)
        
        results = {}
        
        # Structure the results in a way that is expected by the calling API
        results['0'] = {
            "xmin": float(bbox[0]),
            "ymin": float(bbox[1]),
            "xmax": float(bbox[2]),
            "ymax": float(bbox[3]),
            "confidence": float(score),
            "name": text_queries
        }
        
        # Return the results as a JSON response
        return JSONResponse(content={"result": results})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

  
    
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
