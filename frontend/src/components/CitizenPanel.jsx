import React, { useState } from 'react';
import { Megaphone, Radio, Send, CheckCircle2, AlertTriangle, MapPin, Tv } from 'lucide-react';

export default function CitizenPanel({
  onReportSubmitted,
  layout = 'full',
  activeRoadId = 'ROAD_A',
  roads = [],
  isAccidentActive = false
}) {
  const [issueType, setIssueType] = useState('accident');
  const [locationId, setLocationId] = useState('LOC_MARKET');
  const [severity, setSeverity] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);

  const isHud = layout === 'hud';

  // Resolve target road & recommended detour road dynamically
  const targetRoad = roads.find(r => r.id === activeRoadId) || { id: activeRoadId, name: 'Arterial Highway' };
  const altRoad = roads.find(r => r.id !== activeRoadId && !r.is_blocked) || { id: 'ROAD_B', name: 'Expressway Bypass' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/citizen/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_type: issueType,
          location_id: locationId,
          severity: severity,
          description: description
        })
      });
      if (res.ok) {
        setSubmitSuccess(true);
        setDescription('');
        if (onReportSubmitted) onReportSubmitted();
        setTimeout(() => setSubmitSuccess(false), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      display: isHud ? 'flex' : 'grid',
      gridTemplateColumns: isHud ? 'none' : 'repeat(auto-fit, minmax(340px, 1fr))',
      flexDirection: isHud ? 'column' : 'initial',
      gap: '0.85rem'
    }}>
      {/* 1. Roadside Variable Message Sign (VMS) Preview */}
      <div className="card" style={{ padding: isHud ? '1rem' : '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#38bdf8' }}>
          <Tv size={16} />
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f9fafb' }}>
            Roadside LED Sign (VMS)
          </h4>
        </div>

        {/* LED Highway Sign Styling */}
        <div style={{
          backgroundColor: '#05070d',
          border: '2px solid #1e293b',
          borderRadius: '0.5rem',
          padding: isHud ? '0.75rem' : '1.25rem',
          textAlign: 'center',
          boxShadow: isAccidentActive ? '0 0 20px rgba(245, 158, 11, 0.25)' : '0 0 15px rgba(16, 185, 129, 0.15)'
        }}>
          {isAccidentActive ? (
            <div style={{
              fontFamily: 'ui-monospace, Consolas, Monaco, monospace',
              fontSize: isHud ? '0.92rem' : '1.1rem',
              fontWeight: 900,
              color: '#f59e0b',
              letterSpacing: '0.1em',
              lineHeight: '1.6',
              textShadow: '0 0 8px rgba(245, 158, 11, 0.8)'
            }}>
              <div>ACCIDENT AHEAD</div>
              <div>AVOID {targetRoad.id.replace('ROAD_', 'ROAD ')}</div>
              <div>USE {altRoad.id.replace('ROAD_', 'ROAD ')} &rarr;</div>
            </div>
          ) : (
            <div style={{
              fontFamily: 'ui-monospace, Consolas, Monaco, monospace',
              fontSize: isHud ? '0.88rem' : '1rem',
              fontWeight: 900,
              color: '#10b981',
              letterSpacing: '0.1em',
              lineHeight: '1.6',
              textShadow: '0 0 8px rgba(16, 185, 129, 0.8)'
            }}>
              <div>TRAFFIC NORMAL</div>
              <div>ALL ROADS OPEN</div>
              <div>DRIVE SAFELY</div>
            </div>
          )}
        </div>
        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.35rem', textAlign: 'center' }}>
          Simulated overhead LED gantry above Central Interchange
        </div>
      </div>

      {/* 2. Public Push Notification Preview */}
      <div className="card" style={{ padding: isHud ? '1rem' : '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#f59e0b' }}>
          <Megaphone size={16} />
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f9fafb' }}>
            Citizen Mobile Alert
          </h4>
        </div>

        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '0.5rem',
          padding: isHud ? '0.75rem' : '1rem',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: isAccidentActive ? '#ef4444' : '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isAccidentActive ? '⚠️ EMERGENCY ALERT' : '✓ TRAFFIC ADVISORY'}
            </span>
            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Smartphone Push</span>
          </div>
          {isAccidentActive ? (
            <>
              <p style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: '1.4', marginBottom: '0.45rem' }}>
                Collision on <strong>{targetRoad.name} ({targetRoad.id})</strong>. Detour via <strong>{altRoad.name} ({altRoad.id})</strong>.
              </p>
              <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 600 }}>
                Estimated Travel Time Savings: <strong>~37%</strong>
              </div>
            </>
          ) : (
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.4' }}>
              Smart city arterial network operating at optimal capacity. No major incident delays reported.
            </p>
          )}
        </div>
      </div>

      {/* 3. Citizen Incident Report Form */}
      <div className="card" style={{ padding: isHud ? '1rem' : '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isHud && !showReportForm ? 0 : '0.5rem', color: '#10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Radio size={16} />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f9fafb' }}>
              Crowdsourced Report
            </h4>
          </div>
          {isHud && (
            <button
              type="button"
              onClick={() => setShowReportForm(!showReportForm)}
              style={{
                background: 'none',
                border: '1px solid #334155',
                color: '#38bdf8',
                borderRadius: '4px',
                padding: '0.2rem 0.5rem',
                fontSize: '0.7rem',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              {showReportForm ? 'Hide' : '+ Report'}
            </button>
          )}
        </div>

        {(!isHud || showReportForm) && (
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.75rem' }}>
            Citizens report real-world hazards dynamically into operations log.
          </p>
        )}

        {submitSuccess && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem',
            color: '#34d399',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={16} />
            <span>Incident dispatched successfully to City Operations Centre!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: 600 }}>
              Incident Type
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.375rem',
                color: '#fff',
                fontSize: '0.85rem'
              }}
            >
              <option value="accident">Accident / Collision</option>
              <option value="road_closure">Road Construction / Closure</option>
              <option value="hazard">Hazard / Obstruction</option>
              <option value="heavy_jam">Severe Unreported Traffic Jam</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: 600 }}>
                Location
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.375rem',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              >
                <option value="LOC_MARKET">Downtown Market</option>
                <option value="LOC_TECHPARK">Tech & Business Park</option>
                <option value="LOC_UNIVERSITY">Metro University</option>
                <option value="LOC_TERMINAL">Transit Terminal</option>
                <option value="LOC_JUNCTION">Central Roundabout</option>
                <option value="LOC_RESIDENTIAL">Residential District</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: 600 }}>
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.375rem',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              >
                <option value="LOW">Low (Minor Delay)</option>
                <option value="MEDIUM">Medium (Lane Blocked)</option>
                <option value="HIGH">High (Road Impassable)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: 600 }}>
              Description & Details
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Stalled delivery truck blocking right lane, cars piling up..."
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.375rem',
                color: '#fff',
                fontSize: '0.85rem',
                resize: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.65rem',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              marginTop: '0.25rem'
            }}
          >
            <Send size={15} />
            <span>{submitting ? 'Submitting...' : 'SUBMIT CITIZEN REPORT'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
