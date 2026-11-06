import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { CustomizationManager } from './ui/CustomizationManager.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  parent: 'game-container',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, GameScene, GameOverScene],
};

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.borderColor = isError ? '#ef4444' : '#38bdf8';
  toast.style.color = isError ? '#f87171' : '#38bdf8';
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function syncCustomizationUI() {
  const bgSelect = document.getElementById('bg-select');
  const bgCustomOpt = document.getElementById('bg-custom-opt');
  const planeSelect = document.getElementById('plane-select');
  const planeCustomOpt = document.getElementById('plane-custom-opt');
  const planeOrientSelect = document.getElementById('plane-orient-select');

  if (CustomizationManager.customBgDataUrl && bgCustomOpt) {
    bgCustomOpt.disabled = false;
  }
  if (bgSelect) {
    bgSelect.value = CustomizationManager.selectedBackground;
  }

  if (CustomizationManager.customPlaneDataUrl && planeCustomOpt) {
    planeCustomOpt.disabled = false;
  }
  if (planeSelect) {
    planeSelect.value = CustomizationManager.selectedPlane;
  }
  if (planeOrientSelect) {
    planeOrientSelect.value = CustomizationManager.planeOrientation;
  }
}

function setupToolbarEvents() {
  const bgSelect = document.getElementById('bg-select');
  const bgFileInput = document.getElementById('bg-file-input');
  const bgResetBtn = document.getElementById('bg-reset-btn');
  const bgCustomOpt = document.getElementById('bg-custom-opt');

  const planeSelect = document.getElementById('plane-select');
  const planeOrientSelect = document.getElementById('plane-orient-select');
  const planeFileInput = document.getElementById('plane-file-input');
  const planeResetBtn = document.getElementById('plane-reset-btn');
  const planeCustomOpt = document.getElementById('plane-custom-opt');

  syncCustomizationUI();

  // Background dropdown
  if (bgSelect) {
    bgSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      CustomizationManager.setBackground(val);
      showToast(`Background changed: ${e.target.options[e.target.selectedIndex].text}`);
    });
  }

  // Background upload
  if (bgFileInput) {
    bgFileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        await CustomizationManager.loadCustomBackgroundFile(file);
        if (bgCustomOpt) bgCustomOpt.disabled = false;
        if (bgSelect) bgSelect.value = 'bg-custom';
        showToast('Custom background loaded successfully!');
      } catch (err) {
        showToast('Error loading background image: ' + err.message, true);
      }
      bgFileInput.value = '';
    });
  }

  // Background reset
  if (bgResetBtn) {
    bgResetBtn.addEventListener('click', () => {
      CustomizationManager.resetBackground();
      if (bgCustomOpt) bgCustomOpt.disabled = true;
      if (bgSelect) bgSelect.value = 'default';
      showToast('Background reset to default!');
    });
  }

  // Plane dropdown
  if (planeSelect) {
    planeSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      CustomizationManager.setPlanePreset(val);
      showToast(`Plane sprite changed: ${e.target.options[e.target.selectedIndex].text}`);
    });
  }

  // Plane orientation dropdown
  if (planeOrientSelect) {
    planeOrientSelect.addEventListener('change', (e) => {
      CustomizationManager.updatePlaneOrientation(e.target.value);
      showToast(`Plane orientation updated: ${e.target.value}`);
    });
  }

  // Plane upload
  if (planeFileInput) {
    planeFileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const orientation = planeOrientSelect ? planeOrientSelect.value : 'right';
        await CustomizationManager.loadCustomPlaneFile(file, orientation);
        if (planeCustomOpt) planeCustomOpt.disabled = false;
        if (planeSelect) planeSelect.value = 'plane-custom';
        showToast('Custom plane sprite loaded successfully!');
      } catch (err) {
        showToast('Error loading plane image: ' + err.message, true);
      }
      planeFileInput.value = '';
    });
  }

  // Plane reset
  if (planeResetBtn) {
    planeResetBtn.addEventListener('click', () => {
      CustomizationManager.resetPlane();
      if (planeCustomOpt) planeCustomOpt.disabled = true;
      if (planeSelect) planeSelect.value = 'plane';
      showToast('Plane sprite reset to default airliner!');
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const game = new Phaser.Game(config);
  CustomizationManager.init(game);
  setupToolbarEvents();
});
