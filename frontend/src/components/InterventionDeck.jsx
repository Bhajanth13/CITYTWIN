import React, { useState } from 'react';
import { Award, CheckCircle, ArrowRight, ShieldCheck, Zap, AlertTriangle, Activity, Clock, Wind, Sliders } from 'lucide-react';

export default function InterventionDeck({ evalData, onApplyIntervention, onRecalculate }) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = async () => {
    if (!evalData?.recommended_option_id) return;
    setApplying(true);
    try {
      await onApplyIntervention(evalData.recommended_option_id);
      setApplied(true);
    } catch (err) {
      console.error(err);
    } finally {
      setApplying(false);
    }
  };

  if (!evalData) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
        Awaiting simulation parameters...
      </div>
    );
  }

  const optA = evalData.options.find(o => o.id === 'OPTION_A');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Simulation Context Tag */}
      {evalData.parameters_applied && (
        <div style={{
          backgroundColor: 'rgba(2, 132, 199, 0.1)',
          border: '1px solid rgba(2, 132, 199, 0.3)',
          borderRadius: '0.5rem',
          padding: '0.6rem 1rem',
          fontSize: '0.78rem',
          color: '#bae6fd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sliders size={14} color="#38bdf8" />
            <span>
              <strong>Active Simulation Parameters:</strong> Traffic Demand: <strong>{evalData.parameters_applied.traffic_percentage}%</strong> •
              Corridor: <strong>{evalData.parameters_applied.accident_road_id}</strong> ({evalData.parameters_applied.accident_severity_pct}% Blockage) •
              Weather: <strong>{evalData.parameters_applied.weather}</strong>
            </span>
          </div>
          {onRecalculate && (
            <button
              onClick={onRecalculate}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.75rem',
                textDecoration: 'underline'
              }}
            >
              Recalculate Matrix
            </button>
          )}
        </div>
      )}

      {/* 1. Comparison Matrix Table */}
      <div className="card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f9fafb', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={20} color="#f59e0b" />
              <span>Intervention Comparison Matrix (Live Evaluated Scenarios)</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
              Every value is generated dynamically by the MATLAB & BPR link equations for your exact slider configuration.
            </p>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #374151', color: '#9ca3af', textAlign: 'left' }}>
              <th style={{ padding: '0.65rem 0.75rem' }}>Candidate Action</th>
              <th style={{ padding: '0.65rem 0.75rem' }}>Traffic Congestion</th>
              <th style={{ padding: '0.65rem 0.75rem' }}>Mean Speed</th>
              <th style={{ padding: '0.65rem 0.75rem' }}>Ambulance Response</th>
              <th style={{ padding: '0.65rem 0.75rem' }}>Pollution (AQI)</th>
              <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Utility Score</th>
            </tr>
          </thead>
          <tbody>
            {evalData.options.map(opt => {
              const isRec = opt.is_recommended;
              const isA = opt.id === 'OPTION_A';
              const ambDiff = optA ? Math.round((optA.ambulance_time_min - opt.ambulance_time_min) * 10) / 10 : 0;
              const congDiff = optA ? Math.round((optA.traffic_congestion_pct - opt.traffic_congestion_pct) * 10) / 10 : 0;

              return (
                <tr
                  key={opt.id}
                  style={{
                    borderBottom: '1px solid rgba(55, 65, 81, 0.4)',
                    backgroundColor: isRec ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                    fontWeight: isRec ? 700 : 500
                  }}
                >
                  <td style={{ padding: '0.85rem 0.75rem', color: isRec ? '#34d399' : '#f3f4f6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      {isRec && <CheckCircle size={16} color="#10b981" />}
                      <span style={{ fontSize: '0.9rem' }}>{opt.name}</span>
                      {isRec && (
                        <span style={{
                          backgroundColor: '#065f46',
                          color: '#a7f3d0',
                          fontSize: '0.65rem',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          fontWeight: 800
                        }}>
                          BEST
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{
                        color: opt.traffic_congestion_pct > 80 ? '#f87171' : opt.traffic_congestion_pct > 60 ? '#fbbf24' : '#34d399',
                        fontSize: '0.95rem',
                        fontWeight: 700
                      }}>
                        {opt.traffic_congestion_pct}%
                      </span>
                      {!isA && congDiff > 0 && (
                        <span style={{ fontSize: '0.72rem', color: '#10b981' }}>(-{congDiff}%)</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 0.75rem', color: '#e2e8f0' }}>
                    {opt.average_speed_kmh} km/h
                  </td>
                  <td style={{ padding: '0.85rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{
                        color: opt.ambulance_time_min > 12 ? '#f87171' : opt.ambulance_time_min > 8 ? '#fbbf24' : '#34d399',
                        fontSize: '0.95rem',
                        fontWeight: 700
                      }}>
                        {opt.ambulance_time_min} min
                      </span>
                      {!isA && ambDiff > 0 && (
                        <span style={{ fontSize: '0.72rem', color: '#10b981' }}>(-{ambDiff}m)</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 0.75rem' }}>
                    <span style={{ color: opt.pollution_aqi > 90 ? '#f87171' : '#34d399' }}>
                      {opt.pollution_aqi} ({opt.pollution_label})
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', color: isRec ? '#34d399' : '#9ca3af', fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 800 }}>
                    {opt.utility_score.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. Recommendation & Explainable Justification Card */}
      <div className="card" style={{
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        padding: '1.25rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ backgroundColor: '#059669', color: '#ffffff', fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                RECOMMENDED ACTION
              </span>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f9fafb' }}>
                {evalData.recommended_action}
              </h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
              Multi-Criteria Utility Optimization selected this as the mathematically superior response.
            </p>
          </div>

          <button
            onClick={handleApply}
            disabled={applying}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              backgroundColor: applied ? '#059669' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            <Zap size={16} />
            <span>{applied ? '✓ APPLIED TO CITY' : 'APPLY THIS INTERVENTION'}</span>
          </button>
        </div>

        {/* Why Reasons Grid */}
        <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(16, 185, 129, 0.2)', paddingTop: '0.85rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#34d399', marginBottom: '0.5rem' }}>
            Why was this action selected by the Decision Engine?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.6rem' }}>
            {evalData.why_reasons.map((reason, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
                <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
