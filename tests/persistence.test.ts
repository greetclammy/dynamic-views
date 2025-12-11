import { PersistenceManager } from "../src/persistence";
import { Plugin } from "obsidian";

// Mock dependencies
jest.mock("../src/utils/sanitize", () => ({
  sanitizeObject: jest.fn((obj) => obj),
  sanitizeString: jest.fn((str) => str),
}));

jest.mock("../src/constants", () => ({
  DEFAULT_SETTINGS: {
    titleProperty: "title",
    textPreviewProperty: "description",
  },
  DEFAULT_UI_STATE: {
    searchQuery: "",
    sortMethod: "mtime-desc",
    viewMode: "card",
    resultLimit: "",
    widthMode: "normal",
  },
  DEFAULT_VIEW_SETTINGS: {
    viewMode: "grid",
    cardSize: 200,
  },
}));

describe("PersistenceManager", () => {
  let mockPlugin: Plugin;
  let manager: PersistenceManager;

  beforeEach(() => {
    mockPlugin = {
      loadData: jest.fn().mockResolvedValue(null),
      saveData: jest.fn().mockResolvedValue(undefined),
    } as any;

    manager = new PersistenceManager(mockPlugin);
  });

  describe("constructor", () => {
    it("should initialize with default data", () => {
      const settings = manager.getGlobalSettings();
      expect(settings).toBeDefined();
      expect(settings.titleProperty).toBe("title");
    });
  });

  describe("load", () => {
    it("should load data from plugin", async () => {
      const mockData = {
        globalSettings: { titleProperty: "custom-title" },
        defaultViewSettings: { cardSize: 300 },
        queryStates: {},
        viewSettings: {},
      };

      mockPlugin.loadData = jest.fn().mockResolvedValue(mockData);
      await manager.load();

      const settings = manager.getGlobalSettings();
      expect(settings.titleProperty).toBe("custom-title");
    });

    it("should merge loaded data with defaults", async () => {
      const mockData = {
        globalSettings: { titleProperty: "custom" },
        // Missing other fields - should use defaults
      };

      mockPlugin.loadData = jest.fn().mockResolvedValue(mockData);
      await manager.load();

      const settings = manager.getGlobalSettings();
      expect(settings.titleProperty).toBe("custom");
      expect(settings.textPreviewProperty).toBe("description"); // From defaults
    });

    it("should handle null loaded data", async () => {
      mockPlugin.loadData = jest.fn().mockResolvedValue(null);
      await manager.load();

      const settings = manager.getGlobalSettings();
      expect(settings).toBeDefined();
    });

    it("should handle partial loaded data", async () => {
      const mockData = {
        globalSettings: { titleProperty: "test" },
      };

      mockPlugin.loadData = jest.fn().mockResolvedValue(mockData);
      await manager.load();

      const viewSettings = manager.getDefaultViewSettings();
      expect(viewSettings).toBeDefined();
      expect(viewSettings.viewMode).toBe("grid");
    });
  });

  describe("save", () => {
    it("should save data to plugin", async () => {
      await manager.save();

      expect(mockPlugin.saveData).toHaveBeenCalledTimes(1);
      expect(mockPlugin.saveData).toHaveBeenCalledWith(
        expect.objectContaining({
          globalSettings: expect.any(Object),
          defaultViewSettings: expect.any(Object),
          queryStates: expect.any(Object),
          viewSettings: expect.any(Object),
        }),
      );
    });
  });

  describe("getGlobalSettings", () => {
    it("should return copy of global settings", () => {
      const settings1 = manager.getGlobalSettings();
      const settings2 = manager.getGlobalSettings();

      expect(settings1).toEqual(settings2);
      expect(settings1).not.toBe(settings2); // Different objects
    });
  });

  describe("setGlobalSettings", () => {
    it("should update global settings", async () => {
      await manager.setGlobalSettings({ titleProperty: "new-title" });

      const settings = manager.getGlobalSettings();
      expect(settings.titleProperty).toBe("new-title");
    });

    it("should save after updating", async () => {
      await manager.setGlobalSettings({ titleProperty: "new" });

      expect(mockPlugin.saveData).toHaveBeenCalled();
    });

    it("should merge with existing settings", async () => {
      await manager.setGlobalSettings({ titleProperty: "new-title" });
      await manager.setGlobalSettings({
        textPreviewProperty: "new-text-preview",
      });

      const settings = manager.getGlobalSettings();
      expect(settings.titleProperty).toBe("new-title");
      expect(settings.textPreviewProperty).toBe("new-text-preview");
    });

    it("should sanitize settings", async () => {
      const { sanitizeObject } = require("../src/utils/sanitize");

      await manager.setGlobalSettings({ titleProperty: "test" });

      expect(sanitizeObject).toHaveBeenCalled();
    });
  });

  describe("getDefaultViewSettings", () => {
    it("should return copy of default view settings", () => {
      const settings1 = manager.getDefaultViewSettings();
      const settings2 = manager.getDefaultViewSettings();

      expect(settings1).toEqual(settings2);
      expect(settings1).not.toBe(settings2);
    });
  });

  describe("setDefaultViewSettings", () => {
    it("should update default view settings", async () => {
      await manager.setDefaultViewSettings({ cardSize: 250 });

      const settings = manager.getDefaultViewSettings();
      expect(settings.cardSize).toBe(250);
    });

    it("should save after updating", async () => {
      await manager.setDefaultViewSettings({ cardSize: 250 });

      expect(mockPlugin.saveData).toHaveBeenCalled();
    });
  });

  describe("getUIState", () => {
    it("should return default UI state when no state exists", () => {
      const state = manager.getUIState(123456);

      expect(state).toEqual({
        searchQuery: "",
        sortMethod: "mtime-desc",
        viewMode: "card",
        resultLimit: "",
        widthMode: "normal",
      });
    });

    it("should return existing UI state", async () => {
      await manager.setUIState(123456, { searchQuery: "test" });

      const state = manager.getUIState(123456);
      expect(state.searchQuery).toBe("test");
    });

    it("should return copy of state", async () => {
      await manager.setUIState(123456, { searchQuery: "test" });

      const state1 = manager.getUIState(123456);
      const state2 = manager.getUIState(123456);

      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
    });
  });

  describe("setUIState", () => {
    it("should set UI state for ctime", async () => {
      await manager.setUIState(123456, { searchQuery: "query" });

      const state = manager.getUIState(123456);
      expect(state.searchQuery).toBe("query");
    });

    it("should merge with existing state", async () => {
      await manager.setUIState(123456, { searchQuery: "test" });
      await manager.setUIState(123456, { sortMethod: "ctime" as any });

      const state = manager.getUIState(123456);
      expect(state.searchQuery).toBe("test");
      expect(state.sortMethod).toBe("ctime");
    });

    it("should truncate searchQuery to 500 chars", async () => {
      const longQuery = "a".repeat(600);
      await manager.setUIState(123456, { searchQuery: longQuery });

      const state = manager.getUIState(123456);
      expect(state.searchQuery.length).toBe(500);
    });

    it("should sanitize string values", async () => {
      const { sanitizeString } = require("../src/utils/sanitize");

      await manager.setUIState(123456, { searchQuery: "test" });

      expect(sanitizeString).toHaveBeenCalled();
    });

    it("should save after updating", async () => {
      await manager.setUIState(123456, { searchQuery: "test" });

      expect(mockPlugin.saveData).toHaveBeenCalled();
    });

    it("should handle non-string values", async () => {
      await manager.setUIState(123456, { sortMethod: "alphabetical" as any });

      const state = manager.getUIState(123456);
      expect(state.sortMethod).toBe("alphabetical");
    });
  });

  describe("clearUIState", () => {
    it("should remove UI state for ctime", async () => {
      await manager.setUIState(123456, { searchQuery: "test" });
      await manager.clearUIState(123456);

      const state = manager.getUIState(123456);
      expect(state).toEqual({
        searchQuery: "",
        sortMethod: "mtime-desc",
        viewMode: "card",
        resultLimit: "",
        widthMode: "normal",
      });
    });

    it("should save after clearing", async () => {
      await manager.setUIState(123456, { searchQuery: "test" });
      await manager.clearUIState(123456);

      expect(mockPlugin.saveData).toHaveBeenCalled();
    });
  });

  describe("getViewSettings", () => {
    it("should return empty object when no settings exist", () => {
      const settings = manager.getViewSettings(123456);
      expect(settings).toEqual({});
    });

    it("should return existing view settings", async () => {
      await manager.setViewSettings(123456, { cardSize: 300 });

      const settings = manager.getViewSettings(123456);
      expect(settings.cardSize).toBe(300);
    });

    it("should return copy of settings", async () => {
      await manager.setViewSettings(123456, { cardSize: 300 });

      const settings1 = manager.getViewSettings(123456);
      const settings2 = manager.getViewSettings(123456);

      expect(settings1).toEqual(settings2);
      expect(settings1).not.toBe(settings2);
    });
  });

  describe("setViewSettings", () => {
    it("should set view settings for ctime", async () => {
      await manager.setViewSettings(123456, { cardSize: 300 });

      const settings = manager.getViewSettings(123456);
      expect(settings.cardSize).toBe(300);
    });

    it("should merge with existing settings", async () => {
      await manager.setViewSettings(123456, { cardSize: 300 });
      await manager.setViewSettings(123456, { viewMode: "masonry" as any });

      const settings = manager.getViewSettings(123456);
      expect(settings.cardSize).toBe(300);
      expect(settings.viewMode).toBe("masonry");
    });

    it("should sanitize settings", async () => {
      const { sanitizeObject } = require("../src/utils/sanitize");

      await manager.setViewSettings(123456, { cardSize: 300 });

      expect(sanitizeObject).toHaveBeenCalled();
    });

    it("should save after updating", async () => {
      await manager.setViewSettings(123456, { cardSize: 300 });

      expect(mockPlugin.saveData).toHaveBeenCalled();
    });
  });

  describe("clearViewSettings", () => {
    it("should remove view settings for ctime", async () => {
      await manager.setViewSettings(123456, { cardSize: 300 });
      await manager.clearViewSettings(123456);

      const settings = manager.getViewSettings(123456);
      expect(settings).toEqual({});
    });

    it("should save after clearing", async () => {
      await manager.setViewSettings(123456, { cardSize: 300 });
      await manager.clearViewSettings(123456);

      expect(mockPlugin.saveData).toHaveBeenCalled();
    });
  });

  describe("ctime-based isolation", () => {
    it("should keep separate states for different ctimes", async () => {
      await manager.setUIState(111, { searchQuery: "query1" });
      await manager.setUIState(222, { searchQuery: "query2" });

      const state1 = manager.getUIState(111);
      const state2 = manager.getUIState(222);

      expect(state1.searchQuery).toBe("query1");
      expect(state2.searchQuery).toBe("query2");
    });

    it("should keep separate view settings for different ctimes", async () => {
      await manager.setViewSettings(111, { cardSize: 200 });
      await manager.setViewSettings(222, { cardSize: 300 });

      const settings1 = manager.getViewSettings(111);
      const settings2 = manager.getViewSettings(222);

      expect(settings1.cardSize).toBe(200);
      expect(settings2.cardSize).toBe(300);
    });
  });
});
