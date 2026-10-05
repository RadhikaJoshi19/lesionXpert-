import os
import sys
import io
from fastapi.testclient import TestClient
from PIL import Image

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app

client = TestClient(app)


def test_health_endpoint():
    with TestClient(app) as client_with_lifespan:
        response = client_with_lifespan.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["model"] == "Salesforce/blip-image-captioning-base"
        assert data["model_loaded"] is True
        print("\n[PASS] GET /api/health (with lifespan loaded):", data)


def test_caption_generation_jpg():
    img_path = os.path.join(os.path.dirname(__file__), "..", "sample_images", "beach_landscape.jpg")
    with open(img_path, "rb") as f:
        response = client.post(
            "/api/caption",
            files={"image": ("beach_landscape.jpg", f, "image/jpeg")}
        )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["caption"], str)
    assert len(data["caption"]) > 0
    assert data["inference_time"] > 0
    assert data["model"] == "Salesforce/blip-image-captioning-base"
    print("\n[PASS] POST /api/caption (beach_landscape.jpg):", data["caption"], f"({data['inference_time']}s)")


def test_caption_generation_png():
    img_path = os.path.join(os.path.dirname(__file__), "..", "sample_images", "field_animal.png")
    with open(img_path, "rb") as f:
        response = client.post(
            "/api/caption",
            files={"image": ("field_animal.png", f, "image/png")}
        )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["caption"], str)
    print("\n[PASS] POST /api/caption (field_animal.png):", data["caption"], f"({data['inference_time']}s)")


def test_invalid_file_extension():
    fake_txt = io.BytesIO(b"Hello world, this is a text file not an image")
    response = client.post(
        "/api/caption",
        files={"image": ("document.txt", fake_txt, "text/plain")}
    )
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert "Unsupported file format" in data["error"]
    print("\n[PASS] Unsupported extension error handling:", data)


def test_corrupted_image():
    fake_img = io.BytesIO(b"GIF89a corrupted bytes not real image")
    response = client.post(
        "/api/caption",
        files={"image": ("corrupted.jpg", fake_img, "image/jpeg")}
    )
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert "Invalid or corrupted" in data["error"]
    print("\n[PASS] Corrupted image error handling:", data)


def test_empty_file():
    empty_file = io.BytesIO(b"")
    response = client.post(
        "/api/caption",
        files={"image": ("empty.jpg", empty_file, "image/jpeg")}
    )
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert "empty" in data["error"].lower()
    print("\n[PASS] Empty file error handling:", data)


if __name__ == "__main__":
    print("Running backend integration tests...")
    test_health_endpoint()
    test_caption_generation_jpg()
    test_caption_generation_png()
    test_invalid_file_extension()
    test_corrupted_image()
    test_empty_file()
    print("\nALL BACKEND TESTS PASSED SUCCESSFULLY!")
