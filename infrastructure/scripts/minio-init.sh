#!/bin/sh
# ==========================================
# MinIO Bucket Initialization Script
# Reads credentials from environment variables injected by Docker Compose.
# ==========================================

MINIO_HOST="${MINIO_HOST:-minio}"
MINIO_PORT="${MINIO_INIT_PORT:-9000}"
ACCESS_KEY="${MINIO_ROOT_USER:-minioadmin}"
SECRET_KEY="${MINIO_ROOT_PASSWORD:-minioadmin}"

echo "Waiting for MinIO server to become ready..."
/usr/bin/mc alias set localminio "http://${MINIO_HOST}:${MINIO_PORT}" "${ACCESS_KEY}" "${SECRET_KEY}" --api s3v4

echo "Creating buckets..."
/usr/bin/mc mb --ignore-existing localminio/synapsex-evidence
/usr/bin/mc mb --ignore-existing localminio/synapsex-reports

echo "Setting bucket policies..."
# Keep evidence bucket private by default
/usr/bin/mc anonymous set none localminio/synapsex-evidence

echo "MinIO buckets successfully initialized."
exit 0
