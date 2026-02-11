# Use the official Python base image
FROM python:3.9.13

RUN apt-get update
RUN apt-get install ffmpeg libsm6 libxext6  -y

# Set the working directory inside the container
RUN mkdir /code

WORKDIR /code

# Copy the requirements file to the working directory
COPY requirements.txt .

RUN pip install -r requirements.txt

RUN git clone https://github.com/CASIA-IVA-Lab/FastSAM.git

WORKDIR /code/FastSAM

RUN pip install -r requirements.txt

RUN pip install --upgrade typing-extensions

WORKDIR /code

RUN pip install git+https://github.com/openai/CLIP.git

COPY . .

CMD ["uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8006"]
