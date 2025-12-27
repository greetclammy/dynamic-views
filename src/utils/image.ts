import { App, TFile } from "obsidian";
import { getSlideshowMaxImages } from "./style-settings";

/**
 * Maximum content size to parse for image extraction (100KB)
 */
const MAX_IMAGE_EXTRACTION_CONTENT_SIZE = 100_000;

/**
 * Valid image file extensions supported by the plugin
 */
export const VALID_IMAGE_EXTENSIONS: string[] = [
  "avif",
  "bmp",
  "gif",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "webp",
];

/**
 * Check if a URL is an external HTTP/HTTPS URL
 * @param url - The URL to check
 * @returns true if URL starts with http:// or https://
 */
export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * Check if URL is a blob URL (from cached external image)
 */
export function isBlobUrl(url: string): boolean {
  return url.startsWith("blob:");
}

/**
 * Check if URL is external or a blob from external source
 * Used for ambient color exclusion
 */
export function isExternalOrBlobUrl(url: string): boolean {
  return isExternalUrl(url) || isBlobUrl(url);
}

/**
 * Check if a path has a valid image file extension
 * @param path - The file path or URL to check
 * @returns true if path ends with a valid image extension
 */
export function hasValidImageExtension(path: string): boolean {
  return /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i.test(path);
}

/**
 * Validate if a URL points to a valid, loadable image
 * Uses the browser's Image object to verify the URL can be loaded
 * @param url - The image URL to validate
 * @returns Promise that resolves to true if image loads successfully
 */
export function validateImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    // Set a reasonable timeout to avoid hanging on slow/dead URLs
    setTimeout(() => resolve(false), 5000);
    img.src = url;
  });
}

/**
 * Strip wikilink syntax from image path
 * Handles: [[path]], ![[path]], [[path|caption]]
 * @param path - Path that may contain wikilink syntax
 * @returns Clean path without wikilink markers, or empty string if path is null/undefined
 */
export function stripWikilinkSyntax(path: string | null | undefined): string {
  if (!path) return "";
  const wikilinkMatch = path.match(/^!?\[\[([^\]|]+)(?:\|[^\]]*)?\]\]$/);
  return wikilinkMatch ? wikilinkMatch[1].trim() : path;
}

/**
 * Process and validate image paths from property values
 * Handles wikilink stripping, URL validation, and path separation
 * @param imagePaths - Raw image paths from properties (may contain wikilinks)
 * @returns Object with validated internal paths and external URLs
 */
export function processImagePaths(imagePaths: string[]): {
  internalPaths: string[];
  externalUrls: string[];
} {
  const internalPaths: string[] = [];
  const externalUrls: string[] = [];

  for (const imgPath of imagePaths) {
    // Strip wikilink syntax
    const cleanPath = stripWikilinkSyntax(imgPath);

    if (cleanPath.length === 0) continue;

    if (isExternalUrl(cleanPath)) {
      // Skip YouTube video URLs (not images) - thumbnails extracted from embeds only
      if (getYouTubeVideoId(cleanPath)) {
        continue;
      }
      // External URL - pass through without validation
      // Browser handles load/error at render time for faster initial display
      externalUrls.push(cleanPath);
    } else {
      // Internal path - validate extension
      if (hasValidImageExtension(cleanPath)) {
        internalPaths.push(cleanPath);
      }
    }
  }

  return { internalPaths, externalUrls };
}

/**
 * Convert internal image paths to resource URLs
 * @param internalPaths - Array of internal file paths
 * @param sourcePath - Path of the source file (for link resolution)
 * @param app - Obsidian App instance
 * @returns Array of resource URLs
 */
export function resolveInternalImagePaths(
  internalPaths: string[],
  sourcePath: string,
  app: App,
): string[] {
  const resourcePaths: string[] = [];

  for (const propPath of internalPaths) {
    const imageFile = app.metadataCache.getFirstLinkpathDest(
      propPath,
      sourcePath,
    );
    if (imageFile && VALID_IMAGE_EXTENSIONS.includes(imageFile.extension)) {
      const resourcePath = app.vault.getResourcePath(imageFile);
      resourcePaths.push(resourcePath);
    }
  }

  return resourcePaths;
}

// ============================================================================
// YouTube Thumbnail Extraction
// ============================================================================

/**
 * YouTube thumbnail quality levels in order of preference
 */
