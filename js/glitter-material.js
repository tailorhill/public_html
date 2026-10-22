import * as THREE from 'three';

// Use the same typesetting for albedo and foil coverage, including overlapping
// rows and outlines. Black upper layers occlude glitter underneath them.
export function applyGlitter(viewer, material, cfg, top, bottom) {
  const colors = cfg.content?.rows.flatMap(row => row.els.map(e => e.color)) || [];
  if (!cfg.fullGlitter && ![...colors, cfg.symbolColor, cfg.shadowColor].some(c => c?.glitter)) return;
  const W = viewer.texCanvas.width, H = viewer.texCanvas.height;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (cfg.fullGlitter) { ctx.fillStyle = '#fff'; ctx.fillRect(0, top, W, bottom - top); }
  const maskColor = c => c ? { hex: c.glitter ? '#fff' : '#000' } : null;
  viewer.paintTextBlock(ctx, W, H, top, bottom, {
    ...cfg, symbolColor: maskColor(cfg.symbolColor), shadowColor: maskColor(cfg.shadowColor),
    content: cfg.content && { ...cfg.content, rows: cfg.content.rows.map(row => ({ ...row,
      els: row.els.map(e => e.t === 'text' || e.color ? { ...e, color: maskColor(e.color) } : e),
    })) },
  });
  const mask = new THREE.CanvasTexture(canvas);
  mask.wrapS = THREE.RepeatWrapping;
  mask.anisotropy = viewer.renderer.capabilities.getMaxAnisotropy();
  material.userData.glitterMask = mask;
  material.onBeforeCompile = shader => {
    shader.uniforms.foilMask = { value: mask };
    shader.uniforms.foilScale = { value: new THREE.Vector2(cfg.circumference * 75, cfg.width * 75) };
    shader.fragmentShader = `uniform sampler2D foilMask;
uniform vec2 foilScale;
float foilHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      vec2 foilUV = vMapUv * foilScale;
      // Fade facets smaller than a pixel rather than shimmer at a distance.
      float foilDetail = 1.0 - smoothstep(0.8, 2.5, max(fwidth(foilUV.x), fwidth(foilUV.y)));
      float foilCoverage = texture2D(foilMask, vMapUv).r;
      vec2 foilCell = floor(foilUV);
      float foilRandom = foilHash(foilCell);
      roughnessFactor = mix(roughnessFactor, mix(0.32, 0.19, foilDetail * foilRandom), foilCoverage);
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
      metalnessFactor = mix(metalnessFactor, 0.65, foilCoverage);
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      vec3 foilQx = dFdx(-vViewPosition), foilQy = dFdy(-vViewPosition);
      vec2 foilDx = dFdx(vMapUv), foilDy = dFdy(vMapUv);
      vec3 foilT = cross(foilQy, normal) * foilDx.x + cross(normal, foilQx) * foilDy.x;
      vec3 foilB = cross(foilQy, normal) * foilDx.y + cross(normal, foilQx) * foilDy.y;
      float foilInv = inversesqrt(max(max(dot(foilT, foilT), dot(foilB, foilB)), 0.00000001));
      vec2 foilTilt = vec2(foilRandom, foilHash(foilCell + vec2(19.3, 7.1))) - 0.5;
      normal = normalize(normal + (foilT * foilTilt.x + foilB * foilTilt.y) * foilInv * 1.6 * foilCoverage * foilDetail);
    `);
  };
  material.customProgramCacheKey = () => 'valley-foil-v1';
  material.needsUpdate = true;
}
