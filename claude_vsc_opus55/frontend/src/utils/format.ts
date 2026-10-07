/** "2026-10-07T10:09:11.706" → "2026-10-07 10:09" */
export function formatDateTime(iso: string): string {
  return iso.replace('T', ' ').slice(0, 16)
}
