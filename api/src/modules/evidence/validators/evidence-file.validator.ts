import { BadRequestException } from '@nestjs/common';

export interface FileValidationOptions {
  maxSizeBytes?: number;
  minSizeBytes?: number;
}

// 500MB default maximum file size
export const DEFAULT_MAX_FILE_SIZE = 500 * 1024 * 1024;
export const DEFAULT_MIN_FILE_SIZE = 1;

/**
 * Recognized forensic, incident response, document, and media file extensions.
 */
export const ALLOWED_EVIDENCE_EXTENSIONS = new Set<string>([
  // Disk images and raw dumps
  'raw', 'dd', 'img', 'iso', 'dmg', 'vmdk', 'e01', 'aff', 'vhd', 'vhdx',
  // Network captures and memory dumps
  'pcap', 'pcapng', 'cap', 'dmp', 'mem', 'crash',
  // Log and system event files
  'log', 'evtx', 'audit', 'syslog', 'txt', 'csv', 'tsv', 'json', 'xml', 'yaml', 'yml',
  // Documents and spreadsheets
  'pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'rtf', 'odt',
  // Forensic images and media
  'png', 'jpg', 'jpeg', 'tiff', 'tif', 'bmp', 'gif', 'webp', 'wav', 'mp3', 'mp4', 'avi', 'mkv',
  // Compressed archives (forensically packaged)
  'zip', 'tar', 'gz', 'tgz', '7z', 'bz2', 'xz',
  // Data and firmware binaries (treated as non-executable opaque byte streams)
  'bin', 'dat', 'hex', 'out',
]);

/**
 * Explicitly prohibited executable and script extensions that could lead to accidental server execution.
 */
export const BLOCKED_EXECUTABLE_EXTENSIONS = new Set<string>([
  'exe', 'bat', 'cmd', 'sh', 'bash', 'zsh', 'ps1', 'psm1', 'vbs', 'vbe',
  'js', 'mjs', 'cjs', 'jar', 'scr', 'msi', 'com', 'hta', 'cpl', 'wsf', 'reg',
]);

/**
 * Validates uploaded evidence file integrity, file size, allowed extensions, and MIME types.
 * Enforces non-executable policy and forensic data safety.
 */
export function validateEvidenceFile(
  file: Express.Multer.File,
  options?: FileValidationOptions,
): void {
  if (!file) {
    throw new BadRequestException('No evidence file was provided in the request');
  }

  if (!file.buffer || file.buffer.length === 0) {
    throw new BadRequestException('Evidence file cannot be empty (0 bytes received)');
  }

  const minSize = options?.minSizeBytes ?? DEFAULT_MIN_FILE_SIZE;
  const maxSize = options?.maxSizeBytes ?? DEFAULT_MAX_FILE_SIZE;

  if (file.size < minSize || file.buffer.length < minSize) {
    throw new BadRequestException(`File size must be at least ${minSize} byte(s)`);
  }

  if (file.size > maxSize || file.buffer.length > maxSize) {
    const maxSizeMb = Math.round(maxSize / (1024 * 1024));
    throw new BadRequestException(
      `File size exceeds the maximum permitted upload limit of ${maxSizeMb} MB`,
    );
  }

  const originalName = file.originalname || '';
  const lastDotIndex = originalName.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === originalName.length - 1) {
    throw new BadRequestException(
      'Evidence file must contain a valid file extension indicating format (e.g. .raw, .pcap, .log, .pdf, .zip)',
    );
  }

  const extension = originalName.slice(lastDotIndex + 1).toLowerCase();

  // Strict check: Block executables/scripts to ensure server safety
  if (BLOCKED_EXECUTABLE_EXTENSIONS.has(extension)) {
    throw new BadRequestException(
      `Executable script or binary format '.${extension}' is prohibited for direct upload to ensure safety. Please package the evidence inside a secure forensic container or archive (e.g., .zip, .tar, .7z, .dd, .e01).`,
    );
  }

  // Check allowed extensions
  if (!ALLOWED_EVIDENCE_EXTENSIONS.has(extension)) {
    throw new BadRequestException(
      `Unsupported evidence file type '.${extension}'. Allowed types include disk images (.raw, .dd, .e01), packet captures (.pcap), logs (.log, .evtx, .csv, .json), documents (.pdf), and containers (.zip, .7z).`,
    );
  }

  // MIME type validation: ensure valid MIME string structure
  if (!file.mimetype || !file.mimetype.includes('/')) {
    throw new BadRequestException('Invalid or missing MIME type in multipart upload headers');
  }
}
