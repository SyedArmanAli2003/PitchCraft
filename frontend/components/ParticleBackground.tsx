"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 5

    const mouse = new THREE.Vector2(0, 0)
    const target = new THREE.Vector2(0, 0)
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener("mousemove", onMouseMove)

    const COUNT = 180
    const positions = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)
    const palette = [
      new THREE.Color(0x6d28d9), new THREE.Color(0x7c3aed),
      new THREE.Color(0x8b5cf6), new THREE.Color(0xa78bfa),
      new THREE.Color(0x4f46e5), new THREE.Color(0x06b6d4),
    ]
    for (let i = 0; i < COUNT; i++) {
      positions[i*3]   = (Math.random() - 0.5) * 14
      positions[i*3+1] = (Math.random() - 0.5) * 9
      positions[i*3+2] = (Math.random() - 0.5) * 6
      const c = palette[Math.random() < 0.08 ? 5 : Math.floor(Math.random() * 5)]
      colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3))

    const tc = document.createElement("canvas")
    tc.width = tc.height = 64
    const ctx = tc.getContext("2d")!
    const g = ctx.createRadialGradient(32,32,0,32,32,32)
    g.addColorStop(0, "rgba(255,255,255,1)")
    g.addColorStop(0.4, "rgba(255,255,255,0.6)")
    g.addColorStop(1, "rgba(255,255,255,0)")
    ctx.fillStyle = g; ctx.fillRect(0,0,64,64)
    const tex = new THREE.CanvasTexture(tc)

    const mat = new THREE.PointsMaterial({
      size: 0.06, map: tex, vertexColors: true,
      transparent: true, opacity: 0.75,
      sizeAttenuation: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const particles = new THREE.Points(geo, mat)
    scene.add(particles)

    const blob1 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.8, 4),
      new THREE.MeshBasicMaterial({ color: 0x6d28d9, transparent: true, opacity: 0.06, depthWrite: false })
    )
    blob1.position.set(3, -0.5, -2)
    scene.add(blob1)

    const linePos: number[] = []
    for (let i = 0; i < COUNT; i++) {
      for (let j = i+1; j < COUNT; j++) {
        const dx = positions[i*3]-positions[j*3]
        const dy = positions[i*3+1]-positions[j*3+1]
        const dz = positions[i*3+2]-positions[j*3+2]
        if (Math.sqrt(dx*dx+dy*dy+dz*dz) < 2.2)
          linePos.push(positions[i*3],positions[i*3+1],positions[i*3+2],positions[j*3],positions[j*3+1],positions[j*3+2])
      }
    }
    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(linePos), 3))
    const lines = new THREE.LineSegments(lineGeo,
      new THREE.LineBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false })
    )
    scene.add(lines)

    let id: number, t = 0
    const animate = () => {
      id = requestAnimationFrame(animate)
      t += 0.006
      target.x += (mouse.x - target.x) * 0.04
      target.y += (mouse.y - target.y) * 0.04
      particles.rotation.y = t*0.04 + target.x*0.15
      particles.rotation.x = t*0.02 + target.y*0.08
      lines.rotation.y = particles.rotation.y
      lines.rotation.x = particles.rotation.x
      blob1.position.x = 3 + target.x*0.6
      blob1.position.y = -0.5 + target.y*0.4
      blob1.rotation.y = t*0.3
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("resize", onResize)
      renderer.dispose(); geo.dispose(); mat.dispose()
      lineGeo.dispose(); tex.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
}
