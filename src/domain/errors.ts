export class HitoError extends Error {
  code: string; status: number;
  constructor(code: string, message: string, status = 400) {
    super(message); this.name = 'HitoError'; this.code = code; this.status = status;
  }
}
export function check(condition: unknown, code: string, message: string, status = 400): asserts condition {
  if (!condition) throw new HitoError(code, message, status);
}
export function asError(error: unknown) {
  return error instanceof HitoError ? error : new HitoError('INTERNAL', 'Unexpected server error. Check sanitized server logs.', 500);
}
