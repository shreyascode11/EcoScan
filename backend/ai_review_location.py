import json
import os
import urllib.error
import urllib.request
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().with_name(".env"), override=True)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


def fetch_street_view_image(lat: float, lng: float) -> str:
    """
    Fetches the Google Street View URL if GOOGLE_MAPS_API_KEY is defined.
    Otherwise, returns a realistic, coordinate-seeded deterministic mock Street View image from Unsplash.
    """
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if api_key:
        return f"https://maps.googleapis.com/maps/api/streetview?size=600x400&location={lat},{lng}&key={api_key}"

    # Safe deterministic fallback options from Unsplash representing typical roads, sidewalks, and streets
    mock_images = [
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80",  # Street with sidewalk
        "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=600&q=80",  # Urban street scene
        "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=600&q=80",  # Urban alleyway
        "https://images.unsplash.com/photo-1498036882173-b41c28a8ba34?auto=format&fit=crop&w=600&q=80",  # Suburban asphalt road
        "https://images.unsplash.com/photo-1471506480208-91b3a4cc78be?auto=format&fit=crop&w=600&q=80",  # Road next to park vegetation
    ]
    # Use coordinate math to hash to one of the photos deterministically
    idx = int((abs(lat) + abs(lng)) * 100) % len(mock_images)
    return mock_images[idx]


def verify_report_location(uploaded_image: str, lat: float, lng: float, description: str = "") -> dict:
    """
    Compares the citizen's uploaded report image (first image) with the Google Street View image
    associated with the coordinates (second image) using Groq vision API.
    Returns:
        dict: {"status": "approved" | "rejected" | "unclear", "confidence": float, "summary": str}
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return {
            "status": "unclear",
            "confidence": 0.0,
            "summary": "AI Location Verification is not configured on the backend (GROQ_API_KEY missing).",
        }

    reference_image = fetch_street_view_image(lat, lng)
    model = os.getenv("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")

    prompt = (
        "You are an AI verification assistant for EcoScan. "
        "Your task is to verify if the reported garbage spot image could reasonably be taken at the given map coordinates. "
        "Compare the user's uploaded report image (first image) with the Google Street View reference image for those coordinates (second image). "
        "Look for visual landmarks, building styles, road lanes, curb/sidewalk designs, trees/vegetation types, poles/wires, and overall outdoor infrastructure. "
        "Because garbage is transient, focus only on matching the static geographic features of the environment. "
        "Return a valid JSON object with keys: "
        "- status: 'approved' if the place looks identical, similar, or highly plausible (e.g. general matching vegetation, suburban houses, matching pavement style). "
        "  'rejected' if the images are completely different places (e.g. indoor room vs outdoor highway, forest vs dense city block). "
        "  'unclear' if the view is too blurry, close-up, or dark to tell. "
        "- confidence: a float between 0.0 and 1.0. "
        "- summary: a brief sentence explaining why it matches or mismatches. "
        f"User description: {description or 'None'}. "
        "Return ONLY the raw JSON object, without any markdown formatting or surrounding text."
    )

    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt,
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": uploaded_image,
                            "detail": "high",
                        },
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": reference_image,
                            "detail": "high",
                        },
                    },
                ],
            }
        ],
        "response_format": {
            "type": "json_object",
        },
    }

    request = urllib.request.Request(
        GROQ_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            raw = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        return {
            "status": "unclear",
            "confidence": 0.0,
            "summary": f"Location verification unavailable (HTTP {exc.code}).",
        }
    except Exception as exc:
        return {
            "status": "unclear",
            "confidence": 0.0,
            "summary": f"Location verification error: {str(exc)}",
        }

    output_text = ""
    choices = raw.get("choices") or []
    if choices:
        message = choices[0].get("message") or {}
        content = message.get("content")
        if isinstance(content, str):
            output_text = content.strip()
        elif isinstance(content, list):
            text_parts = []
            for item in content:
                if item.get("type") == "text" and item.get("text"):
                    text_parts.append(item["text"])
            output_text = "".join(text_parts).strip()

    cleaned_text = (output_text or "").strip()
    if cleaned_text.startswith("```"):
        lines = cleaned_text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        cleaned_text = "\n".join(lines).strip()

    try:
        parsed = json.loads(cleaned_text or "{}")
    except json.JSONDecodeError:
        parsed = {}

    status = parsed.get("status", "unclear")
    if status not in {"approved", "rejected", "unclear"}:
        status = "unclear"

    try:
        confidence = float(parsed.get("confidence", 0.0))
    except (TypeError, ValueError):
        confidence = 0.0

    summary = str(parsed.get("summary") or "AI could not determine location matching details.").strip()
    return {
        "status": status,
        "confidence": max(0.0, min(confidence, 1.0)),
        "summary": summary,
    }
