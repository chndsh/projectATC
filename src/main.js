import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { CustomizationManager } from './ui/CustomizationManager.js';
import { SoundEffects } from './audio/SoundEffects.js';

let gameInstance = null;
let currentView = 'landing'; // 'landing' | 'settings' | 'game'

const phaserConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  pixelArt: false,
  roundPixels: false,
  backgroundColor: '#090d16',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scene: [BootScene, GameScene, GameOverScene],
};

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.borderColor = isError ? '#c0392b' : '#e8c56a';
  toast.style.color = isError ? '#f87171' : '#e8c56a';
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function showView(viewName) {
  currentView = viewName;

  const landingScreen = document.getElementById('screen-landing');
  const settingsScreen = document.getElementById('screen-settings');
  const gameScreen = document.getElementById('screen-game');

  if (landingScreen) landingScreen.classList.toggle('hidden', viewName !== 'landing');
  if (settingsScreen) settingsScreen.classList.toggle('hidden', viewName !== 'settings');
  if (gameScreen) gameScreen.classList.toggle('hidden', viewName !== 'game');

  if (viewName === 'settings') {
    syncSettingsUI();
    updatePreviews();
  } else if (viewName === 'game') {
    // Screen is now display:flex — wait one frame for reflow so #game-container
    // has its real 800×450 CSS dimensions before Phaser reads them at Game() init.
    requestAnimationFrame(() => {
      launchOrResumeGame();
    });
  }
}

function launchOrResumeGame() {
  if (!gameInstance) {
    gameInstance = new Phaser.Game(phaserConfig);
    CustomizationManager.init(gameInstance);
  } else {
    const sceneManager = gameInstance.scene;
    if (sceneManager) {
      sceneManager.stop('GameOverScene');
      sceneManager.start('GameScene');
    }
  }

  // Refresh scale after transition
  requestAnimationFrame(() => {
    if (gameInstance && gameInstance.scale) {
      gameInstance.scale.refresh();
    }
  });
  setTimeout(() => {
    if (gameInstance && gameInstance.scale) {
      gameInstance.scale.refresh();
    }
  }, 100);
}

// Global return to main menu callback (accessible by GameOverScene)
window.returnToMainMenu = () => {
  if (gameInstance && gameInstance.scene) {
    const sceneManager = gameInstance.scene;
    sceneManager.stop('GameScene');
    sceneManager.stop('GameOverScene');
  }
  showView('landing');
};

/* =========================================================
   SETTINGS & PREVIEWS LOGIC
   ========================================================= */

function syncSettingsUI() {
  const bgSelect = document.getElementById('bg-select');
  const bgCustomOpt = document.getElementById('bg-custom-opt');
  const planeSelect = document.getElementById('plane-select');
  const planeCustomOpt = document.getElementById('plane-custom-opt');
  const planeOrientSelect = document.getElementById('plane-orient-select');
  const audioToggle = document.getElementById('audio-toggle');

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
  if (audioToggle) {
    audioToggle.checked = !CustomizationManager.soundMuted;
  }
}

function updatePreviews() {
  drawBgPreview();
  drawPlanePreview();
}

function drawBgPreview() {
  const canvas = document.getElementById('bg-preview-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const bg = CustomizationManager.selectedBackground;
  if (bg === 'bg-custom' && CustomizationManager.customBgDataUrl) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, w, h);
    img.src = CustomizationManager.customBgDataUrl;
  } else if (bg === 'bg-night-radar') {
    ctx.fillStyle = '#030d17';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 25, 0, Math.PI * 2);
    ctx.arc(w / 2, h / 2, 40, 0, Math.PI * 2);
    ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.stroke();
  } else if (bg === 'bg-satellite') {
    ctx.fillStyle = '#143823';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1e482d';
    ctx.fillRect(10, 10, 45, 30);
    ctx.fillRect(70, 20, 50, 25);
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.bezierCurveTo(50, 45, 90, 60, w, 50);
    ctx.stroke();
  } else if (bg === 'bg-sunset') {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#111827');
    grad.addColorStop(0.35, '#4c1d95');
    grad.addColorStop(0.75, '#b43a22');
    grad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else {
    // Default Sky
    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, h - 12, w, 12);
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, h - 13, w, 1);
  }
}

function drawPlanePreview() {
  const canvas = document.getElementById('plane-preview-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#1a0e05';
  ctx.fillRect(0, 0, w, h);

  // Crosshair
  ctx.strokeStyle = 'rgba(232, 197, 106, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
  ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
  ctx.stroke();

  const plane = CustomizationManager.selectedPlane;

  if (plane === 'plane-custom' && CustomizationManager.customPlaneDataUrl) {
    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      const orient = CustomizationManager.planeOrientation;
      if (orient === 'up') {
        ctx.rotate(Math.PI / 2);
      } else if (orient === 'left') {
        ctx.scale(-1, 1);
      }
      const scale = Math.min(32 / img.width, 22 / img.height, 1);
      ctx.drawImage(img, (-img.width * scale) / 2, (-img.height * scale) / 2, img.width * scale, img.height * scale);
      ctx.restore();
    };
    img.src = CustomizationManager.customPlaneDataUrl;
    return;
  }

  // Draw procedural aircraft icons
  ctx.save();
  ctx.translate(w / 2, h / 2);
  if (plane === 'plane-concorde') {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-12, -2, 24, 4); // needle fuselage
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(8, -2); ctx.lineTo(-6, -10); ctx.lineTo(-4, -2); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, 2); ctx.lineTo(-6, 10); ctx.lineTo(-4, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-12, -6, 3, 5);
  } else if (plane === 'plane-propeller') {
    ctx.fillStyle = '#0d9488';
    ctx.fillRect(-12, -3, 24, 6);
    ctx.fillStyle = '#0f766e';
    ctx.fillRect(-2, -10, 5, 20);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(4, -9, 2, 6);
    ctx.fillRect(4, 3, 2, 6);
  } else if (plane === 'plane-stealth') {
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(12, 0); ctx.lineTo(-8, -10); ctx.lineTo(-4, 0); ctx.lineTo(-8, 10); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(2, -1, 3, 2);
  } else {
    // Default Airliner
    ctx.fillStyle = '#f0f4f8';
    ctx.fillRect(-12, -3, 24, 6);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-2, -9, 5, 18);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(-12, -8, 4, 6);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(8, -2, 3, 2);
  }
  ctx.restore();
}

