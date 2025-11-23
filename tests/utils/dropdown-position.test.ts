import { positionDropdown, setupClickOutside } from '../../src/utils/dropdown-position';

describe('dropdown-position', () => {
  describe('positionDropdown', () => {
    let buttonElement: HTMLElement;
    let menuElement: HTMLElement;

    beforeEach(() => {
      buttonElement = document.createElement('button');
      menuElement = document.createElement('div');

      // Mock getBoundingClientRect for button
      buttonElement.getBoundingClientRect = jest.fn();
      menuElement.getBoundingClientRect = jest.fn();

      // Default viewport size
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });
    });

    it('should position menu below button with default alignment', () => {
      (buttonElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        top: 100,
        bottom: 120,
        left: 50,
        right: 150,
        width: 100,
        height: 20,
      });

      (menuElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        width: 200,
        height: 150,
      });

      positionDropdown(buttonElement, menuElement);

      // Should be 4px below button
      expect(menuElement.style.top).toBe('124px'); // 120 + 4
      // Should be left-aligned with button
      expect(menuElement.style.left).toBe('50px');
    });

    it('should adjust position when menu overflows right edge', () => {
      (buttonElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        top: 100,
        bottom: 120,
        left: 900, // Near right edge
        right: 1000,
        width: 100,
        height: 20,
      });

      (menuElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        width: 200,
        height: 150,
      });

      positionDropdown(buttonElement, menuElement);

      // Should shift left to fit within viewport
      // Max position: 1024 - 200 - 8 = 816px
      expect(menuElement.style.left).toBe('816px');
    });

    it('should position menu above button when overflowing bottom', () => {
      (buttonElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        top: 650,
        bottom: 670,
        left: 50,
        right: 150,
        width: 100,
        height: 20,
      });

      (menuElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        width: 200,
        height: 150,
      });

      positionDropdown(buttonElement, menuElement);

      // Should be positioned above button
      // 650 - 150 - 4 = 496px
      expect(menuElement.style.top).toBe('496px');
    });

    it('should position at top when menu does not fit above or below', () => {
      (buttonElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        top: 100,
        bottom: 120,
        left: 50,
        right: 150,
        width: 100,
        height: 20,
      });

      (menuElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        width: 200,
        height: 700, // Too tall to fit below (120 + 700 > 768)
      });

      positionDropdown(buttonElement, menuElement);

      // Can't fit below (120 + 4 + 700 > 768)
      // Can't fit above (100 - 4 - 700 < 0)
      // Should position at edge padding
      expect(menuElement.style.top).toBe('8px');
    });

    it('should handle small viewport with edge padding', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 320 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 480 });

      (buttonElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        top: 50,
        bottom: 70,
        left: 200, // Near right edge
        right: 300,
        width: 100,
        height: 20,
      });

      (menuElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        width: 250,
        height: 100,
      });

      positionDropdown(buttonElement, menuElement);

      // Menu would overflow: 200 + 250 = 450 > 320 - 8
      // Max left: 320 - 250 - 8 = 62px
      expect(menuElement.style.left).toBe('62px');
    });

    it('should handle button near left edge', () => {
      (buttonElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        top: 100,
        bottom: 120,
        left: 5, // Very close to left edge
        right: 55,
        width: 50,
        height: 20,
      });

      (menuElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        width: 150,
        height: 100,
      });

      positionDropdown(buttonElement, menuElement);

      // Should align with button left
      expect(menuElement.style.left).toBe('5px');
    });

    it('should handle button at top of viewport', () => {
      (buttonElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        top: 0,
        bottom: 20,
        left: 100,
        right: 200,
        width: 100,
        height: 20,
      });

      (menuElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        width: 150,
        height: 100,
      });

      positionDropdown(buttonElement, menuElement);

      // Should position below button
      expect(menuElement.style.top).toBe('24px'); // 20 + 4
    });

    it('should handle button at bottom of viewport', () => {
      (buttonElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        top: 748,
        bottom: 768, // At very bottom
        left: 100,
        right: 200,
        width: 100,
        height: 20,
      });

      (menuElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        width: 150,
        height: 100,
      });

      positionDropdown(buttonElement, menuElement);

      // Should position above button
      // 748 - 100 - 4 = 644px
      expect(menuElement.style.top).toBe('644px');
    });

    it('should respect edge padding constant', () => {
      (buttonElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        top: 100,
        bottom: 120,
        left: 1020, // Very near right edge
        right: 1024,
        width: 4,
        height: 20,
      });

      (menuElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        width: 200,
        height: 50,
      });

      positionDropdown(buttonElement, menuElement);

      // Should stay 8px from right edge
      // 1024 - 200 - 8 = 816px
      expect(menuElement.style.left).toBe('816px');
    });

    it('should handle menu wider than viewport', () => {
      (buttonElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        top: 100,
        bottom: 120,
        left: 500,
        right: 600,
        width: 100,
        height: 20,
      });

      (menuElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        width: 1100, // Wider than viewport
        height: 100,
      });

      positionDropdown(buttonElement, menuElement);

      // Should respect minimum edge padding
      // Math.max(8, 1024 - 1100 - 8) = Math.max(8, -84) = 8
      expect(menuElement.style.left).toBe('8px');
    });

    it('should handle zero-width button', () => {
      (buttonElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        top: 100,
        bottom: 120,
        left: 50,
        right: 50,
        width: 0,
        height: 20,
      });

      (menuElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        width: 150,
        height: 100,
      });

      positionDropdown(buttonElement, menuElement);

      // Should still position at button left
      expect(menuElement.style.left).toBe('50px');
      expect(menuElement.style.top).toBe('124px');
    });

    it('should handle combined horizontal and vertical overflow', () => {
      (buttonElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        top: 700,
        bottom: 720,
        left: 900,
        right: 1000,
        width: 100,
        height: 20,
      });

      (menuElement.getBoundingClientRect as jest.Mock).mockReturnValue({
        width: 200,
        height: 100,
      });

      positionDropdown(buttonElement, menuElement);

      // Should adjust both axes
      // Horizontal: 1024 - 200 - 8 = 816px
      expect(menuElement.style.left).toBe('816px');
      // Vertical: position above (700 - 100 - 4 = 596px)
      expect(menuElement.style.top).toBe('596px');
    });
  });

  describe('setupClickOutside', () => {
    let containerElement: HTMLElement;
    let onClickOutside: jest.Mock;
    let cleanup: (() => void) | undefined;

    beforeEach(() => {
      containerElement = document.createElement('div');
      document.body.appendChild(containerElement);
      onClickOutside = jest.fn();
      jest.useFakeTimers();
    });

    afterEach(() => {
      if (cleanup) {
        cleanup();
      }
      document.body.removeChild(containerElement);
      jest.useRealTimers();
    });

    it('should call callback when clicking outside container', () => {
      cleanup = setupClickOutside(containerElement, onClickOutside);

      // Fast-forward timer to attach event listener
      jest.runAllTimers();

      // Click outside
      const outsideElement = document.createElement('div');
      document.body.appendChild(outsideElement);
      outsideElement.click();

      expect(onClickOutside).toHaveBeenCalledTimes(1);

      document.body.removeChild(outsideElement);
    });

    it('should not call callback when clicking inside container', () => {
      cleanup = setupClickOutside(containerElement, onClickOutside);

      // Fast-forward timer to attach event listener
      jest.runAllTimers();

      // Click inside
      containerElement.click();

      expect(onClickOutside).not.toHaveBeenCalled();
    });

    it('should not call callback when clicking on child elements', () => {
      const childElement = document.createElement('button');
      containerElement.appendChild(childElement);

      cleanup = setupClickOutside(containerElement, onClickOutside);

      // Fast-forward timer
      jest.runAllTimers();

      // Click on child
      childElement.click();

      expect(onClickOutside).not.toHaveBeenCalled();
    });

    it('should delay event listener attachment', () => {
      cleanup = setupClickOutside(containerElement, onClickOutside);

      // Click before timer runs
      const outsideElement = document.createElement('div');
      document.body.appendChild(outsideElement);
      outsideElement.click();

      // Callback should not be called yet
      expect(onClickOutside).not.toHaveBeenCalled();

      // Run timer
      jest.runAllTimers();

      // Click again
      outsideElement.click();

      // Now it should be called
      expect(onClickOutside).toHaveBeenCalledTimes(1);

      document.body.removeChild(outsideElement);
    });

    it('should remove event listener on cleanup', () => {
      cleanup = setupClickOutside(containerElement, onClickOutside);

      // Fast-forward timer
      jest.runAllTimers();

      // Call cleanup
      cleanup();

      // Click outside
      const outsideElement = document.createElement('div');
      document.body.appendChild(outsideElement);
      outsideElement.click();

      // Callback should not be called
      expect(onClickOutside).not.toHaveBeenCalled();

      document.body.removeChild(outsideElement);
    });

    it('should handle cleanup called multiple times', () => {
      cleanup = setupClickOutside(containerElement, onClickOutside);

      // Fast-forward timer
      jest.runAllTimers();

      // Call cleanup multiple times
      cleanup();
      cleanup();
      cleanup();

      // Should not throw error
      expect(onClickOutside).not.toHaveBeenCalled();
    });

    it('should handle nested containers', () => {
      const parentContainer = document.createElement('div');
      const childContainer = document.createElement('div');
      parentContainer.appendChild(childContainer);
      document.body.appendChild(parentContainer);

      const parentCallback = jest.fn();
      const childCallback = jest.fn();

      const parentCleanup = setupClickOutside(parentContainer, parentCallback);
      const childCleanup = setupClickOutside(childContainer, childCallback);

      // Fast-forward timers
      jest.runAllTimers();

      // Click on child
      childContainer.click();

      // Parent should not be called (child contains target)
      // Child should not be called (child contains target)
      expect(parentCallback).not.toHaveBeenCalled();
      expect(childCallback).not.toHaveBeenCalled();

      // Click on parent (but outside child)
      parentContainer.click();

      // Child should be called (outside child container)
      // Parent should not be called (inside parent container)
      expect(childCallback).toHaveBeenCalledTimes(1);
      expect(parentCallback).not.toHaveBeenCalled();

      // Cleanup
      parentCleanup();
      childCleanup();
      document.body.removeChild(parentContainer);
    });

    it('should handle document click events', () => {
      cleanup = setupClickOutside(containerElement, onClickOutside);

      // Fast-forward timer
      jest.runAllTimers();

      // Trigger click event on document
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(clickEvent);

      expect(onClickOutside).toHaveBeenCalledTimes(1);
    });

    it('should work with detached containers', () => {
      const detachedContainer = document.createElement('div');
      const callback = jest.fn();

      const detachedCleanup = setupClickOutside(detachedContainer, callback);

      // Fast-forward timer
      jest.runAllTimers();

      // Click on document
      document.body.click();

      // Should be called (detached container doesn't contain document.body)
      expect(callback).toHaveBeenCalled();

      detachedCleanup();
    });
  });
});
