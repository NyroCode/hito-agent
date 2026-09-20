import { createHash, timingSafeEqual, randomUUID } from 'node:crypto';
import { check,HitoError } from './errors.ts';
export const NETWORK = 'Test SDF Network ; September 2015';
export const MAX_UNITS = (1n << 127n) - 1n;
export function text(v: unknown, label: string, max = 4000): string {
  check(typeof v === 'string' && v.trim().length > 0 && v.length <= max, 'VALIDATION', `${label}: expected non-empty string, max ${max}`);
  return v.trim();
}
export function id(v: unknown): string { const s = text(v, 'id', 80); check(/^[a-zA-Z0-9_-]+$/.test(s), 'VALIDATION', 'Invalid ID'); return s; }
export function hash(v: unknown): string { const s = text(v,'hash',64); check(/^[0-9a-f]{64}$/.test(s),'VALIDATION','Expected lowercase SHA-256 hex'); return s; }
export function object(v: unknown): Record<string, unknown> { check(v !== null && typeof v === 'object' && !Array.isArray(v), 'VALIDATION','Expected object'); return v as Record<string,unknown>; }
export function fields(v: unknown, allowed: string[]) { const o=object(v); check(Object.keys(o).every(k=>allowed.includes(k)), 'VALIDATION','Unknown fields are not accepted'); return o; }
export function units(v: unknown): bigint {
  check(typeof v === 'string' && /^(0|[1-9][0-9]*)$/.test(v), 'AMOUNT','Use integer base units as a decimal string, never floats');
  const n=BigInt(v); check(n>0n && n<=MAX_UNITS, 'AMOUNT','Amount outside positive i128 range'); return n;
}
export function sumUnits(values: string[]) { const n=values.reduce((a,v)=>a+units(v),0n); check(n<=MAX_UNITS,'AMOUNT','Amount sum overflow'); return n.toString(); }
export function integer(v: unknown,label: string,min=0,max=Number.MAX_SAFE_INTEGER): number { check(Number.isSafeInteger(v) && Number(v)>=min && Number(v)<=max,'VALIDATION',`Invalid ${label}`); return Number(v); }
// Project canonical JSON v1: sorted ASCII keys, no undefined/non-finite numbers.
// This is a project format, NOT a claim of RFC 8785 compliance.
export function canonical(v: unknown): string {
  if(v === null || typeof v === 'boolean' || typeof v === 'string') return JSON.stringify(v);
  if(typeof v === 'number') { check(Number.isSafeInteger(v),'CANONICAL','Only safe integer JSON numbers'); return String(v); }
  if(Array.isArray(v)) return '['+v.map(canonical).join(',')+']';
  check(typeof v === 'object' && v !== null, 'CANONICAL','Unsupported canonical value');
  return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Record<string,unknown>)[k])).join(',')+'}';
}
export function digest(v: unknown) { return createHash('sha256').update(canonical(v),'utf8').digest('hex'); }
export function secretEquals(a: string,b: string) { const x=createHash('sha256').update(a).digest(); const y=createHash('sha256').update(b).digest(); return timingSafeEqual(x,y); }
export function newId() { return randomUUID(); }
export function publicAddress(v: unknown): string {
  const s=text(v,'Stellar account',56);
  // Syntax only here; official SDK performs StrKey checksum validation before building transactions.
  check(/^G[A-Z2-7]{55}$/.test(s),'ADDRESS','Expected an unmuxed G Stellar public address'); return s;
}
export function link(v: unknown): string {
  const s=text(v,'reference',2000); let u: URL; try { u=new URL(s); } catch { throw new HitoError('URL','Invalid evidence URL'); }
  check(['https:','http:'].includes(u.protocol) && !u.username && !u.password,'URL','Only HTTP(S) references without credentials');
  // Stored as a reference. Hito NEVER fetches this URL or runs commands from it.
  return s;
}
