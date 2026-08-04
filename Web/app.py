import yaml
import os
import time
import threading
from flask import Flask, render_template, Response, request, jsonify
import cv2
from ultralytics import YOLO

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(BASE_DIR, "config.yaml"), "r") as f:
    config = yaml.safe_load(f)

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = os.path.join(BASE_DIR, "uploads")

model = YOLO(os.path.join(BASE_DIR, config["model"]["path"]))

current_capture = None
current_capture_lock = threading.Lock()
current_source = None


def release_capture():
    global current_capture, current_source
    with current_capture_lock:
        if current_capture is not None:
            current_capture.release()
            current_capture = None
        current_source = None


def open_capture(source_type, source_value=None):
    global current_capture, current_source
    release_capture()
    with current_capture_lock:
        if source_type == "ip":
            cap = cv2.VideoCapture(source_value)
        elif source_type == "webcam":
            cap = cv2.VideoCapture(0)
        elif source_type == "file":
            cap = cv2.VideoCapture(source_value)
        else:
            return False

        if not cap.isOpened():
            return False

        current_capture = cap
        current_source = source_type
        return True


def generate_frames():
    global current_capture
    while True:
        with current_capture_lock:
            if current_capture is None or not current_capture.isOpened():
                time.sleep(0.1)
                continue
            cap = current_capture

        success, frame = cap.read()
        if not success:
            time.sleep(0.1)
            continue

        results = model.predict(frame, verbose=False)
        annotated_frame = results[0].plot()

        ret, buffer = cv2.imencode(".jpg", annotated_frame)
        if not ret:
            continue

        frame_bytes = buffer.tobytes()
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
        )


@app.route("/")
def index():
    images_cfg = config.get("images", {})
    logo_path = images_cfg.get("logo", "")
    hero_bg_path = images_cfg.get("hero_bg", "")
    return render_template(
        "index.html",
        default_url=config["ip_webcam"]["default_url"],
        logo_url=logo_path,
        hero_bg_url=hero_bg_path,
    )


@app.route("/check_stream", methods=["GET"])
def check_stream():
    url = request.args.get("url", config["ip_webcam"]["default_url"])
    cap = cv2.VideoCapture(url)
    success = cap.isOpened()
    if success:
        cap.release()
    return jsonify({"success": success})


@app.route("/video_feed")
def video_feed():
    source = request.args.get("source", "webcam")
    url = request.args.get("url", config["ip_webcam"]["default_url"])
    path = request.args.get("path", "")

    if source == "ip":
        if not open_capture("ip", url):
            return jsonify({"error": "Failed to open IP Webcam stream"}), 400
    elif source == "webcam":
        if not open_capture("webcam"):
            return jsonify({"error": "Failed to open device webcam"}), 400
    elif source == "file":
        full_path = os.path.join(app.config["UPLOAD_FOLDER"], path)
        if not os.path.exists(full_path):
            return jsonify({"error": "File not found"}), 404
        if not open_capture("file", full_path):
            return jsonify({"error": "Failed to open video file"}), 400

    return Response(
        generate_frames(), mimetype="multipart/x-mixed-replace; boundary=frame"
    )


@app.route("/upload", methods=["POST"])
def upload():
    if "video" not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    file = request.files["video"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
    file.save(filepath)

    return jsonify({"filename": file.filename})


@app.route("/stop_stream", methods=["POST"])
def stop_stream():
    release_capture()
    return jsonify({"success": True})


if __name__ == "__main__":
    server_cfg = config["server"]
    app.run(
        host=server_cfg["host"],
        port=server_cfg["port"],
        debug=server_cfg["debug"],
    )
