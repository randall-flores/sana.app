// Human-readable file size for display. Bytes → "820 KB" / "1.4 MB".
// Dependency-free and locale-agnostic; values are small (bucket caps at 10 MB).
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}
