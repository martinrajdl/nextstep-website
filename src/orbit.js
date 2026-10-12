// A small native WebGL sculpture. No model, texture, dependency or network request.
(() => {
  const canvas = document.querySelector('#workspace-orbit');
  if (!canvas) return;
  const stage = canvas.closest('.orbit-stage');
  const fallback = document.querySelector('#orbit-fallback');
  const motionButton = document.querySelector('#orbit-motion');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const descriptions = {
    orbit: 'A constellation of people, projects, and possibilities.',
    grid: 'A place for every detail. Connections between every layer.',
    wave: 'The same context, moving with the work.',
  };
  let shape = 'orbit';
  let scatter = 0;
  let yaw = -0.25;
  let pitch = 0.2;
  let pointer = null;
  let hoverX = 0;
  let hoverY = 0;
  let visible = false;
  let paused = false;
  let frame = 0;
  let lastTime = 0;
  let gl;
  let program;
  let buffer;
  let links;
  let uniforms;
  const count = 720;
  const positions = new Float32Array(count * 4);
  const targets = new Float32Array(count * 4);
  const indices = [];
  for (let i = 0; i < count; i++) if (i % 180 < 179 && i % 3 === 0) indices.push(i, i + 1);
  const random = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  function setTargets() {
    for (let i = 0; i < count; i++) {
      const at = i * 4;
      const t = (i % 180) / 180 * Math.PI * 2;
      const band = Math.floor(i / 180) - 1.5;
      if (shape === 'orbit') {
        const radius = 1.02 + 0.34 * Math.cos(3 * t) + band * 0.055;
        targets[at] = radius * Math.cos(2 * t);
        targets[at + 1] = 0.7 * Math.sin(3 * t) + band * 0.08;
        targets[at + 2] = radius * Math.sin(2 * t);
      } else if (shape === 'grid') {
        targets[at] = (i % 10 - 4.5) * 0.23;
        targets[at + 1] = (Math.floor(i / 10) % 9 - 4) * 0.23;
        targets[at + 2] = (Math.floor(i / 90) - 3.5) * 0.23;
      } else {
        const x = (i % 30 - 14.5) * 0.09;
        const z = (Math.floor(i / 30) - 11.5) * 0.08;
        targets[at] = x;
        targets[at + 1] = Math.sin(x * 2.7 + z * 1.5) * 0.55;
        targets[at + 2] = z;
      }
      targets[at + 3] = i % 29 === 0 ? 1 : random(i) * 0.35;
    }
    if (motion.matches || paused) positions.set(targets);
  }

  function unavailable() {
    cancelAnimationFrame(frame);
    frame = 0;
    gl = null;
    canvas.hidden = true;
    fallback.hidden = false;
    stage.dataset.renderer = 'fallback';
    motionButton.hidden = true;
    document.querySelector('#orbit-hint').textContent = 'Try the shapes. Same context, different possibilities.';
  }

  function shader(type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) { gl.deleteShader(result); throw new Error('Shader unavailable'); }
    return result;
  }

  function initialize() {
    try {
      gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power', preserveDrawingBuffer: false });
      if (!gl) { unavailable(); return; }
      const vertex = shader(gl.VERTEX_SHADER, `
        attribute vec4 a_position;
        uniform vec2 u_rotation;
        uniform float u_aspect;
        uniform float u_dpr;
        varying float v_alpha;
        void main() {
          float cy = cos(u_rotation.x), sy = sin(u_rotation.x);
          float cp = cos(u_rotation.y), sp = sin(u_rotation.y);
          vec3 p = a_position.xyz;
          p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
          p = vec3(p.x, p.y * cp - p.z * sp, p.y * sp + p.z * cp);
          float depth = 4.4 + p.z;
          gl_Position = vec4(p.x * 2.8 / (depth * u_aspect), p.y * 2.8 / depth, 0.0, 1.0);
          gl_PointSize = u_dpr * (2.8 + a_position.w * 7.0) * 3.5 / depth;
          v_alpha = clamp(0.78 - p.z * 0.23, 0.2, 1.0);
        }
      `);
      const fragment = shader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        uniform float u_dark;
        uniform float u_points;
        varying float v_alpha;
        void main() {
          float alpha = v_alpha * 0.16;
          if (u_points > 0.5) {
            float distance = length(gl_PointCoord - vec2(0.5));
            alpha = (1.0 - smoothstep(0.32, 0.5, distance)) * v_alpha;
          }
          vec3 color = mix(vec3(0.17, 0.19, 0.24), vec3(0.82, 0.86, 0.98), u_dark);
          gl_FragColor = vec4(color, alpha);
        }
      `);
      program = gl.createProgram();
      gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
      gl.deleteShader(vertex); gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Program unavailable');
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
      const attribute = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(attribute);
      gl.vertexAttribPointer(attribute, 4, gl.FLOAT, false, 0, 0);
      links = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, links);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
      uniforms = Object.fromEntries(['rotation', 'aspect', 'dpr', 'dark', 'points'].map(key => [key, gl.getUniformLocation(program, `u_${key}`)]));
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      canvas.hidden = false;
      fallback.hidden = true;
      stage.dataset.renderer = 'webgl';
      motionButton.hidden = motion.matches;
      document.querySelector('#orbit-hint').textContent = 'Drag to turn · Arrow keys work too';
      setTargets(); positions.set(targets); draw(); wake();
    } catch { unavailable(); }
  }

  function draw() {
    if (!gl) return;
    const box = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.75);
    const width = Math.round(box.width * dpr), height = Math.round(box.height * dpr);
    if (!width || !height) return;
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, positions);
    gl.uniform2f(uniforms.rotation, yaw + hoverX * 0.1, pitch + hoverY * 0.08);
    gl.uniform1f(uniforms.aspect, width / height);
    gl.uniform1f(uniforms.dpr, dpr);
    gl.uniform1f(uniforms.dark, document.documentElement.dataset.theme === 'dark' ? 1 : 0);
    gl.uniform1f(uniforms.points, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, links);
    gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_SHORT, 0);
    gl.uniform1f(uniforms.points, 1);
    gl.drawArrays(gl.POINTS, 0, count);
  }

  function animate(time) {
    frame = 0;
    if (!gl || !visible || document.hidden || motion.matches || paused) return;
    if (time - lastTime >= 1000 / 30) {
      const elapsed = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      if (!pointer) yaw += elapsed * 0.09;
      scatter *= 0.95;
      for (let i = 0; i < count; i++) {
        for (let axis = 0; axis < 3; axis++) {
          const at = i * 4 + axis;
          const target = targets[at] + (random(i * 3 + axis) - 0.5) * scatter;
          positions[at] += (target - positions[at]) * 0.075;
        }
        positions[i * 4 + 3] = targets[i * 4 + 3];
      }
      draw();
    }
    frame = requestAnimationFrame(animate);
  }
  function wake() {
    if (gl && visible && !document.hidden && !motion.matches && !paused && !frame) { lastTime = performance.now(); frame = requestAnimationFrame(animate); }
  }
  function chooseShape(next) {
    shape = next;
    stage.dataset.shape = next;
    document.querySelectorAll('.shape-options [data-shape]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.shape === next)));
    document.querySelector('#shape-description').textContent = descriptions[next];
    setTargets(); draw(); wake();
  }
  document.querySelectorAll('.shape-options [data-shape]').forEach(button => button.addEventListener('click', () => chooseShape(button.dataset.shape)));
  function shuffle() {
    if (motion.matches || paused || !gl) {
      const names = Object.keys(descriptions);
      chooseShape(names[(names.indexOf(shape) + 1) % names.length]);
    } else {
      scatter = 3.6;
      document.querySelector('#shape-description').textContent = 'A little chaos. Then everything finds its place.';
      wake();
    }
  }
  document.querySelector('#orbit-shuffle').addEventListener('click', shuffle);
  motionButton.addEventListener('click', () => {
    paused = !paused;
    motionButton.textContent = paused ? 'Play animation' : 'Pause animation';
    if (paused) { cancelAnimationFrame(frame); frame = 0; }
    else wake();
  });
  document.addEventListener('nextstep:scatter', shuffle);
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('is-dragging');
  });
  canvas.addEventListener('pointermove', event => {
    if (pointer?.id === event.pointerId) {
      yaw += (event.clientX - pointer.x) * 0.007;
      pitch = Math.max(-1.1, Math.min(1.1, pitch + (event.clientY - pointer.y) * 0.007));
      pointer.x = event.clientX; pointer.y = event.clientY;
      draw();
    } else if (!motion.matches) {
      const box = canvas.getBoundingClientRect();
      hoverX = (event.clientX - box.left) / box.width - 0.5;
      hoverY = (event.clientY - box.top) / box.height - 0.5;
    }
  });
  const release = () => { pointer = null; canvas.classList.remove('is-dragging'); };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('lostpointercapture', release);
  canvas.addEventListener('pointerleave', () => { hoverX = 0; hoverY = 0; });
  canvas.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') { yaw = -0.25; pitch = 0.2; }
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') yaw += event.key === 'ArrowLeft' ? -0.2 : 0.2;
    else pitch = Math.max(-1.1, Math.min(1.1, pitch + (event.key === 'ArrowUp' ? -0.2 : 0.2)));
    draw();
  });
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); unavailable(); });
  canvas.addEventListener('webglcontextrestored', initialize);
  new ResizeObserver(draw).observe(stage);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    stage.dataset.visible = String(visible);
    if (visible) { draw(); wake(); }
    else { cancelAnimationFrame(frame); frame = 0; }
  }, { threshold: 0.05 }).observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else wake();
  });
  document.addEventListener('nextstep:theme', draw);
  motion.addEventListener('change', () => {
    motionButton.hidden = motion.matches || !gl;
    if (motion.matches) { cancelAnimationFrame(frame); frame = 0; scatter = 0; positions.set(targets); draw(); }
    else wake();
  });
  chooseShape('orbit');
  initialize();
})();
