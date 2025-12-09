import {
  getFirstBasesPropertyValue,
  getFirstDatacorePropertyValue,
  getFirstBasesDatePropertyValue,
  getFirstDatacoreDatePropertyValue,
  getAllBasesImagePropertyValues,
  getAllDatacoreImagePropertyValues,
  getPropertyLabel,
  getAllVaultProperties,
} from "../../src/utils/property";
import { App } from "obsidian";

describe("property", () => {
  describe("getFirstBasesPropertyValue", () => {
    let mockApp: App;
    let mockEntry: any;

    beforeEach(() => {
      mockApp = new App();
      mockEntry = {
        getValue: jest.fn(),
      };
    });

    it("should return null for empty property string", () => {
      expect(getFirstBasesPropertyValue(mockApp, mockEntry, "")).toBeNull();
      expect(getFirstBasesPropertyValue(mockApp, mockEntry, "   ")).toBeNull();
    });

    it("should return first property with valid value", () => {
      mockEntry.getValue = jest
        .fn()
        .mockReturnValueOnce(null) // First property doesn't exist
        .mockReturnValueOnce({ data: "test value" }); // Second property exists

      const result = getFirstBasesPropertyValue(
        mockApp,
        mockEntry,
        "prop1, prop2",
      );
      expect(result).toEqual({ data: "test value" });
    });

    it("should try formula prefix if property not found", () => {
      mockEntry.getValue = jest
        .fn()
        .mockReturnValueOnce({ icon: "error" }) // Property not found (error object)
        .mockReturnValueOnce({ data: "formula value" }); // Formula property exists

      const result = getFirstBasesPropertyValue(
        mockApp,
        mockEntry,
        "customProp",
      );
      expect(mockEntry.getValue).toHaveBeenCalledWith("customProp");
      expect(mockEntry.getValue).toHaveBeenCalledWith("formula.customProp");
      expect(result).toEqual({ data: "formula value" });
    });

    it("should handle comma-separated properties", () => {
      mockEntry.getValue = jest
        .fn()
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(null)
        .mockReturnValueOnce({ data: "third value" });

      const result = getFirstBasesPropertyValue(mockApp, mockEntry, "a, b, c");
      expect(result).toEqual({ data: "third value" });
    });

    it("should return null when no properties have values", () => {
      mockEntry.getValue = jest.fn().mockReturnValue(null);

      const result = getFirstBasesPropertyValue(
        mockApp,
        mockEntry,
        "prop1, prop2, prop3",
      );
      expect(result).toBeNull();
    });

    it("should trim property names", () => {
      mockEntry.getValue = jest.fn().mockReturnValue({ data: "value" });

      getFirstBasesPropertyValue(mockApp, mockEntry, "  prop1  ,  prop2  ");
      expect(mockEntry.getValue).toHaveBeenCalledWith("prop1");
    });
  });

  describe("getFirstDatacorePropertyValue", () => {
    let mockPage: any;

    beforeEach(() => {
      mockPage = {
        value: jest.fn(),
      };
    });

    it("should return null for empty property string", () => {
      expect(getFirstDatacorePropertyValue(mockPage, "")).toBeNull();
      expect(getFirstDatacorePropertyValue(mockPage, "   ")).toBeNull();
    });

    it("should return first property with valid value", () => {
      mockPage.value = jest
        .fn()
        .mockReturnValueOnce(null)
        .mockReturnValueOnce("test value");

      const result = getFirstDatacorePropertyValue(mockPage, "prop1, prop2");
      expect(result).toBe("test value");
    });

    it("should skip null/undefined values", () => {
      mockPage.value = jest
        .fn()
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce("valid value");

      const result = getFirstDatacorePropertyValue(mockPage, "a, b, c");
      expect(result).toBe("valid value");
    });

    it("should return null when no properties exist", () => {
      mockPage.value = jest.fn().mockReturnValue(null);

      const result = getFirstDatacorePropertyValue(mockPage, "prop1, prop2");
      expect(result).toBeNull();
    });

    it("should handle different value types", () => {
      mockPage.value = jest.fn().mockReturnValue(42);

      const result = getFirstDatacorePropertyValue(mockPage, "numProp");
      expect(result).toBe(42);
    });
  });

  describe("getFirstBasesDatePropertyValue", () => {
    let mockApp: App;
    let mockEntry: any;

    beforeEach(() => {
      mockApp = new App();
      mockEntry = {
        getValue: jest.fn(),
      };
    });

    it("should return null for empty property string", () => {
      expect(getFirstBasesDatePropertyValue(mockApp, mockEntry, "")).toBeNull();
    });

    it("should return first date property", () => {
      const mockDate = new Date("2024-01-01");
      mockEntry.getValue = jest
        .fn()
        .mockReturnValueOnce(null)
        .mockReturnValueOnce({ date: mockDate });

      const result = getFirstBasesDatePropertyValue(
        mockApp,
        mockEntry,
        "prop1, prop2",
      );
      expect(result).toEqual({ date: mockDate });
    });

    it("should validate date object has Date instance", () => {
      mockEntry.getValue = jest
        .fn()
        .mockReturnValueOnce({ date: "not a date" }) // Invalid
        .mockReturnValueOnce({ date: new Date() }); // Valid

      const result = getFirstBasesDatePropertyValue(mockApp, mockEntry, "a, b");
      expect(result).toHaveProperty("date");
      expect(result.date).toBeInstanceOf(Date);
    });

    it("should try formula prefix for date properties", () => {
      mockEntry.getValue = jest
        .fn()
        .mockReturnValueOnce({ icon: "error" })
        .mockReturnValueOnce({ date: new Date() });

      getFirstBasesDatePropertyValue(mockApp, mockEntry, "dateProp");
      expect(mockEntry.getValue).toHaveBeenCalledWith("formula.dateProp");
    });
  });

  describe("getFirstDatacoreDatePropertyValue", () => {
    let mockPage: any;

    beforeEach(() => {
      mockPage = {
        value: jest.fn(),
      };
    });

    it("should return null for empty property string", () => {
      expect(getFirstDatacoreDatePropertyValue(mockPage, "")).toBeNull();
    });

    it("should return DateTime objects with toMillis method", () => {
      const mockDateTime = { toMillis: () => 1234567890 };
      mockPage.value = jest
        .fn()
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(mockDateTime);

      const result = getFirstDatacoreDatePropertyValue(
        mockPage,
        "prop1, prop2",
      );
      expect(result).toBe(mockDateTime);
    });

    it("should skip non-DateTime objects", () => {
      mockPage.value = jest
        .fn()
        .mockReturnValueOnce("string")
        .mockReturnValueOnce(123)
        .mockReturnValueOnce({ toMillis: () => 999 });

      const result = getFirstDatacoreDatePropertyValue(mockPage, "a, b, c");
      expect(result).toHaveProperty("toMillis");
    });

    it("should return null when no DateTime found", () => {
      mockPage.value = jest.fn().mockReturnValue("not a date");

      const result = getFirstDatacoreDatePropertyValue(mockPage, "prop");
      expect(result).toBeNull();
    });
  });

  describe("getAllBasesImagePropertyValues", () => {
    let mockApp: App;
    let mockEntry: any;

    beforeEach(() => {
      mockApp = new App();
      mockEntry = {
        getValue: jest.fn(),
      };
    });

    it("should return empty array for empty property string", () => {
      expect(getAllBasesImagePropertyValues(mockApp, mockEntry, "")).toEqual(
        [],
      );
    });

    it("should collect string values", () => {
      mockEntry.getValue = jest.fn().mockReturnValue({ data: "image.png" });

      const result = getAllBasesImagePropertyValues(mockApp, mockEntry, "img");
      expect(result).toEqual(["image.png"]);
    });

    it("should collect array values", () => {
      mockEntry.getValue = jest.fn().mockReturnValue({
        data: ["img1.png", "img2.jpg", "img3.gif"],
      });

      const result = getAllBasesImagePropertyValues(
        mockApp,
        mockEntry,
        "images",
      );
      expect(result).toEqual(["img1.png", "img2.jpg", "img3.gif"]);
    });

    it("should collect from multiple properties", () => {
      mockEntry.getValue = jest
        .fn()
        .mockReturnValueOnce({ data: "img1.png" })
        .mockReturnValueOnce({ data: "img2.png" });

      const result = getAllBasesImagePropertyValues(
        mockApp,
        mockEntry,
        "prop1, prop2",
      );
      expect(result).toEqual(["img1.png", "img2.png"]);
    });

    it("should skip null/empty values", () => {
      mockEntry.getValue = jest
        .fn()
        .mockReturnValueOnce({ data: null })
        .mockReturnValueOnce({ data: "" })
        .mockReturnValueOnce({ data: "valid.png" });

      const result = getAllBasesImagePropertyValues(
        mockApp,
        mockEntry,
        "a, b, c",
      );
      expect(result).toEqual(["valid.png"]);
    });

    it("should convert numbers to strings", () => {
      mockEntry.getValue = jest.fn().mockReturnValue({ data: 123 });

      const result = getAllBasesImagePropertyValues(mockApp, mockEntry, "num");
      expect(result).toEqual(["123"]);
    });

    it("should handle mixed arrays", () => {
      mockEntry.getValue = jest.fn().mockReturnValue({
        data: ["img1.png", 42, "img2.jpg"],
      });

      const result = getAllBasesImagePropertyValues(
        mockApp,
        mockEntry,
        "mixed",
      );
      expect(result).toEqual(["img1.png", "42", "img2.jpg"]);
    });

    it("should try formula properties", () => {
      mockEntry.getValue = jest
        .fn()
        .mockReturnValueOnce({ icon: "error" })
        .mockReturnValueOnce({ data: "formula-img.png" });

      const result = getAllBasesImagePropertyValues(mockApp, mockEntry, "img");
      expect(result).toEqual(["formula-img.png"]);
    });
  });

  describe("getAllDatacoreImagePropertyValues", () => {
    let mockPage: any;

    beforeEach(() => {
      mockPage = {
        value: jest.fn(),
      };
    });

    it("should return empty array for empty property string", () => {
      expect(getAllDatacoreImagePropertyValues(mockPage, "")).toEqual([]);
    });

    it("should collect string values", () => {
      mockPage.value = jest.fn().mockReturnValue("image.png");

      const result = getAllDatacoreImagePropertyValues(mockPage, "img");
      expect(result).toEqual(["image.png"]);
    });

    it("should collect array values", () => {
      mockPage.value = jest.fn().mockReturnValue(["img1.png", "img2.jpg"]);

      const result = getAllDatacoreImagePropertyValues(mockPage, "images");
      expect(result).toEqual(["img1.png", "img2.jpg"]);
    });

    it("should handle Link objects with path property", () => {
      mockPage.value = jest.fn().mockReturnValue({ path: "linked-image.png" });

      const result = getAllDatacoreImagePropertyValues(mockPage, "link");
      expect(result).toEqual(["linked-image.png"]);
    });

    it("should handle arrays of Link objects", () => {
      mockPage.value = jest
        .fn()
        .mockReturnValue([{ path: "img1.png" }, { path: "img2.png" }]);

      const result = getAllDatacoreImagePropertyValues(mockPage, "links");
      expect(result).toEqual(["img1.png", "img2.png"]);
    });

    it("should skip null/undefined", () => {
      mockPage.value = jest
        .fn()
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce("valid.png");

      const result = getAllDatacoreImagePropertyValues(mockPage, "a, b, c");
      expect(result).toEqual(["valid.png"]);
    });

    it("should convert numbers to strings", () => {
      mockPage.value = jest.fn().mockReturnValue(42);

      const result = getAllDatacoreImagePropertyValues(mockPage, "num");
      expect(result).toEqual(["42"]);
    });

    it("should trim whitespace", () => {
      mockPage.value = jest.fn().mockReturnValue("  img.png  ");

      const result = getAllDatacoreImagePropertyValues(mockPage, "img");
      expect(result).toEqual(["img.png"]);
    });
  });

  describe("getPropertyLabel", () => {
    it("should return empty string for empty input", () => {
      expect(getPropertyLabel("")).toBe("");
    });

    it('should map file.path to "file path"', () => {
      expect(getPropertyLabel("file.path")).toBe("file path");
      expect(getPropertyLabel("path")).toBe("file path");
    });

    it('should map file.tags to "file tags"', () => {
      expect(getPropertyLabel("file.tags")).toBe("file tags");
    });

    it("should map ctime/mtime to human-readable names", () => {
      expect(getPropertyLabel("file.ctime")).toBe("created time");
      expect(getPropertyLabel("file.mtime")).toBe("modified time");
    });

    it("should handle case-insensitive mapping", () => {
      expect(getPropertyLabel("FILE.PATH")).toBe("file path");
      expect(getPropertyLabel("File.Tags")).toBe("file tags");
    });

    it("should strip note. prefix", () => {
      expect(getPropertyLabel("note.customProp")).toBe("customProp");
      expect(getPropertyLabel("note.title")).toBe("title");
    });

    it("should preserve custom property names as-is", () => {
      expect(getPropertyLabel("MyCustomProperty")).toBe("MyCustomProperty");
      expect(getPropertyLabel("some_property")).toBe("some_property");
    });

    it("should map all file properties correctly", () => {
      expect(getPropertyLabel("file.name")).toBe("file name");
      expect(getPropertyLabel("file.basename")).toBe("file base name");
      expect(getPropertyLabel("file.extension")).toBe("file extension");
      expect(getPropertyLabel("file.size")).toBe("file size");
      expect(getPropertyLabel("folder")).toBe("folder");
    });
  });

  describe("getAllVaultProperties", () => {
    let mockApp: App;

    beforeEach(() => {
      mockApp = new App();
    });

    it("should include built-in properties", () => {
      const result = getAllVaultProperties(mockApp);

      expect(result).toContain("file.path");
      expect(result).toContain("file.tags");
      expect(result).toContain("file.mtime");
      expect(result).toContain("file.ctime");
    });

    it("should include human-readable formats", () => {
      const result = getAllVaultProperties(mockApp);

      expect(result).toContain("file path");
      expect(result).toContain("file tags");
      expect(result).toContain("created time");
      expect(result).toContain("modified time");
    });

    it("should get properties from metadata cache if available", () => {
      (mockApp.metadataCache as any).getAllPropertyInfos = jest
        .fn()
        .mockReturnValue({
          customProp1: {},
          customProp2: {},
          title: {},
        });

      const result = getAllVaultProperties(mockApp);

      expect(result).toContain("customProp1");
      expect(result).toContain("customProp2");
      expect(result).toContain("title");
    });

    it("should handle missing getAllPropertyInfos method", () => {
      delete (mockApp.metadataCache as any).getAllPropertyInfos;

      const result = getAllVaultProperties(mockApp);

      // Should still have built-in properties
      expect(result).toContain("file.path");
      expect(result).toContain("file.tags");
    });

    it("should return sorted array with custom ordering", () => {
      const result = getAllVaultProperties(mockApp);

      // Should have custom sorting (Bases format first, then alphabetical)
      // Just verify it's an array and has expected properties
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // file.* properties should come before "file *" properties
      const basesFormatIndex = result.findIndex((p) => p.startsWith("file."));
      const humanFormatIndex = result.findIndex((p) => p.startsWith("file "));

      if (basesFormatIndex >= 0 && humanFormatIndex >= 0) {
        expect(basesFormatIndex).toBeLessThan(humanFormatIndex);
      }
    });

    it("should prioritize Bases format over human-readable", () => {
      const result = getAllVaultProperties(mockApp);

      const pathIndex = result.indexOf("file.path");
      const filePathIndex = result.indexOf("file path");

      expect(pathIndex).toBeLessThan(filePathIndex);
    });
  });
});
