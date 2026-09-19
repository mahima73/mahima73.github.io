/* ===================================================================
   3D background — particle nebula + reactive wireframe geometry
   Uses global THREE (loaded via CDN). Degrades gracefully.
   =================================================================== */
(function () {
  "use strict";

  const canvas = document.getElementById("bg-canvas");
  if (!canvas || typeof THREE === "undefined") return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x08080f, 0.055);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.z = 9;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  /* ---------- Particle field ---------- */
  const isMobile = window.innerWidth < 768;
  const COUNT = isMobile ? 1400 : 3200;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);

  const palette = [
    new THREE.Color(0xa855f7),
    new THREE.Color(0xec4899),
    new THREE.Color(0x22d3ee),
  ];

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    // spherical distribution shell for a nebula feel
    const r = 6 + Math.random() * 22;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
    positions[i3 + 2] = r * Math.cos(phi);

    const c = palette[(Math.random() * palette.length) | 0];
    colors[i3] = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const sprite = makeCircleTexture();
  const pMat = new THREE.PointsMaterial({
    size: isMobile ? 0.09 : 0.075,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    map: sprite,
    alphaTest: 0.01,
  });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  /* ---------- Central wireframe icosahedron ---------- */
  const icoGeo = new THREE.IcosahedronGeometry(2.4, 1);
  const icoMat = new THREE.MeshBasicMaterial({
    color: 0xec4899,
    wireframe: true,
    transparent: true,
    opacity: 0.18,
  });
  const ico = new THREE.Mesh(icoGeo, icoMat);
  scene.add(ico);
  // keep original vertex positions for the pulse animation
  const basePos = icoGeo.attributes.position.array.slice();

  const icoGlow = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.4, 0),
    new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    })
  );
  scene.add(icoGlow);

  /* ---------- Interaction ---------- */
  const mouse = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  window.addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  });
  window.addEventListener(
    "deviceorientation",
    (e) => {
      if (e.gamma == null) return;
      mouse.x = Math.max(-1, Math.min(1, e.gamma / 45));
      mouse.y = Math.max(-1, Math.min(1, e.beta / 90));
    },
    true
  );

  let scrollY = 0;
  window.addEventListener("scroll", () => {
    scrollY = window.scrollY || 0;
  });

  /* ---------- Resize ---------- */
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  /* ---------- Animate ---------- */
  const clock = new THREE.Clock();
  let paused = false;
  document.addEventListener("visibilitychange", () => {
    paused = document.hidden;
    if (!paused) animate();
  });

  function animate() {
    if (paused) return;
    requestAnimationFrame(animate);

    const t = clock.getElapsedTime();

    // smooth mouse parallax
    target.x += (mouse.x - target.x) * 0.04;
    target.y += (mouse.y - target.y) * 0.04;

    points.rotation.y = t * 0.02 + target.x * 0.4;
    points.rotation.x = target.y * 0.2;

    // pulsing icosahedron (breathing vertices)
    const pos = icoGeo.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      const bx = basePos[i], by = basePos[i + 1], bz = basePos[i + 2];
      const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
      const wave = 1 + Math.sin(t * 1.5 + bx * 2 + by * 2) * 0.06;
      pos[i] = (bx / len) * len * wave;
      pos[i + 1] = (by / len) * len * wave;
      pos[i + 2] = (bz / len) * len * wave;
    }
    icoGeo.attributes.position.needsUpdate = true;

    ico.rotation.x = t * 0.15 + target.y * 0.3;
    ico.rotation.y = t * 0.2 + target.x * 0.5;
    icoGlow.rotation.x = -t * 0.1;
    icoGlow.rotation.y = -t * 0.14;

    const s = 1 + Math.sin(t * 1.2) * 0.04;
    icoGlow.scale.setScalar(s);

    // gentle camera drift + subtle scroll dolly
    camera.position.x += (target.x * 1.2 - camera.position.x) * 0.03;
    camera.position.y += (-target.y * 0.8 - camera.position.y) * 0.03;
    camera.position.z = 9 + Math.min(scrollY / 400, 4);
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  if (reduce) {
    renderer.render(scene, camera); // one static frame
  } else {
    animate();
  }

  /* ---------- Helpers ---------- */
  function makeCircleTexture() {
    const size = 64;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.4, "rgba(255,255,255,0.6)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }
})();
