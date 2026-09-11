import { EntityType } from '../enums/entity-type.enum';

/**
 * Normalizes entity raw values according to their specific forensic type.
 * Ensures consistent indexing, correlation, and deduplication across multi-source evidence.
 */
export function normalizeEntityValue(type: EntityType | string, rawValue: string): string {
  if (!rawValue || typeof rawValue !== 'string') {
    return '';
  }

  const clean = rawValue.trim();

  switch (type) {
    case EntityType.EMAIL:
      return clean.toLowerCase();

    case EntityType.DOMAIN: {
      let domain = clean.toLowerCase();
      // Strip protocol if present
      domain = domain.replace(/^https?:\/\//i, '');
      // Strip path and query if present
      domain = domain.split('/')[0];
      // Strip trailing colon/port
      domain = domain.split(':')[0];
      // Strip leading www.
      domain = domain.replace(/^www\./i, '');
      // Strip trailing dot
      domain = domain.replace(/\.$/, '');
      return domain.trim();
    }

    case EntityType.IP_ADDRESS: {
      let ip = clean.toLowerCase();
      // If IPv4 with port (e.g. 192.168.1.1:8080), extract IP
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(ip)) {
        ip = ip.split(':')[0];
      }
      return ip.trim();
    }

    case EntityType.USER: {
      let user = clean.toLowerCase();
      // Normalize domain\user or user@domain
      if (user.includes('\\')) {
        const parts = user.split('\\');
        user = parts[parts.length - 1];
      }
      return user.trim();
    }

    case EntityType.DEVICE:
      // Canonicalize device strings (e.g., USBSTOR\DISK&VEN...)
      return clean.toUpperCase().replace(/\s+/g, ' ');

    case EntityType.FILE:
      // Normalize directory separators to standard UNIX slash
      return clean.replace(/\\/g, '/');

    case EntityType.PERSON:
      // Clean extra spaces
      return clean.replace(/\s+/g, ' ');

    case EntityType.LOCATION:
      return clean.replace(/\s+/g, ' ');

    default:
      return clean;
  }
}
