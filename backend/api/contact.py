"""Contact form submissions."""
from flask import Blueprint, request, jsonify
from .database import get_db
from .sanitizer import clean
from .auth import require_admin

contact_bp = Blueprint("contact", __name__)

ALLOWED_STATUSES = {"Student", "Parent", "Guardian", "Citizen"}

@contact_bp.route("", methods=["POST"])
def submit_contact():
    data = request.get_json(silent=True) or {}
    name = clean(data.get("name", ""), 80)
    status = clean(data.get("status", ""), 20)
    cls = clean(data.get("class", "") or "", 60)
    contact = clean(data.get("contact", ""), 100)
    message = clean(data.get("message", ""), 255)

    if not all([name, status, contact, message]):
        return jsonify({"error": "All fields required"}), 400
    if status not in ALLOWED_STATUSES:
        return jsonify({"error": "Invalid status"}), 400
    if status == "Student" and not cls:
        return jsonify({"error": "Class required for students"}), 400

    try:
        res = get_db().table("messages").insert({
            "name": name, "status": status, "class": cls or None,
            "contact": contact, "message": message
        }).execute()
        return jsonify(res.data[0] if res.data else {}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@contact_bp.route("", methods=["GET"])
@require_admin
def list_messages():
    try:
        res = get_db().table("messages").select("*").order("created_at", desc=True).execute()
        return jsonify(res.data or [])
    except Exception:
        return jsonify([])

@contact_bp.route("/<msg_id>", methods=["DELETE"])
@require_admin
def delete_message(msg_id):
    try:
        get_db().table("messages").delete().eq("id", msg_id).execute()
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500