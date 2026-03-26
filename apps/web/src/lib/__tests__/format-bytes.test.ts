import { formatBytes } from '../format';

describe('formatBytes', () => {
  it('returns "0 B" for 0', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('returns "0 B" for undefined', () => {
    expect(formatBytes(undefined as unknown as number)).toBe('0 B');
  });

  it('returns "0 B" for null', () => {
    expect(formatBytes(null as unknown as number)).toBe('0 B');
  });

  it('returns "0 B" for NaN', () => {
    expect(formatBytes(NaN)).toBe('0 B');
  });

  it('returns "0 B" for negative numbers', () => {
    expect(formatBytes(-100)).toBe('0 B');
  });

  it('formats bytes correctly', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('formats kilobytes correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB');
  });

  it('formats megabytes correctly', () => {
    expect(formatBytes(1048576)).toBe('1 MB');
  });

  it('formats gigabytes correctly', () => {
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('formats terabytes correctly', () => {
    expect(formatBytes(1099511627776)).toBe('1 TB');
  });

  it('formats fractional values with one decimal', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
  });
});
