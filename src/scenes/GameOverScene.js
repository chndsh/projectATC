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
    // Dimmed overlay background
    this.add.rectangle(400, 225, 800, 450, 0x030712, 0.85);

    // Red warning banner
    this.add.rectangle(400, 110, 800, 50, 0x7f1d1d);
    this.add.text(400, 110, '=== GAME OVER ===', {
      fontFamily: 'Courier New, monospace',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#fecaca',
    }).setOrigin(0.5);

    // Cause of failure
    this.add.text(400, 170, this.reason, {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#f87171',
      align: 'center',
      wordWrap: { width: 700 },
    }).setOrigin(0.5);

    // Stats Box
    const mins = Math.floor(this.elapsedTime / 60).toString().padStart(2, '0');
    const secs = (this.elapsedTime % 60).toString().padStart(2, '0');

    const statsText = [
      `FINAL SCORE:    ${this.score}`,
      `PLANES LANDED:  ${this.landedCount}`,
      `SURVIVAL TIME:  ${mins}:${secs}`,
    ].join('\n');

    this.add.text(400, 245, statsText, {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: '#cbd5e1',
      lineSpacing: 10,
    }).setOrigin(0.5);

    // Restart Button
    const restartBtn = this.add.rectangle(400, 340, 200, 44, 0x0284c7).setInteractive({ cursor: 'pointer' });
    const restartLabel = this.add.text(400, 340, 'TRY AGAIN', {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    restartBtn.on('pointerover', () => restartBtn.setFillStyle(0x0ea5e9));
    restartBtn.on('pointerout', () => restartBtn.setFillStyle(0x0284c7));

    restartBtn.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // Also support Space or Enter to restart
    this.input.keyboard.on('keydown-SPACE', () => this.scene.start('GameScene'));
    this.input.keyboard.on('keydown-ENTER', () => this.scene.start('GameScene'));
  }
}
