/* ============ 陪读小喵 · 轻量 glTF 2.0 .glb 加载器（Three.js r152） ============ */
window.PDM = window.PDM || {};
(function (PDM) {
  'use strict';
  const THREE = window.THREE;
  if (!THREE) return;

  const MAGIC = 0x46546C67;
  const JSON_CHUNK = 0x4E4F534A;
  const BIN_CHUNK = 0x004E4942;
  const COMP = {
    5120: { bytes: 1, Typed: Int8Array, norm: 127 },
    5121: { bytes: 1, Typed: Uint8Array, norm: 255 },
    5122: { bytes: 2, Typed: Int16Array, norm: 32767 },
    5123: { bytes: 2, Typed: Uint16Array, norm: 65535 },
    5125: { bytes: 4, Typed: Uint32Array, norm: 1 },
    5126: { bytes: 4, Typed: Float32Array, norm: 1 }
  };
  const ELEMS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
  const ATTR_MAP = { POSITION: 'position', NORMAL: 'normal', TEXCOORD_0: 'uv', COLOR_0: 'color' };

  function parseGlb(buffer) {
    const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    if (u8.byteLength < 20) throw new Error('GLB too small');
    if (dv.getUint32(0, true) !== MAGIC) throw new Error('Not a glTF binary (.glb)');
    if (dv.getUint32(4, true) !== 2) throw new Error('Unsupported glTF version');
    const total = dv.getUint32(8, true);
    let off = 12;
    let json = null, bin = null;
    while (off + 8 <= Math.min(total, u8.byteLength)) {
      const len = dv.getUint32(off, true);
      const typ = dv.getUint32(off + 4, true);
      off += 8;
      const slice = u8.subarray(off, off + len);
      off += len;
      if (typ === JSON_CHUNK) {
        json = JSON.parse(new TextDecoder('utf-8').decode(slice));
      } else if (typ === BIN_CHUNK) {
        bin = slice;
      }
    }
    if (!json) throw new Error('GLB missing JSON chunk');
    return { json: json, bin: bin || new Uint8Array(0) };
  }

  function getAccessorArray(json, bin, accIndex, asFloat) {
    const acc = json.accessors[accIndex];
    if (!acc) throw new Error('Missing accessor ' + accIndex);
    const comp = COMP[acc.componentType];
    const n = ELEMS[acc.type];
    if (!comp || !n) throw new Error('Unsupported accessor');
    const view = json.bufferViews[acc.bufferView];
    const viewOff = (view && view.byteOffset) || 0;
    const accOff = acc.byteOffset || 0;
    const stride = (view && view.byteStride) || (comp.bytes * n);
    const start = viewOff + accOff;
    const count = acc.count;
    const outCount = count * n;
    let typed;
    if (stride === comp.bytes * n && !asFloat) {
      typed = new comp.Typed(bin.buffer, bin.byteOffset + start, outCount);
    } else if (stride === comp.bytes * n && asFloat && acc.componentType === 5126) {
      typed = new Float32Array(bin.buffer, bin.byteOffset + start, outCount);
    } else {
      const src = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
      const dst = asFloat ? new Float32Array(outCount) : new comp.Typed(outCount);
      const readers = {
        5120: (dv, o) => dv.getInt8(o),
        5121: (dv, o) => dv.getUint8(o),
        5122: (dv, o) => dv.getInt16(o, true),
        5123: (dv, o) => dv.getUint16(o, true),
        5125: (dv, o) => dv.getUint32(o, true),
        5126: (dv, o) => dv.getFloat32(o, true)
      };
      const read = readers[acc.componentType];
      for (let i = 0; i < count; i++) {
        const row = start + i * stride;
        for (let k = 0; k < n; k++) dst[i * n + k] = read(src, row + k * comp.bytes);
      }
      typed = dst;
    }
    if (asFloat && !(typed instanceof Float32Array)) {
      const f = new Float32Array(typed.length);
      if (acc.normalized) {
        const d = comp.norm || 1;
        for (let i = 0; i < typed.length; i++) f[i] = typed[i] / d;
      } else {
        f.set(typed);
      }
      return { array: f, itemSize: n, normalized: false, accessor: acc };
    }
    return { array: typed, itemSize: n, normalized: !!acc.normalized, accessor: acc };
  }

  function applyNodeTransform(obj, node) {
    if (node.matrix && node.matrix.length === 16) {
      const m = new THREE.Matrix4();
      m.fromArray(node.matrix);
      m.decompose(obj.position, obj.quaternion, obj.scale);
      return;
    }
    if (node.translation) obj.position.fromArray(node.translation);
    if (node.rotation) obj.quaternion.fromArray(node.rotation);
    if (node.scale) obj.scale.fromArray(node.scale);
  }

  function colorFromFactor(factor) {
    const r = factor[0], g = factor[1], b = factor[2];
    const c = new THREE.Color(r, g, b);
    if (typeof c.convertSRGBToLinear === 'function') c.convertSRGBToLinear();
    return c;
  }

  function buildTexture(json, bin, texDef, pending) {
    if (!texDef || texDef.index == null || !json.textures) return null;
    const texInfo = json.textures[texDef.index];
    if (!texInfo || texInfo.source == null) return null;
    const image = json.images[texInfo.source];
    if (!image) return null;
    const texture = new THREE.Texture();
    if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;

    const assign = function (img) {
      texture.image = img;
      texture.needsUpdate = true;
    };

    if (image.bufferView != null && image.mimeType) {
      const view = json.bufferViews[image.bufferView];
      const off = (view.byteOffset || 0);
      const bytes = bin.subarray(off, off + view.byteLength);
      const blob = new Blob([bytes], { type: image.mimeType });
      pending.push(new Promise(function (resolve) {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = function () {
          assign(img);
          URL.revokeObjectURL(url);
          resolve(texture);
        };
        img.onerror = function () {
          URL.revokeObjectURL(url);
          resolve(texture);
        };
        img.src = url;
      }));
    } else if (image.uri && image.uri.indexOf('data:') === 0) {
      pending.push(new Promise(function (resolve) {
        const img = new Image();
        img.onload = function () { assign(img); resolve(texture); };
        img.onerror = function () { resolve(texture); };
        img.src = image.uri;
      }));
    }
    return texture;
  }

  function buildMaterial(json, bin, index, pending) {
    const def = (json.materials && json.materials[index]) || {};
    const pbr = def.pbrMetallicRoughness || {};
    const factor = pbr.baseColorFactor || [1, 1, 1, 1];
    const mat = new THREE.MeshStandardMaterial({
      color: colorFromFactor(factor),
      opacity: factor.length > 3 ? factor[3] : 1,
      metalness: pbr.metallicFactor != null ? pbr.metallicFactor : 1,
      roughness: pbr.roughnessFactor != null ? pbr.roughnessFactor : 1,
      transparent: (def.alphaMode === 'BLEND') || (factor.length > 3 && factor[3] < 0.999),
      depthWrite: def.alphaMode !== 'BLEND',
      side: def.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
      name: def.name || ''
    });
    if (def.alphaMode === 'MASK') {
      mat.alphaTest = def.alphaCutoff != null ? def.alphaCutoff : 0.5;
    }
    if (def.emissiveFactor) {
      mat.emissive = colorFromFactor(def.emissiveFactor.concat([1]));
    }
    const map = buildTexture(json, bin, pbr.baseColorTexture, pending);
    if (map) mat.map = map;
    return mat;
  }

  function buildMesh(json, bin, meshIndex, materials, pending) {
    const def = json.meshes[meshIndex];
    const group = new THREE.Group();
    group.name = def.name || ('mesh_' + meshIndex);
    (def.primitives || []).forEach(function (prim, pi) {
      const mode = prim.mode == null ? 4 : prim.mode;
      if (mode !== 4) return;
      const geo = new THREE.BufferGeometry();
      const attrs = prim.attributes || {};
      Object.keys(attrs).forEach(function (name) {
        const dest = ATTR_MAP[name];
        if (!dest) return;
        const asFloat = dest !== 'index';
        const acc = getAccessorArray(json, bin, attrs[name], asFloat);
        const attr = new THREE.BufferAttribute(acc.array, acc.itemSize, acc.normalized);
        geo.setAttribute(dest, attr);
      });
      if (prim.indices != null) {
        const idx = getAccessorArray(json, bin, prim.indices, false);
        geo.setIndex(new THREE.BufferAttribute(idx.array, 1));
      }
      if (!geo.getAttribute('normal')) geo.computeVertexNormals();
      geo.computeBoundingBox();
      geo.computeBoundingSphere();
      const mat = prim.material != null
        ? materials[prim.material]
        : new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = (def.name || 'prim') + '_' + pi;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });
    return group;
  }

  function buildScene(json, bin) {
    const pending = [];
    const materials = (json.materials || []).map(function (_, i) {
      return buildMaterial(json, bin, i, pending);
    });
    const meshCache = {};
    function getMesh(i) {
      if (!meshCache[i]) meshCache[i] = buildMesh(json, bin, i, materials, pending);
      return meshCache[i];
    }
    const nodes = (json.nodes || []).map(function (node, i) {
      let obj;
      if (node.mesh != null) {
        obj = getMesh(node.mesh).clone(true);
      } else {
        obj = new THREE.Group();
      }
      obj.name = node.name || ('node_' + i);
      applyNodeTransform(obj, node);
      return obj;
    });
    (json.nodes || []).forEach(function (node, i) {
      (node.children || []).forEach(function (ci) {
        if (nodes[ci]) nodes[i].add(nodes[ci]);
      });
    });
    const sceneIndex = json.scene || 0;
    const sceneDef = (json.scenes && json.scenes[sceneIndex]) || { nodes: [0] };
    const scene = new THREE.Group();
    scene.name = (sceneDef.name || 'Scene');
    (sceneDef.nodes || []).forEach(function (ni) {
      if (nodes[ni]) scene.add(nodes[ni]);
    });
    return { scene: scene, pending: pending, json: json };
  }

  function parseAsync(data, path) {
    const parsed = parseGlb(data);
    const built = buildScene(parsed.json, parsed.bin);
    const result = {
      scene: built.scene,
      scenes: [built.scene],
      animations: [],
      cameras: [],
      asset: parsed.json.asset || { version: '2.0' },
      parser: { json: parsed.json, path: path || '' }
    };
    if (!built.pending.length) return Promise.resolve(result);
    return Promise.all(built.pending).then(function () { return result; });
  }

  class GLTFLoader {
    constructor(manager) {
      this.manager = manager || THREE.DefaultLoadingManager;
      this.path = '';
    }
    setPath(path) {
      this.path = path || '';
      return this;
    }
    load(url, onLoad, onProgress, onError) {
      const full = this.path + url;
      const manager = this.manager;
      manager.itemStart(full);
      const fail = function (err) {
        if (onError) onError(err);
        else console.error('[GLTFLoader]', err);
        manager.itemEnd(full);
        manager.itemError(full);
      };
      fetch(full).then(function (res) {
        if (!res.ok) throw new Error('Failed to load ' + full + ' (' + res.status + ')');
        if (onProgress && res.body && res.headers.get('Content-Length') && res.clone) {
          /* progress is best-effort; continue with arrayBuffer on the original */
        }
        return res.arrayBuffer();
      }).then(function (buf) {
        return parseAsync(buf, full);
      }).then(function (gltf) {
        if (onLoad) onLoad(gltf);
        manager.itemEnd(full);
      }).catch(fail);
    }
    parse(data, path, onLoad, onError) {
      parseAsync(data, path).then(function (gltf) {
        if (onLoad) onLoad(gltf);
      }).catch(function (err) {
        if (onError) onError(err);
        else console.error('[GLTFLoader]', err);
      });
    }
  }

  if (!THREE.GLTFLoader) THREE.GLTFLoader = GLTFLoader;

  const cache = {};
  const loader = new GLTFLoader();

  function load(url) {
    if (cache[url]) return cache[url];
    cache[url] = new Promise(function (resolve, reject) {
      loader.load(url, resolve, undefined, reject);
    });
    // don't poison the cache on failure — allow retry
    cache[url] = cache[url].catch(function (err) {
      delete cache[url];
      throw err;
    });
    return cache[url];
  }

  function parse(data, path) {
    return parseAsync(data, path || '');
  }

  let manifestPromise = null;
  function loadManifest(url) {
    const src = url || 'assets/models/manifest.json';
    if (!manifestPromise) {
      manifestPromise = fetch(src).then(function (res) {
        if (!res.ok) throw new Error('manifest ' + res.status);
        return res.json();
      }).catch(function (err) {
        manifestPromise = null;
        throw err;
      });
    }
    return manifestPromise;
  }

  PDM.glb = {
    Loader: GLTFLoader,
    load: load,
    parse: parse,
    cache: cache,
    loadManifest: loadManifest,
    parseGlb: parseGlb
  };
})(window.PDM);

