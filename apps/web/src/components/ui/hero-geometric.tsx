'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface HeroGeometricProps {
  color1?: string;
  color2?: string;
  speed?: number;
  className?: string;
}

export function HeroGeometric({
  color1 = '#0C4DA2',
  color2 = '#E6E6FA',
  speed = 1.0,
  className,
}: HeroGeometricProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.warn('WebGL not supported');
      return;
    }

    // Helper to parse hex color to [r, g, b] normalized array
    const hexToRgb = (hex: string): [number, number, number] => {
      const cleanHex = hex.replace('#', '');
      const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
      const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
      const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
      return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
    };

    // Vertex Shader Source
    const vsSource = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment Shader Source
    const fsSource = `
      precision highp float;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      varying vec2 vUv;

      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                 -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      float bayerDither4x4(vec2 uv) {
          int x = int(mod(uv.x, 4.0));
          int y = int(mod(uv.y, 4.0));
          int index = y * 4 + x;
          if (index == 0) return 0.0;
          if (index == 1) return 8.0/16.0;
          if (index == 2) return 2.0/16.0;
          if (index == 3) return 10.0/16.0;
          if (index == 4) return 12.0/16.0;
          if (index == 5) return 4.0/16.0;
          if (index == 6) return 14.0/16.0;
          if (index == 7) return 6.0/16.0;
          if (index == 8) return 3.0/16.0;
          if (index == 9) return 11.0/16.0;
          if (index == 10) return 1.0/16.0;
          if (index == 11) return 9.0/16.0;
          if (index == 12) return 15.0/16.0;
          if (index == 13) return 7.0/16.0;
          if (index == 14) return 13.0/16.0;
          return 5.0/16.0;
      }

      void main() {
          vec2 uv = vUv;
          vec2 coord = gl_FragCoord.xy;
          
          float noise = snoise(uv * 1.5 + vec2(uTime * 0.05, uTime * 0.03)) * 0.25;
          float diagonal = (uv.x + uv.y) * 0.5;
          float gradient = diagonal * 1.2 + noise;
          
          vec3 deepBlue = uColor1;
          vec3 paleBlue = uColor2;
          vec3 softBlue = mix(deepBlue, paleBlue, 0.33);
          vec3 lightBlue = mix(deepBlue, paleBlue, 0.66);
          
          vec3 color;
          if (gradient < 0.3) {
              color = deepBlue;
          } else if (gradient < 0.55) {
              color = softBlue;
          } else if (gradient < 0.8) {
              color = lightBlue;
          } else {
              color = paleBlue;
          }
          
          float dither = bayerDither4x4(coord);
          float threshold = fract(gradient * 4.0);
          
          if (gradient < 0.3 && threshold > dither * 0.5) {
              color = softBlue;
          } else if (gradient >= 0.3 && gradient < 0.55 && threshold > dither * 0.5) {
              color = lightBlue;
          } else if (gradient >= 0.55 && gradient < 0.8 && threshold > dither * 0.5) {
              color = paleBlue;
          }
          
          vec2 cornerDist = vec2(uv.x, uv.y);
          float fadeMask = smoothstep(0.0, 0.25, length(cornerDist));
          color = mix(vec3(1.0), color, fadeMask);
          
          float vignette = smoothstep(1.2, 0.3, length(uv - 0.5));
          color = mix(color, color * 0.95, (1.0 - vignette) * 0.3);
          
          gl_FragColor = vec4(color, 1.0);
      }
    `;

    // Create shader helper
    const loadShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = loadShader(gl.VERTEX_SHADER, vsSource);
    const fs = loadShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    // Create Program
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Shader program linking error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Vertex data: two triangles for a full screen quad
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Look up uniform locations
    const uTimeLoc = gl.getUniformLocation(program, 'uTime');
    const uResolutionLoc = gl.getUniformLocation(program, 'uResolution');
    const uColor1Loc = gl.getUniformLocation(program, 'uColor1');
    const uColor2Loc = gl.getUniformLocation(program, 'uColor2');

    let animationFrameId: number;
    const startTime = performance.now();

    const resize = () => {
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    const render = () => {
      resize();

      const time = (performance.now() - startTime) * 0.001 * speed;
      gl.uniform1f(uTimeLoc, time);
      gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);

      const rgb1 = hexToRgb(color1);
      const rgb2 = hexToRgb(color2);
      gl.uniform3f(uColor1Loc, rgb1[0], rgb1[1], rgb1[2]);
      gl.uniform3f(uColor2Loc, rgb2[0], rgb2[1], rgb2[2]);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, [color1, color2, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('w-full h-full block bg-white', className)}
    />
  );
}
