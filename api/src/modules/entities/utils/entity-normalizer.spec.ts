import { normalizeEntityValue } from './entity-normalizer';
import { EntityType } from '../enums/entity-type.enum';

describe('normalizeEntityValue', () => {
  it('should normalize EMAIL by lowercasing and trimming', () => {
    expect(normalizeEntityValue(EntityType.EMAIL, '  Alex.Mercer@SynapseX.Local  ')).toBe(
      'alex.mercer@synapsex.local',
    );
  });

  it('should normalize DOMAIN by lowercasing, stripping protocol, path, and www.', () => {
    expect(
      normalizeEntityValue(EntityType.DOMAIN, 'HTTPS://WWW.Malicious-C2.Com:8443/beacon/gate'),
    ).toBe('malicious-c2.com');
  });

  it('should normalize IP_ADDRESS by removing port from IPv4', () => {
    expect(normalizeEntityValue(EntityType.IP_ADDRESS, '192.168.1.105:8080')).toBe(
      '192.168.1.105',
    );
    expect(normalizeEntityValue(EntityType.IP_ADDRESS, '10.0.0.1')).toBe('10.0.0.1');
  });

  it('should normalize USER by lowercasing and stripping domain prefix', () => {
    expect(normalizeEntityValue(EntityType.USER, 'CORP\\Alex.Mercer')).toBe('alex.mercer');
    expect(normalizeEntityValue(EntityType.USER, '  root  ')).toBe('root');
  });

  it('should normalize DEVICE by upper-casing', () => {
    expect(
      normalizeEntityValue(EntityType.DEVICE, 'usbstor\\disk&ven_sandisk&prod_cruzer'),
    ).toBe('USBSTOR\\DISK&VEN_SANDISK&PROD_CRUZER');
  });

  it('should normalize FILE paths to use forward slashes', () => {
    expect(
      normalizeEntityValue(EntityType.FILE, 'C:\\Windows\\System32\\cmd.exe'),
    ).toBe('C:/Windows/System32/cmd.exe');
  });

  it('should handle empty or whitespace-only inputs gracefully', () => {
    expect(normalizeEntityValue(EntityType.PERSON, '   ')).toBe('');
  });
});
