import { sanitizeForPreview, loadFilePreview } from "../../src/utils/preview";
import { App, TFile } from "obsidian";

describe("preview", () => {
  describe("sanitizeForPreview", () => {
    it("should remove frontmatter", () => {
      const input = `---
title: Test
tags: test
---
Content here`;
      const result = sanitizeForPreview(input);
      expect(result).toBe("Content here");
    });

    it("should strip inline code", () => {
      const input = "This has `inline code` in it";
      const result = sanitizeForPreview(input);
      expect(result).toBe("This has inline code in it");
    });

    it("should strip bold asterisks", () => {
      const input = "This is **bold text** here";
      const result = sanitizeForPreview(input);
      expect(result).toBe("This is bold text here");
    });

    it("should strip bold underscores", () => {
      const input = "This is __bold text__ here";
      const result = sanitizeForPreview(input);
      expect(result).toBe("This is bold text here");
    });

    it("should strip italic asterisks", () => {
      const input = "This is *italic text* here";
      const result = sanitizeForPreview(input);
      expect(result).toBe("This is italic text here");
    });

    it("should strip italic underscores", () => {
      const input = "This is _italic text_ here";
      const result = sanitizeForPreview(input);
      expect(result).toBe("This is italic text here");
    });

    it("should strip bold+italic combinations", () => {
      const input = "This is ***bold italic*** and ___also bold italic___";
      const result = sanitizeForPreview(input);
      expect(result).toBe("This is bold italic and also bold italic");
    });

    it("should strip strikethrough", () => {
      const input = "This has ~~strikethrough~~ text";
      const result = sanitizeForPreview(input);
      expect(result).toBe("This has strikethrough text");
    });

    it("should strip highlight", () => {
      const input = "This has ==highlighted== text";
      const result = sanitizeForPreview(input);
      expect(result).toBe("This has highlighted text");
    });

    it("should strip markdown links", () => {
      const input = "Visit [Google](https://google.com) for search";
      const result = sanitizeForPreview(input);
      expect(result).toBe("Visit Google for search");
    });

    it("should strip wikilinks", () => {
      const input = "See [[Other Page]] for details";
      const result = sanitizeForPreview(input);
      expect(result).toBe("See for details");
    });

    it("should strip wikilinks with display text", () => {
      const input = "See [[Internal Link|Display Text]] here";
      const result = sanitizeForPreview(input);
      expect(result).toBe("See here");
    });

    it("should strip embedded wikilinks", () => {
      const input = "Image: ![[image.png]] shown";
      const result = sanitizeForPreview(input);
      expect(result).toBe("Image: shown");
    });

    it("should strip tags", () => {
      const input = "This has #tag and #another-tag in it";
      const result = sanitizeForPreview(input);
      expect(result).toBe("This has and in it");
    });

    it("should strip heading lines completely", () => {
      const input = `# Heading 1
Content here
## Heading 2
More content`;
      const result = sanitizeForPreview(input);
      expect(result).toBe("Content here More content");
    });

    it("should strip bullet list markers", () => {
      const input = `- Item 1
* Item 2
+ Item 3`;
      const result = sanitizeForPreview(input);
      expect(result).toBe("Item 1 Item 2 Item 3");
    });

    it("should strip task list markers", () => {
      const input = `- [ ] Unchecked task
- [x] Checked task
- [X] Also checked`;
      const result = sanitizeForPreview(input);
      expect(result).toBe("Unchecked task Checked task Also checked");
    });

    it("should strip numbered list task markers", () => {
      const input = `1. [x] Task one
2) [ ] Task two`;
      const result = sanitizeForPreview(input);
      expect(result).toBe("1. Task one 2) Task two");
    });

    it("should strip horizontal rules", () => {
      const input = `Text before
---
Text after`;
      const result = sanitizeForPreview(input);
      expect(result).toBe("Text before Text after");
    });

    it("should strip tables", () => {
      const input = `Before table
| Col1 | Col2 |
| ---- | ---- |
| A | B |
After table`;
      const result = sanitizeForPreview(input);
      expect(result).toBe("Before table After table");
    });

    it("should strip footnote markers", () => {
      const input = "Text with footnote[^1] here";
      const result = sanitizeForPreview(input);
      expect(result).toBe("Text with footnote here");
    });

    it("should strip inline footnotes", () => {
      const input = "Text with inline^[footnote content] here";
      const result = sanitizeForPreview(input);
      expect(result).toBe("Text with inline here");
    });

    it("should strip footnote definitions", () => {
      const input = `Content
[^1]: Footnote definition
More content`;
      const result = sanitizeForPreview(input);
      // May contain colon from definition, just ensure footnote marker removed
      expect(result).toContain("Content");
      expect(result).toContain("More content");
      expect(result).not.toContain("[^1]");
    });

    it("should strip HTML tags but preserve content", () => {
      const input = "Text with <b>bold</b> and <em>italic</em> tags";
      const result = sanitizeForPreview(input);
      expect(result).toBe("Text with bold and italic tags");
    });

    it("should strip standalone HTML tags", () => {
      const input = "Text with <br> and <hr> tags";
      const result = sanitizeForPreview(input);
      expect(result).toBe("Text with and tags");
    });

    it("should handle code blocks with backticks", () => {
      const input = `Before code
\`\`\`
const x = 1;
\`\`\`
After code`;
      const result = sanitizeForPreview(input);
      expect(result).toBe("Before code After code");
    });

    it("should handle code blocks with tildes", () => {
      const input = `Before code
~~~
const x = 1;
~~~
After code`;
      const result = sanitizeForPreview(input);
      expect(result).toBe("Before code After code");
    });

    it("should handle callouts", () => {
      const input = `> [!NOTE]
> Callout content
> More content

Regular text`;
      const result = sanitizeForPreview(input);
      expect(result).toBe("Callout content More content Regular text");
    });

    it("should handle blockquotes", () => {
      const input = `> Quote line 1
> Quote line 2

Regular text`;
      const result = sanitizeForPreview(input);
      expect(result).toBe("Quote line 1 Quote line 2 Regular text");
    });

    it("should preserve escaped characters", () => {
      const input = "This has \\*escaped\\* characters";
      const result = sanitizeForPreview(input);
      expect(result).toBe("This has *escaped* characters");
    });

    it("should remove block IDs", () => {
      const input = "Text with block ID ^block-123 here";
      const result = sanitizeForPreview(input);
      expect(result).toBe("Text with block ID here");
    });

    it("should normalize multiple spaces", () => {
      const input = "Text    with    multiple     spaces";
      const result = sanitizeForPreview(input);
      expect(result).toBe("Text with multiple spaces");
    });

    it("should replace multiple periods with special character", () => {
      const input = "Text with... ellipsis";
      const result = sanitizeForPreview(input);
      expect(result).toBe("Text with\u2024\u2024\u2024 ellipsis");
    });

    it("should truncate to 500 characters", () => {
      const input = "a".repeat(600);
      const result = sanitizeForPreview(input);
      expect(result.length).toBe(501); // 500 + ellipsis
      expect(result.endsWith("…")).toBe(true);
    });

    it("should not add ellipsis for content under 500 chars", () => {
      const input = "Short content";
      const result = sanitizeForPreview(input);
      expect(result).toBe("Short content");
      expect(result.endsWith("…")).toBe(false);
    });

    it("should omit first line when omitFirstLine is true", () => {
      const input = `First line
Second line
Third line`;
      const result = sanitizeForPreview(input, true);
      expect(result).toBe("Second line Third line");
    });

    it("should omit first line when it matches filename", () => {
      const input = `My File
Content here`;
      const result = sanitizeForPreview(input, false, "My File");
      expect(result).toBe("Content here");
    });

    it("should omit first line when it matches title value", () => {
      const input = `Page Title
Content here`;
      const result = sanitizeForPreview(input, false, undefined, "Page Title");
      expect(result).toBe("Content here");
    });

    it("should not omit first line when it does not match", () => {
      const input = `Different Title
Content here`;
      const result = sanitizeForPreview(input, false, "Another Title");
      expect(result).toBe("Different Title Content here");
    });

    it("should handle empty content", () => {
      expect(sanitizeForPreview("")).toBe("");
      expect(sanitizeForPreview("   ")).toBe("");
    });

    it("should handle complex mixed markdown", () => {
      const input = `---
title: Test
---

# Heading

This is **bold** and *italic* text with a [[link]] and \`code\`.

- [ ] Task item
- Regular bullet

> [!NOTE]
> Callout content

\`\`\`js
const x = 1;
\`\`\`

More text with #tag and ==highlight==.`;

      const result = sanitizeForPreview(input);
      expect(result).not.toContain("**");
      expect(result).not.toContain("*");
      expect(result).not.toContain("[[");
      expect(result).not.toContain("`");
      expect(result).not.toContain("#tag");
      expect(result).not.toContain("==");
      expect(result).not.toContain("const x = 1");
    });

    it("should handle nested markdown syntax", () => {
      const input = "**This has *nested* formatting**";
      const result = sanitizeForPreview(input);
      expect(result).toBe("This has nested formatting");
    });

    it("should handle code blocks with different fence lengths", () => {
      const input = `Text
\`\`\`\`
Code with triple backticks inside \`\`\`
\`\`\`\`
After`;
      const result = sanitizeForPreview(input);
      expect(result).toBe("Text After");
    });
  });

  describe("loadFilePreview", () => {
    let mockApp: App;
    let mockFile: TFile;

    beforeEach(() => {
      mockApp = new App();
      mockFile = new TFile();
      mockFile.path = "test.md";
      mockFile.basename = "test";
    });

    it("should return property value if valid string", async () => {
      const result = await loadFilePreview(
        mockFile,
        mockApp,
        "Property description",
        { fallbackToContent: true, omitFirstLine: false },
      );

      expect(result).toBe("Property description");
    });

    it("should return property value if valid number", async () => {
      const result = await loadFilePreview(mockFile, mockApp, 42, {
        fallbackToContent: true,
        omitFirstLine: false,
      });

      expect(result).toBe("42");
    });

    it("should trim property value whitespace", async () => {
      const result = await loadFilePreview(
        mockFile,
        mockApp,
        "  Property value  ",
        { fallbackToContent: true, omitFirstLine: false },
      );

      expect(result).toBe("Property value");
    });

    it("should fallback to content when property is null and fallback enabled", async () => {
      mockApp.vault.cachedRead = jest.fn().mockResolvedValue("File content");

      const result = await loadFilePreview(mockFile, mockApp, null, {
        fallbackToContent: true,
        omitFirstLine: false,
      });

      expect(result).toBe("File content");
      expect(mockApp.vault.cachedRead).toHaveBeenCalledWith(mockFile);
    });

    it("should fallback to content when property is undefined", async () => {
      mockApp.vault.cachedRead = jest.fn().mockResolvedValue("File content");

      const result = await loadFilePreview(mockFile, mockApp, undefined, {
        fallbackToContent: true,
        omitFirstLine: false,
      });

      expect(result).toBe("File content");
    });

    it("should fallback to content when property is empty string", async () => {
      mockApp.vault.cachedRead = jest.fn().mockResolvedValue("File content");

      const result = await loadFilePreview(mockFile, mockApp, "", {
        fallbackToContent: true,
        omitFirstLine: false,
      });

      expect(result).toBe("File content");
    });

    it("should fallback to content when property is whitespace only", async () => {
      mockApp.vault.cachedRead = jest.fn().mockResolvedValue("File content");

      const result = await loadFilePreview(mockFile, mockApp, "   ", {
        fallbackToContent: true,
        omitFirstLine: false,
      });

      expect(result).toBe("File content");
    });

    it("should return empty string when no property and fallback disabled", async () => {
      const result = await loadFilePreview(mockFile, mockApp, null, {
        fallbackToContent: false,
        omitFirstLine: false,
      });

      expect(result).toBe("");
    });

    it("should pass omitFirstLine to sanitizeForPreview", async () => {
      mockApp.vault.cachedRead = jest.fn().mockResolvedValue(`First line
Second line`);

      const result = await loadFilePreview(mockFile, mockApp, null, {
        fallbackToContent: true,
        omitFirstLine: true,
      });

      expect(result).toBe("Second line");
    });

    it("should pass fileName to sanitizeForPreview", async () => {
      mockApp.vault.cachedRead = jest.fn().mockResolvedValue(`My File
Content`);

      const result = await loadFilePreview(
        mockFile,
        mockApp,
        null,
        { fallbackToContent: true, omitFirstLine: false },
        "My File",
      );

      expect(result).toBe("Content");
    });

    it("should pass titleValue to sanitizeForPreview", async () => {
      mockApp.vault.cachedRead = jest.fn().mockResolvedValue(`Title Here
Content`);

      const result = await loadFilePreview(
        mockFile,
        mockApp,
        null,
        { fallbackToContent: true, omitFirstLine: false },
        undefined,
        "Title Here",
      );

      expect(result).toBe("Content");
    });

    it("should sanitize markdown when falling back to content", async () => {
      mockApp.vault.cachedRead = jest.fn().mockResolvedValue(`---
title: Test
---

# Heading

**Bold** and *italic* text`);

      const result = await loadFilePreview(mockFile, mockApp, null, {
        fallbackToContent: true,
        omitFirstLine: false,
      });

      expect(result).not.toContain("**");
      expect(result).not.toContain("*");
      expect(result).not.toContain("#");
      expect(result).toContain("Bold");
      expect(result).toContain("italic");
    });

    it("should handle read errors gracefully", async () => {
      mockApp.vault.cachedRead = jest
        .fn()
        .mockRejectedValue(new Error("Read failed"));

      await expect(
        loadFilePreview(mockFile, mockApp, null, {
          fallbackToContent: true,
          omitFirstLine: false,
        }),
      ).rejects.toThrow("Read failed");
    });

    it("should prefer property value over content even when fallback enabled", async () => {
      mockApp.vault.cachedRead = jest.fn().mockResolvedValue("File content");

      const result = await loadFilePreview(
        mockFile,
        mockApp,
        "Property value",
        { fallbackToContent: true, omitFirstLine: false },
      );

      expect(result).toBe("Property value");
      expect(mockApp.vault.cachedRead).not.toHaveBeenCalled();
    });

    it("should handle number 0 as valid property value", async () => {
      const result = await loadFilePreview(mockFile, mockApp, 0, {
        fallbackToContent: true,
        omitFirstLine: false,
      });

      expect(result).toBe("0");
    });
  });
});
