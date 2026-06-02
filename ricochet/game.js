(() => {
  'use strict';

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const titleEl = document.getElementById('title');
  const subEl = document.getElementById('sub');
  const hintEl = document.getElementById('hint');
  const muteBtn = document.getElementById('mute');

  const TAU = Math.PI * 2;
  const STATE = { MENU: 0, PLAY: 1, DEAD: 2 };
  let state = STATE.MENU;

  // ---- layout ----
  let W = 0, H = 0, cx = 0, cy = 0, DPR = 1, unit = 1;
  let coreR = 26, shieldR = 92, shieldArc = 0.62, shieldThick = 12;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx = W / 2; cy = H / 2;
    unit = Math.min(W, H);
    coreR = unit * 0.045;
    shieldR = unit * 0.16;
    shieldThick = unit * 0.022;
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- entities ----
  const shield = { angle: -Math.PI / 2, target: -Math.PI / 2, flash: 0 };
  let shards = [];        // incoming + deflected
  let particles = [];
  let popups = [];
  let rings = [];         // expanding shock rings (visual)
  let stars = [];

  let core = { hp: 3, maxHp: 3, hitFlash: 0, pulse: 0 };
  let score = 0, combo = 0, bestChain = 0;
  let best = +(localStorage.getItem('ricochet_best') || 0) || 0;
  let timeAlive = 0, spawnTimer = 0, shake = 0, slowmo = 0;
  let lastT = performance.now();
  let shieldEnergy = 0;   // builds up; spends on a clearing burst

  function makeStars() {
    stars = [];
    const n = Math.floor((W * H) / 11000);
    for (let i = 0; i < n; i++) {
      stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + 0.2, a: Math.random() * 0.5 + 0.1, tw: Math.random() * TAU });
    }
  }
  makeStars();
  window.addEventListener('resize', makeStars);

  // ---- audio ----
  let muted = localStorage.getItem('ricochet_muted') === '1';
  syncMute();
  muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    muted = !muted;
    localStorage.setItem('ricochet_muted', muted ? '1' : '0');
    syncMute();
  });
  function syncMute() { muteBtn.textContent = muted ? '♪ OFF' : '♪ ON'; muteBtn.style.opacity = muted ? 0.5 : 1; }

  const audio = (() => {
    let actx = null;
    const ensure = () => {
      if (!actx) { const C = window.AudioContext || window.webkitAudioContext; if (C) actx = new C(); }
      if (actx && actx.state === 'suspended') actx.resume();
      return actx;
    };
    function tone(freq, dur, type, vol, slide) {
      if (muted) return;
      const a = ensure(); if (!a) return;
      const o = a.createOscillator(), g = a.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, a.currentTime);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), a.currentTime + dur);
      g.gain.setValueAtTime(vol, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
      o.connect(g); g.connect(a.destination);
      o.start(); o.stop(a.currentTime + dur + 0.02);
    }
    return {
      deflect: () => tone(440, 0.08, 'square', 0.05, 720),
      chain:   (n) => tone(420 + n * 80, 0.1, 'triangle', 0.06, 900 + n * 120),
      hurt:    () => tone(150, 0.4, 'sawtooth', 0.14, 50),
      burst:   () => { tone(220, 0.25, 'sine', 0.08, 880); tone(330, 0.3, 'triangle', 0.06, 1100); },
      over:    () => tone(200, 0.7, 'sawtooth', 0.12, 40),
    };
  })();

  // ---- input ----
  function aimTo(clientX, clientY) {
    shield.target = Math.atan2(clientY - cy, clientX - cx);
  }
  canvas.addEventListener('pointermove', (e) => aimTo(e.clientX, e.clientY));
  canvas.addEventListener('pointerdown', (e) => { aimTo(e.clientX, e.clientY); primaryAction(); });
  overlay.addEventListener('pointerdown', (e) => { if (e.target === muteBtn) return; primaryAction(); });

  const keys = { left: false, right: false };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); primaryAction(); }
    if (e.code === 'ShiftLeft' || e.code === 'KeyJ') tryBurst();
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
  });
  // double-tap / right-click to fire the burst
  canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); tryBurst(); });
  let lastTap = 0;
  canvas.addEventListener('pointerup', () => {
    const now = performance.now();
    if (now - lastTap < 280) tryBurst();
    lastTap = now;
  });

  function primaryAction() {
    if (state === STATE.MENU || state === STATE.DEAD) start();
  }

  // ---- game flow ----
  function start() {
    shards = []; particles = []; popups = []; rings = [];
    core = { hp: 3, maxHp: 3, hitFlash: 0, pulse: 0 };
    score = 0; combo = 0; bestChain = 0; timeAlive = 0;
    spawnTimer = 0.8; shake = 0; slowmo = 0; shieldEnergy = 0;
    shield.angle = shield.target;
    state = STATE.PLAY;
    overlay.classList.remove('visible'); overlay.classList.add('hidden');
    lastT = performance.now();
  }

  function gameOver() {
    state = STATE.DEAD;
    shake = 26; slowmo = 0.0;
    audio.over();
    burstParticles(cx, cy, 80, '#ff5d8f', unit * 0.7, 1.1);
    if (score > best) { best = score; localStorage.setItem('ricochet_best', String(best)); }
    setTimeout(() => {
      titleEl.textContent = 'CORE LOST';
      subEl.innerHTML = `score <b>${score}</b> &nbsp;·&nbsp; best <b>${best}</b><br>longest chain <b>x${bestChain}</b>`;
      hintEl.textContent = 'click · tap · space to retry';
      overlay.classList.remove('hidden'); overlay.classList.add('visible');
    }, 700);
  }

  // ---- spawning ----
  function spawnShard(special) {
    const ang = Math.random() * TAU;
    const dist = unit * 0.75;
    const x = cx + Math.cos(ang) * dist;
    const y = cy + Math.sin(ang) * dist;
    const speed = (unit * 0.11) + Math.min(unit * 0.16, timeAlive * unit * 0.0024);
    const dx = cx - x, dy = cy - y, L = Math.hypot(dx, dy);
    shards.push({
      x, y,
      vx: dx / L * speed, vy: dy / L * speed,
      r: special ? unit * 0.028 : unit * 0.018,
      prevDist: dist,
      state: 'incoming',     // incoming | deflected | dead
      special: !!special,
      rot: Math.random() * TAU,
      vrot: (Math.random() - 0.5) * 5,
      chain: 0,
      hits: 0,
    });
  }

  // ---- particles / fx ----
  function burstParticles(x, y, n, color, speed, life) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = speed * (0.3 + Math.random() * 0.9);
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, color, size: 1 + Math.random() * 3 });
    }
  }
  function popup(text, x, y, color, big) {
    popups.push({ text, x, y, vy: -unit * 0.12, life: big ? 1.2 : 0.85, max: big ? 1.2 : 0.85, color, big: !!big });
  }
  function shockRing(x, y, color, maxR) {
    rings.push({ x, y, r: 6, maxR, life: 0.6, max: 0.6, color });
  }

  function tryBurst() {
    if (state !== STATE.PLAY) return;
    if (shieldEnergy < 1) return;
    shieldEnergy = 0;
    audio.burst();
    shake = Math.max(shake, 14);
    shockRing(cx, cy, '#5de4ff', unit * 0.9);
    burstParticles(cx, cy, 50, '#5de4ff', unit * 0.6, 0.8);
    // knock all incoming shards outward; chains can follow
    for (const s of shards) {
      if (s.state === 'incoming') {
        const a = Math.atan2(s.y - cy, s.x - cx);
        const sp = unit * 0.4;
        s.vx = Math.cos(a) * sp; s.vy = Math.sin(a) * sp;
        s.state = 'deflected'; s.chain = 1;
        score += 5; addCombo();
      }
    }
  }

  function addCombo() { combo++; }

  // ---- update ----
  function update(dt) {
    timeAlive += dt;
    core.pulse += dt;
    for (const st of stars) st.tw += dt * 1.5;

    // shield follow (smooth) + keyboard rotate
    if (keys.left) shield.target -= dt * 4.5;
    if (keys.right) shield.target += dt * 4.5;
    let d = ((shield.target - shield.angle + Math.PI) % TAU) - Math.PI;
    shield.angle += d * Math.min(1, dt * 18);
    shield.flash *= 0.85;
    core.hitFlash *= 0.88;

    if (state === STATE.PLAY) {
      // spawn cadence
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        const interval = Math.max(0.34, 1.2 - timeAlive * 0.02);
        spawnTimer = interval * (0.8 + Math.random() * 0.4);
        const special = timeAlive > 12 && Math.random() < 0.15;
        spawnShard(special);
        if (timeAlive > 20 && Math.random() < 0.35) spawnShard(false);
      }

      stepShards(dt);
    }

    // fx always animate
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; p.life -= dt; }
    particles = particles.filter(p => p.life > 0);
    for (const u of popups) { u.y += u.vy * dt; u.vy *= 0.9; u.life -= dt; }
    popups = popups.filter(u => u.life > 0);
    for (const r of rings) { r.life -= dt; r.r += (r.maxR - r.r) * Math.min(1, dt * 6); }
    rings = rings.filter(r => r.life > 0);

    shake *= 0.86;
    if (slowmo > 0) slowmo = Math.max(0, slowmo - dt);
  }

  function angWithinShield(ang) {
    let diff = Math.abs(((ang - shield.angle + Math.PI) % TAU) - Math.PI);
    return diff <= shieldArc / 2;
  }

  function stepShards(dt) {
    for (const s of shards) {
      if (s.state === 'dead') continue;
      s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vrot * dt;
      const dx = s.x - cx, dy = s.y - cy;
      const dist = Math.hypot(dx, dy);

      if (s.state === 'incoming') {
        // crossing the shield band inward?
        if (s.prevDist > shieldR && dist <= shieldR) {
          const ang = Math.atan2(dy, dx);
          if (angWithinShield(ang)) {
            deflect(s, ang);
          }
        }
        // reached core?
        if (dist <= coreR + s.r * 0.5) {
          s.state = 'dead';
          damageCore();
        }
      } else if (s.state === 'deflected') {
        // chain collisions vs incoming shards
        for (const o of shards) {
          if (o === s || o.state !== 'incoming') continue;
          const ddx = o.x - s.x, ddy = o.y - s.y;
          if (ddx * ddx + ddy * ddy <= (s.r + o.r) * (s.r + o.r)) {
            chainHit(s, o);
          }
        }
        if (dist > unit * 0.85) s.state = 'dead';
      }
      s.prevDist = dist;
    }
    shards = shards.filter(s => s.state !== 'dead');
  }

  function deflect(s, ang) {
    s.state = 'deflected';
    s.chain = 1;
    const sp = Math.hypot(s.vx, s.vy) * 1.65 + unit * 0.05;
    s.vx = Math.cos(ang) * sp; s.vy = Math.sin(ang) * sp;
    s.vrot = (Math.random() - 0.5) * 12;
    shield.flash = 1;
    shake = Math.max(shake, 5);
    addCombo();
    const gain = 10 * Math.max(1, combo);
    score += gain;
    if (s.special) { shieldEnergy = Math.min(1, shieldEnergy + 0.5); shockRing(s.x, s.y, '#ffd166', unit * 0.22); }
    else shieldEnergy = Math.min(1, shieldEnergy + 0.08);
    burstParticles(s.x, s.y, 12, '#ffd166', unit * 0.35, 0.5);
    audio.deflect();
  }

  function chainHit(proj, target) {
    target.state = 'dead';
    proj.chain++;
    proj.hits++;
    const chainLen = proj.chain;
    bestChain = Math.max(bestChain, chainLen);
    const gain = 15 * chainLen;
    score += gain;
    addCombo();
    burstParticles(target.x, target.y, 14 + chainLen * 2, '#5de4ff', unit * 0.4, 0.6);
    shockRing(target.x, target.y, '#5de4ff', unit * 0.1 + chainLen * unit * 0.012);
    popup(chainLen >= 2 ? `CHAIN x${chainLen}  +${gain}` : `+${gain}`, target.x, target.y, '#5de4ff', chainLen >= 3);
    audio.chain(chainLen);
    shake = Math.max(shake, 4 + chainLen);
    if (chainLen >= 4) slowmo = Math.min(0.35, slowmo + 0.12); // dramatic time dilation
    shieldEnergy = Math.min(1, shieldEnergy + 0.05);
    // projectile keeps flying (pierces); dies after a few hits to keep it fair
    if (proj.hits >= 4) proj.state = 'dead';
  }

  function damageCore() {
    core.hp--;
    core.hitFlash = 1;
    shake = Math.max(shake, 16);
    combo = 0;
    audio.hurt();
    burstParticles(cx, cy, 30, '#ff5d8f', unit * 0.45, 0.7);
    shockRing(cx, cy, '#ff5d8f', unit * 0.3);
    if (core.hp <= 0) gameOver();
  }

  // ---- render ----
  function drawStars() {
    for (const s of stars) {
      ctx.globalAlpha = s.a * (0.7 + 0.3 * Math.sin(s.tw));
      ctx.fillStyle = '#fff';
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;
  }

  function drawCore() {
    const pulse = coreR + Math.sin(core.pulse * 2.2) * coreR * 0.08;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulse * 2.4);
    const hit = core.hitFlash;
    glow.addColorStop(0, `rgba(${120 + hit * 135}, ${160 - hit * 80}, 255, 0.9)`);
    glow.addColorStop(0.5, 'rgba(80,100,255,0.35)');
    glow.addColorStop(1, 'rgba(80,100,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, pulse * 2.4, 0, TAU); ctx.fill();

    ctx.fillStyle = hit > 0.1 ? '#ff9db8' : '#e6ecff';
    ctx.beginPath(); ctx.arc(cx, cy, pulse, 0, TAU); ctx.fill();

    // hp pips around core
    for (let i = 0; i < core.maxHp; i++) {
      const a = -Math.PI / 2 + (i - (core.maxHp - 1) / 2) * 0.4;
      const rr = coreR * 1.7;
      ctx.fillStyle = i < core.hp ? '#5de4ff' : 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, coreR * 0.16, 0, TAU);
      ctx.fill();
    }
  }

  function drawShield() {
    ctx.save();
    ctx.translate(cx, cy);
    const a0 = shield.angle - shieldArc / 2;
    const a1 = shield.angle + shieldArc / 2;
    ctx.lineCap = 'round';
    // glow
    ctx.strokeStyle = `rgba(255,209,102,${0.5 + shield.flash * 0.5})`;
    ctx.shadowColor = '#ffd166';
    ctx.shadowBlur = 18 + shield.flash * 26;
    ctx.lineWidth = shieldThick;
    ctx.beginPath(); ctx.arc(0, 0, shieldR, a0, a1); ctx.stroke();
    // bright inner
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(255,255,255,${0.7 + shield.flash * 0.3})`;
    ctx.lineWidth = shieldThick * 0.4;
    ctx.beginPath(); ctx.arc(0, 0, shieldR, a0, a1); ctx.stroke();

    // energy meter arc (full ring faint, filled portion bright)
    ctx.strokeStyle = 'rgba(93,228,255,0.12)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, shieldR + shieldThick, 0, TAU); ctx.stroke();
    if (shieldEnergy > 0) {
      ctx.strokeStyle = shieldEnergy >= 1 ? '#5de4ff' : 'rgba(93,228,255,0.55)';
      ctx.lineWidth = shieldEnergy >= 1 ? 4 : 3;
      if (shieldEnergy >= 1) { ctx.shadowColor = '#5de4ff'; ctx.shadowBlur = 12; }
      ctx.beginPath(); ctx.arc(0, 0, shieldR + shieldThick, -Math.PI / 2, -Math.PI / 2 + TAU * shieldEnergy); ctx.stroke();
    }
    ctx.restore();
  }

  function drawShard(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    const deflected = s.state === 'deflected';
    const col = deflected ? '#5de4ff' : (s.special ? '#ffd166' : '#ff5d8f');
    ctx.shadowColor = col; ctx.shadowBlur = deflected ? 18 : 12;
    ctx.fillStyle = col;
    ctx.beginPath();
    const r = s.r;
    ctx.moveTo(r, 0);
    ctx.lineTo(0, r * 0.7);
    ctx.lineTo(-r, 0);
    ctx.lineTo(0, -r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawHUD() {
    if (state === STATE.PLAY || state === STATE.DEAD) {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.font = '800 40px ui-sans-serif, system-ui, sans-serif';
      ctx.fillText(String(score), 24, 54);
      if (combo > 2) {
        ctx.fillStyle = '#ffd166';
        ctx.font = '700 15px ui-sans-serif, system-ui, sans-serif';
        ctx.fillText(`COMBO x${combo}`, 26, 76);
      }
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '600 13px ui-sans-serif, system-ui, sans-serif';
      ctx.fillText(`best ${best}`, W - 24, 32);
      if (shieldEnergy >= 1) {
        ctx.fillStyle = '#5de4ff';
        ctx.fillText('BURST READY · double-tap / shift', W - 24, 52);
      }
    }
  }

  function draw() {
    ctx.fillStyle = '#05060d';
    ctx.fillRect(0, 0, W, H);
    drawStars();

    const sx = shake > 0.3 ? (Math.random() - 0.5) * shake : 0;
    const sy = shake > 0.3 ? (Math.random() - 0.5) * shake : 0;
    ctx.save();
    ctx.translate(sx, sy);

    // rings
    for (const r of rings) {
      ctx.globalAlpha = Math.max(0, r.life / r.max) * 0.6;
      ctx.strokeStyle = r.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    drawCore();
    drawShield();
    for (const s of shards) drawShard(s);

    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    for (const u of popups) {
      ctx.globalAlpha = Math.max(0, u.life / u.max);
      ctx.fillStyle = u.color;
      ctx.font = `${u.big ? 800 : 700} ${u.big ? 22 : 14}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(u.text, u.x, u.y);
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // slow-mo vignette tint
    if (slowmo > 0) {
      ctx.fillStyle = `rgba(93,228,255,${slowmo * 0.18})`;
      ctx.fillRect(0, 0, W, H);
    }

    drawHUD();
  }

  // ---- loop ----
  function loop(now) {
    let dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    if (slowmo > 0) dt *= 0.4;   // bullet-time on big chains
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  if (best > 0) {
    subEl.innerHTML = `Aim your shield. Deflect the shards.<br>Bounced shards smash others — chain them.<br><span style="color:rgba(255,255,255,0.5)">best ${best}</span>`;
  }
  requestAnimationFrame((t) => { lastT = t; loop(t); });
})();
