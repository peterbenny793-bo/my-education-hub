"""Resources CRUD + Cloudinary upload."""
from flask import Blueprint, request, jsonify
from .database import get_db
from .storage import upload_file
from .sanitizer import clean
from .cache import cache_get, cache_set, cache_delete
from .auth import require_admin

res_bp = Blueprint("resources", __name__)

@res_bp.route("/<subject>", methods=["GET"])
def list_resources(subject):
    subject = clean(subject, 80)
    key = f"resources:{subject}"
    cached = cache_get(key)
    if cached: return jsonify(cached)
    try:
        res = get_db().table("resources").select("*").eq("subject", subject).execute()
        data = res.data or []
    except Exception:
        data = []
    cache_set(key, data, 120)
    return jsonify(data)

@res_bp.route("/upload", methods=["POST"])
@require_admin
def upload_resource():
    subject = clean(request.form.get("subject", ""), 80)
    topic = clean(request.form.get("topic", ""), 120)
    name = clean(request.form.get("name", ""), 120)
    file = request.files.get("file")
    if not all([subject, topic, name]) or not file:
        return jsonify({"error": "Missing fields"}), 400
    try:
        uploaded = upload_file(file.read(), file.filename)
        res = get_db().table("resources").insert({
            "subject": subject, "topic": topic, "name": name,
            "type": file.content_type or "application/octet-stream",
            "url": uploaded["url"], "public_id": uploaded["public_id"]
        }).execute()
        cache_delete(f"resources:{subject}")
        return jsonify(res.data[0] if res.data else {}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@res_bp.route("/<resource_id>", methods=["DELETE"])
@require_admin
def delete_resource(resource_id):
    try:
        res = get_db().table("resources").select("subject,public_id").eq("id", resource_id).execute()
        if res.data:
            get_db().table("resources").delete().eq("id", resource_id).execute()
            cache_delete(f"resources:{res.data[0]['subject']}")
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@res_bp.route("/latest", methods=["GET"])
def latest():
    try:
        res = get_db().table("resources").select("id,name").order("created_at", desc=True).limit(1).execute()
        return jsonify({"latest": res.data[0] if res.data else None})
    except Exception:
        return jsonify({"latest": None})