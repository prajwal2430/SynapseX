"""
Evidence Storage Abstraction Layer for SynapseX / ADEIP.

Provides a unified interface for persistent forensic evidence storage.
Currently implements LocalStorageService for persistent filesystem storage,
structured so that production storage providers (AWS S3, MinIO, Azure Blob,
Cloudinary, Google Cloud Storage) can be plugged in without affecting upstream services or frontend clients.
"""

import abc
import hashlib
import logging
import os
import re
import uuid
from typing import BinaryIO, Optional, Tuple, Union
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.core.file_security import safe_join_path, sanitize_filename

logger = logging.getLogger("adeip.storage_service")


class BaseStorageService(abc.ABC):
    """Abstract base class defining the evidence storage interface."""

    @abc.abstractmethod
    async def save_upload_file(
        self,
        file: UploadFile,
        case_id: int,
        max_bytes: int = settings.MAX_UPLOAD_SIZE_BYTES,
    ) -> Tuple[str, str, int, str]:
        """
        Saves an uploaded file to persistent storage while computing SHA-256.

        Returns:
            Tuple of (stored_filename, storage_path, total_bytes, sha256_hash)
        """
        pass

    @abc.abstractmethod
    def get_file_path(self, storage_path: str) -> str:
        """Resolves and validates the physical path for file streaming."""
        pass

    @abc.abstractmethod
    def file_exists(self, storage_path: str) -> bool:
        """Checks whether the physical file exists in storage."""
        pass

    @abc.abstractmethod
    def delete_file(self, storage_path: str) -> bool:
        """Physically deletes the file from storage."""
        pass

    @abc.abstractmethod
    def get_file_url(self, evidence_id: int) -> str:
        """Returns the public API endpoint URL used by the frontend to stream/download the file."""
        pass


class LocalStorageService(BaseStorageService):
    """
    Persistent local filesystem storage service.
    Stores files inside settings.UPLOAD_STORAGE_DIR/case_{case_id}/.
    Enforces collision resistance, path traversal safety, and atomic writes.
    """

    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = os.path.abspath(base_dir or settings.UPLOAD_STORAGE_DIR)
        os.makedirs(self.base_dir, exist_ok=True)
        logger.info(f"Initialized LocalStorageService at '{self.base_dir}'")

    def _generate_unique_filename(self, original_filename: str) -> str:
        """
        Generates a unique, collision-resistant storage filename.
        Format: evd_{uuid4_prefix}_{safe_basename}
        Prevents overwriting identical files uploaded multiple times.
        """
        clean = sanitize_filename(original_filename)
        # Ensure safe alphanumeric prefix
        unique_prefix = uuid.uuid4().hex[:12]
        # Keep extension intact
        base, ext = os.path.splitext(clean)
        # Clean base of any special chars
        safe_base = re.sub(r'[^a-zA-Z0-9_\-]', '_', base)[:60]
        return f"evd_{unique_prefix}_{safe_base}{ext}"

    async def save_upload_file(
        self,
        file: UploadFile,
        case_id: int,
        max_bytes: int = settings.MAX_UPLOAD_SIZE_BYTES,
    ) -> Tuple[str, str, int, str]:
        """
        Streams UploadFile to disk in chunks, computes SHA-256 on the fly,
        and atomically cleans up on any failure.
        """
        case_dir = safe_join_path(self.base_dir, f"case_{case_id}")
        os.makedirs(case_dir, exist_ok=True)

        original_name = file.filename or "unnamed_artifact"
        stored_filename = self._generate_unique_filename(original_name)
        destination_path = safe_join_path(case_dir, stored_filename)

        sha256 = hashlib.sha256()
        total_bytes = 0
        chunk_size = 64 * 1024  # 64 KB chunks

        try:
            with open(destination_path, "wb") as f_out:
                while True:
                    chunk = await file.read(chunk_size)
                    if not chunk:
                        break
                    total_bytes += len(chunk)
                    if total_bytes > max_bytes:
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"File exceeds maximum allowed upload size of {max_bytes / (1024 * 1024):.0f} MB.",
                        )
                    sha256.update(chunk)
                    f_out.write(chunk)

            if total_bytes == 0:
                if os.path.exists(destination_path):
                    os.remove(destination_path)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Uploaded file is empty (0 bytes). Evidence artifacts must contain data.",
                )

        except Exception as exc:
            # Clean up partial/corrupted file to prevent orphans
            if os.path.exists(destination_path):
                try:
                    os.remove(destination_path)
                except OSError:
                    pass
            if isinstance(exc, HTTPException):
                raise exc
            logger.error(f"Error writing evidence file '{destination_path}': {exc}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to persistently store evidence file: {str(exc)}",
            )

        calculated_hash = sha256.hexdigest()
        logger.info(f"Stored evidence file: {destination_path} ({total_bytes} bytes, hash: {calculated_hash[:16]}...)")
        return stored_filename, destination_path, total_bytes, calculated_hash

    def get_file_path(self, storage_path: str) -> str:
        """
        Validates that the path exists and resides within the allowed base directory.
        """
        abs_path = os.path.abspath(storage_path)
        if not os.path.exists(abs_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evidence physical file not found in persistent storage.",
            )
        # Security: verify path is within storage base directory
        canonical_base = os.path.abspath(self.base_dir)
        try:
            common = os.path.commonpath([canonical_base, abs_path])
        except ValueError:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

        if common != canonical_base:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

        return abs_path

    def file_exists(self, storage_path: str) -> bool:
        """Checks if physical file exists on disk."""
        if not storage_path:
            return False
        return os.path.exists(storage_path)

    def delete_file(self, storage_path: str) -> bool:
        """
        Deletes the physical file from disk.
        Returns True if deleted or already absent, False if error.
        """
        if not storage_path:
            return True
        try:
            abs_path = os.path.abspath(storage_path)
            if os.path.exists(abs_path):
                os.remove(abs_path)
                logger.info(f"Deleted physical evidence file: {abs_path}")
            return True
        except Exception as exc:
            logger.error(f"Failed to delete physical file '{storage_path}': {exc}")
            return False

    def get_file_url(self, evidence_id: int) -> str:
        """Generates the permanent API endpoint URL to access this evidence."""
        return f"/api/evidence/{evidence_id}/file"


# Global singleton instance
_storage_service: Optional[BaseStorageService] = None


def get_storage_service() -> BaseStorageService:
    """Factory function returning active storage service implementation."""
    global _storage_service
    if _storage_service is None:
        _storage_service = LocalStorageService()
    return _storage_service
