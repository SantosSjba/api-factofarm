/** True si el buffer es un PDF real (magic %PDF). */
export function isValidPdfBuffer(content: Buffer | null | undefined): boolean {
  if (!content || content.length < 5) return false;
  return content.subarray(0, 4).toString('utf8') === '%PDF';
}
