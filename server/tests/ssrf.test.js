import { describe, it, expect } from 'vitest';
import { validateUrlForSSRF } from '../src/utils/ssrf.js';

describe('SSRF Protection Utility', () => {
  it('blocks loopback localhost requests', async () => {
    const result = await validateUrlForSSRF('http://localhost:5000/api/secret');
    expect(result.safe).toBe(false);
    expect(result.error).toMatch(/restricted/i);
  });

  it('blocks direct loopback IPv4 127.0.0.1', async () => {
    const result = await validateUrlForSSRF('http://127.0.0.1:8080/admin');
    expect(result.safe).toBe(false);
  });

  it('blocks AWS/Cloud metadata IP 169.254.169.254', async () => {
    const result = await validateUrlForSSRF('http://169.254.169.254/latest/meta-data/');
    expect(result.safe).toBe(false);
  });

  it('blocks Google Cloud metadata hostname', async () => {
    const result = await validateUrlForSSRF('http://metadata.google.internal/computeMetadata/v1/');
    expect(result.safe).toBe(false);
  });

  it('blocks private IP ranges (10.x.x.x, 192.168.x.x, 172.16.x.x)', async () => {
    const res10 = await validateUrlForSSRF('http://10.0.0.1/status');
    expect(res10.safe).toBe(false);

    const res192 = await validateUrlForSSRF('http://192.168.1.100:3000/ping');
    expect(res192.safe).toBe(false);

    const res172 = await validateUrlForSSRF('http://172.16.0.5:8000/health');
    expect(res172.safe).toBe(false);
  });

  it('blocks non-HTTP protocols like file://, ftp://, gopher://', async () => {
    const fileResult = await validateUrlForSSRF('file:///etc/passwd');
    expect(fileResult.safe).toBe(false);

    const ftpResult = await validateUrlForSSRF('ftp://example.com/file.txt');
    expect(ftpResult.safe).toBe(false);
  });

  it('allows public legitimate HTTPS URLs', async () => {
    const result = await validateUrlForSSRF('https://httpbin.org/get');
    expect(result.safe).toBe(true);
    expect(result.parsedUrl.hostname).toBe('httpbin.org');
  });
});
