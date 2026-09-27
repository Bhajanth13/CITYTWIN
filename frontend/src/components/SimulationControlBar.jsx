import React from 'react';
import { 
  Sliders, Flame, RotateCcw, Play, CloudRain, 
  Wind, Zap, AlertTriangle, CheckCircle, Navigation 
} from 'lucide-react';

export default function SimulationControlBar({
  params,
  onChangeParams,
  onRunSimulation,
  onTriggerAccident,
  onResetBaseline,
  isSimulating,
  roads = [],
  layout = 'horizontal'
}) {
  const handleSliderChange = (key, value) => {
    onChangeParams({ ...params, [key]: value });
  };

  const isVertical = layout === 'vertical';

  return (
    <div style={{
      backgroundColor: '#111827',
      border: '1px solid #374151',
      borderRadius: '0.85rem',
      padding: isVertical ? '1rem' : '1.25rem',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.85rem'
    }}>
      {/* Header & Quick Action Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
        borderBottom: isVertical ? '1px solid #1f2937' : 'none',
        paddingBottom: isVertical ? '0.65rem' : 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            backgroundColor: '#0284c7',
            padding: '0.35rem',
            borderRadius: '0.4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sliders size={16} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: isVertical ? '0.95rem' : '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
              Simulation Controls
            </h3>
            {!isVertical && (
              <p style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                Adjust city demand, crash severity, and environmental sliders to simulate live consequences in 3D.
              </p>
            )}
          </div>
        </div>

        {/* Master Execution Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: isVertical ? '100%' : 'auto', marginTop: isVertical ? '0.35rem' : 0 }}>
          <button
            onClick={onRunSimulation}
            disabled={isSimulating}
            style={{
              flex: isVertical ? 1 : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.5rem 0.85rem',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.45rem',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
              transition: 'all 0.15s ease'
            }}
            title="Recalculate entire network"
          >
            <Zap size={14} />
            <span>{isSimulating ? '...' : 'SIMULATE'}</span>
          </button>

          <button
            onClick={onTriggerAccident}
            disabled={isSimulating}
            style={{
              flex: isVertical ? 1 : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.5rem 0.85rem',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.45rem',
              fontWeight: 700,
              fontSize: '0.75rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
            }}
            title={`Inject collision on ${params.accident_road_id}`}
          >
            <Flame size={14} />
            <span>CRASH {params.accident_road_id ? params.accident_road_id.replace('ROAD_', '') : 'A'}</span>
          </button>

          <button
            onClick={onResetBaseline}
            disabled={isSimulating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              padding: '0.5rem 0.65rem',
              backgroundColor: '#1f2937',
              border: '1px solid #475569',
              color: '#cbd5e1',
              borderRadius: '0.45rem',
              fontWeight: 600,
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
            title="Reset City to Normal Baseline"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Interactive Controls Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isVertical ? '1fr' : 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '0.85rem',
        backgroundColor: '#0a0f1d',
        padding: '0.85rem',
        borderRadius: '0.65rem',
        border: '1px solid #1e293b'
      }}>
        {/* Knob 1: Traffic Demand Multiplier */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.78rem' }}>
            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Traffic Volume Demand</span>
            <span style={{ color: '#38bdf8', fontWeight: 800, fontFamily: 'monospace' }}>
              {Math.round(params.traffic_multiplier * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={params.traffic_multiplier}
            onChange={(e) => handleSliderChange('traffic_multiplier', parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#38bdf8' }}
          />
          {/* Quick Presets */}
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem' }}>
            {[
              { label: '50% Night', val: 0.5 },
              { label: '100% Normal', val: 1.0 },
              { label: '150% Rush', val: 1.5 },
              { label: '200% Gridlock', val: 2.0 }
            ].map(p => (
              <button
                key={p.val}
                type="button"
                onClick={() => handleSliderChange('traffic_multiplier', p.val)}
                style={{
                  flex: 1,
                  padding: '0.2rem 0.1rem',
                  fontSize: '0.65rem',
                  borderRadius: '3px',
                  border: '1px solid #334155',
                  backgroundColor: Math.abs(params.traffic_multiplier - p.val) < 0.05 ? '#0284c7' : '#1e293b',
                  color: Math.abs(params.traffic_multiplier - p.val) < 0.05 ? '#fff' : '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Knob 2: Accident Severity */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.78rem' }}>
            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Accident Impairment</span>
            <span style={{ color: params.accident_severity_pct > 80 ? '#f87171' : params.accident_severity_pct > 0 ? '#fbbf24' : '#34d399', fontWeight: 800, fontFamily: 'monospace' }}>
              {Math.round(params.accident_severity_pct)}% Blocked
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={params.accident_severity_pct}
            onChange={(e) => handleSliderChange('accident_severity_pct', parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#ef4444' }}
          />
          {/* Quick Presets */}
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem' }}>
            {[
              { label: '0% Clear', val: 0 },
              { label: '40% Minor', val: 40 },
              { label: '80% Heavy', val: 80 },
              { label: '100% Closure', val: 100 }
            ].map(p => (
              <button
                key={p.val}
                type="button"
                onClick={() => {
                  const updated = {
                    ...params,
                    accident_severity_pct: p.val,
                    is_accident_active: p.val > 0
                  };
                  onChangeParams(updated);
                }}
                style={{
                  flex: 1,
                  padding: '0.2rem 0.1rem',
                  fontSize: '0.65rem',
                  borderRadius: '3px',
                  border: '1px solid #334155',
                  backgroundColor: Math.abs(params.accident_severity_pct - p.val) < 3 ? '#b91c1c' : '#1e293b',
                  color: Math.abs(params.accident_severity_pct - p.val) < 3 ? '#fff' : '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Knob 3: Target Road Selection */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: 600 }}>
            Incident Corridor Location
          </label>
          <select
            value={params.accident_road_id}
            onChange={(e) => handleSliderChange('accident_road_id', e.target.value)}
            style={{
              width: '100%',
              padding: '0.4rem',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '0.375rem',
              color: '#f8fafc',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
          >
            {roads.map(r => (
              <option key={r.id} value={r.id}>
                {r.id}: {r.name}
              </option>
            ))}
          </select>
          {/* Quick Corridor Selection Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.35rem' }}>
            {['ROAD_A', 'ROAD_B', 'ROAD_C', 'ROAD_D', 'ROAD_E', 'ROAD_F'].map(rId => (
              <button
                key={rId}
                type="button"
                onClick={() => handleSliderChange('accident_road_id', rId)}
                style={{
                  flex: '1 1 30%',
                  padding: '0.2rem 0.2rem',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  borderRadius: '3px',
                  border: params.accident_road_id === rId ? '1px solid #ef4444' : '1px solid #334155',
                  backgroundColor: params.accident_road_id === rId ? 'rgba(239, 68, 68, 0.25)' : '#1e293b',
                  color: params.accident_road_id === rId ? '#fca5a5' : '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                {rId.replace('ROAD_', 'Road ')}
              </button>
            ))}
          </div>
        </div>

        {/* Knob 4: Weather / Pavement Friction */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: 600 }}>
            Weather & Roadway Friction
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
            {['clear', 'rain', 'storm'].map(w => (
              <button
                key={w}
                type="button"
                onClick={() => handleSliderChange('weather', w)}
                style={{
                  padding: '0.35rem 0.2rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  borderRadius: '0.3rem',
                  border: params.weather === w ? '1px solid #38bdf8' : '1px solid #334155',
                  backgroundColor: params.weather === w ? 'rgba(56, 189, 248, 0.2)' : '#1e293b',
                  color: params.weather === w ? '#38bdf8' : '#94a3b8',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {w === 'clear' ? '☀️ Clear' : w === 'rain' ? '🌧️ Rain' : '⛈️ Storm'}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.2rem' }}>
            {params.weather === 'clear' ? '100% velocity' : params.weather === 'rain' ? '-15% friction' : '-30% storm grip'}
          </div>
        </div>
      </div>
    </div>
  );
}
