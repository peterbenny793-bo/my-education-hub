"""Announcements CRUD."""
from flask import Blueprint, request, jsonify
from .database import get_db
from .sanitizer import clean
from .cache import cache_get, cache_set, cache_delete
from .auth import require_admin

ann_bp = Blueprint("announcements", __name__)

@ann_bp.route("", methods=["GET"])
def list_posts():
    cached = cache_get("announcements:list")
    if cached: return jsonify(cached)
    try:
        res = get_db().table("announcements").select("*").order("created_at", desc=True).execute()
        data = res.data or []
    except Exception:
        data = []
    cache_set("announcements:list", data, 60)
    return jsonify(data)

@ann_bp.route("", methods=["POST"])
@require_admin
def create_post():
    data = request.get_json(silent=True) or {}
    title = clean(data.get("title", ""), 120)
    content = clean(data.get("content", ""), 2000)
    if not title or not content:
        return jsonify({"error": "Title and content required"}), 400
    try:
        res = get_db().table("announcements").insert({
            "title": title, "content": content, "author": "Teacher"
        }).execute()
        cache_delete("announcements:list")
        return jsonify(res.data[0] if res.data else {}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ann_bp.route("/<post_id>", methods=["DELETE"])
@require_admin
def delete_post(post_id):
    try:
        get_db().table("announcements").delete().eq("id", post_id).execute()
        cache_delete("announcements:list")
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500