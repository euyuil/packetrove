import { PublicIpResultSchema, type PublicIpResult } from '@packetrove/contracts';
import { ToolError } from '@packetrove/core';

/** Read connection metadata supplied by the deployment's Cloudflare HTTP boundary. */
export function getPublicIp(headers?: Headers): PublicIpResult {
  const unavailable = () => new ToolError(
    'CLIENT_IP_UNAVAILABLE',
    'The current connection IP is unavailable. Use an endpoint with Cloudflare connection metadata.',
  );
  const ip = headers?.get('cf-connecting-ip');
  if (!ip) throw unavailable();
  const result = PublicIpResultSchema.safeParse({ ip, family: ip.includes(':') ? 'ipv6' : 'ipv4' });
  if (!result.success) throw unavailable();

  // Pseudo IPv4 overwrites the main header with a Class E address. Only use the
  // preserved IPv6 header in that case; an unrelated header cannot override a
  // normal IPv4 or IPv6 connection address.
  if (result.data.family === 'ipv4' && Number(ip.split('.')[0]) >= 240) {
    const original = PublicIpResultSchema.safeParse({ ip: headers?.get('cf-connecting-ipv6'), family: 'ipv6' });
    if (!original.success) throw unavailable();
    return original.data;
  }
  return result.data;
}
