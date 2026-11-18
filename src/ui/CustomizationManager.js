import { SoundEffects } from '../audio/SoundEffects.js';

/**
 * CustomizationManager manages custom background images, plane sprites,
 * presets, file uploads, audio settings, and localStorage persistence.
 */
export const CustomizationManager = {
  // Current settings
  selectedBackground: 'default', // 'default' | 'bg-night-radar' | 'bg-satellite' | 'bg-sunset' | 'bg-custom'
  customBgDataUrl: null,

  selectedPlane: 'plane', // 'plane' | 'plane-concorde' | 'plane-propeller' | 'plane-stealth' | 'plane-custom'
  planeOrientation: 'right', // 'right' | 'up' | 'left'
  customPlaneDataUrl: null,

  soundMuted: false,

  // Reference to Phaser game instance and active GameScene
  game: null,

  init(game) {
    this.game = game;
    this.loadFromStorage();
  },

  getActiveGameScene() {
    if (!this.game || !this.game.scene) return null;
    return this.game.scene.getScene('GameScene');
  },

  loadFromStorage() {
    try {
      if (typeof localStorage === 'undefined') return;
      const data = localStorage.getItem('atc_customization_settings');
      if (data) {
        const parsed = JSON.parse(data);

        // Background: only allow 'bg-custom' if valid data URL is present
        if (parsed.customBgDataUrl) {
          this.customBgDataUrl = parsed.customBgDataUrl;
          this.selectedBackground = parsed.selectedBackground || 'default';
        } else {
          this.customBgDataUrl = null;
          this.selectedBackground = (parsed.selectedBackground === 'bg-custom') ? 'default' : (parsed.selectedBackground || 'default');
        }

        // Plane: only allow 'plane-custom' if valid data URL is present
        if (parsed.customPlaneDataUrl) {
          this.customPlaneDataUrl = parsed.customPlaneDataUrl;
          this.selectedPlane = parsed.selectedPlane || 'plane';
        } else {
          this.customPlaneDataUrl = null;
          this.selectedPlane = (parsed.selectedPlane === 'plane-custom') ? 'plane' : (parsed.selectedPlane || 'plane');
        }

        if (parsed.planeOrientation) this.planeOrientation = parsed.planeOrientation;
        if (parsed.soundMuted !== undefined) {
          this.soundMuted = parsed.soundMuted;
          SoundEffects.isMuted = this.soundMuted;
        }
      }
    } catch (e) {
      console.warn('CustomizationManager: Could not load saved settings from localStorage', e);
    }
  },

  saveToStorage() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem('atc_customization_settings', JSON.stringify({
        selectedBackground: this.selectedBackground,
        customBgDataUrl: this.customBgDataUrl,
        selectedPlane: this.selectedPlane,
        planeOrientation: this.planeOrientation,
        customPlaneDataUrl: this.customPlaneDataUrl,
        soundMuted: this.soundMuted,
      }));
    } catch (e) {
      console.warn('CustomizationManager: Could not save settings to localStorage (quota exceeded?)', e);
    }
  },

  setSoundMuted(muted) {
    this.soundMuted = muted;
    SoundEffects.isMuted = muted;
    this.saveToStorage();
  },

  // Called during Scene Boot or GameScene create to ensure textures are ready
  restoreCustomTextures(scene) {
    if (this.customBgDataUrl && !scene.textures.exists('bg-custom')) {
      const img = new Image();
      img.onload = () => {
        if (scene.textures.exists('bg-custom')) scene.textures.remove('bg-custom');
        scene.textures.addImage('bg-custom', img);
        if (this.selectedBackground === 'bg-custom') {
          const gameScene = this.getActiveGameScene();
          if (gameScene && gameScene.applyBackground) {
            gameScene.applyBackground('bg-custom');
          }
        }
      };
      img.src = this.customBgDataUrl;
    }

    if (this.customPlaneDataUrl && !scene.textures.exists('plane-custom')) {
      const img = new Image();
      img.onload = () => {
        this.registerPlaneTexture(scene, img, this.planeOrientation);
        if (this.selectedPlane === 'plane-custom') {
          const gameScene = this.getActiveGameScene();
          if (gameScene && gameScene.applyPlaneTexture) {
            gameScene.applyPlaneTexture('plane-custom');
          }
        }
      };
      img.src = this.customPlaneDataUrl;
    }
  },

  // --- Background handlers ---

  setBackground(bgKey) {
    if (bgKey === 'bg-custom' && !this.customBgDataUrl) {
      bgKey = 'default';
    }
    this.selectedBackground = bgKey;
    this.saveToStorage();

    const scene = this.getActiveGameScene();
    if (scene && scene.applyBackground) {
      scene.applyBackground(bgKey);
    }
  },

  loadCustomBackgroundFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('No file selected'));

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const img = new Image();
        img.onload = () => {
          this.customBgDataUrl = dataUrl;
          this.selectedBackground = 'bg-custom';

          const scene = this.getActiveGameScene();
          if (scene) {
            if (scene.textures.exists('bg-custom')) {
              scene.textures.remove('bg-custom');
            }
            scene.textures.addImage('bg-custom', img);
            if (scene.applyBackground) {
              scene.applyBackground('bg-custom');
            }
          }

          this.saveToStorage();
          resolve('Custom background image applied successfully!');
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },

  resetBackground() {
    this.selectedBackground = 'default';
    this.customBgDataUrl = null;
    this.saveToStorage();

    const scene = this.getActiveGameScene();
    if (scene) {
      if (scene.textures.exists('bg-custom')) {
        scene.textures.remove('bg-custom');
      }
      if (scene.applyBackground) {
        scene.applyBackground('default');
      }
    }
  },

  // --- Plane handlers ---

  setPlanePreset(planeKey) {
    if (planeKey === 'plane-custom' && !this.customPlaneDataUrl) {
      planeKey = 'plane';
    }
    this.selectedPlane = planeKey;
    this.saveToStorage();

    const scene = this.getActiveGameScene();
    if (scene && scene.applyPlaneTexture) {
      scene.applyPlaneTexture(planeKey);
    }
  },

  registerPlaneTexture(scene, img, orientation) {
    // Renders the image onto a canvas oriented East (heading = 0)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (orientation === 'up') {
      // Rotate 90 deg clockwise so top points right (East)
      canvas.width = img.height;
      canvas.height = img.width;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
    } else if (orientation === 'left') {
      // Mirror horizontally so left points right (East)
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
    } else {
      // Natural right-facing orientation
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    }

    if (scene.textures.exists('plane-custom')) {
      scene.textures.remove('plane-custom');
    }
    scene.textures.addCanvas('plane-custom', canvas);
  },

  loadCustomPlaneFile(file, orientation = 'right') {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('No file selected'));

      this.planeOrientation = orientation;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const img = new Image();
        img.onload = () => {
          this.customPlaneDataUrl = dataUrl;
          this.selectedPlane = 'plane-custom';

          const scene = this.getActiveGameScene();
          if (scene) {
            this.registerPlaneTexture(scene, img, orientation);
            if (scene.applyPlaneTexture) {
              scene.applyPlaneTexture('plane-custom');
            }
          }

          this.saveToStorage();
          resolve('Custom plane sprite applied successfully!');
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },

  updatePlaneOrientation(orientation) {
    this.planeOrientation = orientation;
    if (this.customPlaneDataUrl && this.selectedPlane === 'plane-custom') {
      const img = new Image();
      img.onload = () => {
        const scene = this.getActiveGameScene();
        if (scene) {
          this.registerPlaneTexture(scene, img, orientation);
          if (scene.applyPlaneTexture) {
            scene.applyPlaneTexture('plane-custom');
          }
        }
        this.saveToStorage();
      };
      img.src = this.customPlaneDataUrl;
    }
  },

  resetPlane() {
    this.selectedPlane = 'plane';
    this.customPlaneDataUrl = null;
    this.planeOrientation = 'right';
    this.saveToStorage();

    const scene = this.getActiveGameScene();
    if (scene) {
      if (scene.textures.exists('plane-custom')) {
        scene.textures.remove('plane-custom');
      }
      if (scene.applyPlaneTexture) {
        scene.applyPlaneTexture('plane');
      }
    }
  },
};

// Automatically initialize storage state on module load
CustomizationManager.loadFromStorage();
