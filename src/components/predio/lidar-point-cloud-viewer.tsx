"use client"

import * as React from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

import { LIDAR_RENDER_POINT_CAP } from "@/lib/drone-images"

/** 8-byte magic so header is 20 bytes (Float32-aligned). */
const MAGIC = "FICPCD1\0"
const HEADER_BYTES = 20
const POINT_SIZE_PX = 3.5

type LidarCloud = {
  count: number
  positions: Float32Array
  rgb: Uint8Array
  vmin: number
  vmax: number
}

function elevationToRgb(t: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, t))
  const stops: Array<[number, [number, number, number]]> = [
    [0, [51, 51, 153]],
    [0.25, [42, 122, 176]],
    [0.5, [143, 216, 211]],
    [0.75, [200, 232, 142]],
    [1, [220, 140, 51]],
  ]
  for (let i = 0; i < stops.length - 1; i++) {
    const [p0, c0] = stops[i]
    const [p1, c1] = stops[i + 1]
    if (x >= p0 && x <= p1) {
      const f = (x - p0) / (p1 - p0 + 1e-9)
      return [
        (c0[0] + (c1[0] - c0[0]) * f) / 255,
        (c0[1] + (c1[1] - c0[1]) * f) / 255,
        (c0[2] + (c1[2] - c0[2]) * f) / 255,
      ]
    }
  }
  return [0.86, 0.55, 0.2]
}

function makePointSprite() {
  const size = 48
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (ctx) {
    const g = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    )
    g.addColorStop(0, "rgba(255,255,255,1)")
    g.addColorStop(0.4, "rgba(255,255,255,0.88)")
    g.addColorStop(0.68, "rgba(255,255,255,0.35)")
    g.addColorStop(1, "rgba(255,255,255,0)")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.NoColorSpace
  tex.needsUpdate = true
  return tex
}

function parseFicpcd(buf: ArrayBuffer): LidarCloud {
  const u8 = new Uint8Array(buf)
  const magic = String.fromCharCode(...u8.subarray(0, 8))
  if (magic !== MAGIC) {
    throw new Error(`Formato LiDAR inválido (${JSON.stringify(magic)})`)
  }
  const view = new DataView(buf)
  const count = view.getUint32(8, true)
  const vmin = view.getFloat32(12, true)
  const vmax = view.getFloat32(16, true)
  const posBytes = count * 3 * 4
  // Always copy into a freshly allocated, 4-byte-aligned buffer.
  const posCopy = new Uint8Array(posBytes)
  posCopy.set(new Uint8Array(buf, HEADER_BYTES, posBytes))
  const positions = new Float32Array(posCopy.buffer)
  const rgb = Uint8Array.from(
    new Uint8Array(buf, HEADER_BYTES + posBytes, count * 3)
  )
  return { count, positions, rgb, vmin, vmax }
}

function buildPoints(data: LidarCloud, colorMode: "rgb" | "canopy") {
  const n = data.count
  let step = 1
  if (n > LIDAR_RENDER_POINT_CAP) {
    step = Math.ceil(n / LIDAR_RENDER_POINT_CAP)
  }

  const outN = Math.ceil(n / step)
  const verts = new Float32Array(outN * 3)
  const cols = new Float32Array(outN * 3)
  const span = Math.max(data.vmax - data.vmin, 1e-6)
  let oi = 0

  for (let i = 0; i < n; i += step) {
    const pi = i * 3
    verts[oi * 3] = data.positions[pi]
    verts[oi * 3 + 1] = data.positions[pi + 1]
    verts[oi * 3 + 2] = data.positions[pi + 2]

    if (colorMode === "rgb") {
      cols[oi * 3] = data.rgb[pi] / 255
      cols[oi * 3 + 1] = data.rgb[pi + 1] / 255
      cols[oi * 3 + 2] = data.rgb[pi + 2] / 255
    } else {
      const z = data.positions[pi + 2]
      const t = Math.max(0, Math.min(1, (z - data.vmin) / span))
      const [r, g, b] = elevationToRgb(t)
      cols[oi * 3] = r
      cols[oi * 3 + 1] = g
      cols[oi * 3 + 2] = b
    }
    oi += 1
  }

  const geom = new THREE.BufferGeometry()
  const posAttr = new THREE.BufferAttribute(verts.subarray(0, oi * 3).slice(), 3)
  const colAttr = new THREE.BufferAttribute(cols.subarray(0, oi * 3).slice(), 3)
  // Vertex colors already in display/sRGB space (match fic_agro / pre-r152 look)
  colAttr.setUsage(THREE.StaticDrawUsage)
  geom.setAttribute("position", posAttr)
  geom.setAttribute("color", colAttr)
  geom.computeBoundingSphere()

  const mat = new THREE.PointsMaterial({
    size: POINT_SIZE_PX,
    map: makePointSprite(),
    alphaTest: 0.15,
    vertexColors: true,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.94,
    depthWrite: false,
  })

  return { points: new THREE.Points(geom, mat), rendered: oi, total: n, step }
}

