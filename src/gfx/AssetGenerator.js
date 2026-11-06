// Generates crisp procedural pixel art textures onto Phaser's TextureManager
export class AssetGenerator {
  static generateTextures(scene) {
    this.createPlaneTexture(scene);
    this.createConcordeTexture(scene);
    this.createPropellerTexture(scene);
    this.createStealthTexture(scene);
    this.createRunwayTexture(scene);
    this.createParticleTextures(scene);
    this.createCloudTexture(scene);
    this.createNightRadarBg(scene);
    this.createSatelliteBg(scene);
    this.createSunsetBg(scene);
  }

  static createPlaneTexture(scene) {
    if (scene.textures.exists('plane')) return;

    // 36x20 Pixel Art Commercial Airplane (Heading east / right)
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

  static createConcordeTexture(scene) {
    if (scene.textures.exists('plane-concorde')) return;

    // 38x18 Sleek Supersonic Delta Jet (Heading east / right)
    const canvas = document.createElement('canvas');
    canvas.width = 38;
    canvas.height = 18;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Slender needle white fuselage
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(6, 7, 24, 4);
    ctx.fillRect(30, 8, 5, 2);
    ctx.fillRect(35, 9, 3, 1); // Needle nose probe

    // Cockpit visor (Dark cyan)
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(29, 7, 3, 2);

    // Swept delta wings
    ctx.fillStyle = '#cbd5e1';
    // Top delta wing
    ctx.fillRect(14, 2, 12, 5);
    ctx.fillRect(10, 4, 5, 3);
    // Bottom delta wing
    ctx.fillRect(14, 11, 12, 5);
    ctx.fillRect(10, 11, 5, 3);

    // Engine nacelles under wings
    ctx.fillStyle = '#475569';
    ctx.fillRect(15, 1, 6, 2);
    ctx.fillRect(15, 15, 6, 2);

    // Tail fin with British red/navy stripe accent
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(2, 1, 4, 6);
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, 3, 3);

    scene.textures.addCanvas('plane-concorde', canvas);
  }

  static createPropellerTexture(scene) {
    if (scene.textures.exists('plane-propeller')) return;

    // 36x22 Vintage Twin-Engine Propeller Plane (Heading east / right)
    const canvas = document.createElement('canvas');
    canvas.width = 36;
    canvas.height = 22;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Fuselage (Vintage military olive/teal)
    ctx.fillStyle = '#0d9488';
    ctx.fillRect(8, 8, 22, 6);
    // Rounded nose
    ctx.fillStyle = '#14b8a6';
    ctx.fillRect(30, 9, 3, 4);

    // Cockpit canopy
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(25, 8, 4, 3);

    // Straight wings
    ctx.fillStyle = '#0f766e';
    ctx.fillRect(18, 1, 6, 7);
    ctx.fillRect(18, 14, 6, 7);

    // Twin radial engine nacelles with yellow propeller spinners
    ctx.fillStyle = '#334155';
    ctx.fillRect(22, 3, 6, 3);
    ctx.fillRect(22, 16, 6, 3);
    // Propeller blur disks (Bright yellow)
    ctx.fillStyle = '#facc15';
    ctx.fillRect(28, 1, 1, 7);
    ctx.fillRect(28, 14, 1, 7);

    // Tail rudder
    ctx.fillStyle = '#f97316'; // Orange high-visibility tail
    ctx.fillRect(2, 3, 5, 6);
    ctx.fillRect(0, 2, 3, 4);

    scene.textures.addCanvas('plane-propeller', canvas);
  }

  static createStealthTexture(scene) {
    if (scene.textures.exists('plane-stealth')) return;

    // 36x22 Tactical Stealth Jet (Heading east / right)
    const canvas = document.createElement('canvas');
    canvas.width = 36;
    canvas.height = 22;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Dark charcoal faceted airframe
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(35, 11); // Sharp nose
    ctx.lineTo(24, 6);
    ctx.lineTo(8, 1);   // Wingtip top
    ctx.lineTo(12, 8);
    ctx.lineTo(0, 7);   // Tail corner
    ctx.lineTo(4, 11);  // Rear exhaust notch
    ctx.lineTo(0, 15);
    ctx.lineTo(12, 14);
    ctx.lineTo(8, 21);  // Wingtip bottom
    ctx.lineTo(24, 16);
    ctx.closePath();
    ctx.fill();

    // Inner highlight facets
    ctx.fillStyle = '#334155';
    ctx.fillRect(14, 9, 14, 4);

    // Glowing cockpit visor (Amber gold / tactical HUD)
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(27, 10, 4, 2);

    // Twin rear exhaust glows (Cyan ion burn)
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(3, 9, 2, 1);
    ctx.fillRect(3, 12, 2, 1);

    scene.textures.addCanvas('plane-stealth', canvas);
  }

  static createNightRadarBg(scene) {
    if (scene.textures.exists('bg-night-radar')) return;

    // 800x450 Dark Tactical Phosphor Radar Background
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');

    // Deep radar CRT background
    ctx.fillStyle = '#030d17';
    ctx.fillRect(0, 0, 800, 450);

    // Subtle fine radar grid lines (50px spacing)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 800; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 450);
      ctx.stroke();
    }
    for (let y = 0; y <= 450; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }

