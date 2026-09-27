import React from 'react';
import { Building2, Plus, AlertOctagon, GraduationCap, Bus, ShoppingBag, Home, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function CityMap({ cityState, selectedRoad, onSelectRoad }) {
  if (!cityState) return null;

  const { nodes = [], roads = [], locations = [], emergency_vehicles = [], incidents = [] } = cityState;

  // Map nodes to easy coordinate lookup
  const nodeMap = {};
  nodes.forEach(node => {
    nodeMap[node.id] = { x: node.x, y: node.y, name: node.name };
  });

  // Color mapping based on congestion level
  const getRoadColor = (road) => {
    if (road.is_blocked || road.congestion_level === 'BLOCKED') return '#dc2626';
    switch (road.congestion_level) {
      case 'LOW': return '#10b981';      // Emerald Green
      case 'MODERATE': return '#f59e0b'; // Amber
      case 'HIGH': return '#f97316';     // Orange
      case 'SEVERE': return '#ef4444';   // Bright Red
      default: return '#3b82f6';
    }
  };

  const getLocationIcon = (type) => {
    switch (type) {
      case 'hospital':
        return <Plus size={16} color="#ffffff" strokeWidth={3} />;
      case 'emergency_station':
        return <ShieldAlert size={16} color="#ffffff" />;
      case 'education':
        return <GraduationCap size={16} color="#ffffff" />;
      case 'transit':
        return <Bus size={16} color="#ffffff" />;
      case 'commercial':
        return <ShoppingBag size={16} color="#ffffff" />;
      case 'residential':
        return <Home size={16} color="#ffffff" />;
      default:
        return <Building2 size={16} color="#ffffff" />;
    }
  };

  const getLocationColor = (type) => {
    switch (type) {
      case 'hospital': return '#ef4444';          // Red for Hospital
      case 'emergency_station': return '#3b82f6';  // Blue for Emergency Station
      case 'education': return '#8b5cf6';          // Purple for University
      case 'transit': return '#06b6d4';            // Cyan for Terminal
      case 'commercial': return '#f59e0b';         // Amber for Tech / Market
      case 'residential': return '#10b981';        // Green for Residential
      default: return '#6b7280';
    }
  };

  // Find ambulance
  const ambulance = emergency_vehicles.find(v => v.id === 'AMB_01');

  return (
    <div style={{ position: 'relative', width: '100%', backgroundColor: '#0d1527', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #1e293b' }}>
      {/* Map Header Overlay */}
      <div style={{
        position: 'absolute',
        top: 14,
        left: 16,
        zIndex: 10,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        padding: '0.4rem 0.8rem',
        borderRadius: '0.5rem',
        border: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        fontSize: '0.75rem',
        color: '#94a3b8'
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
        <span>Virtual Urban Canvas (1000 x 600) • 18 Arterials • 8 Strategic Nodes</span>
      </div>

      {/* Map Legend */}
      <div style={{
        position: 'absolute',
        bottom: 14,
        left: 16,
        zIndex: 10,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        padding: '0.5rem 0.9rem',
        borderRadius: '0.5rem',
        border: '1px solid #334155',
        display: 'flex',
        gap: '1rem',
        fontSize: '0.75rem',
        color: '#cbd5e1'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 14, height: 4, backgroundColor: '#10b981', borderRadius: 2 }}></span>
          <span>Low (Flowing)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 14, height: 4, backgroundColor: '#f59e0b', borderRadius: 2 }}></span>
          <span>Moderate</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 14, height: 4, backgroundColor: '#f97316', borderRadius: 2 }}></span>
          <span>High Congestion</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 14, height: 4, backgroundColor: '#ef4444', borderRadius: 2 }}></span>
          <span>Severe</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 14, height: 4, backgroundColor: '#dc2626', border: '1px dashed #ffffff', borderRadius: 2 }}></span>
          <span>Blocked (Incident)</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        viewBox="0 0 1000 600"
        style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '540px' }}
      >
        {/* Decorative Grid Lines */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(51, 65, 85, 0.25)" strokeWidth="0.8" />
          </pattern>
          {/* Animated filter for blocked road */}
          <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="1000" height="600" fill="url(#grid)" />

        {/* 1. Draw Roads */}
        {roads.map(road => {
          const start = nodeMap[road.start_node];
          const end = nodeMap[road.end_node];
          if (!start || !end) return null;

          const isSelected = selectedRoad?.id === road.id;
          const roadColor = getRoadColor(road);
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;

          return (
            <g
              key={road.id}
              onClick={() => onSelectRoad(road)}
              style={{ cursor: 'pointer' }}
            >
              {/* Outer Glow / Selection Indicator */}
              {isSelected && (
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="#38bdf8"
                  strokeWidth="14"
                  strokeOpacity="0.45"
                  strokeLinecap="round"
                />
              )}

              {/* Blocked Road Warning Aura */}
              {road.is_blocked && (
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="#ef4444"
                  strokeWidth="12"
                  strokeOpacity="0.6"
                  strokeLinecap="round"
                  filter="url(#glow-red)"
                >
                  <animate attributeName="stroke-opacity" values="0.7;0.2;0.7" dur="1.2s" repeatCount="indefinite" />
                </line>
              )}

              {/* Underlying Base Road Track */}
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="#1e293b"
                strokeWidth="9"
                strokeLinecap="round"
              />

              {/* Dynamic Traffic Road Line */}
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={roadColor}
                strokeWidth={road.is_blocked ? "6" : "5"}
                strokeDasharray={road.is_blocked ? "8,6" : "none"}
                strokeLinecap="round"
                style={{ transition: 'stroke 0.3s ease, stroke-width 0.2s ease' }}
              />

              {/* Road ID Label Bubble */}
              <circle
                cx={midX}
                cy={midY}
                r={road.is_blocked ? "12" : "10"}
                fill={road.is_blocked ? "#dc2626" : "#0f172a"}
                stroke={roadColor}
                strokeWidth="1.5"
              />
              <text
                x={midX}
                y={midY + (road.is_blocked ? 3.5 : 3.5)}
                textAnchor="middle"
                fontSize={road.is_blocked ? "8" : "8.5"}
                fontWeight="700"
                fill="#ffffff"
              >
                {road.is_blocked ? "⚠" : road.id.replace('ROAD_', '')}
              </text>
            </g>
          );
        })}

        {/* 2. Highlight Ambulance Active Route (Emergency Corridor) */}
        {ambulance && ambulance.route && ambulance.route.length > 1 && (
          <g>
            {ambulance.route.slice(0, -1).map((nodeId, idx) => {
              const nextNodeId = ambulance.route[idx + 1];
              const p1 = nodeMap[nodeId];
              const p2 = nodeMap[nextNodeId];
              if (!p1 || !p2) return null;
              return (
                <g key={`amb_seg_${idx}`}>
                  {/* Glowing emergency path backing */}
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#0284c7"
                    strokeWidth="8"
                    strokeOpacity="0.4"
                    strokeLinecap="round"
                  />
                  {/* Moving dashed emergency corridor indicator */}
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#38bdf8"
                    strokeWidth="3.5"
                    strokeDasharray="6,6"
                    strokeLinecap="round"
                  >
                    <animate attributeName="stroke-dashoffset" values="0;24" dur="1s" repeatCount="indefinite" />
                  </line>
                </g>
              );
            })}
          </g>
        )}

        {/* 3. Draw Nodes (Intersections) */}
        {nodes.map(node => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r="7"
              fill="#1e293b"
              stroke="#64748b"
              strokeWidth="2"
            />
            <circle
              cx={node.x}
              cy={node.y}
              r="2.5"
              fill="#94a3b8"
            />
          </g>
        ))}

        {/* 4. Draw Locations (Landmarks) */}
        {locations.map(loc => {
          const color = getLocationColor(loc.type);
          return (
            <g key={loc.id} transform={`translate(${loc.x}, ${loc.y})`}>
              {/* Pulsing ring for hospital */}
              {loc.type === 'hospital' && (
                <circle r="22" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.4">
                  <animate attributeName="r" values="18;26;18" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Landmark background circle */}
              <circle
                r="16"
                fill={color}
                stroke="#ffffff"
                strokeWidth="2"
                style={{ filter: 'drop-shadow(0px 3px 6px rgba(0,0,0,0.6))' }}
              />

              {/* Icon Container */}
              <g transform="translate(-8, -8)">
                {getLocationIcon(loc.type)}
              </g>

              {/* Landmark Text Tag */}
              <rect
                x="-55"
                y="19"
                width="110"
                height="17"
                rx="4"
                fill="rgba(15, 23, 42, 0.9)"
                stroke="#334155"
                strokeWidth="0.8"
              />
              <text
                x="0"
                y="31"
                textAnchor="middle"
                fontSize="8.5"
                fontWeight="600"
                fill="#f1f5f9"
              >
                {loc.name.length > 20 ? loc.name.substring(0, 18) + '...' : loc.name}
              </text>
            </g>
          );
        })}

        {/* 5. Draw Ambulance Unit */}
        {ambulance && (
          <g transform={`translate(${nodeMap[ambulance.route[0]]?.x || 150}, ${nodeMap[ambulance.route[0]]?.y || 480})`}>
            {/* Siren pulse animation if dispatched */}
            {ambulance.status === "DISPATCHED" && (
              <circle r="22" fill="none" stroke="#38bdf8" strokeWidth="2">
                <animate attributeName="r" values="14;28;14" dur="0.8s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.8;0.0;0.8" dur="0.8s" repeatCount="indefinite" />
              </circle>
            )}
            <circle r="14" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
            <text x="0" y="4" textAnchor="middle" fontSize="10">🚑</text>
            <rect x="-32" y="-24" width="64" height="15" rx="3" fill="#0369a1" />
            <text x="0" y="-13" textAnchor="middle" fontSize="8" fontWeight="700" fill="#ffffff">
              AMB-01 ({ambulance.estimated_arrival_time_min}m)
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