/* =========================================================
   EVENT LISTENERS SETUP
   ========================================================= */

function setupEventListeners() {
  // Navigation buttons
  const btnStartGame = document.getElementById('btn-start-game');
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const btnSettingsBack = document.getElementById('btn-settings-back');
  const btnSettingsCancel = document.getElementById('btn-settings-cancel');
  const btnSettingsPlay = document.getElementById('btn-settings-play');
  const btnGameSettings = document.getElementById('btn-game-settings');
  const btnGameMenu = document.getElementById('btn-game-menu');

  if (btnStartGame) btnStartGame.addEventListener('click', () => showView('game'));
  if (btnOpenSettings) btnOpenSettings.addEventListener('click', () => showView('settings'));
  if (btnSettingsBack) btnSettingsBack.addEventListener('click', () => showView('landing'));
  if (btnSettingsCancel) btnSettingsCancel.addEventListener('click', () => showView('landing'));
  if (btnSettingsPlay) btnSettingsPlay.addEventListener('click', () => showView('game'));
  if (btnGameSettings) btnGameSettings.addEventListener('click', () => showView('settings'));
  if (btnGameMenu) btnGameMenu.addEventListener('click', () => window.returnToMainMenu());

  // Background settings
  const bgSelect = document.getElementById('bg-select');
  const bgFileInput = document.getElementById('bg-file-input');
  const bgResetBtn = document.getElementById('bg-reset-btn');
  const bgCustomOpt = document.getElementById('bg-custom-opt');

  if (bgSelect) {
    bgSelect.addEventListener('change', (e) => {
      CustomizationManager.setBackground(e.target.value);
      updatePreviews();
      showToast(`Background: ${e.target.options[e.target.selectedIndex].text}`);
    });
  }

  if (bgFileInput) {
    bgFileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        await CustomizationManager.loadCustomBackgroundFile(file);
        if (bgCustomOpt) bgCustomOpt.disabled = false;
        if (bgSelect) bgSelect.value = 'bg-custom';
        updatePreviews();
        showToast('Custom background loaded!');
      } catch (err) {
        showToast('Error: ' + err.message, true);
      }
      bgFileInput.value = '';
    });
  }

  if (bgResetBtn) {
    bgResetBtn.addEventListener('click', () => {
      CustomizationManager.resetBackground();
      if (bgCustomOpt) bgCustomOpt.disabled = true;
      if (bgSelect) bgSelect.value = 'default';
      updatePreviews();
      showToast('Background reset to default!');
    });
  }

  // Plane settings
  const planeSelect = document.getElementById('plane-select');
  const planeOrientSelect = document.getElementById('plane-orient-select');
  const planeFileInput = document.getElementById('plane-file-input');
  const planeResetBtn = document.getElementById('plane-reset-btn');
  const planeCustomOpt = document.getElementById('plane-custom-opt');

  if (planeSelect) {
    planeSelect.addEventListener('change', (e) => {
      CustomizationManager.setPlanePreset(e.target.value);
      updatePreviews();
      showToast(`Aircraft: ${e.target.options[e.target.selectedIndex].text}`);
    });
  }

  if (planeOrientSelect) {
    planeOrientSelect.addEventListener('change', (e) => {
      CustomizationManager.updatePlaneOrientation(e.target.value);
      updatePreviews();
      showToast(`Orientation updated: ${e.target.value}`);
    });
  }

  if (planeFileInput) {
    planeFileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const orientation = planeOrientSelect ? planeOrientSelect.value : 'right';
        await CustomizationManager.loadCustomPlaneFile(file, orientation);
        if (planeCustomOpt) planeCustomOpt.disabled = false;
        if (planeSelect) planeSelect.value = 'plane-custom';
        updatePreviews();
        showToast('Custom aircraft sprite loaded!');
      } catch (err) {
        showToast('Error: ' + err.message, true);
      }
      planeFileInput.value = '';
    });
  }

  if (planeResetBtn) {
    planeResetBtn.addEventListener('click', () => {
      CustomizationManager.resetPlane();
      if (planeCustomOpt) planeCustomOpt.disabled = true;
      if (planeSelect) planeSelect.value = 'plane';
      updatePreviews();
      showToast('Aircraft reset to default airliner!');
    });
  }

  // Audio settings
  const audioToggle = document.getElementById('audio-toggle');
  if (audioToggle) {
    audioToggle.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      CustomizationManager.setSoundMuted(!enabled);
      showToast(enabled ? 'Sound effects enabled' : 'Sound effects muted');
    });
  }
}

function init() {
  setupEventListeners();
  syncSettingsUI();
  updatePreviews();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