    // Radar Center & Concentric Range Rings (centered at x: 400, y: 225)
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.22)';
    ctx.lineWidth = 1.5;
    for (const r of [75, 150, 225, 300, 375]) {
      ctx.beginPath();
      ctx.arc(400, 225, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Cardinal Axes crosshairs
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.35)';
    ctx.beginPath();
    ctx.moveTo(400, 0);
    ctx.lineTo(400, 450);
    ctx.moveTo(0, 225);
    ctx.lineTo(800, 225);
    ctx.stroke();

    // Degree Ticks along main circle
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.28)';
    for (let deg = 0; deg < 360; deg += 15) {
      const rad = (deg * Math.PI) / 180;
      const x1 = 400 + Math.cos(rad) * 220;
      const y1 = 225 + Math.sin(rad) * 220;
      const x2 = 400 + Math.cos(rad) * 230;
      const y2 = 225 + Math.sin(rad) * 230;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Radar telemetry labels
    ctx.fillStyle = 'rgba(52, 211, 153, 0.35)';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('PRIMARY SURVEILLANCE RADAR // RANGE 60NM', 15, 60);
    ctx.fillText('SSR MODE-S INTERROGATOR ACTIVE', 15, 75);
    ctx.fillText('SECTOR FREQ: 124.850 MHz', 590, 60);

    scene.textures.addCanvas('bg-night-radar', canvas);
  }

  static createSatelliteBg(scene) {
    if (scene.textures.exists('bg-satellite')) return;

    // 800x450 Aerial Satellite Map Texture
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');

    // Rich landscape base (Dark satellite forest / grass)
    ctx.fillStyle = '#143823';
    ctx.fillRect(0, 0, 800, 450);

    // Varied agricultural / terrain plots
    const plots = [
      { x: 20, y: 30, w: 180, h: 100, c: '#1e482d' },
      { x: 220, y: 15, w: 200, h: 90, c: '#173f27' },
      { x: 440, y: 30, w: 160, h: 110, c: '#1f4e30' },
      { x: 620, y: 10, w: 160, h: 120, c: '#183c25' },
      { x: 50, y: 150, w: 150, h: 120, c: '#235334' },
      { x: 580, y: 160, w: 200, h: 130, c: '#1e452a' },
      { x: 80, y: 290, w: 220, h: 70, c: '#163c24' },
      { x: 500, y: 310, w: 260, h: 60, c: '#204a2d' },
    ];
    for (const p of plots) {
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }

    // Meandering coastal river / inlet
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 28;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 110);
    ctx.bezierCurveTo(250, 140, 380, 220, 800, 190);
    ctx.stroke();

    // Secondary waterways
    ctx.strokeStyle = '#254a75';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(350, 175);
    ctx.bezierCurveTo(450, 120, 500, 70, 520, 0);
    ctx.stroke();

    // Airfield perimeter roads (Asphalt gray lines)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 370, 740, 45);
    ctx.beginPath();
    ctx.moveTo(200, 370);
    ctx.lineTo(200, 280);
    ctx.lineTo(600, 280);
    ctx.lineTo(600, 370);
    ctx.stroke();

    // Taxiway connectors
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 6;
    for (const tx of [160, 320, 480, 640]) {
      ctx.beginPath();
      ctx.moveTo(tx, 370);
      ctx.lineTo(tx, 415);
      ctx.stroke();
    }

    scene.textures.addCanvas('bg-satellite', canvas);
  }

  static createSunsetBg(scene) {
    if (scene.textures.exists('bg-sunset')) return;

    // 800x450 Dusk Sunset Horizon Background
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');

    // Smooth vertical sunset sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 450);
    grad.addColorStop(0.0, '#111827'); // Twilight black-indigo
    grad.addColorStop(0.25, '#311042'); // Deep purple
    grad.addColorStop(0.50, '#6b114d'); // Crimson-magenta
    grad.addColorStop(0.72, '#b43a22'); // Warm amber-red
    grad.addColorStop(0.88, '#d97706'); // Glowing sunset horizon
    grad.addColorStop(1.0, '#1c1917');  // Dark ground silhouette
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 450);

    // Subtle twinkling stars in upper atmosphere
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    const stars = [
      [60, 30], [140, 50], [210, 20], [330, 40], [420, 15],
      [510, 55], [600, 25], [710, 35], [770, 65], [100, 80],
      [270, 75], [470, 85], [660, 70], [740, 100],
    ];
    for (const [sx, sy] of stars) {
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Distant mountain ridge silhouette along horizon (y: 350-390)
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(0, 400);
    ctx.lineTo(0, 370);
    ctx.lineTo(90, 345);
    ctx.lineTo(190, 375);
    ctx.lineTo(310, 335);
    ctx.lineTo(440, 365);
    ctx.lineTo(560, 340);
    ctx.lineTo(670, 370);
    ctx.lineTo(760, 350);
    ctx.lineTo(800, 365);
    ctx.lineTo(800, 450);
    ctx.lineTo(0, 450);
    ctx.closePath();
    ctx.fill();

    scene.textures.addCanvas('bg-sunset', canvas);
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
