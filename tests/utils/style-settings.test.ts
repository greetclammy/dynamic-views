import {
  getMinMasonryColumns,
  getMinGridColumns,
  hasCardBackground,
  showTimestampIcon,
  getTagStyle,
  getCardSpacing,
  shouldShowRecentTimeOnly,
  shouldShowOlderDateOnly,
  getListSeparator,
  getEmptyValueMarker,
  shouldHideMissingProperties,
  shouldHideEmptyProperties,
  applyCustomColors,
  StyleSettingsColorCache,
} from '../../src/utils/style-settings';

describe('style-settings', () => {
  let mockGetComputedStyle: jest.SpyInstance;
  let mockClassList: Set<string>;

  beforeEach(() => {
    // Mock getComputedStyle
    mockGetComputedStyle = jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (name: string) => '',
    } as CSSStyleDeclaration);

    // Mock body classList
    mockClassList = new Set<string>();
    Object.defineProperty(document.body, 'classList', {
      value: {
        contains: (className: string) => mockClassList.has(className),
        add: (className: string) => mockClassList.add(className),
        remove: (className: string) => mockClassList.delete(className),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    mockGetComputedStyle.mockRestore();
    mockClassList.clear();
  });

  describe('getMinMasonryColumns', () => {
    it('should return default value of 2', () => {
      expect(getMinMasonryColumns()).toBe(2);
    });

    it('should return custom value from CSS variable', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: (name: string) => name === '--dynamic-views-min-masonry-columns' ? '3' : '',
      } as CSSStyleDeclaration);

      expect(getMinMasonryColumns()).toBe(3);
    });

    it('should parse value with px unit', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: (name: string) => name === '--dynamic-views-min-masonry-columns' ? '4px' : '',
      } as CSSStyleDeclaration);

      expect(getMinMasonryColumns()).toBe(4);
    });

    it('should return default for invalid value', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: (name: string) => name === '--dynamic-views-min-masonry-columns' ? 'invalid' : '',
      } as CSSStyleDeclaration);

      expect(getMinMasonryColumns()).toBe(2);
    });

    it('should handle whitespace in CSS variable', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: (name: string) => name === '--dynamic-views-min-masonry-columns' ? '  5  ' : '',
      } as CSSStyleDeclaration);

      expect(getMinMasonryColumns()).toBe(5);
    });
  });

  describe('getMinGridColumns', () => {
    it('should return default value of 1', () => {
      expect(getMinGridColumns()).toBe(1);
    });

    it('should return custom value from CSS variable', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: (name: string) => name === '--dynamic-views-min-grid-columns' ? '2' : '',
      } as CSSStyleDeclaration);

      expect(getMinGridColumns()).toBe(2);
    });

    it('should handle decimal values', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: (name: string) => name === '--dynamic-views-min-grid-columns' ? '1.5' : '',
      } as CSSStyleDeclaration);

      expect(getMinGridColumns()).toBe(1.5);
    });
  });

  describe('hasCardBackground', () => {
    it('should return false by default', () => {
      expect(hasCardBackground()).toBe(false);
    });

    it('should return true when class is present', () => {
      mockClassList.add('dynamic-views-card-background');
      expect(hasCardBackground()).toBe(true);
    });

    it('should return false when class is removed', () => {
      mockClassList.add('dynamic-views-card-background');
      mockClassList.delete('dynamic-views-card-background');
      expect(hasCardBackground()).toBe(false);
    });
  });

  describe('showTimestampIcon', () => {
    it('should return true by default', () => {
      expect(showTimestampIcon()).toBe(true);
    });

    it('should return false when hide class is present', () => {
      mockClassList.add('dynamic-views-timestamp-icon-hide');
      expect(showTimestampIcon()).toBe(false);
    });

    it('should return true when hide class is removed', () => {
      mockClassList.add('dynamic-views-timestamp-icon-hide');
      mockClassList.delete('dynamic-views-timestamp-icon-hide');
      expect(showTimestampIcon()).toBe(true);
    });
  });

  describe('getTagStyle', () => {
    it('should return "plain" by default', () => {
      expect(getTagStyle()).toBe('plain');
    });

    it('should return "minimal" when minimal class is present', () => {
      mockClassList.add('dynamic-views-tag-style-minimal');
      expect(getTagStyle()).toBe('minimal');
    });

    it('should return "theme" when theme class is present', () => {
      mockClassList.add('dynamic-views-tag-style-theme');
      expect(getTagStyle()).toBe('theme');
    });

    it('should prefer minimal over theme when both are present', () => {
      mockClassList.add('dynamic-views-tag-style-minimal');
      mockClassList.add('dynamic-views-tag-style-theme');
      expect(getTagStyle()).toBe('minimal');
    });

    it('should return plain when both classes are removed', () => {
      mockClassList.add('dynamic-views-tag-style-minimal');
      mockClassList.delete('dynamic-views-tag-style-minimal');
      expect(getTagStyle()).toBe('plain');
    });
  });

  describe('getCardSpacing', () => {
    it('should return default value of 12', () => {
      expect(getCardSpacing()).toBe(12);
    });

    it('should return custom value from CSS variable', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: (name: string) => name === '--dynamic-views-card-spacing' ? '16' : '',
      } as CSSStyleDeclaration);

      expect(getCardSpacing()).toBe(16);
    });

    it('should parse value with px unit', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: (name: string) => name === '--dynamic-views-card-spacing' ? '20px' : '',
      } as CSSStyleDeclaration);

      expect(getCardSpacing()).toBe(20);
    });

    it('should handle zero value', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: (name: string) => name === '--dynamic-views-card-spacing' ? '0' : '',
      } as CSSStyleDeclaration);

      expect(getCardSpacing()).toBe(0);
    });
  });

  describe('shouldShowRecentTimeOnly', () => {
    it('should return false by default', () => {
      expect(shouldShowRecentTimeOnly()).toBe(false);
    });

    it('should return true when class is present', () => {
      mockClassList.add('dynamic-views-timestamp-recent-time-only');
      expect(shouldShowRecentTimeOnly()).toBe(true);
    });
  });

  describe('shouldShowOlderDateOnly', () => {
    it('should return false by default', () => {
      expect(shouldShowOlderDateOnly()).toBe(false);
    });

    it('should return true when class is present', () => {
      mockClassList.add('dynamic-views-timestamp-older-date-only');
      expect(shouldShowOlderDateOnly()).toBe(true);
    });
  });

  describe('getListSeparator', () => {
    it('should return default ", " (comma space)', () => {
      expect(getListSeparator()).toBe(', ');
    });

    it('should return custom value from CSS variable', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: (name: string) => name === '--dynamic-views-list-separator' ? ' | ' : '',
      } as CSSStyleDeclaration);

      expect(getListSeparator()).toBe(' | ');
    });

    it('should strip double quotes', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: (name: string) => name === '--dynamic-views-list-separator' ? '" • "' : '',
      } as CSSStyleDeclaration);

      expect(getListSeparator()).toBe(' • ');
    });

    it('should strip single quotes', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: (name: string) => name === '--dynamic-views-list-separator' ? "' / '" : '',
      } as CSSStyleDeclaration);

      expect(getListSeparator()).toBe(' / ');
    });

    it('should preserve whitespace', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: (name: string) => name === '--dynamic-views-list-separator' ? '   ' : '',
      } as CSSStyleDeclaration);

      expect(getListSeparator()).toBe('   ');
    });

    it('should not strip quotes if only one side matches', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: (name: string) => name === '--dynamic-views-list-separator' ? '"hello' : '',
      } as CSSStyleDeclaration);

      expect(getListSeparator()).toBe('"hello');
    });

    it('should handle empty string after quote stripping', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: (name: string) => name === '--dynamic-views-list-separator' ? '""' : '',
      } as CSSStyleDeclaration);

      expect(getListSeparator()).toBe(', '); // Falls back to default
    });
  });

  describe('getEmptyValueMarker', () => {
    it('should return default "—" (em dash)', () => {
      expect(getEmptyValueMarker()).toBe('—');
    });

    it('should return custom value from CSS variable', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: (name: string) => name === '--dynamic-views-empty-value-marker' ? 'N/A' : '',
      } as CSSStyleDeclaration);

      expect(getEmptyValueMarker()).toBe('N/A');
    });

    it('should strip double quotes', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: (name: string) => name === '--dynamic-views-empty-value-marker' ? '"..."' : '',
      } as CSSStyleDeclaration);

      expect(getEmptyValueMarker()).toBe('...');
    });

    it('should strip single quotes', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: (name: string) => name === '--dynamic-views-empty-value-marker' ? "'—'" : '',
      } as CSSStyleDeclaration);

      expect(getEmptyValueMarker()).toBe('—');
    });

    it('should handle empty string after quote stripping', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: (name: string) => name === '--dynamic-views-empty-value-marker' ? '""' : '',
      } as CSSStyleDeclaration);

      expect(getEmptyValueMarker()).toBe('—'); // Falls back to default
    });

    it('should preserve special characters', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: (name: string) => name === '--dynamic-views-empty-value-marker' ? '∅' : '',
      } as CSSStyleDeclaration);

      expect(getEmptyValueMarker()).toBe('∅');
    });
  });

  describe('shouldHideMissingProperties', () => {
    it('should return false by default', () => {
      expect(shouldHideMissingProperties()).toBe(false);
    });

    it('should return true when class is present', () => {
      mockClassList.add('dynamic-views-hide-missing-properties');
      expect(shouldHideMissingProperties()).toBe(true);
    });
  });

  describe('shouldHideEmptyProperties', () => {
    it('should return false by default', () => {
      expect(shouldHideEmptyProperties()).toBe(false);
    });

    it('should return true when class is present', () => {
      mockClassList.add('dynamic-views-hide-empty-properties');
      expect(shouldHideEmptyProperties()).toBe(true);
    });
  });

  describe('applyCustomColors', () => {
    let cardEl: HTMLElement;

    beforeEach(() => {
      cardEl = document.createElement('div');
    });

    it('should not set any colors when cache is empty', () => {
      const cache: StyleSettingsColorCache = {};
      applyCustomColors(cardEl, 'light', cache);

      expect(cardEl.style.getPropertyValue('--dynamic-views-title-color')).toBe('');
      expect(cardEl.style.getPropertyValue('--dynamic-views-snippet-color')).toBe('');
    });

    it('should apply title color for light theme', () => {
      const cache: StyleSettingsColorCache = {
        titleColor: { light: '#000000', dark: '#ffffff' },
      };

      applyCustomColors(cardEl, 'light', cache);

      expect(cardEl.style.getPropertyValue('--dynamic-views-title-color')).toBe('#000000');
    });

    it('should apply title color for dark theme', () => {
      const cache: StyleSettingsColorCache = {
        titleColor: { light: '#000000', dark: '#ffffff' },
      };

      applyCustomColors(cardEl, 'dark', cache);

      expect(cardEl.style.getPropertyValue('--dynamic-views-title-color')).toBe('#ffffff');
    });

    it('should apply all color types', () => {
      const cache: StyleSettingsColorCache = {
        titleColor: { light: '#111111' },
        snippetColor: { light: '#222222' },
        tagsColor: { light: '#333333' },
        timestampColor: { light: '#444444' },
        metadataColor: { light: '#555555' },
      };

      applyCustomColors(cardEl, 'light', cache);

      expect(cardEl.style.getPropertyValue('--dynamic-views-title-color')).toBe('#111111');
      expect(cardEl.style.getPropertyValue('--dynamic-views-snippet-color')).toBe('#222222');
      expect(cardEl.style.getPropertyValue('--dynamic-views-tags-color')).toBe('#333333');
      expect(cardEl.style.getPropertyValue('--dynamic-views-timestamp-color')).toBe('#444444');
      expect(cardEl.style.getPropertyValue('--dynamic-views-metadata-color')).toBe('#555555');
    });

    it('should only apply colors for specified theme', () => {
      const cache: StyleSettingsColorCache = {
        titleColor: { light: '#000000' },
        snippetColor: { dark: '#ffffff' },
      };

      applyCustomColors(cardEl, 'light', cache);

      expect(cardEl.style.getPropertyValue('--dynamic-views-title-color')).toBe('#000000');
      expect(cardEl.style.getPropertyValue('--dynamic-views-snippet-color')).toBe(''); // Only has dark
    });

    it('should handle partial cache', () => {
      const cache: StyleSettingsColorCache = {
        titleColor: { light: '#000000' },
      };

      applyCustomColors(cardEl, 'light', cache);

      expect(cardEl.style.getPropertyValue('--dynamic-views-title-color')).toBe('#000000');
      expect(cardEl.style.getPropertyValue('--dynamic-views-snippet-color')).toBe('');
    });

    it('should handle undefined theme colors', () => {
      const cache: StyleSettingsColorCache = {
        titleColor: {},
      };

      applyCustomColors(cardEl, 'light', cache);

      expect(cardEl.style.getPropertyValue('--dynamic-views-title-color')).toBe('');
    });

    it('should override existing styles', () => {
      cardEl.style.setProperty('--dynamic-views-title-color', '#oldcolor');

      const cache: StyleSettingsColorCache = {
        titleColor: { light: '#newcolor' },
      };

      applyCustomColors(cardEl, 'light', cache);

      expect(cardEl.style.getPropertyValue('--dynamic-views-title-color')).toBe('#newcolor');
    });

    it('should handle RGB color values', () => {
      const cache: StyleSettingsColorCache = {
        titleColor: { light: 'rgb(255, 0, 0)' },
      };

      applyCustomColors(cardEl, 'light', cache);

      expect(cardEl.style.getPropertyValue('--dynamic-views-title-color')).toBe('rgb(255, 0, 0)');
    });

    it('should handle HSL color values', () => {
      const cache: StyleSettingsColorCache = {
        titleColor: { light: 'hsl(120, 100%, 50%)' },
      };

      applyCustomColors(cardEl, 'light', cache);

      expect(cardEl.style.getPropertyValue('--dynamic-views-title-color')).toBe('hsl(120, 100%, 50%)');
    });
  });

  describe('StyleSettingsColorCache type', () => {
    it('should accept all optional color fields', () => {
      const cache: StyleSettingsColorCache = {
        titleColor: { light: '#000', dark: '#fff' },
        snippetColor: { light: '#111' },
        tagsColor: { dark: '#222' },
        timestampColor: {},
        metadataColor: { light: '#333', dark: '#444' },
      };

      expect(cache).toBeDefined();
    });

    it('should accept empty object', () => {
      const cache: StyleSettingsColorCache = {};
      expect(cache).toBeDefined();
    });
  });
});
