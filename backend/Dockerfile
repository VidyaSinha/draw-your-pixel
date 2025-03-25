FROM python:3.9-slim

WORKDIR /app

# Install system dependencies for OpenCV, OpenGL, and Qt
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libv4l-0 \
    v4l-utils \
    libxcb1 \
    libxcb-xinerama0 \
    libxcb-randr0 \
    libxcb-render0 \
    libxcb-shape0 \
    libxcb-xfixes0 \
    libxcb-sync1 \
    libxcb-shm0 \
    libxcb-icccm4 \
    libxcb-keysyms1 \
    libxcb-image0 \
    x11-xserver-utils \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create a script to run the application with Xvfb
RUN echo '#!/bin/bash\nxvfb-run -a python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload' > /app/start.sh \
    && chmod +x /app/start.sh

# Make port 8000 available
EXPOSE 8000

# Use environment variables
ENV PORT=8000
ENV HOST=0.0.0.0
ENV DISPLAY=:99
ENV QT_X11_NO_MITSHM=1

# Run the application with Xvfb
CMD ["/app/start.sh"]
