/**
 * Universal settings schema
 * Defines settings structure for both Bases and Datacore views
 */

import type { Settings, DefaultViewSettings } from "../types";
import { DEFAULT_SETTINGS, DEFAULT_VIEW_SETTINGS } from "../constants";

// Bases config object interface
interface BasesConfig {
  get(key: string): unknown;
}

// Plugin instance interface
interface PluginInstance {
  persistenceManager: {
    getGlobalSettings(): Settings;
    getDefaultViewSettings(): DefaultViewSettings;
  };
}

export function setPluginInstance(plugin: PluginInstance): void {
  // Function exists to maintain API compatibility
  // Plugin instance currently unused but may be needed for future features
}

/**
 * Bases view options for card/masonry views
 * These options appear in the Bases view configuration menu
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Bases API requires any for options array structure
export function getBasesViewOptions(): any[] {
  return [
    {
      type: "slider",
      displayName: "Card size",
      key: "cardSize",
      min: 50,
      max: 800,
      step: 10,
      default: DEFAULT_VIEW_SETTINGS.cardSize,
    },
    {
      type: "group",
      displayName: "Title",
      items: [
        {
          type: "toggle",
          displayName: "Show title",
          key: "showTitle",
          default: DEFAULT_VIEW_SETTINGS.showTitle,
        },
        {
          type: "text",
          displayName: "Title property",
          key: "titleProperty",
          placeholder: "Comma-separated if multiple",
          default: DEFAULT_VIEW_SETTINGS.titleProperty,
        },
      ],
    },
    {
      type: "group",
      displayName: "Text preview",
      items: [
        {
          type: "toggle",
          displayName: "Show text preview",
          key: "showTextPreview",
          default: DEFAULT_VIEW_SETTINGS.showTextPreview,
        },
        {
          type: "text",
          displayName: "Text preview property",
          key: "textPreviewProperty",
          placeholder: "Comma-separated if multiple",
          default: DEFAULT_VIEW_SETTINGS.textPreviewProperty,
        },
        {
          type: "toggle",
          displayName:
            "Show note content if text preview property missing or empty",
          key: "fallbackToContent",
          default: DEFAULT_VIEW_SETTINGS.fallbackToContent,
        },
      ],
    },
    {
      type: "group",
      displayName: "Image",
      items: [
        {
          type: "dropdown",
          displayName: "Format",
          key: "imageFormat",
          options: {
            thumbnail: "Thumbnail",
            cover: "Cover",
            none: "No image",
          },
          default: "thumbnail",
        },
        {
          type: "dropdown",
          displayName: "Position",
          key: "imagePosition",
          options: {
            left: "Left",
            right: "Right",
            top: "Top",
            bottom: "Bottom",
          },
          default: "right",
        },
        {
          type: "text",
          displayName: "Image property",
          key: "imageProperty",
          placeholder: "Comma-separated if multiple",
          default: DEFAULT_VIEW_SETTINGS.imageProperty,
        },
        {
          type: "dropdown",
          displayName: "Show image embeds",
          key: "fallbackToEmbeds",
          options: {
            always: "Always",
            "if-empty": "If image property missing or empty",
            never: "Never",
          },
          default: "always",
        },
        {
          type: "dropdown",
          displayName: "Fit",
          key: "imageFit",
          options: {
            crop: "Crop",
            contain: "Contain",
          },
          default: "crop",
        },
        {
          type: "slider",
          displayName: "Ratio",
          key: "imageAspectRatio",
          min: 0.25,
          max: 2.5,
          step: 0.05,
          default: DEFAULT_VIEW_SETTINGS.imageAspectRatio,
        },
      ],
    },
    {
      type: "group",
      displayName: "Properties",
      items: [
        {
          type: "text",
          displayName: "Subtitle property",
          key: "subtitleProperty",
          placeholder: "Comma-separated if multiple",
          default: "",
        },
        {
          type: "text",
          displayName: "URL property",
          key: "urlProperty",
          placeholder: "Comma-separated if multiple",
          default: "",
        },
        {
          type: "dropdown",
          displayName: "Property labels",
          key: "propertyLabels",
          options: {
            inline: "Inline",
            above: "On top",
            hide: "Hide",
          },
          default: DEFAULT_VIEW_SETTINGS.propertyLabels,
        },
      ],
    },
    {
      type: "group",
      displayName: "Property set 1",
      items: [
        {
          type: "property",
          displayName: "First property",
          key: "propertyDisplay1",
          placeholder: "Select property",
          default: "",
        },
        {
          type: "property",
          displayName: "Second property",
          key: "propertyDisplay2",
          placeholder: "Select property",
          default: "",
        },
        {
          type: "toggle",
          displayName: "Show side-by-side",
          key: "propertySet1SideBySide",
          default: DEFAULT_VIEW_SETTINGS.propertySet1SideBySide,
        },
        {
          type: "dropdown",
          displayName: "Position",
          key: "propertySet1Position",
          options: {
            top: "Top",
            bottom: "Bottom",
          },
          default: DEFAULT_VIEW_SETTINGS.propertySet1Position,
        },
      ],
    },
    {
      type: "group",
      displayName: "Property set 2",
      items: [
        {
          type: "property",
          displayName: "First property",
          key: "propertyDisplay3",
          placeholder: "Select property",
          default: "",
        },
        {
          type: "property",
          displayName: "Second property",
          key: "propertyDisplay4",
          placeholder: "Select property",
          default: "",
        },
        {
          type: "toggle",
          displayName: "Show side-by-side",
          key: "propertySet2SideBySide",
          default: DEFAULT_VIEW_SETTINGS.propertySet2SideBySide,
        },
        {
          type: "dropdown",
          displayName: "Position",
          key: "propertySet2Position",
          options: {
            top: "Top",
            bottom: "Bottom",
          },
          default: DEFAULT_VIEW_SETTINGS.propertySet2Position,
        },
      ],
    },
    {
      type: "group",
      displayName: "Property set 3",
      items: [
        {
          type: "property",
          displayName: "First property",
          key: "propertyDisplay5",
          placeholder: "Select property",
          default: "",
        },
        {
          type: "property",
          displayName: "Second property",
          key: "propertyDisplay6",
          placeholder: "Select property",
          default: "",
        },
        {
          type: "toggle",
          displayName: "Show side-by-side",
          key: "propertySet3SideBySide",
          default: DEFAULT_VIEW_SETTINGS.propertySet3SideBySide,
        },
        {
          type: "dropdown",
          displayName: "Position",
          key: "propertySet3Position",
          options: {
            top: "Top",
            bottom: "Bottom",
          },
          default: DEFAULT_VIEW_SETTINGS.propertySet3Position,
        },
      ],
    },
    {
      type: "group",
      displayName: "Property set 4",
      items: [
        {
          type: "property",
          displayName: "First property",
          key: "propertyDisplay7",
          placeholder: "Select property",
          default: "",
        },
        {
          type: "property",
          displayName: "Second property",
          key: "propertyDisplay8",
          placeholder: "Select property",
          default: "",
        },
        {
          type: "toggle",
          displayName: "Show side-by-side",
          key: "propertySet4SideBySide",
          default: DEFAULT_VIEW_SETTINGS.propertySet4SideBySide,
        },
        {
          type: "dropdown",
          displayName: "Position",
          key: "propertySet4Position",
          options: {
            top: "Top",
            bottom: "Bottom",
          },
          default: DEFAULT_VIEW_SETTINGS.propertySet4Position,
        },
      ],
    },
    {
      type: "group",
      displayName: "Property set 5",
      items: [
        {
          type: "property",
          displayName: "First property",
          key: "propertyDisplay9",
          placeholder: "Select property",
          default: "",
        },
        {
          type: "property",
          displayName: "Second property",
          key: "propertyDisplay10",
          placeholder: "Select property",
          default: "",
        },
        {
          type: "toggle",
          displayName: "Show side-by-side",
          key: "propertySet5SideBySide",
          default: DEFAULT_VIEW_SETTINGS.propertySet5SideBySide,
        },
        {
          type: "dropdown",
          displayName: "Position",
          key: "propertySet5Position",
          options: {
            top: "Top",
            bottom: "Bottom",
          },
          default: DEFAULT_VIEW_SETTINGS.propertySet5Position,
        },
      ],
    },
    {
      type: "group",
      displayName: "Property set 6",
      items: [
        {
          type: "property",
          displayName: "First property",
          key: "propertyDisplay11",
          placeholder: "Select property",
          default: "",
        },
        {
          type: "property",
          displayName: "Second property",
          key: "propertyDisplay12",
          placeholder: "Select property",
          default: "",
        },
        {
          type: "toggle",
          displayName: "Show side-by-side",
          key: "propertySet6SideBySide",
          default: DEFAULT_VIEW_SETTINGS.propertySet6SideBySide,
        },
        {
          type: "dropdown",
          displayName: "Position",
          key: "propertySet6Position",
          options: {
            top: "Top",
            bottom: "Bottom",
          },
          default: DEFAULT_VIEW_SETTINGS.propertySet6Position,
        },
      ],
    },
    {
      type: "group",
      displayName: "Property set 7",
      items: [
        {
          type: "property",
          displayName: "First property",
          key: "propertyDisplay13",
          placeholder: "Select property",
          default: "",
        },
        {
          type: "property",
          displayName: "Second property",
          key: "propertyDisplay14",
          placeholder: "Select property",
          default: "",
        },
        {
          type: "toggle",
          displayName: "Show side-by-side",
          key: "propertySet7SideBySide",
          default: DEFAULT_VIEW_SETTINGS.propertySet7SideBySide,
        },
        {
          type: "dropdown",
          displayName: "Position",
          key: "propertySet7Position",
          options: {
            top: "Top",
            bottom: "Bottom",
          },
          default: DEFAULT_VIEW_SETTINGS.propertySet7Position,
        },
      ],
    },
  ];
}

/**
 * Additional options specific to masonry view
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Bases API requires any for options array structure
export function getMasonryViewOptions(): any[] {
  return getBasesViewOptions();
}

/**
 * Read settings from Bases config
 * Maps Bases config values to Settings object
 */
