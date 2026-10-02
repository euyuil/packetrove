import ipaddr from 'ipaddr.js';
import type { CidrCoverResult } from '@packetrove/contracts';
import { ToolError } from './errors';

export type Family = CidrCoverResult['family'];
export type Interval = { first: bigint; last: bigint };
export type ParsedInput = Interval & { family: Family; width: number; cidr: string };

export function formatAddress(value: bigint, family: Family): string {
  const byteCount = family === 'ipv4' ? 4 : 16;
  const bytes = new Array<number>(byteCount);
  for (let index = byteCount - 1; index >= 0; index--) {
    bytes[index] = Number(value & 255n);
    value >>= 8n;
  }
  const address = ipaddr.fromByteArray(bytes);
  return address.kind() === 'ipv4'
    ? address.toString()
    : (address as ipaddr.IPv6).toRFC5952String();
}

export function parseInput(input: string, index: number): ParsedInput {
  const fail = () => new ToolError('INVALID_INPUT', 'Expected valid IP addresses or CIDRs.', [
    { index, message: 'Use a standard IPv4 or IPv6 address with an optional valid CIDR prefix. Zone identifiers and IPv4 leading zeros are not supported.' },
  ], [{ reason: 'INVALID_ADDRESS' }]);
  const entry = input.trim();
  const parts = entry.split('/');
  const text = parts[0]!;
  if (!text || parts.length > 2 || text.includes('%')) throw fail();
  // Embedded IPv4 addresses follow the same strict decimal-octet rules.
  if (text.includes('.')) {
    const dotted = text.slice(text.lastIndexOf(':') + 1);
    if (!/^(0|[1-9]\d{0,2})(\.(0|[1-9]\d{0,2})){3}$/.test(dotted)) throw fail();
  }
  if (!text.includes(':') && !text.includes('.')) throw fail();
  let address: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    // ipaddr.js rewrites ::d.d.d.d to ::ffff:d.d.d.d. Expand only this
    // spelling so parsing preserves the original 128-bit address instead.
    const addressText = /^::\d+\./.test(text) ? `0:0:0:0:0:0:${text.slice(2)}` : text;
    address = ipaddr.parse(addressText);
  } catch {
    throw fail();
  }
  const family = address.kind();
  const width = family === 'ipv4' ? 32 : 128;
  const prefixText = parts[1];
  if (prefixText !== undefined && !/^(0|[1-9]\d*)$/.test(prefixText)) throw fail();
  const prefix = prefixText === undefined ? width : Number(prefixText);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > width) throw fail();
  const value = address.toByteArray().reduce((sum, byte) => (sum << 8n) | BigInt(byte), 0n);
  const hostBits = BigInt(width - prefix);
  const first = (value >> hostBits) << hostBits;
  const last = first + (1n << hostBits) - 1n;
  return { first, last, family, width, cidr: `${formatAddress(first, family)}/${prefix}` };
}

/** Merge overlapping and adjacent intervals without enumerating addresses. */
export function mergeIntervals(intervals: Interval[]): Interval[] {
  const sorted = [...intervals].sort((left, right) =>
    left.first < right.first ? -1 : left.first > right.first ? 1 : 0);
  const merged: Interval[] = [];
  for (const interval of sorted) {
    const previous = merged.at(-1);
    if (previous && interval.first <= previous.last + 1n) {
      if (interval.last > previous.last) previous.last = interval.last;
    } else {
      merged.push({ first: interval.first, last: interval.last });
    }
  }
  return merged;
}

export function addressCount(intervals: Interval[]): bigint {
  return intervals.reduce((total, interval) => total + interval.last - interval.first + 1n, 0n);
}

export function unionAddressCount(intervals: Interval[]): bigint {
  return addressCount(mergeIntervals(intervals));
}
