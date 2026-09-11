import { Injectable } from '@nestjs/common';
import { MinioStorageService } from '../storage/minio-storage.service';

/**
 * StorageService alias maintaining backward compatibility with existing tests and imports.
 * Delegates directly to the MinIO implementation of IEvidenceStorageService.
 */
@Injectable()
export class StorageService extends MinioStorageService {}
