"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useFluid } from "@/contexts/FluidContext";

/* ─── GLSL VERTEX SHADER ─── */
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

/* ─── GLSL FRAGMENT SHADER ─── */
const fragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uViscosity;
  uniform float uFlowSpeed;
  uniform float uRefractionDepth;
  uniform float uCursorIntensity;

  uniform float uMatrixMode;

  varying vec2 vUv;

  // Simplex noise helpers
  vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // Fractal Brownian Motion
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 3; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 uvAspect = uv * aspect;
    float t = uTime * uFlowSpeed * 0.15;

    // ─── Fluid layers ───
    float viscFactor = mix(0.3, 2.0, uViscosity);
    float n1 = fbm(vec3(uvAspect * 2.5 * viscFactor, t * 0.8));
    float n2 = fbm(vec3(uvAspect * 3.5 * viscFactor + 5.0, t * 0.6 + 100.0));
    float n3 = fbm(vec3(uvAspect * 1.8 * viscFactor - 3.0, t * 1.1 + 200.0));

    // ─── Cursor interaction ───
    vec2 mouseUV = uMouse * 0.5 + 0.5;
    mouseUV.y = 1.0 - mouseUV.y;
    float dist = length((uv - mouseUV) * aspect);
    float cursorEffect = exp(-dist * dist * (8.0 - uCursorIntensity * 5.0)) * uCursorIntensity;

    // Distort fluid based on cursor
    float distortion = cursorEffect * uRefractionDepth * 0.4;
    n1 += distortion * sin(t * 3.0 + dist * 12.0);
    n2 -= distortion * cos(t * 2.5 - dist * 8.0);

    // ─── Color mapping ───
    // Multi color palettes! Normal mode vs Matrix Mode!
    vec3 base1 = mix(vec3(0.102, 0.020, 0.200), vec3(0.000, 0.100, 0.000), uMatrixMode);
    vec3 base2 = mix(vec3(0.176, 0.106, 0.412), vec3(0.010, 0.300, 0.020), uMatrixMode);
    vec3 base3 = mix(vec3(0.055, 0.427, 0.914), vec3(0.100, 0.800, 0.100), uMatrixMode);
    vec3 base4 = mix(vec3(0.047, 0.078, 0.271), vec3(0.000, 0.050, 0.000), uMatrixMode);
    vec3 accent = mix(vec3(0.133, 0.827, 0.933), vec3(0.500, 1.000, 0.500), uMatrixMode);

    float blend = n1 * 0.5 + 0.5;
    vec3 color = mix(base1, base2, smoothstep(0.2, 0.5, blend));
    color = mix(color, base3, smoothstep(0.5, 0.8, blend + n2 * 0.3) * 0.4);
    color = mix(color, base4, smoothstep(0.0, 0.3, n3 * 0.5 + 0.5) * 0.3);

    // Cursor glow
    color += accent * cursorEffect * 0.35;

    // Bright swirling highlights
    vec3 mixHighlight = mix(vec3(0.3, 0.2, 0.5), vec3(0.8, 1.0, 0.8), uMatrixMode);
    float highlight = smoothstep(0.55, 0.7, n1 + n3 * 0.3) * 0.15;
    color += mixHighlight * highlight;

    // Matrix digital lines effect superimposed
    if (uMatrixMode > 0.0) {
      float mLines = step(0.9, fract(uv.y * 30.0 - uTime * 2.0)) * 0.15;
      color += vec3(0.0, mLines, 0.0) * uMatrixMode;
    }

    // Subtle vignette
    float vig = 1.0 - smoothstep(0.3, 1.4, length(uv - 0.5) * 1.5);
    color *= mix(0.6, 1.0, vig);

    // Subtle grain
    float grain = (fract(sin(dot(uv * uResolution, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.03;
    color += grain;

    gl_FragColor = vec4(color, 1.0);
  }
`;

/* ─── FLUID MESH COMPONENT ─── */
function FluidMesh({ paused }: { paused?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();
  const { mousePosNormalized, params, matrixMode } = useFluid();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uViscosity: { value: params.viscosity },
      uFlowSpeed: { value: params.flowSpeed },
      uRefractionDepth: { value: params.refractionDepth },
      uCursorIntensity: { value: params.cursorIntensity },
      uMatrixMode: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
  }, [size, uniforms]);

  useFrame((state) => {
    if (!meshRef.current || paused) return;
    const material = meshRef.current.material as THREE.ShaderMaterial;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uMouse.value.lerp(
      new THREE.Vector2(mousePosNormalized.x, mousePosNormalized.y),
      0.15
    );
    material.uniforms.uViscosity.value = params.viscosity;
    material.uniforms.uFlowSpeed.value = params.flowSpeed;
    material.uniforms.uRefractionDepth.value = params.refractionDepth;
    material.uniforms.uCursorIntensity.value = params.cursorIntensity;
    material.uniforms.uMatrixMode.value = THREE.MathUtils.lerp(material.uniforms.uMatrixMode.value, matrixMode ? 1.0 : 0.0, 0.1);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

/* ─── EXPORTED COMPONENT ─── */
export default function FluidBackground({ paused }: { paused?: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-0 transition-opacity duration-1000 ${paused ? 'opacity-40' : 'opacity-100'}`}
      style={{ pointerEvents: "none" }}
    >
      <Canvas
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: false,
        }}
        dpr={[0.5, 1]}
        camera={{ position: [0, 0, 1] }}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      >
        <FluidMesh paused={paused} />
      </Canvas>
    </div>
  );
}
