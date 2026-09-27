import React from 'react';
import { X, Navigation, Gauge, Wind, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';

export default function RoadInspector({ road, onClose, onCrashRoad, onClearRoad }) {
  if (!road) return null;

  const getCongestionBadgeStyle = (level) => {
    switch (level) {
      case 'LOW':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: '#10b981' };
      case 'MODERATE':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: '#f59e0b' };
      case 'HIGH':
        return { bg: 'rgba(249, 115, 22, 0.15)', text: '#fb923c', border: '#f97316' };
      case 'SEVERE':
      case 'BLOCKED':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: '#ef4444' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: '#3b82f6' };
    }
  };

  const badge = getCongestionBadgeStyle(road.congestion_level);

  return (
    <div style={{
      backgroundColor: '#111827',
      border: '1px solid #374151',
      borderRadius: '0.75rem',
      padding: '1.25rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid #1f2937', paddingBottom: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              backgroundColor: '#1f2937',
              padding: '0.15rem 0.45rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#38bdf8'
            }}>
              {road.id}
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f9fafb' }}>{road.name}</h3>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.2rem' }}>
            {road.start_node} &rarr; {road.end_node}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '0.2rem' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Congestion Status Banner */}
      <div style={{
        backgroundColor: badge.bg,
        border: `1px solid ${badge.border}`,
        borderRadius: '0.5rem',
        padding: '0.5rem 0.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: badge.text, fontSize: '0.85rem', fontWeight: 700 }}>
          {road.is_blocked ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
          <span>STATUS: {road.congestion_level}</span>
        </div>
        <span style={{ fontSize: '0.8rem', color: '#e5e7eb', fontWeight: 600 }}>
          {Math.round(road.traffic_density * 100)}% Saturation
        </span>
      </div>

      {/* 2-Column Physical Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ backgroundColor: '#1f2937', padding: '0.75rem', borderRadius: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            <Gauge size={14} />
            <span>Traffic Dynamics</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div>Speed: <strong style={{ color: '#fff' }}>{road.average_speed} km/h</strong></div>
            <div>Free-Flow: {road.free_flow_speed} km/h</div>
            <div>Travel Time: <strong style={{ color: '#fff' }}>{road.travel_time_min > 900 ? 'Impassable' : `${road.travel_time_min} min`}</strong></div>
            <div>Vehicles: {road.vehicle_count} / {road.capacity}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#1f2937', padding: '0.75rem', borderRadius: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            <Wind size={14} />
            <span>Environmental Impact</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div>AQI: <strong style={{ color: road.aqi > 100 ? '#f87171' : '#34d399' }}>{road.aqi} ({road.aqi_category})</strong></div>
            <div>CO2: {road.co2_kg_hr} kg/h</div>
            <div>NOx: {road.nox_g_hr} g/h</div>
            <div>PM2.5: {road.pm25_g_hr} g/h</div>
          </div>
        </div>
      </div>

      {/* Geometry Footer */}
      <div style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1f2937', paddingTop: '0.5rem', marginBottom: '0.75rem' }}>
        <span>Length: <strong>{road.length_km} km</strong></span>
        <span>Design Capacity: <strong>{road.capacity} veh/h</strong></span>
      </div>

      {/* Interactive Crash / Reopen Button */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {road.is_blocked ? (
          <button
            type="button"
            onClick={() => onClearRoad && onClearRoad(road.id)}
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.55rem',
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.45rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <ShieldCheck size={14} />
            <span>Reopen & Clear {road.id}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onCrashRoad && onCrashRoad(road.id)}
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.55rem',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.45rem',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
            }}
          >
            <Flame size={14} />
            <span>💥 Crash This Road ({road.id})</span>
          </button>
        )}
      </div>
    </div>
  );
}
