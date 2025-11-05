/**
 * Preview and snippet utilities
 * Extracts and sanitizes content for card previews
 */

/**
 * Markdown patterns for syntax stripping
 * Note: Code blocks are handled separately before these patterns
 */
const markdownPatterns = [
    /`([^`]+)`/g,                                // Inline code
    /\*\*\*((?:(?!\*\*\*).)+)\*\*\*/g,          // Bold + italic asterisks
    /___((?:(?!___).)+)___/g,                    // Bold + italic underscores
    /\*\*((?:(?!\*\*).)+)\*\*/g,                // Bold asterisks
    /__((?:(?!__).)+)__/g,                       // Bold underscores
    /\*((?:(?!\*).)+)\*/g,                       // Italic asterisks
    /_((?:(?!_).)+)_/g,                          // Italic underscores
    /~~((?:(?!~~).)+)~~/g,                       // Strikethrough (after code blocks processed)
    /==((?:(?!==).)+)==/g,                       // Highlight
    /\[([^\]]+)\]\([^)]+\)/g,                    // Links
    /!\[\[[^\]]+\]\]/g,                          // Embedded wikilinks (images, etc.)
    /\[\[[^\]|]+\|[^\]]+\]\]/g,                  // Wikilinks with display
    /\[\[[^\]]+\]\]/g,                           // Wikilinks
    /#[a-zA-Z0-9_\-/]+/g,                        // Tags
    /^[-*+]\s*\[[ xX]\]\s+/gm,                   // Task list markers (bullet-style)
    /^\d+\.\s*\[[ xX]\]\s+/gm,                   // Task list markers (numbered)
    /^[-*+]\s+/gm,                               // Bullet list markers
    /^\d+\.\s+/gm,                               // Numbered list markers
    /^#{1,6}\s+.+$/gm,                           // Heading lines (full removal)
    /^\s*(?:[-_*])\s*(?:[-_*])\s*(?:[-_*])[\s\-_*]*$/gm, // Horizontal rules
    /^\s*\|.*\|.*$/gm,                           // Tables
    /\^\[[^\]]*?]/g,                             // Inline footnotes
    /\[\^[^\]]+]/g,                              // Footnote markers
    /^\s*\[\^[^\]]+]:.*$/gm,                     // Footnote details
    /<([a-z][a-z0-9]*)\b[^>]*>(.*?)<\/\1>/gi,    // HTML tag pairs
    /<[^>]+>/g                                   // Remaining HTML tags
];

/**
 * Remove code blocks (fenced with backticks or tildes) with matching fence counts
 * Must be done before strikethrough processing since ~~~ can be code fences
 */
function removeCodeBlocks(text: string): string {
    const lines = text.split('\n');
    const processedLines: string[] = [];
    let inCodeBlock = false;
    let codeBlockFenceChar = '';
    let codeBlockFenceLength = 0;

    for (const line of lines) {
        if (!inCodeBlock) {
            // Check for opening fence (3+ backticks or tildes)
            const openMatch = line.match(/^([`~]{3,})/);
            if (openMatch) {
                inCodeBlock = true;
                codeBlockFenceChar = openMatch[1][0]; // ` or ~
                codeBlockFenceLength = openMatch[1].length;
                continue; // Skip fence line
            }
            processedLines.push(line);
        } else {
            // Check for closing fence with exact same character and count
            const closePattern = `^${codeBlockFenceChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}{${codeBlockFenceLength}}\\s*$`;
            const closeMatch = line.match(new RegExp(closePattern));
            if (closeMatch) {
                inCodeBlock = false;
                codeBlockFenceChar = '';
                codeBlockFenceLength = 0;
                continue; // Skip fence line
            }
            // Inside code block, skip all content
        }
    }

    return processedLines.join('\n');
}

/**
 * Strip markdown syntax from text while preserving content
 */
function stripMarkdownSyntax(text: string): string {
    if (!text || text.trim().length === 0) return '';

    // First pass: remove callout title lines only
    text = text.replace(/^>\s*\[![\w-]+\][+-]?.*$/gm, '');
    // Second pass: strip > prefix from remaining blockquote lines
    text = text.replace(/^>\s?/gm, '');

    // Remove code blocks before other processing (important for tildes before strikethrough)
    let result = removeCodeBlocks(text);

    // Apply each pattern
    markdownPatterns.forEach((pattern) => {
        result = result.replace(pattern, (match, ...groups) => {
            // Special handling for HTML tag pairs - return content (group 2)
            if (match.match(/<[a-z][a-z0-9]*\b[^>]*>.*?<\//i)) {
                return groups[1] || '';
            }

            // For patterns with capture groups, return the captured content
            if (groups.length > 0 && groups[0] !== undefined) {
                for (let i = 0; i < groups.length - 2; i++) {
                    if (typeof groups[i] === 'string') {
                        return groups[i];
                    }
                }
            }

            // For other patterns, remove completely
            return '';
        });
    });

    return result;
}

/**
 * Sanitize markdown content for preview display
 * @param content - Raw markdown content
 * @param alwaysOmitFirstLine - Whether to always omit the first line
 * @param filename - Optional filename to compare against first line
 * @param titleValue - Optional title value to compare against first line
 * @returns Sanitized preview text (max 500 chars)
 */
export function sanitizeForPreview(
    content: string,
    alwaysOmitFirstLine: boolean = false,
    filename?: string,
    titleValue?: string
): string {
    // Remove frontmatter
    const cleaned = content.replace(/^---[\s\S]*?---/, "").trim();
    let stripped = stripMarkdownSyntax(cleaned);

    // Check if first line matches filename or title
    const firstLineEnd = stripped.indexOf('\n');
    const firstLine = (firstLineEnd !== -1 ? stripped.substring(0, firstLineEnd) : stripped).trim();

    // Omit first line if it matches filename/title or if alwaysOmitFirstLine enabled
    if (alwaysOmitFirstLine ||
        (filename && firstLine === filename) ||
        (titleValue && firstLine === titleValue)) {
        stripped = firstLineEnd !== -1 ? stripped.substring(firstLineEnd + 1).trim() : '';
    }

    // Normalize whitespace and special characters
    const normalized = stripped
        .replace(/\^[a-zA-Z0-9-]+/g, '') // Remove block IDs
        .replace(/\\/g, '') // Remove backslashes
        .split(/\s+/)
        .filter(word => word)
        .join(' ')
        .trim()
        .replace(/\.{2,}/g, match => match.replace(/\./g, '\u2024'));

    // Truncate to 500 characters
    const wasTruncated = normalized.length > 500;
    let preview = normalized.substring(0, 500);

    if (wasTruncated) {
        preview += '…';
    }

    return preview;
}
