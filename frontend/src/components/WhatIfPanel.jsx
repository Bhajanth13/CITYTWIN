import React, { useState } from 'react';
import { Sliders, CloudRain, Play, ArrowRight, Activity, Car, Wind, Clock } from 'lucide-react';

export default function WhatIfPanel() {
  const [trafficMultiplier, setTrafficMultiplier] = useState(1.4);
  const [rainfall, setRainfall] = useState('none');
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRunWhatIf = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/simulation/what-if', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traffic_multiplier: trafficMultiplier,
          rainfall_level: rainfall
        })
      });
      const data = await res.json();
      setSimResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#38bdf8' }}>
        <Sliders size={20} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f9fafb' }}>
          What-If Scenario Projection Studio
        </h3>
      </div>
      <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: '1.25rem' }}>
        Adjust city traffic demand multipliers and atmospheric weather friction to forecast network vulnerability.
      </p>

      {/* Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Slider 1: Traffic Demand Level */}
        <div style={{ backgroundColor: '#1f2937', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #374151' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e5e7eb' }}>
              Traffic Volume Multiplier
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8' }}>
              {Math.round(trafficMultiplier * 100)}% Demand
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.8"
            step="0.05"
            value={trafficMultiplier}
            onChange={(e) => setTrafficMultiplier(parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#38bdf8' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>
            <span>50% (Late Night)</span>
            <span>100% (Normal)</span>
            <span>180% (Extreme Rush)</span>
          </div>
        </div>

        {/* Selector 2: Weather & Precipitation */}
        <div style={{ backgroundColor: '#1f2937', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #374151' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#e5e7eb', marginBottom: '0.5rem' }}>
            <CloudRain size={16} color="#60a5fa" />
            <span>Weather & Roadway Friction</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {['none', 'moderate', 'heavy'].map(lvl => (
              <button
                key={lvl}
                type="button"
                onClick={() => setRainfall(lvl)}
                style={{
                  padding: '0.4rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '0.375rem',
                  border: rainfall === lvl ? '1px solid #38bdf8' : '1px solid #374151',
                  backgroundColor: rainfall === lvl ? 'rgba(56, 189, 248, 0.15)' : '#111827',
                  color: rainfall === lvl ? '#38bdf8' : '#9ca3af',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {lvl === 'none' ? 'Clear Sky' : `${lvl} Rain`}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.4rem' }}>
            {rainfall === 'none' ? 'Normal pavement traction' : rainfall === 'moderate' ? '-15% free-speed friction' : '-30% free-speed hazard'}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          onClick={handleRunWhatIf}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <Play size={16} />
          <span>{loading ? 'Projecting Dynamics...' : 'RUN WHAT-IF SIMULATION'}</span>
        </button>
      </div>

      {/* Results Projection Cards */}
      {simResult && (
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '0.5rem',
          padding: '1.25rem'
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f9fafb', marginBottom: '0.85rem' }}>
            Projected Macro Impact (At {simResult.inputs.traffic_percentage}% Traffic Volume)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* Density */}
            <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '0.375rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Traffic Density</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', fontSize: '1.1rem', fontWeight: 800 }}>
                <span style={{ color: '#94a3b8' }}>{simResult.baseline.traffic_density_pct}%</span>
                <ArrowRight size={14} color="#64748b" />
                <span style={{ color: simResult.projected.traffic_density_pct > 75 ? '#f87171' : '#34d399' }}>
                  {simResult.projected.traffic_density_pct}%
                </span>
              </div>
            </div>

            {/* Mean Speed */}
            <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '0.375rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mean Speed</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', fontSize: '1.1rem', fontWeight: 800 }}>
                <span style={{ color: '#94a3b8' }}>{simResult.baseline.average_speed_kmh} km/h</span>
                <ArrowRight size={14} color="#64748b" />
                <span style={{ color: simResult.projected.average_speed_kmh < 25 ? '#f87171' : '#34d399' }}>
                  {simResult.projected.average_speed_kmh} km/h
                </span>
              </div>
            </div>

            {/* AQI */}
            <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '0.375rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Urban AQI</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', fontSize: '1.1rem', fontWeight: 800 }}>
                <span style={{ color: '#94a3b8' }}>{simResult.baseline.aqi}</span>
                <ArrowRight size={14} color="#64748b" />
                <span style={{ color: simResult.projected.aqi > 90 ? '#f87171' : '#34d399' }}>
                  {simResult.projected.aqi}
                </span>
              </div>
            </div>

            {/* Ambulance Time */}
            <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '0.375rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Ambulance Delay</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', fontSize: '1.1rem', fontWeight: 800 }}>
                <span style={{ color: '#94a3b8' }}>{simResult.baseline.ambulance_time_min}m</span>
                <ArrowRight size={14} color="#64748b" />
                <span style={{ color: simResult.projected.ambulance_time_min > 10 ? '#f87171' : '#34d399' }}>
                  {simResult.projected.ambulance_time_min}m
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
