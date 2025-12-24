/**
 * Shared property type helpers
 * Used by both Bases (shared-renderer.ts) and Datacore (card-renderer.tsx) renderers
 */

/**
 * Check if a property is a tag property (tags or file tags)
 */
export function isTagProperty(propertyName: string | undefined): boolean {
  return (
    propertyName === "tags" ||
    propertyName === "note.tags" ||
    propertyName === "file.tags" ||
    propertyName === "file tags"
  );
}

/**
 * Check if a property is a file property (intrinsic, cannot be missing)
 */
export function isFileProperty(propertyName: string | undefined): boolean {
  if (!propertyName) return false;
  const normalized = propertyName.toLowerCase();
  return normalized.startsWith("file.") || normalized.startsWith("file ");
}

/**
 * Check if a property is a formula property (computed, cannot be missing)
 */
export function isFormulaProperty(propertyName: string | undefined): boolean {
  if (!propertyName) return false;
  return propertyName.startsWith("formula.");
}
