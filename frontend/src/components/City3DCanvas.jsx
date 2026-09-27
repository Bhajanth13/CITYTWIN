import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Camera, Eye, RotateCw, ZoomIn, ZoomOut, Compass, 
  Layers, ShieldAlert, Activity, Navigation, Radio, MapPin
} from 'lucide-react';

export default function City3DCanvas({
  cityState,
  selectedRoad,
  onSelectRoad,
  activeAccidentRoadId = "ROAD_A"
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const roadsGroupRef = useRef(new THREE.Group());
  const buildingsGroupRef = useRef(new THREE.Group());
  const particlesGroupRef = useRef(new THREE.Group());
  const ambulanceMeshRef = useRef(null);
  const accidentMeshRef = useRef(null);

  const [cameraMode, setCameraMode] = useState('iso'); // 'iso', 'drone', 'chase', 'top'

  // Map 2D seed coordinate (0..1000, 0..600) to 3D World (X, Z)
  const to3D = (x, y, elevation = 0) => {
    const worldX = (x - 500) * 1.6;
    const worldZ = (y - 300) * 1.6;
    return new THREE.Vector3(worldX, elevation, worldZ);
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 560;

    // 1. Scene & Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.0012);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    camera.position.set(0, 520, 680);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting (Command Center Cyberpunk Aesthetic)
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    sunLight.position.set(300, 600, 200);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const warmLight = new THREE.DirectionalLight(0xf59e0b, 0.6);
    warmLight.position.set(-400, 400, -300);
    scene.add(warmLight);

    // 5. Ground Plane & Cyber Grid
    const groundGeo = new THREE.PlaneGeometry(2400, 1600);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x070b14,
      roughness: 0.85,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(2000, 40, 0x1e293b, 0x0f172a);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // 6. Water Canal / River Ribbon
    const riverGeo = new THREE.PlaneGeometry(180, 1600);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.65
    });
    const river = new THREE.Mesh(riverGeo, riverMat);
    river.rotation.x = -Math.PI / 2;
    river.rotation.z = Math.PI / 4;
    river.position.set(-200, 0.5, 0);
    scene.add(river);

    // Add Groups
    scene.add(buildingsGroupRef.current);
    scene.add(roadsGroupRef.current);
    scene.add(particlesGroupRef.current);

    // 7. Procedural 3D City Buildings
    createProceduralCity(buildingsGroupRef.current);

    // 8. 3D Animated Ambulance Model
    const ambGroup = createAmbulanceMesh();
    scene.add(ambGroup);
    ambulanceMeshRef.current = ambGroup;

    // 9. 3D Incident Beacon Wreckage Model
    const accidentGroup = createAccidentBeacon();
    scene.add(accidentGroup);
    accidentMeshRef.current = accidentGroup;

    // 10. Mouse Drag Controls (Orbit & Pan)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let cameraAngle = { theta: 0, phi: Math.PI / 3, radius: 850 };

    const updateCameraFromAngles = () => {
      camera.position.x = cameraAngle.radius * Math.sin(cameraAngle.phi) * Math.sin(cameraAngle.theta);
      camera.position.y = cameraAngle.radius * Math.cos(cameraAngle.phi);
      camera.position.z = cameraAngle.radius * Math.sin(cameraAngle.phi) * Math.cos(cameraAngle.theta);
      camera.lookAt(0, 0, 0);
    };

    const onMouseDown = (e) => {
      if (e.button === 0 || e.button === 2) {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      cameraAngle.theta -= deltaX * 0.005;
      cameraAngle.phi = Math.max(0.1, Math.min(Math.PI / 2.1, cameraAngle.phi - deltaY * 0.005));

      updateCameraFromAngles();
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      cameraAngle.radius = Math.max(300, Math.min(1400, cameraAngle.radius + e.deltaY * 0.8));
      updateCameraFromAngles();
    };

    // Raycasting for 3D Road Click Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(roadsGroupRef.current.children, true);

      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit && !hit.userData?.roadId && hit.parent) {
          hit = hit.parent;
        }
        if (hit && hit.userData?.road) {
          onSelectRoad(hit.userData.road);
        }
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domEl.addEventListener('wheel', onWheel, { passive: false });
    domEl.addEventListener('click', onClick);

    // 11. Animation Loop (60 FPS)
    let clock = new THREE.Clock();
    let ambProgress = 0;

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Animate 3D Traffic Flow Particles
      particlesGroupRef.current.children.forEach((p) => {
        if (p.userData && p.userData.speed) {
          p.userData.progress = (p.userData.progress + delta * p.userData.speed) % 1.0;
          p.position.lerpVectors(p.userData.pStart, p.userData.pEnd, p.userData.progress);
        }
      });

      // Animate Ambulance along Dijkstra Route
      if (ambulanceMeshRef.current && ambulanceMeshRef.current.userData?.routePoints?.length > 1) {
        const pts = ambulanceMeshRef.current.userData.routePoints;
        const totalSegments = pts.length - 1;
        ambProgress = (ambProgress + delta * 0.15) % totalSegments;
        const segIdx = Math.floor(ambProgress);
        const subProgress = ambProgress - segIdx;

        const p1 = pts[segIdx];
        const p2 = pts[segIdx + 1] || pts[segIdx];
        ambulanceMeshRef.current.position.lerpVectors(p1, p2, subProgress);
        ambulanceMeshRef.current.position.y = 8;
        ambulanceMeshRef.current.lookAt(p2.x, 8, p2.z);

        // Rotating siren light
        if (ambulanceMeshRef.current.userData.sirenLight) {
          ambulanceMeshRef.current.userData.sirenLight.intensity = Math.sin(time * 15) > 0 ? 3.0 : 0.2;
          ambulanceMeshRef.current.userData.sirenLight.color.setHex(Math.sin(time * 15) > 0 ? 0xef4444 : 0x38bdf8);
        }
      }

      // Animate Accident Warning Beacon
      if (accidentMeshRef.current) {
        accidentMeshRef.current.rotation.y += delta * 1.5;
        const scale = 1.0 + Math.sin(time * 6) * 0.15;
        accidentMeshRef.current.scale.set(scale, scale, scale);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const newW = mountRef.current.clientWidth;
      const newH = mountRef.current.clientHeight || 560;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domEl.removeEventListener('wheel', onWheel);
      domEl.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update 3D Roads & Particles whenever cityState or selection changes
  useEffect(() => {
    if (!cityState || !roadsGroupRef.current) return;

    const nodeMap = {};
    (cityState.nodes || []).forEach(n => {
      nodeMap[n.id] = to3D(n.x, n.y, 4);
    });

    // Clear previous roads and particles
    while (roadsGroupRef.current.children.length > 0) {
      const obj = roadsGroupRef.current.children[0];
      roadsGroupRef.current.remove(obj);
    }
    while (particlesGroupRef.current.children.length > 0) {
      const obj = particlesGroupRef.current.children[0];
      particlesGroupRef.current.remove(obj);
    }

    // Color mapper
    const getRoadColor = (r) => {
      if (r.is_blocked || r.congestion_level === 'BLOCKED') return 0xdc2626;
      switch (r.congestion_level) {
        case 'LOW': return 0x10b981;
        case 'MODERATE': return 0xf59e0b;
        case 'HIGH': return 0xf97316;
        case 'SEVERE': return 0xef4444;
        default: return 0x38bdf8;
      }
    };

    (cityState.roads || []).forEach(road => {
      const pStart = nodeMap[road.start_node];
      const pEnd = nodeMap[road.end_node];
      if (!pStart || !pEnd) return;

      const isSelected = selectedRoad?.id === road.id;
      const isBlocked = road.is_blocked;
      const roadColor = getRoadColor(road);

      // 1. Create 3D Road Mesh (Extruded Ribbon)
      const roadGroup = new THREE.Group();
      roadGroup.userData = { roadId: road.id, road: road };

      const distance = pStart.distanceTo(pEnd);
      const roadWidth = isBlocked ? 14 : 11;
      const roadGeo = new THREE.BoxGeometry(roadWidth, 3, distance);
      const roadMat = new THREE.MeshStandardMaterial({
        color: isBlocked ? 0x7f1d1d : 0x1e293b,
        roughness: 0.4,
        metalness: 0.6
      });
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);

      // Orient and position road mesh between nodes
      const midPoint = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
      roadMesh.position.copy(midPoint);
      roadMesh.position.y = 2;
      roadMesh.lookAt(pEnd);
      roadGroup.add(roadMesh);

      // Glowing traffic ribbon line on top
      const ribbonGeo = new THREE.BoxGeometry(isSelected ? 9 : 6, 0.8, distance - 4);
      const ribbonMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0x38bdf8 : roadColor,
        transparent: true,
        opacity: isBlocked ? 0.9 : 0.85
      });
      const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
      ribbonMesh.position.copy(midPoint);
      ribbonMesh.position.y = 4.2;
      ribbonMesh.lookAt(pEnd);
      roadGroup.add(ribbonMesh);

      // Selection Glow Box
      if (isSelected) {
        const selGeo = new THREE.BoxGeometry(roadWidth + 8, 8, distance + 6);
        const selMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.6 });
        const selMesh = new THREE.Mesh(selGeo, selMat);
        selMesh.position.copy(midPoint);
        selMesh.position.y = 4;
        selMesh.lookAt(pEnd);
        roadGroup.add(selMesh);
      }

      roadsGroupRef.current.add(roadGroup);

      // 2. Add 3D Moving Traffic Flow Particles (inversely proportional to congestion)
      if (!isBlocked) {
        const particleCount = Math.max(3, Math.min(10, Math.floor(road.vehicle_count / 80)));
        const flowSpeed = Math.max(0.04, (road.average_speed / 50.0) * 0.25);

        for (let i = 0; i < particleCount; i++) {
          const pGeo = new THREE.SphereGeometry(2.2, 8, 8);
          const pMat = new THREE.MeshBasicMaterial({ color: roadColor });
          const particle = new THREE.Mesh(pGeo, pMat);
          particle.userData = {
            pStart: pStart.clone().setY(5.5),
            pEnd: pEnd.clone().setY(5.5),
            speed: flowSpeed,
            progress: i / particleCount
          };
          particlesGroupRef.current.add(particle);
        }
      }
    });

    // Update Ambulance Route path in 3D
    const ambulance = (cityState.emergency_vehicles || []).find(v => v.id === "AMB_01");
    if (ambulanceMeshRef.current && ambulance && ambulance.route && ambulance.route.length > 0) {
      const routePts = ambulance.route.map(nId => nodeMap[nId]).filter(Boolean);
      ambulanceMeshRef.current.userData.routePoints = routePts;
    }

    // Update 3D Accident Scene position
    const activeInc = (cityState.incidents || []).find(i => i.active);
    if (accidentMeshRef.current) {
      if (activeInc && cityState.roads) {
        const targetR = cityState.roads.find(r => r.id === activeInc.affected_road_id);
        if (targetR && nodeMap[targetR.start_node] && nodeMap[targetR.end_node]) {
          const mid = new THREE.Vector3().addVectors(nodeMap[targetR.start_node], nodeMap[targetR.end_node]).multiplyScalar(0.5);
          accidentMeshRef.current.position.set(mid.x, 16, mid.z);
          accidentMeshRef.current.visible = true;
        } else {
          accidentMeshRef.current.visible = false;
        }
      } else {
        accidentMeshRef.current.visible = false;
      }
    }
  }, [cityState, selectedRoad]);

  // Camera presets
  const setCameraPreset = (preset) => {
    setCameraMode(preset);
    if (!cameraRef.current) return;
    const cam = cameraRef.current;

    switch (preset) {
      case 'drone':
        cam.position.set(0, 480, 520);
        cam.lookAt(0, 0, 0);
        break;
      case 'iso':
        cam.position.set(450, 480, 500);
        cam.lookAt(0, 0, 0);
        break;
      case 'top':
        cam.position.set(0, 850, 50);
        cam.lookAt(0, 0, 0);
        break;
      case 'chase':
        if (ambulanceMeshRef.current) {
          const pos = ambulanceMeshRef.current.position;
          cam.position.set(pos.x + 120, pos.y + 160, pos.z + 180);
          cam.lookAt(pos.x, 10, pos.z);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '560px', borderRadius: '0.85rem', overflow: 'hidden', border: '1px solid #1e293b', backgroundColor: '#0a0f1d' }}>
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* Top Floating Telemetry Overlay */}
      <div style={{
        position: 'absolute',
        top: 14,
        left: 16,
        zIndex: 10,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(10px)',
        padding: '0.45rem 0.9rem',
        borderRadius: '0.5rem',
        border: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        fontSize: '0.75rem',
        color: '#94a3b8'
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
        <span style={{ fontWeight: 700, color: '#f8fafc' }}>3D DIGITAL TWIN WEBGL ENGINE</span>
        <span>• 60 FPS Dynamic Continuum Flow</span>
      </div>

      {/* Camera View Preset Controls */}
      <div style={{
        position: 'absolute',
        top: 14,
        right: 16,
        zIndex: 10,
        display: 'flex',
        gap: '0.4rem',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(10px)',
        padding: '0.35rem',
        borderRadius: '0.5rem',
        border: '1px solid #334155'
      }}>
        <button
          onClick={() => setCameraPreset('iso')}
          style={{
            padding: '0.35rem 0.65rem',
            backgroundColor: cameraMode === 'iso' ? '#0284c7' : 'transparent',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.3rem',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
          title="Isometric View"
        >
          🏙️ Isometric
        </button>
        <button
          onClick={() => setCameraPreset('drone')}
          style={{
            padding: '0.35rem 0.65rem',
            backgroundColor: cameraMode === 'drone' ? '#0284c7' : 'transparent',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.3rem',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
          title="Drone Aerial Perspective"
        >
          🚁 Drone
        </button>
        <button
          onClick={() => setCameraPreset('chase')}
          style={{
            padding: '0.35rem 0.65rem',
            backgroundColor: cameraMode === 'chase' ? '#0284c7' : 'transparent',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.3rem',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
          title="Ambulance Follow Cam"
        >
          🚑 Follow
        </button>
        <button
          onClick={() => setCameraPreset('top')}
          style={{
            padding: '0.35rem 0.65rem',
            backgroundColor: cameraMode === 'top' ? '#0284c7' : 'transparent',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.3rem',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
          title="2D/3D Top-Down Tactical"
        >
          🗺️ Top-Down
        </button>
      </div>

      {/* Bottom 3D Scene Legend */}
      <div style={{
        position: 'absolute',
        bottom: 14,
        left: 16,
        zIndex: 10,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(10px)',
        padding: '0.5rem 0.9rem',
        borderRadius: '0.5rem',
        border: '1px solid #334155',
        display: 'flex',
        gap: '1rem',
        fontSize: '0.75rem',
        color: '#cbd5e1'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 12, height: 12, backgroundColor: '#10b981', borderRadius: 2 }}></span>
          <span>Flowing (v &gt; 35 km/h)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 12, height: 12, backgroundColor: '#f59e0b', borderRadius: 2 }}></span>
          <span>Moderate Delay</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 12, height: 12, backgroundColor: '#ef4444', borderRadius: 2 }}></span>
          <span>Severe Bottleneck</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 12, height: 12, backgroundColor: '#dc2626', border: '1px solid #fff', borderRadius: 2 }}></span>
          <span>Blocked (Crash)</span>
        </div>
      </div>

      {/* Helper text overlay */}
      <div style={{
        position: 'absolute',
        bottom: 14,
        right: 16,
        zIndex: 10,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        padding: '0.4rem 0.75rem',
        borderRadius: '0.4rem',
        fontSize: '0.7rem',
        color: '#94a3b8'
      }}>
        🖱️ Drag to Rotate • Right-Click to Pan • Scroll to Zoom
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Helper: Procedural 3D City Buildings & Landmarks
// -------------------------------------------------------------
function createProceduralCity(group) {
  // 1. Procedural High-Rise Downtown Blocks
  const buildingMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.6,
    metalness: 0.4
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.75
  });

  const windowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  // Generate a cluster of skyscrapers around town
  const buildingLocations = [
    // Tech corridor
    { x: -540, z: -240, w: 60, d: 60, h: 140 },
    { x: -460, z: -280, w: 45, d: 50, h: 110 },
    { x: -520, z: -160, w: 55, d: 55, h: 90 },
    // Center ring commercial blocks
    { x: -60, z: -80, w: 65, d: 65, h: 180 },
    { x: 30, z: -90, w: 50, d: 55, h: 150 },
    { x: -80, z: 80, w: 55, d: 60, h: 130 },
    { x: 40, z: 70, w: 60, d: 50, h: 100 },
    // East side high-rises
    { x: 260, z: -120, w: 50, d: 50, h: 120 },
    { x: 320, z: -80, w: 45, d: 55, h: 160 },
    { x: 280, z: 40, w: 50, d: 50, h: 110 },
    // South residential zone (lower blocks)
    { x: -40, z: 320, w: 70, d: 45, h: 60 },
    { x: 50, z: 340, w: 65, d: 50, h: 55 },
    { x: -140, z: 330, w: 60, d: 55, h: 50 },
    // West Market area
    { x: -340, z: 40, w: 55, d: 50, h: 70 },
    { x: -320, z: -40, w: 60, d: 45, h: 65 },
  ];

  buildingLocations.forEach(loc => {
    const geo = new THREE.BoxGeometry(loc.w, loc.h, loc.d);
    const bMesh = new THREE.Mesh(geo, buildingMat);
    bMesh.position.set(loc.x, loc.h / 2, loc.z);
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    group.add(bMesh);

    // Glowing roof perimeter
    const roofGeo = new THREE.BoxGeometry(loc.w * 0.9, 3, loc.d * 0.9);
    const roofMesh = new THREE.Mesh(roofGeo, windowMat);
    roofMesh.position.set(loc.x, loc.h + 1.5, loc.z);
    group.add(roofMesh);
  });

  // 2. Custom 3D Landmark: City General Hospital (at world coordinates ~ x: 512, z: -256)
  const hospGroup = new THREE.Group();
  hospGroup.position.set(512, 0, -256);

  // Hospital Base & Wings
  const hospBase = new THREE.Mesh(new THREE.BoxGeometry(110, 80, 80), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 }));
  hospBase.position.y = 40;
  hospGroup.add(hospBase);

  const hospWing = new THREE.Mesh(new THREE.BoxGeometry(140, 50, 50), new THREE.MeshStandardMaterial({ color: 0xcfd8dc }));
  hospWing.position.y = 25;
  hospGroup.add(hospWing);

  // Helipad on rooftop
  const helipad = new THREE.Mesh(new THREE.CylinderGeometry(25, 25, 3, 24), new THREE.MeshStandardMaterial({ color: 0x334155 }));
  helipad.position.y = 81.5;
  hospGroup.add(helipad);

  // 3D Glowing Red Cross
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(16, 5, 5), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  crossH.position.y = 84;
  hospGroup.add(crossH);
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 16), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  crossV.position.y = 84;
  hospGroup.add(crossV);

  group.add(hospGroup);

  // 3. Custom 3D Landmark: Central Emergency Station (at x: -560, z: 288)
  const stationGroup = new THREE.Group();
  stationGroup.position.set(-560, 0, 288);
  const stationBase = new THREE.Mesh(new THREE.BoxGeometry(90, 45, 75), new THREE.MeshStandardMaterial({ color: 0x1e3a8a }));
  stationBase.position.y = 22.5;
  stationGroup.add(stationBase);

  // Dual Bays
  const bay1 = new THREE.Mesh(new THREE.BoxGeometry(25, 25, 4), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
  bay1.position.set(-20, 12.5, 38);
  stationGroup.add(bay1);
  const bay2 = new THREE.Mesh(new THREE.BoxGeometry(25, 25, 4), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
  bay2.position.set(20, 12.5, 38);
  stationGroup.add(bay2);

  group.add(stationGroup);
}

// -------------------------------------------------------------
// Helper: 3D Ambulance Mesh with rotating sirens
// -------------------------------------------------------------
function createAmbulanceMesh() {
  const ambGroup = new THREE.Group();

  // Vehicle Body
  const bodyGeo = new THREE.BoxGeometry(16, 10, 26);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 5;
  ambGroup.add(body);

  // Red Cross Decals
  const redBand = new THREE.Mesh(new THREE.BoxGeometry(16.5, 2.5, 20), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  redBand.position.y = 5;
  ambGroup.add(redBand);

  // Windshield
  const glass = new THREE.Mesh(new THREE.BoxGeometry(14, 5, 8), new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.1 }));
  glass.position.set(0, 7.5, 8);
  ambGroup.add(glass);

  // Flashing Siren Light
  const sirenLight = new THREE.PointLight(0xef4444, 2.5, 90);
  sirenLight.position.set(0, 12, 0);
  ambGroup.add(sirenLight);
  ambGroup.userData.sirenLight = sirenLight;

  return ambGroup;
}

// -------------------------------------------------------------
// Helper: 3D Incident Beacon & Hazard Smoke
// -------------------------------------------------------------
function createAccidentBeacon() {
  const beaconGroup = new THREE.Group();

  // Holographic Warning Octahedron
  const prismGeo = new THREE.OctahedronGeometry(12, 0);
  const prismMat = new THREE.MeshBasicMaterial({ color: 0xef4444, wireframe: true });
  const prism = new THREE.Mesh(prismGeo, prismMat);
  beaconGroup.add(prism);

  // Solid center core
  const coreGeo = new THREE.SphereGeometry(6, 12, 12);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const core = new THREE.Mesh(coreGeo, coreMat);
  beaconGroup.add(core);

  // Ground hazard ring
  const ringGeo = new THREE.RingGeometry(18, 22, 24);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xdc2626, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -14;
  beaconGroup.add(ring);

  const light = new THREE.PointLight(0xef4444, 3.5, 140);
  beaconGroup.add(light);

  beaconGroup.visible = false;
  return beaconGroup;
}
