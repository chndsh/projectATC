import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.reason = data.reason || 'Simulation Terminated';
    this.score = data.score || 0;
    this.elapsedTime = data.elapsedTime || 0;
    this.landedCount = data.landedCount || 0;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;
    const cy = H / 2;

    // Warm dark overlay
    this.add.rectangle(cx, cy, W, H, 0x1a0e05, 0.9);

    // Stardew Valley parchment/wood modal card
    const panelW = Math.min(W - 24, 480);
    const panelH = Math.min(H - 24, 380);

    // Main card box
    this.add.rectangle(cx, cy, panelW, panelH, 0x3d2b1f);
    // Outer and inner pixel gold borders
    this.add.rectangle(cx, cy, panelW, panelH).setStrokeStyle(3, 0x8b6914);
    this.add.rectangle(cx, cy, panelW - 6, panelH - 6).setStrokeStyle(1, 0x5c4010);

    const sf = Math.max(0.7, Math.min(1.2, panelW / 480));

    // GAME OVER red banner
    const bannerY = cy - panelH / 2 + Math.round(36 * sf);
    const bannerH = Math.round(44 * sf);
    this.add.rectangle(cx, bannerY, panelW - 12, bannerH, 0xc0392b);
    this.add.rectangle(cx, bannerY, panelW - 12, bannerH).setStrokeStyle(2, 0x7f1d1d);

    const titleSize = `${Math.max(12, Math.round(18 * sf))}px`;
    this.add.text(cx, bannerY, 'GAME OVER', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: titleSize,
      color: '#f5e6c8',
      stroke: '#3b0a07',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Reason message
    const reasonY = bannerY + Math.round(40 * sf);
    const reasonSize = `${Math.max(9, Math.round(10 * sf))}px`;
    this.add.text(cx, reasonY, this.reason, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: reasonSize,
      color: '#e8c56a',
      align: 'center',
      wordWrap: { width: panelW - 32 },
      lineSpacing: 4,
    }).setOrigin(0.5);

    // Decorative divider line
    const divY = reasonY + Math.round(28 * sf);
    this.add.rectangle(cx, divY, panelW - 40, 2, 0x5c4010);

    // Stats
    const mins = Math.floor(this.elapsedTime / 60).toString().padStart(2, '0');
    const secs = (this.elapsedTime % 60).toString().padStart(2, '0');

    const statsFontSize = `${Math.max(8, Math.round(10 * sf))}px`;
    const stats = [
      { label: 'SCORE:',   value: `${this.score}` },
      { label: 'LANDED:',  value: `${this.landedCount}` },
      { label: 'TIME:',    value: `${mins}:${secs}` },
    ];

    const statsStartY = divY + Math.round(22 * sf);
    const lineGap = Math.round(24 * sf);
    stats.forEach(({ label, value }, i) => {
      const y = statsStartY + i * lineGap;
      this.add.text(cx - 15, y, label, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: statsFontSize,
        color: '#b8945a',
      }).setOrigin(1, 0.5);

      this.add.text(cx + 15, y, value, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: statsFontSize,
        color: '#e8c56a',
      }).setOrigin(0, 0.5);
    });

    // Action Buttons: TRY AGAIN and MAIN MENU
    const btnY = cy + panelH / 2 - Math.round(38 * sf);
    const btnW = Math.min(150, (panelW - 48) / 2);
    const btnH = Math.round(40 * sf);
    const btnFontSize = `${Math.max(7, Math.round(9 * sf))}px`;

    // Try Again (Forest Green)
    const restartBtn = this.add.rectangle(cx - btnW / 2 - 8, btnY, btnW, btnH, 0x4a7c59).setInteractive({ cursor: 'pointer' });
    this.add.rectangle(cx - btnW / 2 - 8, btnY, btnW, btnH).setStrokeStyle(2, 0x7ec892);
    this.add.text(cx - btnW / 2 - 8, btnY, 'TRY AGAIN', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: btnFontSize,
      color: '#f5e6c8',
    }).setOrigin(0.5);

    restartBtn.on('pointerover', () => restartBtn.setFillStyle(0x5a9c6a));
    restartBtn.on('pointerout', () => restartBtn.setFillStyle(0x4a7c59));
    restartBtn.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // Main Menu (Wood Brown)
    const menuBtn = this.add.rectangle(cx + btnW / 2 + 8, btnY, btnW, btnH, 0x5c3d1e).setInteractive({ cursor: 'pointer' });
    this.add.rectangle(cx + btnW / 2 + 8, btnY, btnW, btnH).setStrokeStyle(2, 0x8b6914);
    this.add.text(cx + btnW / 2 + 8, btnY, 'MAIN MENU', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: btnFontSize,
      color: '#f5e6c8',
    }).setOrigin(0.5);

    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x7a5230));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x5c3d1e));
    menuBtn.on('pointerdown', () => {
      if (typeof window !== 'undefined' && window.returnToMainMenu) {
        window.returnToMainMenu();
      }
    });

    // Keyboard shortcuts
    this.input.keyboard.on('keydown-SPACE', () => this.scene.start('GameScene'));
    this.input.keyboard.on('keydown-ENTER', () => this.scene.start('GameScene'));
  }
}
