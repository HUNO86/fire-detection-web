const ipUrlInput = document.getElementById("ip-url");
const btnIp = document.getElementById("btn-ip");
const btnWebcam = document.getElementById("btn-webcam");
const btnStop = document.getElementById("btn-stop");
const videoUpload = document.getElementById("video-upload");
const videoContainer = document.getElementById("video-container");
const videoFeed = document.getElementById("video-feed");
const placeholder = document.getElementById("placeholder");
const modalOverlay = document.getElementById("modal-overlay");
const modalYes = document.getElementById("modal-yes");
const modalNo = document.getElementById("modal-no");
const statusBar = document.getElementById("status-bar");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");
const loadingBar = document.getElementById("loading-bar");

function showLoading() {
    loadingBar.style.display = "flex";
}

function hideLoading() {
    loadingBar.style.display = "none";
}

function updateStatus(text, state) {
    statusText.textContent = text;
    statusDot.className = "status-dot";
    if (state === "active") {
        statusDot.classList.add("active");
    } else if (state === "error") {
        statusDot.classList.add("error");
    }
}

function showStream(url, sourceName) {
    showLoading();
    placeholder.style.display = "none";
    videoContainer.style.display = "block";

    const videoFrame = videoContainer.querySelector(".video-frame");
    videoFrame.classList.remove("active");

    videoFeed.onload = function () {
        hideLoading();
        videoFrame.classList.add("active");
        updateStatus("Source: " + sourceName, "active");
    };

    videoFeed.onerror = function () {
        hideLoading();
        updateStatus("Connection lost", "error");
    };

    videoFeed.src = url;
}

function stopStream() {
    fetch("/stop_stream", { method: "POST" });
    videoFeed.src = "";
    videoFeed.onload = null;
    videoFeed.onerror = null;
    videoContainer.style.display = "none";
    placeholder.style.display = "block";
    hideLoading();
    updateStatus("Idle", "");

    const videoFrame = videoContainer.querySelector(".video-frame");
    videoFrame.classList.remove("active");
}

function showModal() {
    modalOverlay.classList.add("active");
}

function hideModal() {
    modalOverlay.classList.remove("active");
}

function startWebcam() {
    showStream("/video_feed?source=webcam", "Local Webcam");
}

function disableButtons(disabled) {
    btnIp.disabled = disabled;
    btnWebcam.disabled = disabled;
    document.getElementById("btn-upload-label").style.pointerEvents = disabled ? "none" : "auto";
}

btnIp.addEventListener("click", async () => {
    const url = ipUrlInput.value.trim() || ipUrlInput.placeholder;
    disableButtons(true);
    showLoading();
    updateStatus("Connecting to IP Webcam...", "");

    try {
        const resp = await fetch(`/check_stream?url=${encodeURIComponent(url)}`);
        const data = await resp.json();

        if (data.success) {
            showStream(`/video_feed?source=ip&url=${encodeURIComponent(url)}`, "IP Webcam");
        } else {
            hideLoading();
            updateStatus("IP Webcam unreachable", "error");
            showModal();
        }
    } catch {
        hideLoading();
        updateStatus("IP Webcam unreachable", "error");
        showModal();
    } finally {
        disableButtons(false);
    }
});

btnWebcam.addEventListener("click", () => {
    startWebcam();
});

btnStop.addEventListener("click", () => {
    stopStream();
});

videoUpload.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    disableButtons(true);
    showLoading();
    updateStatus("Uploading video...", "");

    const formData = new FormData();
    formData.append("video", file);

    try {
        const resp = await fetch("/upload", { method: "POST", body: formData });
        const data = await resp.json();

        if (data.filename) {
            showStream(`/video_feed?source=file&path=${encodeURIComponent(data.filename)}`, file.name);
        } else {
            hideLoading();
            updateStatus("Upload failed", "error");
        }
    } catch (err) {
        hideLoading();
        updateStatus("Upload failed", "error");
    } finally {
        disableButtons(false);
        videoUpload.value = "";
    }
});

modalYes.addEventListener("click", () => {
    hideModal();
    startWebcam();
});

modalNo.addEventListener("click", () => {
    hideModal();
});

window.addEventListener('load', () => {
    btnIp.click();
});