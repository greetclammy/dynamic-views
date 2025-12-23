import { serializeGroupKey } from "../../src/bases/utils";

describe("serializeGroupKey", () => {
  describe("primitives", () => {
    it("should return undefined for null", () => {
      expect(serializeGroupKey(null)).toBeUndefined();
    });

    it("should return undefined for undefined", () => {
      expect(serializeGroupKey(undefined)).toBeUndefined();
    });

    it("should return string as-is", () => {
      expect(serializeGroupKey("test")).toBe("test");
      expect(serializeGroupKey("")).toBe("");
      expect(serializeGroupKey("hello world")).toBe("hello world");
    });

    it("should convert number to string", () => {
      expect(serializeGroupKey(123)).toBe("123");
      expect(serializeGroupKey(0)).toBe("0");
      expect(serializeGroupKey(-42)).toBe("-42");
      expect(serializeGroupKey(3.14)).toBe("3.14");
    });

    it("should convert boolean to string", () => {
      expect(serializeGroupKey(true)).toBe("true");
      expect(serializeGroupKey(false)).toBe("false");
    });
  });

  describe("Bases Value objects with .data", () => {
    it("should extract string from .data", () => {
      expect(serializeGroupKey({ icon: "📁", data: "folder" })).toBe("folder");
      expect(serializeGroupKey({ data: "value" })).toBe("value");
    });

    it("should extract number from .data and convert to string", () => {
      expect(serializeGroupKey({ icon: "🔢", data: 462 })).toBe("462");
      expect(serializeGroupKey({ data: 0 })).toBe("0");
      expect(serializeGroupKey({ data: -1 })).toBe("-1");
    });

    it("should extract boolean from .data and convert to string", () => {
      expect(serializeGroupKey({ icon: "✓", data: true })).toBe("true");
      expect(serializeGroupKey({ data: false })).toBe("false");
    });

    it("should return undefined for null .data", () => {
      expect(serializeGroupKey({ icon: "❌", data: null })).toBeUndefined();
    });

    it("should return undefined for undefined .data", () => {
      expect(
        serializeGroupKey({ icon: "❌", data: undefined }),
      ).toBeUndefined();
    });

    it("should handle empty string in .data", () => {
      expect(serializeGroupKey({ data: "" })).toBe("");
    });

    it("should return undefined for empty arrays in .data", () => {
      expect(serializeGroupKey({ data: [] })).toBeUndefined();
    });

    it("should join primitive arrays in .data with comma separator", () => {
      const result = serializeGroupKey({ data: [1, 2, 3] });
      expect(result).toBe("1, 2, 3");
    });

    it("should stringify nested objects in .data", () => {
      const result = serializeGroupKey({ data: { nested: "value" } });
      expect(result).toBe('{"nested":"value"}');
    });
  });

  describe("Bases date Value objects", () => {
    it("should format Date object to ISO string", () => {
      const date = new Date("2024-06-15T10:30:00Z");
      const result = serializeGroupKey({ date });
      expect(result).toBe("2024-06-15T10:30:00.000Z");
    });

    it("should format Date object with additional properties to ISO string", () => {
      // Additional properties like `time` are ignored - only .date matters
      const date = new Date("2024-06-15T00:00:00Z");
      const result = serializeGroupKey({ date, time: false, extra: "ignored" });
      expect(result).toBe("2024-06-15T00:00:00.000Z");
    });
  });

  describe("plain objects and arrays", () => {
    it("should stringify plain objects", () => {
      expect(serializeGroupKey({ key: "value" })).toBe('{"key":"value"}');
    });

    it("should return undefined for empty arrays", () => {
      expect(serializeGroupKey([])).toBeUndefined();
    });

    it("should join string arrays with comma separator", () => {
      expect(serializeGroupKey(["a", "b", "c"])).toBe("a, b, c");
    });

    it("should join number arrays with comma separator", () => {
      expect(serializeGroupKey([1, 2, 3])).toBe("1, 2, 3");
    });

    it("should extract .data from arrays of Bases Value objects (tags)", () => {
      const tags = [
        { icon: "lucide-text", data: "#tag1" },
        { icon: "lucide-text", data: "#tag2" },
      ];
      expect(serializeGroupKey(tags)).toBe("#tag1, #tag2");
    });
  });

  describe("edge cases", () => {
    it("should handle circular references gracefully", () => {
      const obj: Record<string, unknown> = {};
      obj.self = obj;
      const result = serializeGroupKey(obj);
      expect(result).toMatch(/^\[object:/);
    });

    it("should not confuse regular objects with .data as Bases Values", () => {
      // Object with .data that contains null should return undefined
      expect(serializeGroupKey({ data: null })).toBeUndefined();
      // Object with .data that contains a value should extract it
      expect(serializeGroupKey({ data: "extracted" })).toBe("extracted");
    });

    it("should handle mixed primitive types in arrays", () => {
      expect(serializeGroupKey([1, "two", true])).toBe("1, two, true");
    });

    it("should recursively process nested .data properties", () => {
      expect(serializeGroupKey({ data: { data: "nested" } })).toBe("nested");
    });

    it("should convert NaN to string", () => {
      expect(serializeGroupKey(NaN)).toBe("NaN");
    });

    it("should convert Infinity to string", () => {
      expect(serializeGroupKey(Infinity)).toBe("Infinity");
    });

    it("should handle arrays with null elements", () => {
      // Arrays with null stringify to JSON
      expect(serializeGroupKey([1, null, 3])).toBe("[1,null,3]");
    });
  });
});
