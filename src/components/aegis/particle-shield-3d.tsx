'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * ParticleShield3D — an interactive 3D shield made of particles.
 *
 * A sphere of ~2000 particles forms a shield shape. The shield:
 *   - Rotates slowly on its own
 *   - Tilts toward the mouse (parallax)
 *   - Pulses subtly (breathing)
 *   - Particles are colored in the mint-jade Aegis palette
 *
 * Uses Three.js with a custom shader for the particles (size + color
 * attenuation by depth). Paused when off-screen via IntersectionObserver.
 *
 * This replaces the dot-matrix WebGL background in the hero — it's the
 * "living, breathing digital organism" the VLM recommended.
 */
export function ParticleShield3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000,
    );
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Particle geometry — sphere distribution using fibonacci spiral
    const PARTICLE_COUNT = 2000;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    const colorA = new THREE.Color('#5eead4'); // mint primary
    const colorB = new THREE.Color('#0f3a2a'); // deep jade
    const sphereRadius = 3;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Fibonacci sphere distribution — even spread
      const phi = Math.acos(1 - (2 * (i + 0.5)) / PARTICLE_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      // Flatten slightly to make it shield-like (elongated on Y)
      const r = sphereRadius * (0.9 + Math.random() * 0.2);
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.cos(phi) * r * 1.2; // elongate Y
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;

      // Color: blend between mint and deep jade based on Y position
      const t = (positions[i * 3 + 1] + sphereRadius) / (sphereRadius * 2);
      const color = colorA.clone().lerp(colorB, t);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 1.0 + Math.random() * 2.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    // Custom shader material — particles with size + color attenuation
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uMouse: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: `
        attribute float aSize;
        attribute vec3 aColor;
        varying vec3 vColor;
        varying float vDepth;
        uniform float uTime;
        uniform float uPixelRatio;
        uniform vec2 uMouse;

        void main() {
          vColor = aColor;
          vec3 pos = position;

          // Subtle breathing — particles pulse outward slightly
          float breath = sin(uTime * 0.8) * 0.05 + 1.0;
          pos *= breath;

          // Mouse parallax — tilt the whole field
          pos.x += uMouse.x * 0.3;
          pos.y += uMouse.y * 0.3;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = aSize * uPixelRatio * (8.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;

          vDepth = -mvPosition.z;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vDepth;

        void main() {
          // Circular particle with soft edge
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          if (dist > 0.5) discard;

          float alpha = smoothstep(0.5, 0.0, dist);
          // Depth attenuation — farther particles are dimmer
          alpha *= smoothstep(12.0, 4.0, vDepth);

          gl_FragColor = vec4(vColor, alpha * 1.0);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Wireframe overlay — a subtle icosahedron wireframe for structure
    const icoGeo = new THREE.IcosahedronGeometry(sphereRadius * 1.15, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0x5eead4,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const ico = new THREE.Mesh(icoGeo, icoMat);
    scene.add(ico);

    // Mouse tracking
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Resize
    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // IntersectionObserver — pause when off-screen
    let isVisible = true;
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? false;
      },
      { threshold: 0 },
    );
    observer.observe(mount);

    // Animation loop
    const clock = new THREE.Clock();
    let rafId: number;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      // Smooth mouse lerp
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      material.uniforms.uTime.value = elapsed;
      material.uniforms.uMouse.value.set(mouse.x, mouse.y);

      // Rotation
      particles.rotation.y = elapsed * 0.1 + mouse.x * 0.3;
      particles.rotation.x = mouse.y * 0.2;
      ico.rotation.y = elapsed * 0.08 + mouse.x * 0.2;
      ico.rotation.x = mouse.y * 0.15;

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
      geometry.dispose();
      material.dispose();
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