export function readBasesSettings(
  config: BasesConfig,
  globalSettings: Settings,
  defaultViewSettings: DefaultViewSettings,
): Settings {
  const titlePropertyValue = config.get("titleProperty");
  const textPreviewPropertyValue = config.get("textPreviewProperty");
  const imagePropertyValue = config.get("imageProperty");
  const urlPropertyValue = config.get("urlProperty");

  return {
    titleProperty:
      typeof titlePropertyValue === "string"
        ? titlePropertyValue
        : defaultViewSettings.titleProperty,
    textPreviewProperty:
      typeof textPreviewPropertyValue === "string"
        ? textPreviewPropertyValue
        : defaultViewSettings.textPreviewProperty,
    imageProperty:
      typeof imagePropertyValue === "string"
        ? imagePropertyValue
        : defaultViewSettings.imageProperty,
    urlProperty:
      typeof urlPropertyValue === "string"
        ? urlPropertyValue
        : defaultViewSettings.urlProperty,
    omitFirstLine: globalSettings.omitFirstLine, // From global settings
    showTitle: Boolean(
      config.get("showTitle") ?? defaultViewSettings.showTitle,
    ),
    subtitleProperty: (() => {
      const value = config.get("subtitleProperty");
      if (value !== undefined && value !== null) {
        return typeof value === "string" ? value : "";
      }
      return "";
    })(),
    showTextPreview: Boolean(
      config.get("showTextPreview") ?? defaultViewSettings.showTextPreview,
    ),
    fallbackToContent: Boolean(
      config.get("fallbackToContent") ?? defaultViewSettings.fallbackToContent,
    ),
    fallbackToEmbeds: (() => {
      const value = config.get("fallbackToEmbeds");
      return value === "always" || value === "if-empty" || value === "never"
        ? value
        : defaultViewSettings.fallbackToEmbeds;
    })(),
    propertyDisplay1: (() => {
      const value = config.get("propertyDisplay1");
      // If value is explicitly set (including empty string), use it
      if (value !== undefined && value !== null) {
        return typeof value === "string" ? value : "";
      }
      // For Bases views, default to empty (no properties shown)
      return "";
    })(),
    propertyDisplay2: (() => {
      const value = config.get("propertyDisplay2");
      if (value !== undefined && value !== null) {
        return typeof value === "string" ? value : "";
      }
      return "";
    })(),
    propertyDisplay3: (() => {
      const value = config.get("propertyDisplay3");
      if (value !== undefined && value !== null) {
        return typeof value === "string" ? value : "";
      }
      return "";
    })(),
    propertyDisplay4: (() => {
      const value = config.get("propertyDisplay4");
      if (value !== undefined && value !== null) {
        return typeof value === "string" ? value : "";
      }
      return "";
    })(),
    propertySet1SideBySide: Boolean(
      config.get("propertySet1SideBySide") ??
      defaultViewSettings.propertySet1SideBySide,
    ),
    propertySet2SideBySide: Boolean(
      config.get("propertySet2SideBySide") ??
      defaultViewSettings.propertySet2SideBySide,
    ),
    propertyDisplay5: (() => {
      const value = config.get("propertyDisplay5");
      if (value !== undefined && value !== null) {
        return typeof value === "string" ? value : "";
      }
      return "";
    })(),
    propertyDisplay6: (() => {
      const value = config.get("propertyDisplay6");
      if (value !== undefined && value !== null) {
        return typeof value === "string" ? value : "";
      }
      return "";
    })(),
    propertySet3SideBySide: Boolean(
      config.get("propertySet3SideBySide") ??
      defaultViewSettings.propertySet3SideBySide,
    ),
    propertyDisplay7: (() => {
      const value = config.get("propertyDisplay7");
      if (value !== undefined && value !== null) {
        return typeof value === "string" ? value : "";
      }
      return "";
    })(),
    propertyDisplay8: (() => {
      const value = config.get("propertyDisplay8");
      if (value !== undefined && value !== null) {
        return typeof value === "string" ? value : "";
      }
      return "";
    })(),
    propertySet4SideBySide: Boolean(
      config.get("propertySet4SideBySide") ??
      defaultViewSettings.propertySet4SideBySide,
    ),
    propertyDisplay9: (() => {
      const value = config.get("propertyDisplay9");
      if (value !== undefined && value !== null) {
        return typeof value === "string" ? value : "";
      }
      return "";
    })(),
    propertyDisplay10: (() => {
      const value = config.get("propertyDisplay10");
      if (value !== undefined && value !== null) {
        return typeof value === "string" ? value : "";
      }
      return "";
    })(),
    propertySet5SideBySide: Boolean(
      config.get("propertySet5SideBySide") ??
      defaultViewSettings.propertySet5SideBySide,
    ),
    propertyDisplay11: (() => {
      const value = config.get("propertyDisplay11");
      if (value !== undefined && value !== null) {
        return typeof value === "string" ? value : "";
      }
      return "";
    })(),
    propertyDisplay12: (() => {
      const value = config.get("propertyDisplay12");
      if (value !== undefined && value !== null) {
        return typeof value === "string" ? value : "";
      }
      return "";
    })(),
    propertySet6SideBySide: Boolean(
      config.get("propertySet6SideBySide") ??
      defaultViewSettings.propertySet6SideBySide,
    ),
    propertyDisplay13: (() => {
      const value = config.get("propertyDisplay13");
      if (value !== undefined && value !== null) {
        return typeof value === "string" ? value : "";
      }
      return "";
    })(),
    propertyDisplay14: (() => {
      const value = config.get("propertyDisplay14");
      if (value !== undefined && value !== null) {
        return typeof value === "string" ? value : "";
      }
      return "";
    })(),
    propertySet7SideBySide: Boolean(
      config.get("propertySet7SideBySide") ??
      defaultViewSettings.propertySet7SideBySide,
    ),
    propertySet1Position: (() => {
      const value = config.get("propertySet1Position");
      return value === "top" || value === "bottom"
        ? value
        : defaultViewSettings.propertySet1Position;
    })(),
    propertySet2Position: (() => {
      const value = config.get("propertySet2Position");
      return value === "top" || value === "bottom"
        ? value
        : defaultViewSettings.propertySet2Position;
    })(),
    propertySet3Position: (() => {
      const value = config.get("propertySet3Position");
      return value === "top" || value === "bottom"
        ? value
        : defaultViewSettings.propertySet3Position;
    })(),
    propertySet4Position: (() => {
      const value = config.get("propertySet4Position");
      return value === "top" || value === "bottom"
        ? value
        : defaultViewSettings.propertySet4Position;
    })(),
    propertySet5Position: (() => {
      const value = config.get("propertySet5Position");
      return value === "top" || value === "bottom"
        ? value
        : defaultViewSettings.propertySet5Position;
    })(),
    propertySet6Position: (() => {
      const value = config.get("propertySet6Position");
      return value === "top" || value === "bottom"
        ? value
        : defaultViewSettings.propertySet6Position;
    })(),
    propertySet7Position: (() => {
      const value = config.get("propertySet7Position");
      return value === "top" || value === "bottom"
        ? value
        : defaultViewSettings.propertySet7Position;
    })(),
    propertyLabels: (() => {
      const value = config.get("propertyLabels");
      return value === "hide" || value === "inline" || value === "above"
        ? value
        : defaultViewSettings.propertyLabels;
    })(),
    imageFormat: (() => {
      const format = config.get("imageFormat");
      const position = config.get("imagePosition");

      // Handle "none" directly
      if (format === "none") return "none";

      // Combine format + position (e.g., "cover" + "top" → "cover-top")
      if (
        (format === "thumbnail" || format === "cover") &&
        (position === "left" ||
          position === "right" ||
          position === "top" ||
          position === "bottom")
      ) {
        return `${format}-${position}` as Settings["imageFormat"];
      }

      // Check if already a combined value (legacy/direct)
      const value = format;
      if (
        value === "thumbnail-left" ||
        value === "thumbnail-right" ||
        value === "thumbnail-top" ||
        value === "thumbnail-bottom" ||
        value === "cover-left" ||
        value === "cover-right" ||
        value === "cover-top" ||
        value === "cover-bottom" ||
        value === "none"
      ) {
        return value;
      }

      return defaultViewSettings.imageFormat;
    })(),
    imageFit: (() => {
      const value = config.get("imageFit");
      return value === "crop" || value === "contain"
        ? value
        : defaultViewSettings.imageFit;
    })(),
    listMarker: (() => {
      const value = config.get("listMarker");
      return (
        typeof value === "string" ? value : DEFAULT_SETTINGS.listMarker
      ) as "bullet" | "number";
    })(),
    randomizeAction: (() => {
      const value = config.get("randomizeAction");
      return (
        typeof value === "string" ? value : DEFAULT_SETTINGS.randomizeAction
      ) as "shuffle" | "random";
    })(),
    queryHeight: 0, // Not configurable in Bases
    openFileAction: globalSettings.openFileAction, // From global settings
    openRandomInNewTab: globalSettings.openRandomInNewTab, // From global settings
    showShuffleInRibbon: globalSettings.showShuffleInRibbon, // From global settings
    showRandomInRibbon: globalSettings.showRandomInRibbon, // From global settings
    smartTimestamp: globalSettings.smartTimestamp, // From global settings
    createdTimeProperty: globalSettings.createdTimeProperty, // From global settings
    modifiedTimeProperty: globalSettings.modifiedTimeProperty, // From global settings
    showYoutubeThumbnails: globalSettings.showYoutubeThumbnails, // From global settings
    showCardLinkCovers: globalSettings.showCardLinkCovers, // From global settings
    cardSize: (() => {
      const value = config.get("cardSize");
      return typeof value === "number" ? value : defaultViewSettings.cardSize;
    })(),
    imageAspectRatio: (() => {
      const value = config.get("imageAspectRatio");
      return typeof value === "number"
        ? value
        : defaultViewSettings.imageAspectRatio;
    })(),
    preventSidebarSwipe: globalSettings.preventSidebarSwipe, // From global settings
    revealInNotebookNavigator: globalSettings.revealInNotebookNavigator, // From global settings
  };
}
