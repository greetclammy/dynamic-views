/**
 * Link parser utility for property values
 * Handles all frontmatter link types from obsidian-frontmatter-markdown-links
 */

export interface ParsedLink {
  type: "internal" | "external";
  url: string;
  caption: string;
  isEmbed: boolean;
  isWebUrl: boolean; // true for http/https, false for custom URIs like obsidian://
}

/**
 * Check if URL is a web URL (http:// or https://)
 */
function isWebUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * Check if URL has any URI scheme (protocol://)
 */
function hasUriScheme(url: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(url);
}

/**
 * Decode URL-encoded path and remove angle brackets if present
 */
function normalizePath(path: string): string {
  // Remove angle brackets if present
  if (path.startsWith("<") && path.endsWith(">")) {
    path = path.slice(1, -1);
  }
  // Decode URL-encoded characters
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/**
 * Parse text to detect links
 * Returns ParsedLink if text is a link, null otherwise
 *
 * Supported formats (in order of precedence):
 * 1. ![[path]] or ![[path|alias]] - embedded wikilink
 * 2. [[path]] or [[path|alias]] - wikilink
 * 3. ![caption](<path>) or ![caption](path) - embedded markdown
 * 4. [caption](<path>) or [caption](path) - markdown link
 * 5. <https://url> - angle bracket URL
 * 6. https://url - plain URL
 */
export function parseLink(text: string): ParsedLink | null {
  // 1. Embedded wikilink: ![[path]] or ![[path|alias]]
  const embeddedWikilinkMatch = text.match(
    /^!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/,
  );
  if (embeddedWikilinkMatch) {
    const path = embeddedWikilinkMatch[1];
    const alias = embeddedWikilinkMatch[2];
    return {
      type: "internal",
      url: path,
      caption: alias || path,
      isEmbed: true,
      isWebUrl: false,
    };
  }

  // 2. Wikilink: [[path]] or [[path|alias]]
  const wikilinkMatch = text.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
  if (wikilinkMatch) {
    const path = wikilinkMatch[1];
    const alias = wikilinkMatch[2];
    return {
      type: "internal",
      url: path,
      caption: alias || path,
      isEmbed: false,
      isWebUrl: false,
    };
  }

  // 3. Embedded markdown: ![caption](<path>) or ![caption](path)
  const embeddedMdMatch = text.match(
    /^!\[([^\]]*)\]\((?:<([^>]+)>|([^)]+))\)$/,
  );
  if (embeddedMdMatch) {
    const caption = embeddedMdMatch[1];
    const angleBracketPath = embeddedMdMatch[2];
    const regularPath = embeddedMdMatch[3];
    const rawPath = angleBracketPath || regularPath;
    const path = normalizePath(rawPath);
    const isExternal = hasUriScheme(path);
    return {
      type: isExternal ? "external" : "internal",
      url: path,
      caption: caption || path,
      isEmbed: true,
      isWebUrl: isWebUrl(path),
    };
  }

  // 4. Markdown link: [caption](<path>) or [caption](path)
  const mdLinkMatch = text.match(/^\[([^\]]+)\]\((?:<([^>]+)>|([^)]+))\)$/);
  if (mdLinkMatch) {
    const caption = mdLinkMatch[1];
    const angleBracketPath = mdLinkMatch[2];
    const regularPath = mdLinkMatch[3];
    const rawPath = angleBracketPath || regularPath;
    const path = normalizePath(rawPath);
    const isExternal = hasUriScheme(path);
    return {
      type: isExternal ? "external" : "internal",
      url: path,
      caption: caption,
      isEmbed: false,
      isWebUrl: isWebUrl(path),
    };
  }

  // 5. Angle bracket URL: <scheme://url>
  const angleBracketUrlMatch = text.match(/^<([a-z][a-z0-9+.-]*:\/\/[^>]+)>$/i);
  if (angleBracketUrlMatch) {
    const url = angleBracketUrlMatch[1];
    return {
      type: "external",
      url: url,
      caption: url,
      isEmbed: false,
      isWebUrl: isWebUrl(url),
    };
  }

  // 6. Plain URL: scheme://url
  const plainUrlMatch = text.match(/^([a-z][a-z0-9+.-]*:\/\/[^\s]+)$/i);
  if (plainUrlMatch) {
    const url = plainUrlMatch[1];
    return {
      type: "external",
      url: url,
      caption: url,
      isEmbed: false,
      isWebUrl: isWebUrl(url),
    };
  }

  // No link found
  return null;
}

/**
 * Segment of text that is either plain text or a link
 */
export type TextSegment =
  | { type: "text"; content: string }
  | { type: "link"; link: ParsedLink; raw: string };

/**
 * Find all links within text and return segments
 * Handles mixed content like "hello [[World]] and https://example.com"
 */
export function findLinksInText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];

  // Combined pattern to match all link types (non-anchored)
  // Order: embedded wikilink, wikilink, embedded markdown, markdown link, angle bracket URL, plain URL
  const linkPattern =
    /!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|!\[([^\]]*)\]\((?:<([^>]+)>|([^)]+))\)|\[([^\]]+)\]\((?:<([^>]+)>|([^)]+))\)|<([a-z][a-z0-9+.-]*:\/\/[^>]+)>|([a-z][a-z0-9+.-]*:\/\/[^\s<>[\]()]+)/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    // Parse the matched link
    const rawMatch = match[0];
    const parsed = parseLink(rawMatch);

    if (parsed) {
      segments.push({ type: "link", link: parsed, raw: rawMatch });
    } else {
      // Fallback: treat as text if parsing fails
      segments.push({ type: "text", content: rawMatch });
    }

    lastIndex = match.index + rawMatch.length;
  }

  // Add remaining text after last match
  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  // If no segments, return the whole text
  if (segments.length === 0) {
    segments.push({ type: "text", content: text });
  }

  return segments;
}
