/**
 * Converts a Date or string value to a Date instance.
 * @param value - Date instance, ISO string, or null/undefined
 * @returns Date instance or null
 */
export function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}
