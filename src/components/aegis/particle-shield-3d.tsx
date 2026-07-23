'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * ParticleShield3D — an immersive 3D particle shield with a cinematic entrance.
 *
 * Enhanced features:
 *   - **Cinematic entrance**: particles start scattered in a vast cloud, then
 *     converge into the shield shape over 2.5s (timed to play after the loader)
 *   - **Inner core glow**: a pulsing sphere of light at the center
 *   - **Orbiting ring**: a thin particle ring orbiting the shield on the XZ plane
 *   - **Mouse parallax**: shield tilts toward cursor (smooth lerp)
 *   - **Breathing**: subtle scale pulse
 *   - **Color gradient**: mint top → deep jade bottom, with brighter rim particles
 *   - **Wireframe icosahedron**: geometric structure overlay
 *   - **Scroll-linked fade**: shield dims as user scrolls past hero
 *
 * Paused when off-screen via IntersectionObserver.
 */
export function ParticleShield3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.z = 9;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // ---- Main particle shield ----
    const PARTICLE_COUNT = 2500;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
    const startPositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    const colorA = new THREE.Color('#5eead4');
    const colorB = new THREE.Color('#0f3a2a');
    const colorRim = new THREE.Color('#7df9e8');
    const sphereRadius = 3.2;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / PARTICLE_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = sphereRadius * (0.92 + Math.random() * 0.16);

      // Target = shield shape (elongated Y)
      targetPositions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      targetPositions[i * 3 + 1] = Math.cos(phi) * r * 1.25;
      targetPositions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;

      // Start = scattered cloud (far away, random)
      const cloudR = 15 + Math.random() * 10;
      const cloudPhi = Math.random() * Math.PI * 2;
      const cloudTheta = Math.random() * Math.PI;
      startPositions[i * 3] = Math.sin(cloudTheta) * Math.cos(cloudPhi) * cloudR;
      startPositions[i * 3 + 1] = Math.cos(cloudTheta) * cloudR;
      startPositions[i * 3 + 2] = Math.sin(cloudTheta) * Math.sin(cloudPhi) * cloudR;

      // Initial position = start (will lerp to target)
      positions[i * 3] = startPositions[i * 3];
      positions[i * 3 + 1] = startPositions[i * 3 + 1];
      positions[i * 3 + 2] = startPositions[i * 3 + 2];

      // Color: blend mint→jade by Y, with brighter rim
      const t = (targetPositions[i * 3 + 1] + sphereRadius) / (sphereRadius * 2);
      const distFromCenter = Math.sqrt(
        targetPositions[i * 3] ** 2 + targetPositions[i * 3 + 2] ** 2,
      );
      const rimFactor = Math.min(1, distFromCenter / sphereRadius);
      const color = colorA.clone().lerp(colorB, t).lerp(colorRim, rimFactor * 0.3);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 1.0 + Math.random() * 2.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uConverge: { value: 0 }, // 0 = scattered, 1 = shield shape
      },
      vertexShader: `
        attribute float aSize;
        attribute vec3 aColor;
        varying vec3 vColor;
        varying float vDepth;
        uniform float uTime;
        uniform float uPixelRatio;
        uniform vec2 uMouse;
        uniform float uConverge;

        void main() {
          vColor = aColor;
          vec3 pos = position;

          // Breathing — only when converged
          float breath = mix(1.0, sin(uTime * 0.8) * 0.04 + 1.0, uConverge);
          pos *= breath;

          // Mouse parallax
          pos.x += uMouse.x * 0.3;
          pos.y += uMouse.y * 0.3;

          // Slight swirl when converging
          float angle = uTime * 0.3 * (1.0 - uConverge);
          float ca = cos(angle), sa = sin(angle);
          pos.xz = mat2(ca, -sa, sa, ca) * pos.xz;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = aSize * uPixelRatio * (10.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          vDepth = -mvPosition.z;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vDepth;

        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.0, dist);
          alpha *= smoothstep(14.0, 3.0, vDepth);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // ---- Inner core glow — pulsing sphere of light ----
    const coreGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x5eead4,
      transparent: true,
      opacity: 0,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // ---- Orbiting ring — thin particle ring on XZ plane ----
    const RING_COUNT = 200;
    const ringPositions = new Float32Array(RING_COUNT * 3);
    const ringColors = new Float32Array(RING_COUNT * 3);
    const ringSizes = new Float32Array(RING_COUNT);
    const ringRadius = 4.5;

    for (let i = 0; i < RING_COUNT; i++) {
      const angle = (i / RING_COUNT) * Math.PI * 2;
      ringPositions[i * 3] = Math.cos(angle) * ringRadius;
      ringPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      ringPositions[i * 3 + 2] = Math.sin(angle) * ringRadius;
      ringColors[i * 3] = 0.37;
      ringColors[i * 3 + 1] = 0.92;
      ringColors[i * 3 + 2] = 0.83;
      ringSizes[i] = 0.5 + Math.random() * 1.0;
    }

    const ringGeo = new THREE.BufferGeometry();
    ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));
    ringGeo.setAttribute('aColor', new THREE.BufferAttribute(ringColors, 3));
    ringGeo.setAttribute('aSize', new THREE.BufferAttribute(ringSizes, 1));

    const ringMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float aSize;
        attribute vec3 aColor;
        varying vec3 vColor;
        uniform float uTime;
        uniform float uPixelRatio;

        void main() {
          vColor = aColor;
          vec3 pos = position;
          // Rotate the ring
          float angle = uTime * 0.15;
          float ca = cos(angle), sa = sin(angle);
          pos.xz = mat2(ca, -sa, sa, ca) * pos.xz;
          // Wobble
          pos.y += sin(uTime * 0.5 + pos.x * 0.5) * 0.15;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = aSize * uPixelRatio * (8.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.0, d) * 0.7;
          gl_FragColor = vec4(vColor, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const ring = new THREE.Points(ringGeo, ringMat);
    scene.add(ring);

    // ---- Wireframe icosahedron ----
    const icoGeo = new THREE.IcosahedronGeometry(sphereRadius * 1.15, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0x5eead4,
      wireframe: true,
      transparent: true,
      opacity: 0,
    });
    const ico = new THREE.Mesh(icoGeo, icoMat);
    scene.add(ico);

    // ---- Mouse tracking ----
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // ---- Resize ----
    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // ---- IntersectionObserver ----
    let isVisible = true;
    const observer = new IntersectionObserver(
      (entries) => { isVisible = entries[0]?.isIntersecting ?? false; },
      { threshold: 0 },
    );
    observer.observe(mount);

    // ---- Convergence animation (cinematic entrance) ----
    // Starts at 1.9s (after loader exits), converges over 2.5s
    const CONVERGE_START = 1.9;
    const CONVERGE_DURATION = 2.5;
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;

    // ---- Animation loop ----
    const clock = new THREE.Clock();
    let rafId: number;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      // Smooth mouse lerp
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      // Convergence: lerp positions from scattered → shield
      let converge = 0;
      if (elapsed >= CONVERGE_START) {
        converge = Math.min(1, (elapsed - CONVERGE_START) / CONVERGE_DURATION);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - converge, 3);
        for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
          positions[i] = startPositions[i] + (targetPositions[i] - startPositions[i]) * eased;
        }
        posAttr.needsUpdate = true;
      }

      material.uniforms.uTime.value = elapsed;
      material.uniforms.uMouse.value.set(mouse.x, mouse.y);
      material.uniforms.uConverge.value = converge;

      ringMat.uniforms.uTime.value = elapsed;

      // Core glow — fades in as shield converges, then pulses
      const corePulse = 0.3 + Math.sin(elapsed * 1.5) * 0.1;
      coreMat.opacity = converge * corePulse;
      core.scale.setScalar(1 + Math.sin(elapsed * 1.5) * 0.1);

      // Wireframe — fades in as shield converges
      icoMat.opacity = converge * 0.12;

      // Rotation
      particles.rotation.y = elapsed * 0.08 + mouse.x * 0.3;
      particles.rotation.x = mouse.y * 0.2;
      ico.rotation.y = elapsed * 0.06 + mouse.x * 0.2;
      ico.rotation.x = mouse.y * 0.15;
      ring.rotation.x = Math.PI * 0.1;

      renderer.render(scene, camera);
    };
    animate();

    // ---- Cleanup ----
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
      geometry.dispose();
      material.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      icoGeo.dispose();
      icoMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full" aria-hidden />;
}
