export class HUD {
  constructor(scene) {
    this.scene = scene;
    this._build(scene.scale.width, scene.scale.height);
  }

  _build(W, H) {
    // Warm dark parchment/wood HUD bar (always on top layer)
    this.bg = this.scene.add.rectangle(W / 2, 20, W, 40, 0x2a1c10, 0.95).setDepth(100);
    this.border = this.scene.add.rectangle(W / 2, 39, W, 2, 0x8b6914).setDepth(100);

    const sf = Math.max(0.7, Math.min(1.4, W / 800));
    const fontSize = `${Math.max(9, Math.round(10 * sf))}px`;
    const style = {
      fontFamily: "'Press Start 2P', monospace",
      fontSize,
      color: '#f5e6c8',
    };

    this.scoreText = this.scene.add.text(12, 12, 'SCORE: 0', {
      ...style,
      color: '#e8c56a',
    }).setDepth(101);

    this.planesText = this.scene.add.text(W * 0.32, 12, 'FLY: 0', style).setDepth(101);
    this.timeText = this.scene.add.text(W * 0.55, 12, 'TIME: 00:00', style).setDepth(101);
    this.comboText = this.scene.add.text(W * 0.80, 12, 'COMBO: x1', {
      ...style,
      color: '#b8945a',
    }).setDepth(101);
  }

  resize(W, H) {
    if (this.bg) this.bg.setPosition(W / 2, 20).setSize(W, 40);
    if (this.border) this.border.setPosition(W / 2, 39).setSize(W, 2);

    const sf = Math.max(0.7, Math.min(1.4, W / 800));
    const fontSize = `${Math.max(9, Math.round(10 * sf))}px`;

    if (this.scoreText) {
      this.scoreText.setFontSize(fontSize);
    }
    if (this.planesText) {
      this.planesText.setPosition(W * 0.32, 12).setFontSize(fontSize);
    }
    if (this.timeText) {
      this.timeText.setPosition(W * 0.55, 12).setFontSize(fontSize);
    }
    if (this.comboText) {
      this.comboText.setPosition(W * 0.80, 12).setFontSize(fontSize);
    }
  }

  update(state) {
    this.scoreText.setText(`SCORE: ${state.score}`);
    this.planesText.setText(`FLY: ${state.activePlanesCount}`);
    this.planesText.setColor('#f5e6c8');

    const mins = Math.floor(state.elapsedTime / 60).toString().padStart(2, '0');
    const secs = (state.elapsedTime % 60).toString().padStart(2, '0');
    this.timeText.setText(`${mins}:${secs}`);

    this.comboText.setText(`x${state.combo}`);
    if (state.combo > 1) {
      this.comboText.setColor('#7ec892');
    } else {
      this.comboText.setColor('#b8945a');
    }
  }
}
