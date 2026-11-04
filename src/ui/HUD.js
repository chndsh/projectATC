export class HUD {
  constructor(scene) {
    this.scene = scene;

    // Top Header Background
    this.bg = scene.add.rectangle(400, 20, 800, 40, 0x090d16, 0.9);
    this.border = scene.add.rectangle(400, 39, 800, 2, 0x1e293b);

    const style = {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#e2e8f0',
    };

    this.scoreText = scene.add.text(25, 12, 'SCORE: 0', {
      ...style,
      fontStyle: 'bold',
      color: '#38bdf8',
    });

    this.planesText = scene.add.text(220, 12, 'ACTIVE: 0/10', style);
    this.timeText = scene.add.text(420, 12, 'TIME: 00:00', style);
    this.comboText = scene.add.text(620, 12, 'COMBO: x1', {
      ...style,
      fontStyle: 'bold',
      color: '#f59e0b',
    });
  }

  update(state) {
    this.scoreText.setText(`SCORE: ${state.score}`);

    // Active planes indicator - turn red when close to 10
    const activeStr = `ACTIVE: ${state.activePlanesCount}/10`;
    this.planesText.setText(activeStr);
    if (state.activePlanesCount >= 8) {
      this.planesText.setColor('#ef4444');
    } else {
      this.planesText.setColor('#e2e8f0');
    }

    // Elapsed time format mm:ss
    const mins = Math.floor(state.elapsedTime / 60).toString().padStart(2, '0');
    const secs = (state.elapsedTime % 60).toString().padStart(2, '0');
    this.timeText.setText(`TIME: ${mins}:${secs}`);

    // Combo
    this.comboText.setText(`COMBO: x${state.combo}`);
    if (state.combo > 1) {
      this.comboText.setColor('#22c55e');
    } else {
      this.comboText.setColor('#f59e0b');
    }
  }
}
