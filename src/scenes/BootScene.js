import Phaser from 'phaser';
import { AssetGenerator } from '../gfx/AssetGenerator.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    // Generate procedural pixel art
    AssetGenerator.generateTextures(this);

    // Proceed directly to the main gameplay scene
    this.scene.start('GameScene');
  }
}
