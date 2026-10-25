---
title: CPV Fire Detection Hosting
sdk: docker
license: mit
short_description: A space to host the server
---

# Real-Time Smoke & Fire Detection

A Flask web app that runs a **YOLO26n** smoke/fire detector on uploaded videos and IP-camera streams, with live controls and real-time metrics.

**▶ Live demo:** https://huggingface.co/spaces/HUNO86/CPV_fire_detection_hosting

<!-- Add a screenshot or GIF of the app here, e.g. ![demo](static/images/demo.gif) -->

## Features
- **Video sources:** video upload, IP camera URL (local webcam when running on your own machine)
- **Live controls:** confidence and IoU threshold sliders applied on the fly
- **Metrics panel:** FPS, total detections, minimum confidence, per-class counts
- **Deployment:** hosted on Hugging Face Spaces

## Project structure
```
app.py            # Flask routes and streaming
captures.py       # video / camera capture sources
config.yaml       # model path, thresholds, server settings
models/           # best.pt (fine-tuned), yolo26n.pt
templates/, static/   # frontend (HTML/CSS/JS)
```

## Run locally
```bash
pip install -r requirements.txt
python app.py
# open http://localhost:7860
```

## Notes
- On Hugging Face Spaces there is no physical camera, so the server-side webcam source only works locally; use **Upload Video** or **IP Camera** in the demo.

## Team
CPV301 (Computer Vision) group project, FPT University Can Tho. Mentor: Mr. Nguyen Dinh Vinh.
My role: web application and deployment.