const YOUTUBE_THUMBNAIL_QUALITIES = [
  "maxresdefault", // 1280x720
  "hqdefault", // 480x360
  "mqdefault", // 320x180
];

/**
 * Extract YouTube video ID from a URL
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/embed/, youtube.com/shorts/
 */
export function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^(www\.|m\.)/, "");

    if (host === "youtu.be") {
      return parsed.pathname.slice(1); // /VIDEO_ID
    }
    if (host === "youtube.com") {
      // /watch?v=ID, /embed/ID, /shorts/ID, /v/ID
      if (parsed.searchParams.has("v")) return parsed.searchParams.get("v");
      const segments = parsed.pathname.split("/");
      if (["embed", "shorts", "v"].includes(segments[1])) return segments[2];
    }
  } catch {
    /* invalid URL */
  }
  return null;
}

/**
 * Minimum width for valid YouTube thumbnail.
 * mqdefault (lowest quality we try) is 320px wide.
 * Placeholders are typically 120px wide.
 */
const MIN_THUMBNAIL_WIDTH = 320;

/**
 * Validate YouTube thumbnail URL and check it's not a placeholder
 */
function validateYouTubeThumbnail(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(img.naturalWidth >= MIN_THUMBNAIL_WIDTH);
    };
    img.onerror = () => resolve(false);
    setTimeout(() => resolve(false), 5000);
    img.src = url;
  });
}

/**
 * Get YouTube thumbnail URL with fallback through quality levels
 * Returns null if video has no thumbnail (only placeholder available)
 */
