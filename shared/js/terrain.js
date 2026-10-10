/* A conceptual landscape study, not a model of either portfolio project.
   Real 3D geometry is projected into a small, dependency-free 2D canvas.
   Native ViewTimeline supplies camera progress. A cached land layer keeps the
   living miniature light: only people and birds redraw when the view is still.
   Nothing replaces, captures or changes the browser's natural scroll. */
(() => {
  'use strict';

  const canvas = document.getElementById('terrainCanvas');
  const frame = canvas && canvas.closest('.terrain-frame');
  const subject = document.querySelector('.intro');
  if (!canvas || !frame || !subject) return;
  const displayContext = canvas.getContext('2d', { alpha: true });
  const landCanvas = document.createElement('canvas');
  const context = landCanvas.getContext('2d', { alpha: true });
  if (!displayContext || !context) return;
  const replay = document.getElementById('terrainReplay');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let motionEnabled = !reduceMotion.matches && !document.documentElement.classList.contains('motion-paused');
  let visible = true;
  let pageVisible = !document.hidden;
  let width = 1;
  let height = 1;
  let pixelRatio = 1;
  let raf = 0;
  let currentProgress = -1;
  let pointerX = 0;
  let pointerY = 0;
  let desiredPointerX = 0;
  let desiredPointerY = 0;
  let needsRender = true;
  let timeline = null;
  let projectScene = null;
  let sceneScale = 1;
  let renderCount = 0;
  let lifeTime = 0;
  let lastTick = 0;
  let lastPaint = 0;
  let entranceTime = motionEnabled ? 0 : 1500;
  let currentEntrance = -1;
  const entranceDuration = 1500;
  const frameInterval = 1000 / 25;

  try {
    if ('ViewTimeline' in window) timeline = new ViewTimeline({ subject, axis: 'block' });
  } catch (_) {
    // A static axonometric artwork remains useful without scroll timelines.
  }

  const rangeX = 1.55;
  const rangeY = 1.13;
  const baseZ = -0.14;
  const ribbonY = x => Math.sin(x * 2.55 + 0.45) * 0.22 + Math.sin(x * 5.1) * 0.065;
  const gaussian = (x, y, centerX, centerY, spreadX, spreadY, rise) =>
    rise * Math.exp(-((x - centerX) ** 2 / spreadX + (y - centerY) ** 2 / spreadY));

  function elevation(x, y) {
    const peaks = gaussian(x, y, -0.72, -0.57, 0.44, 0.26, 0.78)
      + gaussian(x, y, 0.79, 0.59, 0.38, 0.30, 0.62)
      + gaussian(x, y, 0.92, -0.61, 0.23, 0.16, 0.32);
    const valley = 1 - 0.76 * Math.exp(-((y - ribbonY(x)) ** 2) / 0.045);
    const edge = Math.min(1, (rangeX - Math.abs(x)) * 3.8, (rangeY - Math.abs(y)) * 4.6);
    return 0.035 + peaks * valley * Math.max(0, edge);
  }

  function point(x, y, z = elevation(x, y)) { return { x, y, z }; }
  const meshFaces = [];
  const meshX = 56;
  const meshY = 40;
  const mesh = [];
  for (let row = 0; row <= meshY; row += 1) {
    const y = -rangeY + row / meshY * rangeY * 2;
    mesh[row] = [];
    for (let col = 0; col <= meshX; col += 1) {
      const x = -rangeX + col / meshX * rangeX * 2;
      mesh[row][col] = point(x, y);
    }
  }

  function makeFace(points, color) {
    const center = points.reduce((acc, p) => ({ x: acc.x + p.x / points.length, y: acc.y + p.y / points.length, z: acc.z + p.z / points.length }), { x: 0, y: 0, z: 0 });
    return { points, center, color };
  }

  for (let row = 0; row < meshY; row += 1) {
    for (let col = 0; col < meshX; col += 1) {
      const a = mesh[row][col];
      const b = mesh[row][col + 1];
      const c = mesh[row + 1][col + 1];
      const d = mesh[row + 1][col];
      const slopeX = ((b.z + c.z) - (a.z + d.z)) / 2;
      const slopeY = ((c.z + d.z) - (a.z + b.z)) / 2;
      const shade = Math.max(214, Math.min(252, Math.round(242 - slopeX * 210 - slopeY * 115)));
      meshFaces.push(makeFace([a, b, c, d], `rgb(${shade} ${shade - 1} ${shade - 5})`));
    }
  }

  const sideFaces = [];
  for (let col = 0; col < meshX; col += 1) {
    for (const row of [0, meshY]) {
      const a = mesh[row][col];
      const b = mesh[row][col + 1];
      sideFaces.push(makeFace([a, b, point(b.x, b.y, baseZ), point(a.x, a.y, baseZ)], row === meshY ? '#d1cfc7' : '#e2e0d8'));
    }
  }
  for (let row = 0; row < meshY; row += 1) {
    for (const col of [0, meshX]) {
      const a = mesh[row][col];
      const b = mesh[row + 1][col];
      sideFaces.push(makeFace([a, b, point(b.x, b.y, baseZ), point(a.x, a.y, baseZ)], col === 0 ? '#dad8d0' : '#c6c4bc'));
    }
  }

  // Marching squares: real elevation contours rather than a decorative grid.
  const contourSegments = [];
  const interpolate = (a, b, z) => {
    const amount = (z - a.z) / (b.z - a.z);
    return point(a.x + (b.x - a.x) * amount, a.y + (b.y - a.y) * amount, z + 0.004);
  };
  for (let level = 0.075; level <= 0.75; level += 0.043) {
    for (let row = 0; row < meshY; row += 1) {
      for (let col = 0; col < meshX; col += 1) {
        const corners = [mesh[row][col], mesh[row][col + 1], mesh[row + 1][col + 1], mesh[row + 1][col]];
        const crosses = [];
        corners.forEach((a, i) => {
          const b = corners[(i + 1) % 4];
          if ((a.z < level) !== (b.z < level)) crosses.push(interpolate(a, b, level));
        });
        if (crosses.length === 2) contourSegments.push(crosses);
        if (crosses.length === 4) contourSegments.push([crosses[0], crosses[1]], [crosses[2], crosses[3]]);
      }
    }
  }

  const ribbon = [];
  const ribbonCount = 140;
  for (let index = 0; index <= ribbonCount; index += 1) {
    const x = -rangeX + index / ribbonCount * rangeX * 2;
    const y = ribbonY(x);
    ribbon.push({ left: point(x, y - 0.046, elevation(x, y - 0.046) + 0.008), right: point(x, y + 0.046, elevation(x, y + 0.046) + 0.008) });
  }

  // Irregular planting groups are deliberately composed, not randomly animated.
  const trees = [
    [-1.20, -0.84, .18], [-1.03, -.73, .20], [-1.26, -.60, .15], [-.95, -.91, .17],
    [-.36, -.77, .16], [-.18, -.91, .19], [.01, -.77, .17], [.18, -.91, .15],
    [.98, -.81, .16], [1.19, -.62, .19], [1.28, -.83, .16], [.78, -.96, .17],
    [-1.20, .63, .18], [-1.02, .78, .22], [-.84, .62, .17], [-.68, .88, .18],
    [.08, .61, .18], [.20, .78, .17], [.39, .91, .22], [.56, .72, .18],
    [1.14, .64, .17], [1.25, .85, .18], [1.04, .94, .16]
  ].map(([x, y, size]) => ({ x, y, z: elevation(x, y), size }));

  const buildings = [
    { x: -.66, y: .45, sx: .26, sy: .15, height: .105 },
    { x: -.31, y: .47, sx: .13, sy: .15, height: .105 }
  ];

  function readProgress() {
    if (!motionEnabled || !timeline) return .42;
    const time = timeline.currentTime;
    if (!time) return .42;
    return Math.max(0, Math.min(1, Number(time.value) / 100));
  }

  function render(progress, entrance) {
    if (width < 2 || height < 2) return;
    const settle = 1 - (1 - entrance) ** 3;
    const rise = .38 + settle * .62;
    const yaw = -.55 + (progress - .42) * .90 + pointerX * .18 - (1 - settle) * .16;
    const pitch = .64 + (progress - .42) * .31 + pointerY * .085 + (1 - settle) * .09;
    const scale = Math.min(width / 4.26, height / 2.94);
    sceneScale = scale;
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    function project(p) {
      const x = p.x * cosYaw - p.y * sinYaw;
      const y = p.x * sinYaw + p.y * cosYaw;
      const z = p.z > 0 ? p.z * rise : p.z;
      return { x: width * .50 + x * scale, y: height * .56 + (y * sinPitch - z * cosPitch) * scale + (1 - settle) * 10, depth: y * cosPitch + z * sinPitch };
    }
    projectScene = project;
    function polygon(points, fill, outline = null, lineWidth = .6) {
      context.beginPath();
      points.forEach((p, index) => {
        const projected = project(p);
        if (index === 0) context.moveTo(projected.x, projected.y);
        else context.lineTo(projected.x, projected.y);
      });
      context.closePath();
      if (fill) { context.fillStyle = fill; context.fill(); }
      if (outline) { context.strokeStyle = outline; context.lineWidth = lineWidth; context.stroke(); }
    }

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.lineCap = 'round';
    context.lineJoin = 'round';

    // Soft, restrained grounding. The model itself stays paper, red and ink.
    const ground = project(point(.05, .10, baseZ));
    context.save();
    context.translate(ground.x, ground.y + scale * .23);
    context.scale(1, .28);
    const shadow = context.createRadialGradient(0, 0, scale * .20, 0, 0, scale * 1.78);
    shadow.addColorStop(0, 'rgba(38,37,34,.11)');
    shadow.addColorStop(.75, 'rgba(38,37,34,.035)');
    shadow.addColorStop(1, 'rgba(38,37,34,0)');
    context.fillStyle = shadow;
    context.beginPath();
    context.arc(0, 0, scale * 1.78, 0, Math.PI * 2);
    context.fill();
    context.restore();

    const surfaces = sideFaces.concat(meshFaces).map(face => ({ face, depth: project(face.center).depth }));
    surfaces.sort((a, b) => a.depth - b.depth);
    surfaces.forEach(({ face }) => {
      // Same-color hairline removes anti-alias seams between neighbouring cells.
      polygon(face.points, face.color, face.color, .55);
    });

    context.strokeStyle = 'rgba(38,37,34,.57)';
    context.lineWidth = Math.max(.64, scale / 180);
    context.lineCap = 'round';
    context.beginPath();
    contourSegments.forEach(([a, b]) => {
      const start = project(a);
      const end = project(b);
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
    });
    context.stroke();

    for (let index = 0; index < ribbon.length - 1; index += 1) {
      polygon([ribbon[index].left, ribbon[index + 1].left, ribbon[index + 1].right, ribbon[index].right], '#9d1212', '#9d1212', .55);
    }

    // Cut-paper stratigraphy along the slab edge gives the terrain physicality.
    context.strokeStyle = 'rgba(38,37,34,.33)';
    context.lineWidth = .7;
    for (const z of [-.045, -.090, -.135]) {
      const edgePoints = [point(-rangeX, -rangeY, z), point(-rangeX, rangeY, z), point(rangeX, rangeY, z)];
      context.beginPath();
      edgePoints.forEach((p, index) => {
        const q = project(p);
        if (index === 0) context.moveTo(q.x, q.y); else context.lineTo(q.x, q.y);
      });
      context.stroke();
    }

    buildings.forEach(building => {
      const { x, y, sx, sy, height: rise } = building;
      const z = Math.max(elevation(x, y), elevation(x + sx, y + sy)) + .014;
      const a = point(x, y, z);
      const b = point(x + sx, y, z);
      const c = point(x + sx, y + sy, z);
      const d = point(x, y + sy, z);
      const top = p => point(p.x, p.y, z + rise);
      polygon([a, d, top(d), top(a)], '#d9d7ce', 'rgba(38,37,34,.61)', .75);
      polygon([d, c, top(c), top(d)], '#e4e2da', 'rgba(38,37,34,.61)', .75);
      polygon([a, b, c, d].map(top), '#fffefa', 'rgba(38,37,34,.61)', .75);
    });

    trees.sort((a, b) => project(a).depth - project(b).depth).forEach(tree => {
      const base = project(tree);
      const trunkTop = project(point(tree.x, tree.y, tree.z + tree.size * .60));
      const apex = point(tree.x, tree.y, tree.z + tree.size);
      const radius = tree.size * .30;
      const crown = [];
      for (let segment = 0; segment < 6; segment += 1) {
        const angle = segment / 6 * Math.PI * 2;
        crown.push(point(tree.x + Math.cos(angle) * radius, tree.y + Math.sin(angle) * radius, tree.z + tree.size * .38));
      }
      context.beginPath();
      context.moveTo(base.x, base.y);
      context.lineTo(trunkTop.x, trunkTop.y);
      context.strokeStyle = 'rgba(38,37,34,.76)';
      context.lineWidth = .9;
      context.stroke();
      const treeFaces = crown.map((p, index) => ({ points: [p, crown[(index + 1) % crown.length], apex], depth: project(p).depth, index }));
      treeFaces.sort((a, b) => a.depth - b.depth).forEach(face => polygon(face.points, face.index % 2 ? '#e7e5dd' : '#f5f4ee', 'rgba(38,37,34,.53)', .65));
    });

    frame.classList.add('terrain-ready');
    if (replay) replay.hidden = false;
    frame.dataset.scrollProgress = progress.toFixed(3);
    renderCount += 1;
    frame.dataset.renderCount = String(renderCount);
    frame.dataset.entranceProgress = entrance.toFixed(3);
  }

  function paintLife() {
    if (!projectScene) return;
    const project = projectScene;
    const scale = sceneScale;
    displayContext.setTransform(1, 0, 0, 1, 0, 0);
    displayContext.clearRect(0, 0, canvas.width, canvas.height);
    displayContext.drawImage(landCanvas, 0, 0);
    displayContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    displayContext.lineCap = 'round';
    displayContext.lineJoin = 'round';

    function line(a, b, color, weight) {
      const first = project(a);
      const second = project(b);
      displayContext.beginPath();
      displayContext.moveTo(first.x, first.y);
      displayContext.lineTo(second.x, second.y);
      displayContext.strokeStyle = color;
      displayContext.lineWidth = weight;
      displayContext.stroke();
    }

    // Two architectural-scale people give a sense of occupation and scale.
    // Both turn at the path ends rather than teleporting into view.
    for (let index = 0; index < 2; index += 1) {
      const phase = lifeTime / 22000 + index * .39;
      const position = .5 - Math.cos(phase * Math.PI * 2) * .37;
      const direction = Math.sin(phase * Math.PI * 2) >= 0 ? 1 : -1;
      const x = -rangeX + position * rangeX * 2;
      const y = ribbonY(x) + (index ? .022 : -.022);
      const z = elevation(x, y) + .016;
      const step = Math.sin(lifeTime / 170 + index * Math.PI) * .022;
      const shoulder = point(x, y, z + .108);
      const waist = point(x, y, z + .060);
      const head = project(point(x, y, z + .139));
      const ink = '#262522';
      const shirt = index ? '#9d1212' : '#262522';
      line(waist, point(x + step * direction, y - .010, z), ink, Math.max(1.1, scale * .009));
      line(waist, point(x - step * direction, y + .010, z), ink, Math.max(1.1, scale * .009));
      line(shoulder, waist, shirt, Math.max(1.8, scale * .019));
      line(point(x, y, z + .095), point(x - step * direction, y - .017, z + .065), shirt, Math.max(.9, scale * .008));
      line(point(x, y, z + .095), point(x + step * direction, y + .017, z + .065), shirt, Math.max(.9, scale * .008));
      displayContext.beginPath();
      displayContext.arc(head.x, head.y, Math.max(1.5, scale * .012), 0, Math.PI * 2);
      displayContext.fillStyle = ink;
      displayContext.fill();
    }

    // A paired glide high above the land. Small ink marks, no decorative trail.
    for (let index = 0; index < 2; index += 1) {
      const flight = lifeTime / 11000 + index * .052;
      const x = Math.sin(flight * Math.PI * 2) * .66 + .08;
      const y = -.48 + Math.cos(flight * Math.PI * 2) * .16 + index * .12;
      const z = 1.05 + Math.sin(flight * Math.PI * 2) * .025 + index * .07;
      const lift = .028 + Math.sin(lifeTime / 430 + index * .6) * .022;
      const body = point(x, y, z);
      const leftWing = point(x - .062, y + .009, z + lift);
      const rightWing = point(x + .062, y + .009, z + lift);
      const center = project(body);
      const left = project(leftWing);
      const right = project(rightWing);
      displayContext.beginPath();
      displayContext.moveTo(left.x, left.y);
      displayContext.quadraticCurveTo(center.x - scale * .014, center.y - scale * .009, center.x, center.y);
      displayContext.quadraticCurveTo(center.x + scale * .014, center.y - scale * .009, right.x, right.y);
      displayContext.strokeStyle = 'rgba(38,37,34,.78)';
      displayContext.lineWidth = Math.max(.9, scale * .007);
      displayContext.stroke();
    }
    frame.dataset.characterPhase = (lifeTime / 1000).toFixed(3);
  }

  function drawFrame(now) {
    raf = 0;
    if (!visible || !pageVisible) return;
    if (motionEnabled && now - lastPaint < frameInterval && !needsRender) {
      raf = requestAnimationFrame(drawFrame);
      return;
    }
    const elapsed = lastTick ? Math.min(100, now - lastTick) : 0;
    lastTick = now;
    lastPaint = now;
    if (motionEnabled) {
      lifeTime += elapsed;
      entranceTime = Math.min(entranceDuration, entranceTime + elapsed);
    }
    const entrance = motionEnabled ? entranceTime / entranceDuration : 1;
    const progress = readProgress();
    const pointerChanged = Math.abs(pointerX - desiredPointerX) + Math.abs(pointerY - desiredPointerY) > .002;
    if (motionEnabled) {
      pointerX += (desiredPointerX - pointerX) * .16;
      pointerY += (desiredPointerY - pointerY) * .16;
    } else {
      pointerX = 0;
      pointerY = 0;
    }
    if (needsRender || Math.abs(progress - currentProgress) > .0008 || pointerChanged || Math.abs(entrance - currentEntrance) > .0008) {
      try {
        render(progress, entrance);
        currentProgress = progress;
        currentEntrance = entrance;
        needsRender = false;
      } catch (_) {
        frame.classList.remove('terrain-ready');
        return;
      }
    }
    paintLife();
    if (motionEnabled) raf = requestAnimationFrame(drawFrame);
  }

  function wake() {
    if (!visible || !pageVisible) return;
    if (!raf) raf = requestAnimationFrame(drawFrame);
  }

  function resize() {
    const rect = frame.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * pixelRatio));
    canvas.height = Math.max(1, Math.round(height * pixelRatio));
    landCanvas.width = canvas.width;
    landCanvas.height = canvas.height;
    needsRender = true;
    wake();
  }

  function setMotion(enabled) {
    motionEnabled = Boolean(enabled) && !reduceMotion.matches;
    if (replay) replay.disabled = !motionEnabled;
    desiredPointerX = 0;
    desiredPointerY = 0;
    needsRender = true;
    entranceTime = entranceDuration;
    lastTick = 0;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    wake();
  }

  frame.addEventListener('pointermove', event => {
    if (!motionEnabled || !finePointer.matches || event.pointerType === 'touch') return;
    const rect = frame.getBoundingClientRect();
    desiredPointerX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    desiredPointerY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
    wake();
  }, { passive: true });
  frame.addEventListener('pointerleave', () => {
    desiredPointerX = 0;
    desiredPointerY = 0;
    wake();
  }, { passive: true });
  document.addEventListener('portfolio:motion', event => setMotion(event.detail && event.detail.enabled));
  reduceMotion.addEventListener('change', () => setMotion(!document.documentElement.classList.contains('motion-paused')));
  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
    lastTick = 0;
    if (!pageVisible && raf) { cancelAnimationFrame(raf); raf = 0; }
    if (pageVisible) wake();
  });

  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    lastTick = 0;
    if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
    if (visible) { needsRender = true; wake(); }
  }, { rootMargin: '0px' });
  observer.observe(frame);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(frame);
  else window.addEventListener('resize', resize, { passive: true });

  if (replay) {
    replay.disabled = !motionEnabled;
    replay.addEventListener('click', () => {
      if (!motionEnabled) return;
      entranceTime = 0;
      lifeTime = 0;
      currentEntrance = -1;
      needsRender = true;
      lastTick = 0;
      wake();
    });
  }

  resize();
})();
