// Generates crisp procedural pixel art textures onto Phaser's TextureManager
export class AssetGenerator {
  static generateTextures(scene) {
    this.createPlaneTexture(scene);
    this.createRunwayTexture(scene);
    this.createParticleTextures(scene);
    this.createCloudTexture(scene);
  }

  static createPlaneTexture(scene) {
    if (scene.textures.exists('plane')) return;

    // 32x20 Pixel Art Commercial Airplane (Heading east / right)
    const canvas = document.createElement('canvas');
    canvas.width = 36;
    canvas.height = 20;
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = false;

    // Body (White fuselage)
    ctx.fillStyle = '#f0f4f8';
    ctx.fillRect(8, 7, 22, 6);
    // Nose curve
    ctx.fillRect(30, 8, 4, 4);
    ctx.fillRect(34, 9, 2, 2);

    // Cockpit windows (Sky blue / cyan)
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(29, 8, 3, 2);

    // Passenger windows
    ctx.fillStyle = '#0284c7';
    for (let x = 12; x <= 26; x += 3) {
      ctx.fillRect(x, 9, 2, 2);
    }

    // Wings
    ctx.fillStyle = '#94a3b8';
    // Top wing
    ctx.fillRect(16, 3, 8, 4);
    ctx.fillRect(14, 5, 4, 2);
    // Bottom wing
    ctx.fillRect(16, 13, 8, 4);
    ctx.fillRect(14, 13, 4, 2);

    // Tail fin
    ctx.fillStyle = '#3b82f6'; // Bright blue tail
    ctx.fillRect(4, 2, 4, 6);
    ctx.fillRect(2, 1, 3, 4);
    ctx.fillRect(0, 0, 3, 2);

    // Dark outline / shadow accents
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(8, 13, 24, 1);

    scene.textures.addCanvas('plane', canvas);
  }

  static createRunwayTexture(scene) {
    if (scene.textures.exists('runway')) return;

    // 800px full-width runway
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 45;
    const ctx = canvas.getContext('2d');

    // Asphalt dark gray
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 800, 45);

    // Top grass border
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, 800, 3);
    // Bottom grass border
    ctx.fillRect(0, 42, 800, 3);

    // Far Left Entry Threshold (Yellow chevron / piano keys)
    ctx.fillStyle = '#eab308';
    ctx.fillRect(6, 4, 8, 37);
    ctx.fillRect(20, 4, 6, 37);

    // White piano key runway numbers / markers at left gate
    ctx.fillStyle = '#f8fafc';
    for (let y = 6; y <= 36; y += 6) {
      ctx.fillRect(32, y, 20, 3);
    }

    // Left threshold guide text / arrow in threshold
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(60, 21, 24, 3);
    ctx.fillRect(78, 17, 3, 11);

    // Centerline dashes across full 800px width
    ctx.fillStyle = '#f8fafc';
    for (let x = 90; x < 790; x += 30) {
      ctx.fillRect(x, 21, 16, 3);
    }

    scene.textures.addCanvas('runway', canvas);
  }

  static createCloudTexture(scene) {
    if (scene.textures.exists('cloud')) return;

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(12, 12, 40, 14);
    ctx.fillRect(18, 6, 28, 20);
    ctx.fillRect(6, 16, 52, 8);

    scene.textures.addCanvas('cloud', canvas);
  }

  static createParticleTextures(scene) {
    if (!scene.textures.exists('smoke-particle')) {
      const canvas = document.createElement('canvas');
      canvas.width = 6;
      canvas.height = 6;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(1, 1, 4, 4);
      scene.textures.addCanvas('smoke-particle', canvas);
    }

    if (!scene.textures.exists('spark-particle')) {
      const canvas = document.createElement('canvas');
      canvas.width = 4;
      canvas.height = 4;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f97316';
      ctx.fillRect(0, 0, 4, 4);
      scene.textures.addCanvas('spark-particle', canvas);
    }
  }
}
