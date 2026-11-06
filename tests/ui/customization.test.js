import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomizationManager } from '../../src/ui/CustomizationManager.js';

describe('CustomizationManager', () => {
  beforeEach(() => {
    // Mock localStorage
    const storage = {};
    globalThis.localStorage = {
      getItem: vi.fn((key) => storage[key] || null),
      setItem: vi.fn((key, val) => { storage[key] = val; }),
      removeItem: vi.fn((key) => { delete storage[key]; }),
      clear: vi.fn(() => { Object.keys(storage).forEach(k => delete storage[k]); }),
    };

    // Reset CustomizationManager state
    CustomizationManager.selectedBackground = 'default';
    CustomizationManager.customBgDataUrl = null;
    CustomizationManager.selectedPlane = 'plane';
    CustomizationManager.planeOrientation = 'right';
    CustomizationManager.customPlaneDataUrl = null;
    CustomizationManager.game = null;
  });

  it('initializes with default background and plane sprite', () => {
    expect(CustomizationManager.selectedBackground).toBe('default');
    expect(CustomizationManager.selectedPlane).toBe('plane');
    expect(CustomizationManager.planeOrientation).toBe('right');
  });

  it('updates selected background and notifies active GameScene', () => {
    const mockApplyBg = vi.fn();
    CustomizationManager.game = {
      scene: {
        getScene: vi.fn().mockReturnValue({ applyBackground: mockApplyBg }),
      },
    };

    CustomizationManager.setBackground('bg-night-radar');
    expect(CustomizationManager.selectedBackground).toBe('bg-night-radar');
    expect(mockApplyBg).toHaveBeenCalledWith('bg-night-radar');
    expect(globalThis.localStorage.setItem).toHaveBeenCalled();
  });

  it('updates selected plane preset and notifies active GameScene', () => {
    const mockApplyPlane = vi.fn();
    CustomizationManager.game = {
      scene: {
        getScene: vi.fn().mockReturnValue({ applyPlaneTexture: mockApplyPlane }),
      },
    };

    CustomizationManager.setPlanePreset('plane-concorde');
    expect(CustomizationManager.selectedPlane).toBe('plane-concorde');
    expect(mockApplyPlane).toHaveBeenCalledWith('plane-concorde');
    expect(globalThis.localStorage.setItem).toHaveBeenCalled();
  });

  it('resets background to default and clears custom image data', () => {
    CustomizationManager.selectedBackground = 'bg-custom';
    CustomizationManager.customBgDataUrl = 'data:image/png;base64,...';

    const mockApplyBg = vi.fn();
    CustomizationManager.game = {
      scene: {
        getScene: vi.fn().mockReturnValue({
          textures: { exists: vi.fn().mockReturnValue(true), remove: vi.fn() },
          applyBackground: mockApplyBg,
        }),
      },
    };

    CustomizationManager.resetBackground();
    expect(CustomizationManager.selectedBackground).toBe('default');
    expect(CustomizationManager.customBgDataUrl).toBeNull();
    expect(mockApplyBg).toHaveBeenCalledWith('default');
  });

  it('resets plane to default airliner and resets orientation', () => {
    CustomizationManager.selectedPlane = 'plane-custom';
    CustomizationManager.customPlaneDataUrl = 'data:image/png;base64,...';
    CustomizationManager.planeOrientation = 'up';

    const mockApplyPlane = vi.fn();
    CustomizationManager.game = {
      scene: {
        getScene: vi.fn().mockReturnValue({
          textures: { exists: vi.fn().mockReturnValue(true), remove: vi.fn() },
          applyPlaneTexture: mockApplyPlane,
        }),
      },
    };

    CustomizationManager.resetPlane();
    expect(CustomizationManager.selectedPlane).toBe('plane');
    expect(CustomizationManager.customPlaneDataUrl).toBeNull();
    expect(CustomizationManager.planeOrientation).toBe('right');
    expect(mockApplyPlane).toHaveBeenCalledWith('plane');
  });

  it('persists and restores customizations from localStorage', () => {
    CustomizationManager.selectedBackground = 'bg-sunset';
    CustomizationManager.selectedPlane = 'plane-stealth';
    CustomizationManager.planeOrientation = 'left';
    CustomizationManager.saveToStorage();

    // Reset state
    CustomizationManager.selectedBackground = 'default';
    CustomizationManager.selectedPlane = 'plane';
    CustomizationManager.planeOrientation = 'right';

    // Load from storage
    CustomizationManager.loadFromStorage();
    expect(CustomizationManager.selectedBackground).toBe('bg-sunset');
    expect(CustomizationManager.selectedPlane).toBe('plane-stealth');
    expect(CustomizationManager.planeOrientation).toBe('left');
  });
});