type LidarPointCloudViewerProps = {
  url: string
  className?: string
}

export function LidarPointCloudViewer({
  url,
  className,
}: LidarPointCloudViewerProps) {
  const hostRef = React.useRef<HTMLDivElement>(null)
  const dataRef = React.useRef<LidarCloud | null>(null)
  const sceneRef = React.useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    controls: OrbitControls
    renderer: THREE.WebGLRenderer
    points: THREE.Points | null
    sprite: THREE.Texture | null
  } | null>(null)
  const colorModeRef = React.useRef<"rgb" | "canopy">("rgb")

  const [status, setStatus] = React.useState<"loading" | "ready" | "error">(
    "loading"
  )
  const [progress, setProgress] = React.useState(0)
  const [info, setInfo] = React.useState("")
  const [colorMode, setColorMode] = React.useState<"rgb" | "canopy">("rgb")

  colorModeRef.current = colorMode

  const applyCloud = React.useCallback(
    (data: LidarCloud, mode: "rgb" | "canopy", fitCamera: boolean) => {
      const ctx = sceneRef.current
      if (!ctx) return
      const built = buildPoints(data, mode)
      if (!built) return

      if (ctx.points) {
        ctx.scene.remove(ctx.points)
        ctx.points.geometry.dispose()
        const oldMat = ctx.points.material as THREE.PointsMaterial
        if (oldMat.map && oldMat.map !== ctx.sprite) oldMat.map.dispose()
        oldMat.dispose()
      }
      ctx.points = built.points
      ctx.scene.add(built.points)

      if (fitCamera) {
        const box = new THREE.Box3().setFromObject(built.points)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const spanXY = Math.max(size.x, size.y, 1)
        const spanZ = Math.max(size.z, 0.5)
        const zContrib = Math.min(spanZ * 0.45, spanXY * 0.35)
        const dist = spanXY * 1.05
        ctx.camera.near = Math.max(0.05, spanXY * 0.002)
        ctx.camera.far = Math.max(5000, spanXY * 20)
        ctx.camera.updateProjectionMatrix()
        ctx.camera.position.set(
          center.x,
          center.y - dist,
          center.z + zContrib + spanXY * 0.12
        )
        ctx.controls.target.copy(center)
        ctx.controls.minDistance = spanXY * 0.25
        ctx.controls.maxDistance = spanXY * 6
        ctx.controls.update()
      }

      setInfo((prev) => {
        const next =
          `${built.rendered.toLocaleString("es-CL")} / ${built.total.toLocaleString("es-CL")} puntos` +
          (built.step > 1 ? ` (paso ${built.step})` : " · densidad máxima")
        return prev === next ? prev : next
      })
      setStatus((s) => (s === "ready" ? s : "ready"))
    },
    []
  )

  React.useEffect(() => {
    const host = hostRef.current
    if (!host) return

    // Match fic_agro look: treat vertex RGB as already display-referred.
    THREE.ColorManagement.enabled = false

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0c1210)
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 5000)
    camera.up.set(0, 0, 1)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    })
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    host.replaceChildren(renderer.domElement)
    renderer.domElement.style.display = "block"
    renderer.domElement.style.width = "100%"
    renderer.domElement.style.height = "100%"

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.screenSpacePanning = true
    scene.add(new THREE.AmbientLight(0xffffff, 1))

    sceneRef.current = {
      scene,
      camera,
      controls,
      renderer,
      points: null,
      sprite: null,
    }

    const resize = () => {
      const w = Math.max(host.clientWidth, 1)
      const h = Math.max(host.clientHeight, 1)
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    let raf = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      const pts = sceneRef.current?.points
      if (pts) {
        scene.remove(pts)
        pts.geometry.dispose()
        ;(pts.material as THREE.Material).dispose()
      }
      renderer.dispose()
      sceneRef.current = null
      host.replaceChildren()
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    dataRef.current = null
    setStatus("loading")
    setProgress(0)
    setInfo("")
    const ctx = sceneRef.current
    if (ctx?.points) {
      ctx.scene.remove(ctx.points)
      ctx.points.geometry.dispose()
      ;(ctx.points.material as THREE.Material).dispose()
      ctx.points = null
    }

    ;(async () => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const reader = res.body?.getReader()
        const total = Number(res.headers.get("content-length") || 0)
        let received = 0
        const chunks: Uint8Array[] = []
        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            if (value) {
              chunks.push(value)
              received += value.length
              if (total > 0 && !cancelled) {
                setProgress(Math.min(99, (received / total) * 100))
              }
            }
          }
        } else {
          const ab = await res.arrayBuffer()
          if (cancelled) return
          const data = parseFicpcd(ab)
          dataRef.current = data
          setProgress(100)
          applyCloud(data, colorModeRef.current, true)
          return
        }

        const merged = new Uint8Array(received)
        let offset = 0
        for (const c of chunks) {
          merged.set(c, offset)
          offset += c.length
        }
        if (cancelled) return
        const data = parseFicpcd(merged.buffer)
        dataRef.current = data
        setProgress(100)
        // Wait a frame so the WebGL scene effect is mounted (Strict Mode safe).
        await new Promise((r) => requestAnimationFrame(() => r(null)))
        if (cancelled) return
        applyCloud(data, colorModeRef.current, true)
      } catch (e) {
        console.error(e)
        if (!cancelled) setStatus("error")
      }
    })()

    return () => {
      cancelled = true
    }
  }, [url, applyCloud])

  React.useEffect(() => {
    if (!dataRef.current) return
    applyCloud(dataRef.current, colorMode, false)
  }, [colorMode, applyCloud])

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-xl bg-[#0c1210] ring-1 ring-foreground/10">
        <div ref={hostRef} className="aspect-video w-full" />
        {status === "loading" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 text-white">
            <p className="text-sm font-medium">Cargando nube LiDAR…</p>
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full bg-emerald-400 transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] text-white/70">
              ~35 MB · hasta 2,3 M puntos
            </p>
          </div>
        ) : null}
        {status === "error" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 px-4 text-center text-sm text-red-200">
            No se pudo cargar la nube de puntos LiDAR.
          </div>
        ) : null}
        {status === "ready" ? (
          <div className="pointer-events-none absolute right-2 bottom-2 rounded-md bg-black/60 px-2 py-1 text-[11px] text-white">
            {info}
          </div>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Arrastra para orbitar · rueda para zoom · clic derecho para pan
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            className={`rounded-md px-2 py-1 text-xs ring-1 ring-foreground/10 ${
              colorMode === "canopy" ? "bg-muted font-medium" : "bg-background"
            }`}
            onClick={() => setColorMode("canopy")}
          >
            Altura dosel
          </button>
          <button
            type="button"
            className={`rounded-md px-2 py-1 text-xs ring-1 ring-foreground/10 ${
              colorMode === "rgb" ? "bg-muted font-medium" : "bg-background"
            }`}
            onClick={() => setColorMode("rgb")}
          >
            RGB
          </button>
        </div>
      </div>
    </div>
  )
}
