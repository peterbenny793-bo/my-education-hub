"""Cloudinary upload helper."""
import os
import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

def upload_file(file_bytes, filename, resource_type="auto"):
    result = cloudinary.uploader.upload(
        file_bytes,
        public_id=os.path.splitext(filename)[0],
        resource_type=resource_type,
        overwrite=False
    )
    return {"url": result["secure_url"], "public_id": result["public_id"]}