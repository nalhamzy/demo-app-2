(() => {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const titleEl = document.getElementById('title');
  const subEl = document.getElementById('sub');
  const muteBtn = document.getElementById('mute');

  const STATE = { MENU: 0, PLAYING: 1, DEAD: 2 };
  let state = STATE.MENU;

  const TAU = Math.PI * 2;
  const SHIP_SIZE = 10;
  const COLLISION_ARC = 0.18;

  let W = 0, H = 0, cx = 0, cy = 0, DPR = 1;
  let orbitR = 130;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx = W / 2; cy = H / 2;
    orbitR = Math.max(90, Math.min(W, H) * 0.22);
  }
  window.addEventListener('resize', resize);
  resize();

  const player = { theta: -Math.PI / 2, dir: 1, omega: 1.9, flash: 0, alive: true };
  let asteroids = [];
  let pickups = [];
  let particles = [];
  let stars = [];
  let popups = [];
  let shake = 0;
  let combo = 0, maxCombo = 0;
  let score = 0;
  let best = parseInt(localStorage.getItem('orbit_best') || '0', 10) || 0;
  let timeAlive = 0;
  let spawnTimer = 0;
  let lastT = performance.now();

  function initStars() {
    stars = [];
    const n = Math.floor((W * H) / 9000);
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.4 + 0.2,
        a: Math.random() * 0.6 + 0.15,
        tw: Math.random() * TAU,
      });
    }
  }
  initStars();
  window.addEventListener('resize', initStars);

  let muted = localStorage.getItem('orbit_muted') === '1';
  updateMuteBtn();
  muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    muted = !muted;
    localStorage.setItem('orbit_muted', muted ? '1' : '0');
    updateMuteBtn();
  });
  function updateMuteBtn() {
    muteBtn.textContent = muted ? 'SOUND OFF' : 'SOUND ON';
    muteBtn.style.opacity = muted ? '0.5' : '1';
  }

  const audio = (() => {
    let actx = null;
    function ensure() {
      if (!actx) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        actx = new C();
      }
      return actx;
    }
    function beep(freq, dur, type, vol, slide) {
      if (muted) return;
      const a = ensure();
      if (!a) return;
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, a.currentTime);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, a.currentTime + dur);
      g.gain.setValueAtTime(vol, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
      o.connect(g); g.connect(a.destination);
      o.start();
      o.stop(a.currentTime + dur + 0.02);
    }
    return {
      flip:   () => beep(520, 0.08,  'triangle', 0.05, 720),
      near:   () => beep(880, 0.07,  'sine',     0.04, 1320),
      pickup: () => { beep(660, 0.09, 'sine', 0.05, 990); setTimeout(() => beep(1320, 0.09, 'sine', 0.04, 1760), 50); },
      hit:    () => beep(140, 0.45, 'sawtooth', 0.13, 60),
    };
  })();

  function reset() {
    player.theta = -Math.PI / 2;
    player.dir = 1;
    player.omega = 1.9;
    player.flash = 0;
    player.alive = true;
    asteroids = [];
    pickups = [];
    particles = [];
    popups = [];
    combo = 0;
    maxCombo = 0;
    score = 0;
    timeAlive = 0;
    spawnTimer = 0.6;
    shake = 0;
  }

  function px() { return cx + Math.cos(player.theta) * orbitR; }
  function py() { return cy + Math.sin(player.theta) * orbitR; }

  function spawn(isPickup) {
    const phi = Math.random() * TAU;
    const R = Math.hypot(W, H) * 0.6;
    const sx = cx + Math.cos(phi) * R;
    const sy = cy + Math.sin(phi) * R;
    const dx = cx - sx, dy = cy - sy;
    const len = Math.hypot(dx, dy);
    const speed = 110 + Math.min(180, timeAlive * 3.2);
    (isPickup ? pickups : asteroids).push({
      x: sx, y: sy,
      vx: dx / len * speed,
      vy: dy / len * speed,
      r: isPickup ? 7 : (10 + Math.random() * 7),
      rot: Math.random() * TAU,
      vrot: (Math.random() - 0.5) * 4,
      alive: true,
      scored: false,
      vertices: isPickup ? null : makePoly(6 + (Math.random() * 3 | 0)),
    });
  }

  function makePoly(n) {
    const verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const r = 0.7 + Math.random() * 0.5;
      verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    return verts;
  }

  function emit(x, y, n, color, speed, life) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const s = speed * (0.35 + Math.random() * 0.9);
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life, max: life,
        color,
        size: 1 + Math.random() * 2.5,
      });
    }
  }

  function popup(text, x, y, color) {
    popups.push({ text, x, y, vy: -40, life: 0.9, max: 0.9, color });
  }

  function tap() {
    if (state === STATE.MENU) {
      reset();
      state = STATE.PLAYING;
      overlay.classList.remove('visible');
      overlay.classList.add('hidden');
      lastT = performance.now();
    } else if (state === STATE.PLAYING) {
      player.dir = -player.dir;
      player.flash = 1;
      emit(px(), py(), 12, '#ffd166', 220, 0.4);
      audio.flip();
    } else if (state === STATE.DEAD) {
      reset();
      state = STATE.PLAYING;
      overlay.classList.remove('visible');
      overlay.classList.add('hidden');
      lastT = performance.now();
    }
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') {
      e.preventDefault();
      tap();
    }
  });
  canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(); });
  overlay.addEventListener('pointerdown', (e) => {
    if (e.target === muteBtn) return;
    e.preventDefault();
    tap();
  });

  function angDiff(a, b) {
    let d = Math.abs(a - b);
    if (d > Math.PI) d = TAU - d;
    return d;
  }

  function step(arr, dt, pTheta, isPickup) {
    for (const o of arr) {
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.rot += o.vrot * dt;
      const dx = o.x - cx, dy = o.y - cy;
      const dist = Math.hypot(dx, dy);

      if (!o.scored && dist < orbitR + o.r && dist > orbitR - o.r) {
        const ang = Math.atan2(dy, dx);
        const a2 = (ang + TAU) % TAU;
        const p2 = (pTheta + TAU) % TAU;
        const diff = angDiff(a2, p2);
        if (diff < COLLISION_ARC + (o.r / orbitR) * 0.4) {
          if (isPickup) {
            o.alive = false; o.scored = true;
            combo++;
            maxCombo = Math.max(maxCombo, combo);
            const gain = 10 * combo;
            score += gain;
            emit(o.x, o.y, 22, '#48e5c2', 240, 0.6);
            popup(`+${gain}`, o.x, o.y, '#48e5c2');
            audio.pickup();
          } else {
            die();
            return;
          }
        }
      }

      if (!isPickup && !o.scored && dist < orbitR - 4) {
        o.scored = true;
        const ang = Math.atan2(dy, dx);
        const diff = angDiff((ang + TAU) % TAU, (pTheta + TAU) % TAU);
        if (diff < COLLISION_ARC * 2.4) {
          combo++;
          maxCombo = Math.max(maxCombo, combo);
          const gain = 5 * combo;
          score += gain;
          popup(`near +${gain}`, o.x, o.y, '#9af0ff');
          emit(o.x, o.y, 7, '#9af0ff', 160, 0.4);
          audio.near();
        } else {
          score += 1;
        }
      }

      if (dist < 14) o.alive = false;
      if (Math.abs(o.x - cx) > W * 0.8 || Math.abs(o.y - cy) > H * 0.8) o.alive = false;
    }
  }

  function update(dt) {
    timeAlive += dt;
    for (const s of stars) s.tw += dt * 2;

    if (state !== STATE.PLAYING) {
      for (const p of particles) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= 0.94; p.vy *= 0.94;
        p.life -= dt;
      }
      particles = particles.filter(p => p.life > 0);
      shake *= 0.9;
      return;
    }

    const ramp = 1 + Math.min(1.4, timeAlive * 0.035);
    player.omega = 1.9 * ramp;
    player.theta += player.dir * player.omega * dt;
    player.flash *= 0.86;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      const interval = Math.max(0.32, 1.15 - timeAlive * 0.018);
      spawnTimer = interval * (0.85 + Math.random() * 0.3);
      if (Math.random() < 0.22) spawn(true);
      else {
        spawn(false);
        if (timeAlive > 22 && Math.random() < 0.22) {
          setTimeout(() => { if (state === STATE.PLAYING) spawn(false); }, 90);
        }
      }
    }

    const pTheta = player.theta;
    step(asteroids, dt, pTheta, false);
    if (!player.alive) return;
    step(pickups, dt, pTheta, true);

    asteroids = asteroids.filter(o => o.alive);
    pickups = pickups.filter(o => o.alive);

    for (const p of particles) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.93; p.vy *= 0.93;
      p.life -= dt;
    }
    particles = particles.filter(p => p.life > 0);

    for (const u of popups) {
      u.y += u.vy * dt;
      u.vy *= 0.92;
      u.life -= dt;
    }
    popups = popups.filter(u => u.life > 0);

    shake *= 0.85;
  }

  function die() {
    if (!player.alive) return;
    player.alive = false;
    state = STATE.DEAD;
    shake = 22;
    emit(px(), py(), 70, '#ff4d6d', 320, 0.9);
    audio.hit();
    if (score > best) {
      best = score;
      localStorage.setItem('orbit_best', String(best));
    }
    setTimeout(() => {
      titleEl.textContent = 'GAME OVER';
      subEl.innerHTML = `score <b>${score}</b> &nbsp;·&nbsp; best <b>${best}</b> &nbsp;·&nbsp; combo x${maxCombo}`;
      overlay.classList.remove('hidden');
      overlay.classList.add('visible');
    }, 650);
  }

  function drawStars() {
    for (const s of stars) {
      const a = s.a * (0.7 + 0.3 * Math.sin(s.tw));
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;
  }

  function drawPlanet() {
    const pulse = 18 + Math.sin(timeAlive * 1.4) * 3;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulse + 26);
    grad.addColorStop(0, '#7a8aff');
    grad.addColorStop(0.55, '#3b3fd8');
    grad.addColorStop(1, 'rgba(91,107,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, pulse + 26, 0, TAU); ctx.fill();
    ctx.fillStyle = '#dde4ff';
    ctx.beginPath(); ctx.arc(cx, cy, pulse, 0, TAU); ctx.fill();
  }

  function drawOrbitRing() {
    ctx.strokeStyle = 'rgba(154,240,255,0.18)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, orbitR, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawPolygon(o, fill, glow) {
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.rot);
    ctx.shadowColor = glow;
    ctx.shadowBlur = 16;
    ctx.fillStyle = fill;
    ctx.beginPath();
    for (let i = 0; i < o.vertices.length; i++) {
      const [vx, vy] = o.vertices[i];
      const x = vx * o.r, y = vy * o.r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawShip() {
    if (!player.alive) return;
    const x = px(), y = py();
    const tangent = player.theta + player.dir * Math.PI / 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tangent);
    ctx.shadowColor = '#ffd166';
    ctx.shadowBlur = 18 + player.flash * 22;
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(SHIP_SIZE, 0);
    ctx.lineTo(-SHIP_SIZE * 0.75, SHIP_SIZE * 0.65);
    ctx.lineTo(-SHIP_SIZE * 0.4, 0);
    ctx.lineTo(-SHIP_SIZE * 0.75, -SHIP_SIZE * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawHUD() {
    if (state === STATE.PLAYING) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 38px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(String(score), 24, 52);
      if (combo > 1) {
        ctx.font = '600 14px ui-sans-serif, system-ui, sans-serif';
        ctx.fillStyle = '#48e5c2';
        ctx.fillText(`COMBO x${combo}`, 26, 74);
      }
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '500 13px ui-sans-serif, system-ui, sans-serif';
      ctx.fillText(`best ${best}`, W - 24, 32);
    }
  }

  function draw() {
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);
    drawStars();

    const sx = shake > 0.2 ? (Math.random() - 0.5) * shake : 0;
    const sy = shake > 0.2 ? (Math.random() - 0.5) * shake : 0;
    ctx.save();
    ctx.translate(sx, sy);

    drawOrbitRing();
    drawPlanet();

    for (const p of pickups) {
      ctx.shadowColor = '#48e5c2';
      ctx.shadowBlur = 22;
      ctx.fillStyle = '#48e5c2';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;
    }

    for (const a of asteroids) {
      drawPolygon(a, '#ff4d6d', '#ff4d6d');
    }

    for (const p of particles) {
      const t = Math.max(0, p.life / p.max);
      ctx.globalAlpha = t;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    for (const u of popups) {
      const t = Math.max(0, u.life / u.max);
      ctx.globalAlpha = t;
      ctx.fillStyle = u.color;
      ctx.font = '700 14px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(u.text, u.x, u.y);
    }
    ctx.globalAlpha = 1;

    drawShip();
    ctx.restore();

    drawHUD();
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  if (best > 0) {
    subEl.innerHTML = `Tap to flip your orbit. Dodge red. Grab cyan.<br><span style="color:rgba(255,255,255,0.5)">best ${best}</span>`;
  }
  requestAnimationFrame((t) => { lastT = t; loop(t); });
})();