export async function getYouTubeThumbnailUrl(
  videoId: string,
): Promise<string | null> {
  for (const quality of YOUTUBE_THUMBNAIL_QUALITIES) {
    const url = `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
    if (await validateYouTubeThumbnail(url)) {
      return url;
    }
  }
  return null;
}

// ============================================================================
// Code Block Detection
// ============================================================================

/**
 * Represents a code block range in content
 */
interface CodeBlockRange {
  start: number;
  end: number;
  isCardlink: boolean;
  content: string;
}

/**
 * Find all code block ranges in content
 * Handles both ``` and ~~~ fences with matching lengths
 */
function findCodeBlockRanges(content: string): CodeBlockRange[] {
  const ranges: CodeBlockRange[] = [];
  const lines = content.split("\n");
  let position = 0;
  let currentBlock: {
    start: number;
    fenceChar: string;
    fenceLength: number;
    isCardlink: boolean;
    contentStart: number;
  } | null = null;

  for (const line of lines) {
    const lineStart = position;
    const lineEnd = position + line.length;

    // Check for fence (3+ backticks or tildes at line start)
    const fenceMatch = line.match(/^(\s*)([`~]{3,})(\w*)\s*$/);

    if (fenceMatch) {
      const fenceChar = fenceMatch[2][0];
      const fenceLength = fenceMatch[2].length;
      const language = fenceMatch[3]?.toLowerCase() || "";

      if (!currentBlock) {
        // Opening fence
        currentBlock = {
          start: lineStart,
          fenceChar,
          fenceLength,
          isCardlink: language === "cardlink" || language === "embed",
          contentStart: lineEnd + 1,
        };
      } else if (
        fenceChar === currentBlock.fenceChar &&
        fenceLength === currentBlock.fenceLength
      ) {
        // Matching closing fence
        ranges.push({
          start: currentBlock.start,
          end: lineEnd,
          isCardlink: currentBlock.isCardlink,
          content: content.slice(currentBlock.contentStart, lineStart),
        });
        currentBlock = null;
      }
    }

    position = lineEnd + 1; // +1 for newline
  }

  return ranges;
}

/**
 * Check if a position falls inside any non-cardlink code block
 */
function isInsideCodeBlock(
  position: number,
  ranges: CodeBlockRange[],
): boolean {
  return ranges.some(
    (r) => !r.isCardlink && position >= r.start && position <= r.end,
  );
}

// ============================================================================
// Image Embed Extraction
// ============================================================================

/**
 * Regex patterns for image extraction
 */
// Wikilink embed: ![[image.png]] or ![[image.png|caption]] or ![[image.png#heading]]
const WIKILINK_EMBED_REGEX = /!\[\[([^\]|#]+)(?:[|#][^\]]*)?]]/g;

// Markdown image: ![...](url) - handles nested parentheses one level deep
const MD_IMAGE_REGEX = /!\[[^\]]*]\(((?:[^)(]|\([^)(]*\))+)\)/g;

// After extracting MD image URL, strip optional title: ![](url "title")
const MD_IMAGE_TITLE_REGEX = /\s+(?:"[^"]*"|'[^']*'|\([^)]*\))\s*$/;

// Auto Card Link image field (inside cardlink code blocks)
const CARDLINK_IMAGE_REGEX = /^image:\s*(.+?)\s*$/im;

/**
 * Represents an embed found in content
 */
interface EmbedMatch {
  type: "wikilink" | "markdown" | "cardlink";
  path: string;
  position: number;
}

/**
 * Extract image embeds from file content
 * Parses wikilinks, markdown images, YouTube links, and cardlink blocks
 *
 * @param file - TFile to extract embeds from
 * @param app - Obsidian App instance
 * @param options - Extraction options
 * @returns Array of validated image resource URLs in document order
 */
export async function extractImageEmbeds(
  file: TFile,
  app: App,
  options?: {
    includeYoutube?: boolean;
    includeCardLink?: boolean;
  },
): Promise<string[]> {
  const includeYoutube = options?.includeYoutube ?? true;
  const includeCardLink = options?.includeCardLink ?? true;
  const maxImages = getSlideshowMaxImages();

  // Read and truncate content
  let content = await app.vault.cachedRead(file);
  if (content.length > MAX_IMAGE_EXTRACTION_CONTENT_SIZE) {
    content = content.slice(0, MAX_IMAGE_EXTRACTION_CONTENT_SIZE);
  }

  // Strip frontmatter
  if (content.startsWith("---\n")) {
    const frontmatterEnd = content.indexOf("\n---\n", 4);
    if (frontmatterEnd !== -1) {
      content = content.slice(frontmatterEnd + 5);
    }
  }

  // Find all code block ranges
  const codeBlockRanges = findCodeBlockRanges(content);

  // Collect all embeds with positions
  const embeds: EmbedMatch[] = [];

  // Extract cardlink images first
  if (includeCardLink) {
    for (const block of codeBlockRanges) {
      if (block.isCardlink) {
        const match = CARDLINK_IMAGE_REGEX.exec(block.content);
        if (match) {
          let imagePath = match[1].trim();
          // Remove surrounding quotes if present
          if (
            (imagePath.startsWith('"') && imagePath.endsWith('"')) ||
            (imagePath.startsWith("'") && imagePath.endsWith("'"))
          ) {
            imagePath = imagePath.slice(1, -1);
          }
          // Strip wikilink syntax if present
          imagePath = stripWikilinkSyntax(imagePath);
          if (imagePath) {
            embeds.push({
              type: "cardlink",
              path: imagePath,
              position: block.start,
            });
          }
        }
      }
    }
  }

  // Extract wikilink embeds
  for (const match of content.matchAll(WIKILINK_EMBED_REGEX)) {
    const position = match.index;
    if (!isInsideCodeBlock(position, codeBlockRanges)) {
      embeds.push({
        type: "wikilink",
        path: match[1].trim(),
        position,
      });
    }
  }

  // Extract markdown image embeds
  for (const match of content.matchAll(MD_IMAGE_REGEX)) {
    const position = match.index;
    if (!isInsideCodeBlock(position, codeBlockRanges)) {
      // Strip optional title from URL
      const url = match[1].trim().replace(MD_IMAGE_TITLE_REGEX, "");
      embeds.push({
        type: "markdown",
        path: url,
        position,
      });
    }
  }

  // Sort by position (document order)
  embeds.sort((a, b) => a.position - b.position);

  // Deduplicate by path
  const seenPaths = new Set<string>();
  const uniqueEmbeds = embeds.filter((e) => {
    if (seenPaths.has(e.path)) return false;
    seenPaths.add(e.path);
    return true;
  });

  // Process embeds and resolve to URLs
  const resultUrls: string[] = [];

  for (const embed of uniqueEmbeds) {
    if (resultUrls.length >= maxImages) break;

    const path = embed.path;

    if (isExternalUrl(path)) {
      // Check for YouTube - skip if it's a YouTube URL (video page, not image)
      const videoId = getYouTubeVideoId(path);
      if (videoId) {
        if (includeYoutube) {
          const thumbnailUrl = await getYouTubeThumbnailUrl(videoId);
          if (thumbnailUrl) {
            resultUrls.push(thumbnailUrl);
          }
        }
        // Skip raw YouTube URLs - they're not images
        continue;
      }

      // Regular external URL - pass through without validation
      resultUrls.push(path);
    } else {
      // Internal path - resolve via metadata cache
      const targetFile = app.metadataCache.getFirstLinkpathDest(
        path,
        file.path,
      );
      if (targetFile && VALID_IMAGE_EXTENSIONS.includes(targetFile.extension)) {
        const resourcePath = app.vault.getResourcePath(targetFile);
        resultUrls.push(resourcePath);
      }
    }
  }

  return resultUrls;
}

/**
 * Load image for a file from property or embeds
 * @param app - Obsidian App instance
 * @param filePath - Path of the file to load image for
 * @param imagePropertyValue - Value from image property (if any)
 * @param cacheSize - Thumbnail cache size setting
 * @param fallbackToEmbeds - Whether to fall back to in-note images when property has no value
 * @param imagePropertyName - The image property name (empty string means no property configured)
 * @returns Image URL(s) or null
 */
export function loadImageForFile(
  app: App,
  filePath: string,
  imagePropertyValue: string,
  cacheSize: "small" | "balanced" | "large",
  fallbackToEmbeds: boolean = true,
  imagePropertyName: string = "",
): string | string[] | null {
  const propertyImagePaths: string[] = [];
  const propertyExternalUrls: string[] = [];

  // Parse image property value (could be single path or array)
  if (imagePropertyValue) {
    const paths = Array.isArray(imagePropertyValue)
      ? imagePropertyValue
      : [imagePropertyValue];

    for (const path of paths) {
      if (typeof path === "string") {
        if (isExternalUrl(path)) {
          propertyExternalUrls.push(path);
        } else {
          propertyImagePaths.push(path);
        }
      }
    }
  }

  // Phase A: Convert property image paths to resource paths
  const propertyResourcePaths: string[] = [];

  // Process internal paths
  for (const propPath of propertyImagePaths) {
    const imageFile = app.metadataCache.getFirstLinkpathDest(
      propPath,
      filePath,
    );
    if (imageFile && VALID_IMAGE_EXTENSIONS.includes(imageFile.extension)) {
      const resourcePath = app.vault.getResourcePath(imageFile);
      propertyResourcePaths.push(resourcePath);
    }
  }

  // Add external URLs without validation - browser handles load/error at render time
  propertyResourcePaths.push(...propertyExternalUrls);

  // Phase B: Extract body embed resource paths (fallback if no property images)
  const file = app.vault.getAbstractFileByPath(filePath);
  if (!file || !(file instanceof TFile)) return null;

  const metadata = app.metadataCache.getFileCache(file);
  if (!metadata) return null;

  const bodyResourcePaths: string[] = [];
  const bodyExternalUrls: string[] = [];

  // Process embeds - separate external URLs from internal paths
  if (metadata.embeds) {
    for (const embed of metadata.embeds) {
      const embedLink = embed.link;
      if (isExternalUrl(embedLink)) {
        // External URL embed - collect for async validation
        bodyExternalUrls.push(embedLink);
      } else {
        // Internal path embed
        const targetFile = app.metadataCache.getFirstLinkpathDest(
          embedLink,
          filePath,
        );
        if (
          targetFile &&
          VALID_IMAGE_EXTENSIONS.includes(targetFile.extension)
        ) {
          const resourcePath = app.vault.getResourcePath(targetFile);
          bodyResourcePaths.push(resourcePath);
        }
      }
    }
  }

  // Add external URLs without validation - browser handles load/error at render time
  bodyResourcePaths.push(...bodyExternalUrls);

  // Phase C: Determine which images to use based on settings
  let allResourcePaths: string[] = [];

  // If no image property is configured, always use in-note images
  if (!imagePropertyName || imagePropertyName.trim() === "") {
    allResourcePaths = bodyResourcePaths;
  }
  // If image property is configured
  else {
    // If property has values, use them (no fallback)
    if (propertyResourcePaths.length > 0) {
      allResourcePaths = propertyResourcePaths;
    }
    // If property has no values and fallback is enabled, use body embeds
    else if (fallbackToEmbeds) {
      allResourcePaths = bodyResourcePaths;
    }
    // Otherwise, no images
    else {
      allResourcePaths = [];
    }
  }

  // Return result
  if (allResourcePaths.length === 0) return null;
  return allResourcePaths.length > 1 ? allResourcePaths : allResourcePaths[0];
}
