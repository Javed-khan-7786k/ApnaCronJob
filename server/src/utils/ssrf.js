import dns from 'dns/promises';
import ipaddr from 'ipaddr.js';
import env from '../config/env.js';

const BLOCKED_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.169.254', // AWS, Azure, DigitalOcean metadata
  'metadata.google.internal', // GCP metadata
  'metadata.packet.net',
  'instance-data',
];

const DISALLOWED_RANGES = [
  'loopback',
  'private',
  'linkLocal',
  'carrierGradeNat',
  'broadcast',
  'multicast',
  'reserved',
  'unspecified',
  'uniqueLocal',
  'ipv4Mapped',
  '6to4',
  'teredo',
];

function isRestrictedIpAddress(addr) {
  const range = addr.range();
  if (DISALLOWED_RANGES.includes(range)) {
    return { restricted: true, range };
  }
  if (addr.kind() === 'ipv6' && typeof addr.isIPv4MappedAddress === 'function' && addr.isIPv4MappedAddress()) {
    const mapped = addr.toIPv4Address();
    const mappedRange = mapped.range();
    if (DISALLOWED_RANGES.includes(mappedRange)) {
      return { restricted: true, range: `ipv4Mapped(${mappedRange})` };
    }
  }
  return { restricted: false, range };
}

/**
 * Validates a target URL against SSRF and forbidden networks
 * @param {string} rawUrl
 * @returns {Promise<{ safe: boolean, error?: string, parsedUrl?: URL, resolvedIp?: string }>}
 */
export async function validateUrlForSSRF(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { safe: false, error: 'URL is required and must be a string' };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch (err) {
    return { safe: false, error: `Invalid URL format: ${err.message}` };
  }

  // Enforce http/https only
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { safe: false, error: `Protocol "${parsed.protocol}" is not permitted. Only HTTP and HTTPS are allowed.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check known dangerous hostnames
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    if (!env.ALLOW_PRIVATE_NETWORK_TARGETS) {
      return { safe: false, error: `Host "${hostname}" is restricted from automated requests.` };
    }
  }

  // Domain allowlist check if configured (sanitizes quotes, empty strings, and wildcards)
  const cleanAllowed = (env.ALLOWED_DOMAINS || '')
    .split(',')
    .map(d => d.trim().toLowerCase().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
  if (cleanAllowed.length > 0 && !cleanAllowed.includes('*')) {
    const matches = cleanAllowed.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
    if (!matches) {
      return { safe: false, error: `Host "${hostname}" is not on the allowed destination domains list.` };
    }
  }

  // If private networks are explicitly allowed (e.g. dev testing flag), skip DNS checks
  if (env.ALLOW_PRIVATE_NETWORK_TARGETS) {
    return { safe: true, parsedUrl: parsed, resolvedIp: '127.0.0.1' };
  }

  // Check if hostname is already a direct IP
  try {
    if (ipaddr.isValid(hostname)) {
      const addr = ipaddr.parse(hostname);
      const check = isRestrictedIpAddress(addr);
      if (check.restricted) {
        return { safe: false, error: `Direct IP address "${hostname}" is in restricted range (${check.range}).` };
      }
      return { safe: true, parsedUrl: parsed, resolvedIp: hostname };
    }
  } catch (err) {
    // Not a direct IP, continue to DNS lookup
  }

  // DNS lookup to prevent DNS rebinding and internal network scanning
  try {
    const lookupResult = await dns.lookup(hostname, { all: true });
    if (!lookupResult || lookupResult.length === 0) {
      return { safe: false, error: `Could not resolve hostname "${hostname}".` };
    }

    for (const record of lookupResult) {
      const resolvedAddress = record.address;
      if (ipaddr.isValid(resolvedAddress)) {
        const addr = ipaddr.parse(resolvedAddress);
        const check = isRestrictedIpAddress(addr);
        if (check.restricted) {
          return {
            safe: false,
            error: `Resolved IP "${resolvedAddress}" for host "${hostname}" belongs to restricted network range (${check.range}).`
          };
        }
      }
    }

    return { safe: true, parsedUrl: parsed, resolvedIp: lookupResult[0].address };
  } catch (dnsErr) {
    return { safe: false, error: `DNS resolution failed for "${hostname}": ${dnsErr.message}` };
  }
}
