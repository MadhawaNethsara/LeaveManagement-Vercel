/** Safe string for toast/UI - never render an object (avoids React error #31) */
export function getErrorMessage(err: any, fallback: string): string {
  const raw = err?.response?.data?.error ?? err?.message
  return typeof raw === 'string' ? raw : fallback
}
