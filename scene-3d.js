/* Original procedural football scene. Three.js is vendored separately under MIT. */
"use strict";

class FootballScene3D {
  constructor(canvas, config, teams) {
    this.config = config;
    this.teams = teams;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#16304a");
    this.scene.fog = new THREE.Fog("#16304a", 24, 65);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.camera = new THREE.PerspectiveCamera(30, 5 / 3, 0.1, 100);
    this.camera.position.set(0, 3.2, -8);
    this.camera.lookAt(0, 0.65, 8);
    this.camera.updateMatrixWorld();
    this.ray = new THREE.Raycaster();
    this.goalPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -config.goalDistance);
    this.sphere = new THREE.SphereGeometry(1, 20, 14);
    this.cylinder = new THREE.CylinderGeometry(0.78, 1, 1, 14);
    this.up = new THREE.Vector3(0, 1, 0);
    this.ambient = new THREE.HemisphereLight("#cce9ff", "#284219", 1.25);
    this.scene.add(this.ambient);
    this.sun = new THREE.DirectionalLight("#fff1d6", 3);
    this.sun.position.set(-9, 15, -5);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -16, right: 16, top: 22, bottom: -12, near: 1, far: 60 });
    this.sun.shadow.normalBias = 0.025;
    this.scene.add(this.sun);
    this.floodlights = [];
    for (const [x, z] of [[-13, -3], [13, -3], [-13, 18], [13, 18]]) {
      const light = new THREE.SpotLight("#e8f3ff", 220, 55, Math.PI / 3.3, 0.45, 2);
      light.position.set(x, 12, z);
      light.target.position.set(0, 0, 5);
      light.castShadow = z < 0;
      light.shadow.mapSize.set(1024, 1024);
      light.shadow.normalBias = 0.025;
      this.scene.add(light, light.target);
      this.floodlights.push(light);
    }
    this.makePitch();
    this.makeStands();
    this.makeGoal();
    this.kicker = this.makeActor(false);
    this.keeper = this.makeActor(true);
    this.ball = this.mesh(new THREE.SphereGeometry(config.ballRadius, 24, 16), this.makeBallMaterial());
    this.ball.castShadow = true;
    this.scene.add(this.ball);
    this.ring = this.mesh(new THREE.RingGeometry(0.24, 0.26, 48), new THREE.MeshBasicMaterial({ color: "#d7ff77", side: THREE.DoubleSide, transparent: true, opacity: 0.8 }));
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.008;
    this.scene.add(this.ring);
    this.trail = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: "#e5f4d3", transparent: true, opacity: 0.3 }));
    this.scene.add(this.trail);
    this.makeEasterEgg();
    this.makeWeather();
    this.lastLighting = null;
    this.lastVenue = null;
  }

  mesh(geometry, material) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    return mesh;
  }

  material(color, roughness = 0.85) {
    return new THREE.MeshStandardMaterial({ color, roughness });
  }

  texture(draw, size = 256) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to create a 3D scene texture.");
    draw(context, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    return texture;
  }

  makePitch() {
    const map = this.texture((c, size) => {
      c.fillStyle = "#427a32";
      c.fillRect(0, 0, size, size);
      let seed = 591;
      const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      for (let i = 0; i < 16000; i++) {
        c.fillStyle = random() < 0.5 ? "#b8ce733b" : "#142f1450";
        c.fillRect(random() * size, random() * size, 1, 1 + random() * 3);
      }
    }, 512);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);
    const pitch = this.mesh(new THREE.PlaneGeometry(50, 52), new THREE.MeshStandardMaterial({ map, roughness: 1 }));
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.set(0, -0.012, 7);
    this.scene.add(pitch);
    for (let x = -24; x < 24; x += 4) {
      const stripe = this.mesh(new THREE.PlaneGeometry(2, 52), new THREE.MeshBasicMaterial({ color: "#c1d89a", transparent: true, opacity: 0.065, depthWrite: false }));
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(x, -0.006, 7);
      this.scene.add(stripe);
    }
    const paint = this.material("#e4e8cc");
    const strip = (x1, z1, x2, z2) => {
      const length = Math.hypot(x2 - x1, z2 - z1);
      const line = this.mesh(new THREE.BoxGeometry(0.065, 0.008, length), paint);
      line.position.set((x1 + x2) / 2, 0, (z1 + z2) / 2);
      line.rotation.y = Math.atan2(x2 - x1, z2 - z1);
      this.scene.add(line);
    };
    strip(-24, 11, 24, 11);
    for (const [halfWidth, front] of [[20.16, -5.5], [9.16, 5.5]]) {
      strip(-halfWidth, 11, -halfWidth, front);
      strip(-halfWidth, front, halfWidth, front);
      strip(halfWidth, front, halfWidth, 11);
    }
    const spot = this.mesh(new THREE.CircleGeometry(0.075, 24), paint);
    spot.rotation.x = -Math.PI / 2;
    spot.position.y = 0.006;
    this.scene.add(spot);
  }

  banner(text, color, width, height) {
    const texture = this.texture((c, size) => {
      c.fillStyle = color; c.fillRect(0, 0, size, size);
      c.fillStyle = "#f5f3e9"; c.font = `bold ${size * 0.32}px Arial`;
      c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(text, size / 2, size / 2, size - 18);
    }, 1024);
    return this.mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
  }

  makeStands() {
    this.stadiums = [];
    for (let venue = 0; venue < 2; venue++) {
      const group = new THREE.Group();
      const seat = this.material(venue ? "#405c7b" : "#6d2436");
      for (let row = 0; row < 10; row++) {
        const tier = this.mesh(new THREE.BoxGeometry(49, 0.55, 0.82), seat);
        tier.position.set(0, row * 0.48 + 0.18, 16.8 + row * 0.78);
        group.add(tier);
      }
      const head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 6, 5), this.material("#c6a786"), 550);
      const bodies = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.1, 0.22, 6), this.material("#ffffff"), 550);
      const matrix = new THREE.Matrix4(), color = new THREE.Color();
      for (let row = 0; row < 10; row++) for (let col = 0; col < 55; col++) {
        const index = row * 55 + col;
        const x = (col - 27) * 0.86 + (row % 2) * 0.25;
        const y = row * 0.48 + 0.63, z = 16.7 + row * 0.78;
        matrix.makeTranslation(x, y, z); head.setMatrixAt(index, matrix);
        matrix.makeTranslation(x, y - 0.18, z); bodies.setMatrixAt(index, matrix);
        color.set((venue ? ["#d6dfea", "#6485a8", "#d9c6a4"] : ["#c4354e", "#efcdc5", "#70433f"])[index % 3]);
        bodies.setColorAt(index, color);
      }
      group.add(head, bodies);
      const wall = this.banner(venue ? "SANTIAGO BERNABEU  |  HALA MADRID" : "ANFIELD  |  THIS IS ANFIELD", venue ? "#264b75" : "#9b1936", 26, 1.1);
      wall.position.set(0, 1, 15.8); wall.rotation.y = Math.PI; group.add(wall);
      const roof = this.mesh(new THREE.BoxGeometry(52, venue ? 0.3 : 0.65, 8), this.material(venue ? "#91a9b8" : "#4b525c"));
      roof.position.set(0, venue ? 7.3 : 6.8, 21.5);
      roof.rotation.x = venue ? -0.05 : 0.12; group.add(roof);
      for (const x of [-24, -12, 12, 24]) {
        const column = this.mesh(new THREE.CylinderGeometry(0.1, 0.12, 7, 8), this.material("#7c8993"));
        column.position.set(x, 3.5, 22); group.add(column);
      }
      this.scene.add(group);
      this.stadiums.push(group);
    }
  }

  makeGoal() {
    const c = this.config, white = this.material("#f2f0e8", 0.38);
    const tube = (a, b, radius) => {
      const p = new THREE.Vector3(...a), q = new THREE.Vector3(...b);
      const mesh = this.mesh(new THREE.CylinderGeometry(radius, radius, p.distanceTo(q), 16), white);
      mesh.position.copy(p).add(q).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(this.up, q.sub(p).normalize());
      mesh.castShadow = true; this.scene.add(mesh);
    };
    for (const x of [-c.goalHalfWidth, c.goalHalfWidth]) {
      tube([x, 0, 11], [x, c.goalHeight, 11], c.postRadius);
      tube([x, 0.025, 11], [x * 0.94, 0.025, 13], 0.025);
      tube([x, c.goalHeight, 11], [x * 0.94, 2.25, 13], 0.025);
      tube([x * 0.94, 0, 13], [x * 0.94, 2.25, 13], 0.025);
    }
    tube([-c.goalHalfWidth, c.goalHeight, 11], [c.goalHalfWidth, c.goalHeight, 11], c.postRadius);
    const vertices = [];
    const line = (a, b) => vertices.push(...a, ...b);
    const half = c.goalHalfWidth * 0.94;
    for (let x = -half; x <= half + 0.01; x += half / 18) {
      line([x, 0.02, 13], [x, 2.25, 13]);
      line([x / 0.94, c.goalHeight, 11], [x, 2.25, 13]);
    }
    for (let y = 0; y <= 2.25 + 0.01; y += 0.15) {
      line([-half, y, 13], [half, y, 13]);
      for (const sign of [-1, 1]) line([sign * c.goalHalfWidth, y / 2.25 * c.goalHeight, 11], [sign * half, y, 13]);
    }
    for (let z = 11; z <= 13.01; z += 0.2) {
      const t = (z - 11) / 2, x = THREE.MathUtils.lerp(c.goalHalfWidth, half, t);
      const height = THREE.MathUtils.lerp(c.goalHeight, 2.25, t);
      for (const sign of [-1, 1]) line([sign * x, 0.02, z], [sign * x, height, z]);
      line([-x, height, z], [x, height, z]);
    }
    this.netBase = new Float32Array(vertices);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 3));
    this.net = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: "#e8efe0", transparent: true, opacity: 0.48 }));
    this.scene.add(this.net);
  }

  makeBallMaterial() {
    const map = this.texture((c, size) => {
      c.fillStyle = "#ecefe4"; c.fillRect(0, 0, size, size);
      for (let row = 0; row < 4; row++) for (let col = 0; col < 6; col++) {
        const x = (col + (row % 2) * 0.5) * size / 6, y = row * size / 4;
        c.beginPath();
        for (let j = 0; j < 5; j++) {
          const a = j * Math.PI * 2 / 5;
          c.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12);
        }
        c.closePath(); c.fillStyle = "#26323b"; c.fill();
      }
    });
    return new THREE.MeshStandardMaterial({ map, roughness: 0.72 });
  }

  makeActor(goalkeeper) {
    const actor = { group: new THREE.Group(), pieces: new Map(), goalkeeper, label: null };
    actor.head = new THREE.Group();
    const skin = this.material("#c99471", 0.8);
    const face = this.mesh(this.sphere, skin);
    face.scale.set(0.115, 0.153, 0.12); actor.head.add(face);
    const hairMaterial = this.material("#292522", 1);
    const hair = this.mesh(new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.53), hairMaterial);
    hair.scale.set(0.12, 0.155, 0.125); hair.position.y = 0.012; actor.head.add(hair);
    actor.hair = hair;
    const nape = this.mesh(new THREE.SphereGeometry(1, 18, 8, Math.PI, Math.PI, Math.PI * 0.5, Math.PI * 0.28), hairMaterial);
    nape.scale.copy(hair.scale); actor.head.add(nape);
    const nose = this.mesh(this.sphere, skin);
    nose.scale.set(0.02, 0.032, 0.033); nose.position.set(0, -0.008, 0.115); actor.head.add(nose);
    for (const side of [-1, 1]) {
      const ear = this.mesh(this.sphere, skin);
      ear.scale.set(0.025, 0.04, 0.022); ear.position.set(side * 0.113, 0, 0); actor.head.add(ear);
      const eye = this.mesh(this.sphere, this.material("#393029"));
      eye.scale.set(0.019, 0.006, 0.006); eye.position.set(side * 0.04, 0.028, 0.112); actor.head.add(eye);
    }
    const mouth = this.mesh(new THREE.BoxGeometry(0.04, 0.004, 0.003), this.material("#805844"));
    mouth.position.set(0, -0.065, 0.103); actor.head.add(mouth);
    actor.group.add(actor.head);
    actor.numberMaterial = new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide, depthWrite: false });
    actor.number = this.mesh(new THREE.PlaneGeometry(0.28, 0.32), actor.numberMaterial);
    actor.group.add(actor.number);
    this.scene.add(actor.group);
    return actor;
  }

  setNumber(actor, player, kit) {
    const key = player.name + kit.main;
    if (actor.label === key) return;
    actor.label = key;
    if (actor.numberMaterial.map) actor.numberMaterial.map.dispose();
    actor.numberMaterial.map = this.texture((c, size) => {
      c.clearRect(0, 0, size, size);
      c.fillStyle = kit.number; c.textAlign = "center";
      c.font = "bold 30px Arial"; c.fillText(player.name.split(" ").slice(-2).join(" ").toUpperCase(), size / 2, 40, size - 10);
      c.font = "bold 158px Arial"; c.fillText(String(player.number), size / 2, 205);
    });
    actor.numberMaterial.needsUpdate = true;
  }

  poseActor(actor, parts, player, kit, headTarget) {
    this.setNumber(actor, player, kit);
    for (const part of parts) {
      const a = this.worldPoint(part.a);
      const b = this.worldPoint(part.b);
      if (part.name === "head") {
        actor.head.position.copy(a).add(b).multiplyScalar(0.5);
        actor.head.up.copy(b).sub(a).normalize();
        actor.head.lookAt(-headTarget.x, actor.head.position.y - 0.06, headTarget.z);
        continue;
      }
      let piece = actor.pieces.get(part.name);
      if (!piece) {
        const geometry = part.name === "torso" ? new THREE.CylinderGeometry(1, 0.72, 1, 20) : this.cylinder;
        piece = this.mesh(geometry, this.material(part.color));
        piece.castShadow = true;
        actor.group.add(piece);
        const joint = this.mesh(this.sphere, piece.material);
        joint.castShadow = true;
        actor.group.add(joint);
        piece.userData.joint = joint;
        actor.pieces.set(part.name, piece);
      }
      piece.material.color.set(part.color);
      const length = Math.max(0.01, a.distanceTo(b));
      piece.position.copy(a).add(b).multiplyScalar(0.5);
      piece.quaternion.setFromUnitVectors(this.up, b.clone().sub(a).normalize());
      const torso = part.name === "torso";
      piece.scale.set(part.r, length + (torso ? 0.06 : 0.025), part.r * (torso ? 0.7 : 1));
      const joint = piece.userData.joint;
      joint.visible = !torso;
      joint.position.copy(b);
      joint.scale.setScalar(part.r * 0.82);
      if (part.name.includes("boot")) {
        piece.visible = false;
        joint.scale.set(0.075, 0.055, 0.16);
        joint.position.copy(a).add(b).multiplyScalar(0.5);
      }
      if (part.name === "torso") {
        actor.number.position.copy(piece.position).add(new THREE.Vector3(0, 0, -0.152).applyQuaternion(piece.quaternion));
        actor.number.quaternion.copy(piece.quaternion);
        actor.number.rotateY(Math.PI);
      }
    }
  }

  kickerParts(state, kit, now) {
    const shot = state.shot, run = shot ? shot.runProgress : 0, follow = shot ? shot.followProgress : 0;
    const plant = THREE.MathUtils.clamp((run - 0.72) / 0.28, 0, 1);
    const stride = Math.sin(run * Math.PI * 2) * (1 - plant);
    const baseX = THREE.MathUtils.lerp(-0.95, -0.19, run);
    const baseZ = THREE.MathUtils.lerp(-0.55, -0.22, run);
    const bob = shot ? Math.abs(stride) * 0.025 : Math.sin(now / 600) * 0.006;
    const point = (x, y, z = 0) => ({ x: baseX + x, y: y + bob, z: baseZ + z });
    const parts = [];
    const add = (name, a, b, r, color) => parts.push({ name, a, b, r, color });
    const knee = (hip, ankle) => {
      const dy = ankle.y - hip.y, dz = ankle.z - hip.z;
      const distance = Math.max(0.001, Math.hypot(dy, dz));
      const half = distance / 2, bend = Math.sqrt(Math.max(0, 0.43 * 0.43 - half * half));
      return { x: (hip.x + ankle.x) / 2, y: hip.y + dy / 2 + dz / distance * bend, z: hip.z + dz / 2 - dy / distance * bend };
    };
    for (const side of [-1, 1]) {
      const prefix = side < 0 ? "left" : "right";
      const hip = point(side * 0.11, 0.92);
      let footZ = side * stride * 0.25, footY = 0.065 + Math.max(0, -side * stride) * 0.12;
      if (side > 0) {
        const swing = THREE.MathUtils.clamp((plant - 0.45) / 0.55, 0, 1);
        footZ = THREE.MathUtils.lerp(footZ, THREE.MathUtils.lerp(-0.3, 0.1, swing), plant);
        footY = THREE.MathUtils.lerp(footY, THREE.MathUtils.lerp(0.22, 0.065, swing), plant);
        footZ += Math.sin(follow * Math.PI) * 0.55;
        footY += Math.sin(follow * Math.PI) * 0.48;
      } else footZ = THREE.MathUtils.lerp(footZ, 0.04, plant);
      const ankle = point(side < 0 ? -0.13 : 0.19, footY, footZ);
      const joint = knee(hip, ankle);
      const shortsEnd = { x: THREE.MathUtils.lerp(hip.x, joint.x, 0.6), y: THREE.MathUtils.lerp(hip.y, joint.y, 0.6), z: THREE.MathUtils.lerp(hip.z, joint.z, 0.6) };
      add(prefix + "-shorts", hip, shortsEnd, 0.1, kit.main);
      add(prefix + "-thigh", shortsEnd, joint, 0.078, "#c99471");
      add(prefix + "-shin", joint, ankle, 0.055, kit.main);
      add(prefix + "-boot", ankle, { ...ankle, z: ankle.z + 0.12 }, 0.055, "#c3e862");
      const shoulder = point(side * 0.22, 1.43, run * 0.07);
      const elbow = point(side * (0.3 + plant * 0.13), 1.19, -side * stride * 0.18);
      const wrist = point(side * (0.32 + plant * 0.23), 0.98 + plant * 0.13, -side * stride * 0.24);
      const sleeveEnd = { x: THREE.MathUtils.lerp(shoulder.x, elbow.x, 0.55), y: THREE.MathUtils.lerp(shoulder.y, elbow.y, 0.55), z: THREE.MathUtils.lerp(shoulder.z, elbow.z, 0.55) };
      add(prefix + "-sleeve", shoulder, sleeveEnd, 0.084, kit.main);
      add(prefix + "-upperarm", sleeveEnd, elbow, 0.066, "#c99471");
      add(prefix + "-forearm", elbow, wrist, 0.045, "#c99471");
      add(prefix + "-hand", wrist, { ...wrist, y: wrist.y - 0.075 }, 0.045, "#c99471");
    }
    add("pelvis", point(0, 0.83), point(0, 0.98), 0.19, kit.main);
    add("torso", point(0, 0.97), point(0, 1.45, run * 0.07), 0.225, kit.main);
    add("neck", point(0, 1.47, run * 0.07), point(0, 1.62, run * 0.09), 0.064, "#c99471");
    add("head", point(0, 1.71, run * 0.1), point(0, 1.75, run * 0.1), 0.12, "#c99471");
    return parts;
  }

  // Physics uses screen-right X and depth-positive Z; the camera looks along +Z.
  worldPoint(point) {
    return new THREE.Vector3(-point.x, point.y, point.z);
  }

  project(point) {
    const p = this.worldPoint(point).project(this.camera);
    return { x: (p.x + 1) * this.config.width / 2, y: (1 - p.y) * this.config.height / 2 };
  }

  aimAt(x, y) {
    this.ray.setFromCamera(new THREE.Vector2(x / this.config.width * 2 - 1, 1 - y / this.config.height * 2), this.camera);
    const point = this.ray.ray.intersectPlane(this.goalPlane, new THREE.Vector3());
    if (!point) throw new Error("The aiming ray did not intersect the goal plane.");
    return { x: -point.x, y: point.y };
  }

  resize(width, height) {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  weatherShape(parent, scale, position, color) {
    const shape = this.mesh(this.sphere, this.material(color));
    shape.scale.set(...scale);
    shape.position.set(...position);
    parent.add(shape);
    return shape;
  }

  makeWeather() {
    this.weatherFX = new THREE.Group();
    this.scene.add(this.weatherFX);
    const positions = new Float32Array(200 * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.weatherParticles = new THREE.Points(geometry, new THREE.PointsMaterial({
      color: "#d9eeff", size: 0.045, transparent: true, opacity: 0.6, depthWrite: false
    }));
    this.weatherParticles.frustumCulled = false;
    this.weatherFX.add(this.weatherParticles);
    const rainGeometry = new THREE.BufferGeometry();
    rainGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(200 * 6), 3));
    this.rainStreaks = new THREE.LineSegments(rainGeometry, new THREE.LineBasicMaterial({
      color: "#aecce0", transparent: true, opacity: 0.35, depthWrite: false
    }));
    this.rainStreaks.frustumCulled = false;
    this.weatherFX.add(this.rainStreaks);
    this.weatherGround = this.mesh(new THREE.PlaneGeometry(48, 48), new THREE.MeshStandardMaterial({
      color: "#d9eaf4", transparent: true, opacity: 0.25, depthWrite: false, roughness: 0.22
    }));
    this.weatherGround.rotation.x = -Math.PI / 2;
    this.weatherGround.position.set(0, 0.014, 7);
    this.weatherFX.add(this.weatherGround);
    const waves = [];
    for (let i = 0; i < 75; i++) {
      const x = ((i * 2.719) % 26) - 13, z = ((i * 1.618) % 23) - 4;
      waves.push(x, 0.045, z, x + 0.18, 0.045, z + 0.025, x + 0.18, 0.045, z + 0.025, x + 0.36, 0.045, z);
    }
    const waveGeometry = new THREE.BufferGeometry();
    waveGeometry.setAttribute("position", new THREE.Float32BufferAttribute(waves, 3));
    this.waterWaves = new THREE.LineSegments(waveGeometry, new THREE.LineBasicMaterial({
      color: "#b3e7f0", transparent: true, opacity: 0.4, depthWrite: false
    }));
    this.weatherFX.add(this.waterWaves);
    const halo = this.texture((c, size) => {
      const glow = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      glow.addColorStop(0, "#fff5ba99"); glow.addColorStop(1, "#fff5ba00");
      c.fillStyle = glow; c.fillRect(0, 0, size, size);
    });
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: halo, transparent: true, depthWrite: false, opacity: 0.65
    }));
    this.sunHalo.position.set(-4, 4.8, 12); this.sunHalo.scale.set(3, 3, 1);
    this.weatherFX.add(this.sunHalo);
    this.windFlag = new THREE.Group();
    const pole = this.mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.5, 6), this.material("#c6d4db"));
    pole.position.y = 1.25; this.windFlag.add(pole);
    this.flagCloth = this.mesh(new THREE.PlaneGeometry(0.8, 0.4), new THREE.MeshBasicMaterial({ color: "#ffcf5b", side: THREE.DoubleSide }));
    this.flagCloth.position.set(0.4, 2.3, 0); this.windFlag.add(this.flagCloth);
    this.windFlag.position.set(-4.5, 0, 11); this.weatherFX.add(this.windFlag);
    this.footprints = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const print = this.mesh(new THREE.CircleGeometry(1, 10), new THREE.MeshBasicMaterial({ color: "#869fad", transparent: true, opacity: 0.3, depthWrite: false }));
      print.rotation.x = -Math.PI / 2;
      print.scale.set(0.07, 0.14, 1);
      print.position.set(0.95 - i * 0.045 + (i % 2 ? 0.12 : -0.12), 0.02, -2.5 + i * 0.2);
      this.footprints.add(print);
    }
    this.weatherFX.add(this.footprints);
    this.sunglasses = new THREE.Group();
    for (const side of [-1, 1]) this.weatherShape(this.sunglasses, [0.095, 0.065, 0.025], [side * 0.085, 0.03, 0.14], "#101a27");
    this.weatherShape(this.sunglasses, [0.06, 0.012, 0.02], [0, 0.03, 0.14], "#e9c95a");
    this.keeper.head.add(this.sunglasses);
    this.binoculars = new THREE.Group();
    for (const side of [-1, 1]) {
      const barrel = this.mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.2, 10), this.material("#303d48"));
      barrel.rotation.x = Math.PI / 2; barrel.position.set(side * 0.07, 0.025, 0.22);
      this.binoculars.add(barrel);
      this.weatherShape(this.binoculars, [0.055, 0.055, 0.012], [side * 0.07, 0.025, 0.325], "#80c8d7");
    }
    this.keeper.head.add(this.binoculars);
    this.cap = new THREE.Group();
    this.weatherShape(this.cap, [0.18, 0.09, 0.16], [0, 0, 0], "#e44b3e");
    this.weatherShape(this.cap, [0.21, 0.018, 0.19], [0, -0.045, -0.12], "#e44b3e");
    this.weatherFX.add(this.cap);
    for (const actor of [this.kicker, this.keeper]) {
      actor.thunderHair = new THREE.Group();
      for (let i = 0; i < 7; i++) {
        const spike = this.mesh(new THREE.ConeGeometry(0.035, 0.24 + (i % 2) * 0.07, 5), this.material("#403123"));
        spike.position.set((i - 3) * 0.032, 0.22, 0);
        spike.rotation.z = (3 - i) * 0.17; actor.thunderHair.add(spike);
      }
      actor.head.add(actor.thunderHair);
    }
    this.tumbleweed = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const loop = this.mesh(new THREE.TorusGeometry(0.26, 0.012, 4, 16), this.material("#a17a43"));
      loop.rotation.set(i * 0.7, i * 1.2, i * 0.4); this.tumbleweed.add(loop);
    }
    this.weatherFX.add(this.tumbleweed);
    this.nest = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const ring = this.mesh(new THREE.TorusGeometry(0.14 + i * 0.012, 0.015, 4, 18), this.material(i % 2 ? "#9a713e" : "#70502b"));
      ring.rotation.set(Math.PI / 2 + i * 0.03, 0, i);
      ring.position.y = i * 0.018; this.nest.add(ring);
    }
    this.weatherFX.add(this.nest);
    this.floatingBoot = new THREE.Group();
    this.weatherShape(this.floatingBoot, [0.09, 0.06, 0.2], [0, 0, 0], "#c3e862");
    this.weatherShape(this.floatingBoot, [0.095, 0.018, 0.21], [0, -0.045, 0], "#303b3c");
    this.weatherFX.add(this.floatingBoot);
    this.duck = new THREE.Group();
    this.weatherShape(this.duck, [0.2, 0.12, 0.25], [0, 0.12, 0], "#ffe056");
    this.weatherShape(this.duck, [0.105, 0.11, 0.105], [0, 0.27, -0.14], "#ffe056");
    this.weatherShape(this.duck, [0.07, 0.025, 0.075], [0, 0.25, -0.245], "#ff943c");
    this.duckWings = [];
    for (const side of [-1, 1]) {
      this.weatherShape(this.duck, [0.012, 0.014, 0.012], [side * 0.08, 0.3, -0.19], "#17252a");
      this.duckWings.push(this.weatherShape(this.duck, [0.035, 0.065, 0.12], [side * 0.19, 0.13, 0], "#e9b62d"));
    }
    this.weatherFX.add(this.duck);
    const angelMap = this.texture((c, size) => {
      c.clearRect(0, 0, size, size); c.fillStyle = "#7491a370";
      for (const side of [-1, 1]) {
        c.beginPath(); c.ellipse(size * (0.5 + side * 0.17), size * 0.4, size * 0.22, size * 0.13, side * 0.45, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.ellipse(size * (0.5 + side * 0.09), size * 0.7, size * 0.12, size * 0.22, -side * 0.25, 0, Math.PI * 2); c.fill();
      }
      c.beginPath(); c.ellipse(size * 0.5, size * 0.32, size * 0.075, size * 0.075, 0, 0, Math.PI * 2); c.fill();
    });
    this.snowAngel = this.mesh(new THREE.PlaneGeometry(1.8, 2), new THREE.MeshBasicMaterial({
      map: angelMap, transparent: true, depthWrite: false
    }));
    this.snowAngel.rotation.x = -Math.PI / 2; this.snowAngel.position.set(0, 0.025, 11);
    this.weatherFX.add(this.snowAngel);
    this.sandPile = this.mesh(new THREE.ConeGeometry(0.25, 0.12, 12), this.material("#c9a46d"));
    this.weatherFX.add(this.sandPile);
    const gagGeometry = new THREE.BufferGeometry();
    gagGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(36 * 3), 3));
    this.comedyParticles = new THREE.Points(gagGeometry, new THREE.PointsMaterial({
      color: "#9cdafa", size: 0.045, transparent: true, opacity: 0.7, depthWrite: false
    }));
    this.comedyParticles.frustumCulled = false; this.weatherFX.add(this.comedyParticles);
    this.ripples = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const ripple = this.mesh(new THREE.TorusGeometry(0.3, 0.009, 4, 24), new THREE.MeshBasicMaterial({
        color: "#b7e5f4", transparent: true, opacity: 0.5, depthWrite: false
      }));
      ripple.rotation.x = -Math.PI / 2; this.ripples.add(ripple);
    }
    this.weatherFX.add(this.ripples);
    const boltGeometry = new THREE.BufferGeometry();
    boltGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6 * 3), 3));
    this.lightningBolt = new THREE.Line(boltGeometry, new THREE.LineBasicMaterial({
      color: "#ffeab0", transparent: true, opacity: 0, depthWrite: false
    }));
    this.lightningBolt.frustumCulled = false;
    this.weatherFX.add(this.lightningBolt);
  }

  activeWeatherGag(state, now) {
    const gag = state.comedy;
    return gag && gag.activeAt !== null && now >= gag.activeAt && now < gag.until ? gag.kind : null;
  }

  weatherActorParts(state, parts, actor, now, reducedMotion) {
    const kind = this.activeWeatherGag(state, now);
    if (!kind || state.phase === "charging") return parts;
    const elapsed = (now - state.comedy.activeAt) / 1000;
    if (actor === this.kicker && ["sweat", "snowboot", "sand"].includes(kind)) {
      const head = parts.find(part => part.name === "head").a;
      if (kind === "sweat") {
        const shoulder = parts.find(part => part.name === "right-upperarm").a;
        const elbow = { x: head.x + 0.37, y: head.y - 0.14, z: head.z };
        const wrist = { x: head.x + 0.04, y: head.y + 0.03, z: head.z + 0.13 };
        parts = parts.map(part => {
          if (part.name === "right-upperarm") return { ...part, a: shoulder, b: elbow };
          if (part.name === "right-forearm") return { ...part, a: elbow, b: wrist };
          if (part.name === "right-hand") return { ...part, a: wrist, b: { ...wrist, x: wrist.x - 0.08 } };
          return part;
        });
      } else {
        const lift = reducedMotion ? 0.18 : 0.18 + Math.sin(elapsed * 12) * 0.04;
        parts = parts.map(part => {
          if (part.name === "right-boot") return { ...part, a: { ...part.a, y: part.a.y + lift }, b: { ...part.b, y: part.b.y + lift } };
          if (part.name === "right-shin") return { ...part, a: { ...part.a, y: part.a.y + 0.08 }, b: { ...part.b, y: part.b.y + lift } };
          if (part.name === "right-thigh") return { ...part, b: { ...part.b, y: part.b.y + 0.08 } };
          return part;
        });
      }
    }
    if (actor === this.keeper && ["slide", "angel", "dolphin"].includes(kind) &&
      (state.phase === "result" || state.phase === "gameOver")) {
      parts = parts.map(part => {
        const flatten = p => ({
          x: state.keeper.x + (p.x - state.keeper.x) * 1.3,
          y: 0.18 + (kind === "dolphin" && !reducedMotion ? Math.max(0, Math.sin(elapsed * 3)) * 0.55 : 0),
          z: 11 + (p.y - 0.95) * 0.85
        });
        return { ...part, a: flatten(part.a), b: flatten(part.b) };
      });
    }
    return parts;
  }

  renderWeather(state, now, reducedMotion, kickerParts) {
    const id = state.weather.id, time = reducedMotion ? 0 : now / 1000;
    const wet = ["rainy", "lightning", "flood"].includes(id), snow = id === "snowy", dust = id === "dusty";
    const kind = this.activeWeatherGag(state, now);
    const elapsed = kind ? Math.max(0, (now - state.comedy.activeAt) / 1000) : 0;
    this.weatherParticles.visible = snow || dust;
    this.rainStreaks.visible = wet;
    this.weatherParticles.material.color.set(snow ? "#ffffff" : "#d6b481");
    this.weatherParticles.material.size = snow ? 0.055 : 0.035;
    this.weatherParticles.material.opacity = snow ? 0.75 : 0.3;
    if (wet || snow || dust) {
      const positions = this.weatherParticles.geometry.attributes.position;
      const rain = this.rainStreaks.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const seed = (i * 0.6180339) % 1;
        const x = ((seed * 24 + time * (dust ? 0.7 : 0.13)) % 24) - 12;
        const z = ((i * 1.719) % 25) - 3;
        const y = 10 - ((i * 0.753 + time * (snow ? 0.6 : 8)) % 10);
        positions.setXYZ(i, x, dust ? 0.2 + y * 0.25 : y, z);
        rain.setXYZ(i * 2, x, y, z); rain.setXYZ(i * 2 + 1, x - 0.025, y - 0.28, z);
      }
      positions.needsUpdate = true; rain.needsUpdate = true;
    }
    this.weatherGround.visible = snow || wet;
    this.weatherGround.material.color.set(snow ? "#e3edf1" : "#407d99");
    this.weatherGround.material.opacity = snow ? 0.64 : id === "flood" ? 0.42 : 0.09;
    this.weatherGround.position.y = id === "flood" ? 0.035 : 0.014;
    this.waterWaves.visible = wet;
    this.waterWaves.material.opacity = id === "flood" ? 0.45 : 0.12;
    this.waterWaves.position.x = reducedMotion ? 0 : Math.sin(time * 0.6) * 0.05;
    this.footprints.visible = snow;
    this.sunHalo.visible = id === "sunny" && state.lighting === "day";
    this.windFlag.visible = id === "windy";
    this.windFlag.scale.x = state.weather.windX > 0 ? -1 : 1;
    this.flagCloth.rotation.y = reducedMotion ? 0 : Math.sin(time * 3) * 0.18;
    this.sunglasses.visible = kind === "sunglasses";
    this.binoculars.visible = kind === "binoculars";
    this.cap.visible = id === "windy";
    const capLost = state.comedy && state.comedy.kind === "cap" && state.comedy.activeAt !== null;
    if (this.cap.visible) {
      const t = capLost ? reducedMotion ? 1 : Math.min(1, (now - state.comedy.activeAt) / 1500) : 0;
      this.cap.position.copy(this.keeper.head.position).add(new THREE.Vector3(0, 0.17, 0));
      this.cap.position.lerp(new THREE.Vector3(-1.8, 0.1, 12.5), t);
      this.cap.position.y += reducedMotion ? 0 : Math.sin(t * Math.PI) * 0.8;
      this.cap.rotation.set(t * 2, t * 3, t * 2);
    }
    for (const actor of [this.kicker, this.keeper]) {
      actor.thunderHair.visible = kind === "static";
      actor.hair.rotation.z = kind === "hair" ? 0.65 : 0;
      actor.hair.scale.y = kind === "hair" ? 0.23 : 0.155;
    }
    this.tumbleweed.visible = kind === "tumbleweed";
    if (this.tumbleweed.visible) {
      const t = reducedMotion ? 0.5 : Math.min(1, elapsed / 4.2);
      this.tumbleweed.position.set(-5 + t * 10, 0.3, 8.5);
      this.tumbleweed.rotation.z = -t * 18;
      this.keeper.head.lookAt(this.tumbleweed.position);
    }
    this.nest.visible = kind === "nest";
    if (this.nest.visible) {
      const t = reducedMotion ? 1 : Math.min(1, elapsed / 1.8);
      this.ball.position.set(1, this.config.ballRadius, 13 - t * 5);
      this.nest.position.copy(this.ball.position).add(new THREE.Vector3(0, 0.08, 0));
    }
    this.floatingBoot.visible = kind === "boot";
    const boot = this.kicker.pieces.get("right-boot").userData.joint;
    boot.visible = kind !== "boot";
    if (this.floatingBoot.visible) {
      const t = reducedMotion ? 1 : Math.min(1, elapsed / 4);
      this.floatingBoot.position.set(-0.4 - t * 1.4, 0.08 + (reducedMotion ? 0 : Math.sin(elapsed * 3) * 0.015), 0.2 + t * 2);
      this.floatingBoot.rotation.set(0, t * 3, 0.12);
    }
    this.duck.visible = kind === "duck";
    if (this.duck.visible) {
      const t = reducedMotion ? 1 : Math.min(1, elapsed / 3);
      const celebrating = state.shot.outcome.type === "miss";
      this.duck.position.set(1.6 - t * 0.7, 0.02 + (!reducedMotion && celebrating ? Math.abs(Math.sin(elapsed * 5)) * 0.18 : 0), 10.5 + t * 0.9);
      this.duck.rotation.y = reducedMotion ? 0 : Math.sin(elapsed) * 0.35;
      this.duckWings.forEach((wing, i) => { wing.rotation.z = celebrating && !reducedMotion ? Math.sin(elapsed * 9) * (i ? 1 : -1) : 0; });
    }
    this.snowAngel.visible = kind === "angel";
    this.snowAngel.position.x = -state.keeper.x;
    const sliding = kind === "slide", dolphin = kind === "dolphin";
    this.keeper.group.position.set(sliding ? (reducedMotion ? 1.3 : Math.min(1.3, elapsed * 0.5)) : 0, 0,
      dolphin && !reducedMotion ? Math.sin(elapsed * 3) * 0.3 : 0);
    this.sandPile.visible = kind === "sand";
    if (this.sandPile.visible) this.sandPile.position.copy(this.worldPoint(kickerParts.find(p => p.name === "right-boot").b)).setY(0.06);
    const particles = ["sweat", "snowboot", "sand", "splash", "slide", "dolphin"].includes(kind);
    this.comedyParticles.visible = particles;
    if (particles) {
      const origin = this.worldPoint(kickerParts.find(p => p.name === (kind === "sweat" ? "head" : "right-boot")).b);
      const nearKeeper = sliding || dolphin;
      const positions = this.comedyParticles.geometry.attributes.position;
      this.comedyParticles.material.color.set(kind === "sand" ? "#d9b67a" : kind === "snowboot" ? "#ffffff" : "#a1d8f2");
      for (let i = 0; i < positions.count; i++) {
        const t = reducedMotion ? (i % 7) / 7 : (elapsed * 0.7 + i * 0.173) % 1;
        const angle = i * 2.399;
        const x = nearKeeper ? -state.keeper.x + Math.cos(angle) * t * 0.8 : origin.x + Math.cos(angle) * t * 0.3;
        const y = Math.max(0.035, (kind === "sweat" ? origin.y : 0.25) * (1 - t) + Math.sin(t * Math.PI) * 0.25);
        const z = kind === "splash" ? origin.z + t * 10.8 : nearKeeper ? 11 + Math.sin(angle) * t : origin.z + Math.sin(angle) * t * 0.3;
        positions.setXYZ(i, x, y, z);
      }
      positions.needsUpdate = true;
    }
    this.ripples.visible = wet;
    this.ripples.children.forEach((ripple, i) => {
      const t = reducedMotion ? 0.5 : (time * 0.8 + i / 3) % 1;
      const p = i === 0 ? this.ball.position : new THREE.Vector3(-state.keeper.x + (i === 1 ? -0.3 : 0.3), 0, 11);
      ripple.position.set(p.x, 0.025, p.z); ripple.scale.setScalar(0.6 + t * 1.8);
      ripple.material.opacity = (1 - t) * 0.35;
      ripple.visible = i !== 0 || this.ball.position.y < 0.3;
    });
    this.lightningBolt.visible = id === "lightning" && Boolean(kind) && elapsed < 0.9 && !reducedMotion;
    if (this.lightningBolt.visible) {
      const target = kind === "bird" ? this.worldPoint(state.bird.perch) : new THREE.Vector3(-4.8, 0.1, 11);
      const positions = this.lightningBolt.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const t = i / (positions.count - 1);
        positions.setXYZ(i, target.x + (1 - t) * 2 + (i % 2 ? 0.25 : -0.25) * (1 - t), target.y + (1 - t) * 7, target.z);
      }
      positions.needsUpdate = true;
      this.lightningBolt.material.opacity = Math.sin(elapsed / 0.9 * Math.PI) * 0.65;
    }
  }

  makeEasterEgg() {
    this.bird = new THREE.Group();
    const feathers = this.material("#e3e7e4"), dark = this.material("#657b85");
    this.birdFeathers = feathers;
    this.birdDark = dark;
    const part = (scale, position, material) => {
      const mesh = this.mesh(this.sphere, material);
      mesh.scale.set(...scale); mesh.position.set(...position);
      this.bird.add(mesh);
      return mesh;
    };
    part([0.16, 0.14, 0.23], [0, 0, 0], feathers);
    part([0.095, 0.1, 0.095], [0, 0.12, -0.17], feathers);
    part([0.1, 0.035, 0.19], [0, -0.02, 0.25], dark);
    const beak = this.mesh(new THREE.ConeGeometry(0.035, 0.12, 8), this.material("#eaa641"));
    beak.rotation.x = -Math.PI / 2;
    beak.position.set(0, 0.1, -0.3);
    this.bird.add(beak);
    this.birdWings = [];
    for (const side of [-1, 1]) {
      part([0.015, 0.015, 0.015], [side * 0.079, 0.14, -0.22], this.material("#10171a"));
      part([0.016, 0.075, 0.016], [side * 0.065, -0.115, 0], this.material("#d6994c"));
      const wing = new THREE.Group();
      wing.position.x = side * 0.12;
      const mesh = this.mesh(this.sphere, dark);
      mesh.scale.set(0.28, 0.025, 0.15);
      mesh.position.x = side * 0.2;
      wing.add(mesh);
      this.bird.add(wing);
      this.birdWings.push(wing);
    }
    this.scene.add(this.bird);
    this.birdScarf = this.mesh(new THREE.TorusGeometry(0.095, 0.024, 6, 16), this.material("#d83b44"));
    this.birdScarf.rotation.x = Math.PI / 2; this.birdScarf.position.set(0, 0.08, -0.16);
    this.bird.add(this.birdScarf);
    const scarfTail = this.mesh(new THREE.BoxGeometry(0.04, 0.18, 0.025), this.material("#d83b44"));
    scarfTail.position.set(0.075, -0.06, 0); this.birdScarf.add(scarfTail);
    this.flameTexture = this.texture((c, size) => {
      const gradient = c.createRadialGradient(size / 2, size * 0.65, 0, size / 2, size / 2, size * 0.48);
      gradient.addColorStop(0, "#ffffdfff");
      gradient.addColorStop(0.25, "#ffdb56ee");
      gradient.addColorStop(0.55, "#ff6500aa");
      gradient.addColorStop(1, "#d0200000");
      c.fillStyle = gradient;
      c.beginPath();
      c.moveTo(size * 0.5, 0);
      c.bezierCurveTo(size * 0.4, size * 0.42, 0, size * 0.55, size * 0.2, size * 0.85);
      c.bezierCurveTo(size * 0.5, size * 1.1, size * 0.9, size * 0.9, size * 0.8, size * 0.6);
      c.bezierCurveTo(size * 0.7, size * 0.4, size * 0.55, size * 0.25, size * 0.5, 0);
      c.fill();
    });
    this.footFire = this.makeFlames(26, 0.25);
    this.ballFire = this.makeFlames(32, 0.28);
    this.netFire = this.makeFlames(192, 0.48);
    this.fireLight = new THREE.PointLight("#ff6b12", 18, 4, 2);
    this.netFireLight = new THREE.PointLight("#ff741b", 65, 9, 2);
    this.netFireLight.position.set(0, 1.3, 11.8);
    this.scene.add(this.fireLight, this.netFireLight);
  }

  makeFlames(count, size) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const flames = new THREE.Points(geometry, new THREE.PointsMaterial({
      map: this.flameTexture, size, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, color: "#ffffff"
    }));
    flames.frustumCulled = false;
    this.scene.add(flames);
    return flames;
  }

  animateFlames(flames, now, reducedMotion, net = false) {
    const positions = flames.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const t = reducedMotion ? 0.35 + (i % 5) * 0.1 : (now / 850 + i * 0.618) % 1;
      const angle = i * 2.399;
      if (net) {
        positions.setXYZ(i, (i % 24) / 23 * 6.8 - 3.4 + Math.sin(angle) * 0.05,
          Math.floor(i / 24) * 0.28 + t * 0.55, 12.9 + Math.cos(angle) * 0.1);
      } else {
        const radius = 0.14 * (1 - t * 0.6);
        positions.setXYZ(i, Math.cos(angle) * radius, t * 0.48, Math.sin(angle) * radius);
      }
    }
    positions.needsUpdate = true;
  }

  renderEasterEgg(state, now, reducedMotion, kickerParts) {
    const bird = state.bird;
    this.birdFeathers.color.set(bird && bird.sooty ? "#6c6461" : "#e3e7e4");
    this.birdDark.color.set(bird && bird.sooty ? "#353b40" : "#657b85");
    this.birdScarf.visible = state.weather.id === "snowy";
    this.bird.rotation.y = state.weather.id === "windy" ? Math.PI : 0;
    const fleeing = bird && bird.fleeAt !== null;
    this.bird.visible = Boolean(bird && (!fleeing || (!reducedMotion && now - bird.fleeAt < 1200)));
    if (bird && this.bird.visible) {
      this.bird.position.copy(this.worldPoint(bird.perch));
      const arriving = now < bird.perchAt;
      if (reducedMotion) this.bird.visible = !arriving && !fleeing;
      else if (fleeing) {
        const t = Math.max(0, (now - bird.fleeAt) / 1000);
        this.bird.position.add(new THREE.Vector3(bird.direction * t * 6, t * 5, t * 2));
      } else if (arriving) {
        const t = THREE.MathUtils.clamp((now - bird.spawnAt) / this.config.birdArrivalMs, 0, 1);
        const remaining = 1 - t * t * (3 - 2 * t);
        this.bird.position.add(new THREE.Vector3(bird.direction * remaining * 5, remaining * 5, -remaining * 4));
      }
      this.birdWings.forEach((wing, index) => {
        const side = index ? 1 : -1;
        const flying = (arriving || fleeing) && !reducedMotion;
        wing.rotation.z = flying ? side * Math.sin(now / 65) * 0.9 : 0;
        wing.rotation.y = flying ? 0 : -side * 1.35;
      });
    }
    const fire = state.shot ? state.shot.fire : state.fireCharges[state.turn];
    const struck = state.shot && state.shot.runProgress >= 1;
    const flamingGoal = Boolean(fire && state.shot && state.shot.outcome && state.shot.outcome.type === "goal");
    this.footFire.visible = Boolean(fire && (!struck || state.shot.followProgress < 1));
    this.ballFire.visible = Boolean(fire && struck);
    this.netFire.visible = flamingGoal;
    if (this.footFire.visible) {
      const boot = kickerParts.find(part => part.name === "right-boot");
      this.footFire.position.copy(this.worldPoint(boot.b));
      this.animateFlames(this.footFire, now, reducedMotion);
    }
    if (this.ballFire.visible) {
      this.ballFire.position.copy(this.ball.position);
      this.animateFlames(this.ballFire, now, reducedMotion);
    }
    if (flamingGoal) this.animateFlames(this.netFire, now, reducedMotion, true);
    this.fireLight.visible = this.footFire.visible || this.ballFire.visible;
    this.fireLight.position.copy(this.ballFire.visible ? this.ball.position : this.footFire.position);
    this.fireLight.position.y += 0.2;
    this.netFireLight.visible = flamingGoal;
    this.net.material.color.set(flamingGoal ? "#ff922f" : "#e8efe0");
    this.ball.material.emissive.set(this.ballFire.visible ? "#ff5200" : "#000000");
    this.ball.material.emissiveIntensity = this.ballFire.visible ? 1.7 : 0;
    this.trail.material.color.set(fire ? "#ff801f" : "#e5f4d3");
    this.trail.material.opacity = fire ? 0.85 : 0.3;
  }

  render(state, keeperParts, player, goalkeeper, now, reducedMotion) {
    this.keeper.group.position.set(0, 0, 0);
    const lightingKey = `${state.lighting}:${state.weather.id}`;
    if (lightingKey !== this.lastLighting) {
      const day = state.lighting === "day";
      const weather = state.weather.id;
      this.scene.background.set(weather === "dusty" ? day ? "#c4a277" : "#453c35" :
        weather === "foggy" ? day ? "#acbec7" : "#576977" :
        ["rainy", "lightning", "flood"].includes(weather) ? day ? "#728c9e" : "#192c40" : day ? "#95bcd3" : "#13243d");
      this.scene.fog.color.copy(this.scene.background);
      this.scene.fog.near = weather === "foggy" ? 16 : weather === "dusty" ? 18 : 24;
      this.scene.fog.far = weather === "foggy" ? 42 : weather === "dusty" ? 48 : 65;
      this.ambient.intensity = day ? 1.65 : 0.7;
      this.sun.intensity = day ? 3.2 : 0.15;
      this.floodlights.forEach(light => { light.visible = !day; });
      this.lastLighting = lightingKey;
    }
    if (state.stadium !== this.lastVenue) {
      this.stadiums.forEach((group, index) => { group.visible = index === state.stadium; });
      this.lastVenue = state.stadium;
    }
    const team = this.teams[state.turn];
    const kit = player === team.players[team.keeperIndex] ? team.keeperKit : team.kit;
    const kickerParts = this.weatherActorParts(state, this.kickerParts(state, kit, now), this.kicker, now, reducedMotion);
    this.poseActor(this.kicker, kickerParts, player, kit, { x: 0, z: 11 });
    const ballPosition = state.shot ? state.shot.ball.p : { x: 0, y: this.config.ballRadius, z: 0 };
    const visualKeeperParts = this.weatherActorParts(state, keeperParts, this.keeper, now, reducedMotion);
    this.poseActor(this.keeper, visualKeeperParts, goalkeeper, this.teams[1 - state.turn].keeperKit, ballPosition);
    this.ball.position.copy(this.worldPoint(ballPosition));
    const age = state.shot && state.shot.resultAt !== undefined && state.shot.outcome && state.shot.outcome.type === "goal" ? (now - state.shot.resultAt) / 1000 : Infinity;
    if (Number.isFinite(age)) {
      const settle = reducedMotion ? 1 : 1 - Math.exp(-Math.max(0, age) * 4);
      this.ball.position.z += settle * 0.85;
      this.ball.position.y = Math.max(this.config.ballRadius, this.ball.position.y - settle * 0.25);
    }
    if (state.shot) {
      this.ball.rotation.x = state.shot.ticks / this.config.physicsHz * (9 + state.shot.spin.back * 16);
      this.ball.rotation.z = -state.shot.ticks / this.config.physicsHz * state.shot.spin.side * 8;
    } else this.ball.rotation.set(0, 0, 0);
    this.ring.visible = state.phase === "aiming" || state.phase === "charging";
    const positions = this.net.geometry.attributes.position;
    const wave = !reducedMotion && age < 1.3 ? Math.sin(age * 22) * Math.exp(-age * 3) * 0.12 : 0;
    for (let i = 0; i < positions.count; i++) {
      const z = this.netBase[i * 3 + 2];
      positions.setZ(i, z + (z > 12.9 ? wave * Math.sin(positions.getX(i) * 1.2) : 0));
    }
    positions.needsUpdate = true;
    this.trail.geometry.dispose();
    this.trail.geometry = new THREE.BufferGeometry().setFromPoints(state.shot ? state.shot.trail.map(p => this.worldPoint(p)) : []);
    this.trail.visible = Boolean(state.shot && !state.shot.outcome && state.shot.trail.length > 1);
    this.renderEasterEgg(state, now, reducedMotion, kickerParts);
    this.renderWeather(state, now, reducedMotion, kickerParts);
    this.renderer.render(this.scene, this.camera);
  }
}
