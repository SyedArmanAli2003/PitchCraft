import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Renderer ──────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    // ── Scene + Camera ────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // ── Mouse tracking ────────────────────────────────────
    const mouse = new THREE.Vector2(0, 0);
    const target = new THREE.Vector2(0, 0);
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // ── Particle field ────────────────────────────────────
    const PARTICLE_COUNT = 180;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    const palette = [
      new THREE.Color(0x6d28d9), // deep purple
      new THREE.Color(0x7c3aed), // violet
      new THREE.Color(0x8b5cf6), // medium purple
      new THREE.Color(0xa78bfa), // lavender
      new THREE.Color(0x4f46e5), // indigo
      new THREE.Color(0x06b6d4), // cyan accent (rare)
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;

      const c = palette[Math.random() < 0.08 ? 5 : Math.floor(Math.random() * 5)];
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = Math.random() < 0.15
        ? Math.random() * 0.06 + 0.04
        : Math.random() * 0.025 + 0.005;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color",    new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("size",     new THREE.BufferAttribute(sizes, 1));

    // Soft circular particle texture — drawn on canvas, no file load
    const tex = (() => {
      const size = 64;
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const ctx = c.getContext("2d")!;
      const grad = ctx.createRadialGradient(
        size / 2, size / 2, 0,
        size / 2, size / 2, size / 2
      );
      grad.addColorStop(0,   "rgba(255,255,255,1)");
      grad.addColorStop(0.4, "rgba(255,255,255,0.6)");
      grad.addColorStop(1,   "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(c);
    })();

    const mat = new THREE.PointsMaterial({
      size: 0.06,
      map: tex,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    // ── Glowing blobs ─────────────────────────────────────
    const blobGeo = new THREE.IcosahedronGeometry(1.8, 4);
    const blobMat = new THREE.MeshBasicMaterial({
      color: 0x6d28d9,
      transparent: true,
      opacity: 0.06,
      wireframe: false,
      depthWrite: false,
    });
    const blob = new THREE.Mesh(blobGeo, blobMat);
    blob.position.set(3, -0.5, -2);
    scene.add(blob);

    const blob2Geo = new THREE.IcosahedronGeometry(1.2, 3);
    const blob2Mat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.04,
      wireframe: false,
      depthWrite: false,
    });
    const blob2 = new THREE.Mesh(blob2Geo, blob2Mat);
    blob2.position.set(-2, 1, -1);
    scene.add(blob2);

    // ── Constellation lines ───────────────────────────────
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lineGeo = new THREE.BufferGeometry();
    const linePositions: number[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const dx = positions[i * 3]     - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 2.2) {
          linePositions.push(
            positions[i * 3],     positions[i * 3 + 1], positions[i * 3 + 2],
            positions[j * 3],     positions[j * 3 + 1], positions[j * 3 + 2]
          );
        }
      }
    }
    lineGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(linePositions), 3)
    );
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // ── Animation loop ────────────────────────────────────
    let animId: number;
    let time = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.006;

      // Smooth mouse follow
      target.x += (mouse.x - target.x) * 0.04;
      target.y += (mouse.y - target.y) * 0.04;

      // Particle field rotation
      particles.rotation.y = time * 0.04 + target.x * 0.15;
      particles.rotation.x = time * 0.02 + target.y * 0.08;

      // Lines follow particles
      lines.rotation.y = particles.rotation.y;
      lines.rotation.x = particles.rotation.x;

      // Blobs react to mouse
      blob.position.x  = 3 + target.x * 0.6;
      blob.position.y  = -0.5 + target.y * 0.4;
      blob.rotation.y  = time * 0.3;
      blob.rotation.x  = time * 0.2;

      blob2.position.x = -2 - target.x * 0.3;
      blob2.position.y = 1 + target.y * 0.3;
      blob2.rotation.y = -time * 0.25;

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // ── Cleanup ───────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      blobGeo.dispose();
      blobMat.dispose();
      blob2Geo.dispose();
      blob2Mat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      tex.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: "block" }}
    />
  );
}
