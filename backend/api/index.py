"""Flask app entry point for Vercel."""
import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret")

CORS(app, origins=[os.getenv("FRONTEND_URL", "*")], supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"])

@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response

from api.auth import auth_bp
from api.announcements import ann_bp
from api.resources import res_bp
from api.contact import contact_bp

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(ann_bp, url_prefix="/api/announcements")
app.register_blueprint(res_bp, url_prefix="/api/resources")
app.register_blueprint(contact_bp, url_prefix="/api/contact")

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})

handler = app