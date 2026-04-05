/** Normalize Indian mobile input to formats often stored in DB. */
export function mobileLookupVariants(input: string): string[] {
  const digits = input.replace(/\D/g, "");
  const out = new Set<string>();
  if (digits.length === 10) {
    out.add(digits);
    out.add(`+91${digits}`);
    out.add(`91${digits}`);
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    out.add(`+${digits}`);
    out.add(digits.slice(-10));
    out.add(digits);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    out.add(digits.slice(1));
    out.add(`+91${digits.slice(1)}`);
  }
  return [...out];
}
