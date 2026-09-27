import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Shield, RefreshCw, Cpu, CheckCircle2, AlertCircle, 
  MapPin, Wind, Car, AlertTriangle, Clock, Layers, RotateCcw,
  Flame, ShieldAlert, Award, Megaphone, Sliders, Sparkles, Box,
  BookOpen, Eye, Zap, HelpCircle, ChevronRight, Compass
} from 'lucide-react';

import City3DCanvas from './components/City3DCanvas';
import SimulationControlBar from './components/SimulationControlBar';
import RoadInspector from './components/RoadInspector';
import SimulinkModal from './components/SimulinkModal';
import ProjectExplainerModal from './components/ProjectExplainerModal';
import InterventionDeck from './components/InterventionDeck';
import CitizenPanel from './components/CitizenPanel';
import WhatIfPanel from './components/WhatIfPanel';

export default function App() {
  const [cityState, setCityState] = useState(null);
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [isSimulinkModalOpen, setIsSimulinkModalOpen] = useState(false);
  const [isExplainerModalOpen, setIsExplainerModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('cockpit'); // 'cockpit', 'what-if'
  const [activeStoryStep, setActiveStoryStep] = useState(1);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState(null);
  const [latency, setLatency] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const decisionTableRef = useRef(null);

  // UNIFIED DYNAMIC SIMULATION PARAMETERS (Controllable by user via sliders)
  const [simParams, setSimParams] = useState({
    traffic_multiplier: 1.0,
    accident_road_id: 'ROAD_A',
    accident_severity_pct: 0,
    weather: 'clear',
    industrial_base_aqi: 45,
    is_accident_active: false
  });

  // Dynamic evaluation comparison matrix
  const [evalData, setEvalData] = useState(null);

  // Fetch initial city state and candidate matrix
  const fetchCityState = async () => {
    const startTime = performance.now();
    try {
      const response = await fetch('/api/city/state');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const endTime = performance.now();
      setCityState(data);
      setLatency(Math.round(endTime - startTime));
      setError(null);
      setLastChecked(new Date().toLocaleTimeString());

      if (selectedRoad) {
        const updated = data.roads.find(r => r.id === selectedRoad.id);
        if (updated) setSelectedRoad(updated);
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server');
    }
  };

  // Evaluate candidate interventions dynamically with current slider parameters
  const fetchDynamicEvaluation = async (paramsToUse = simParams) => {
    try {
      const res = await fetch('/api/decision/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paramsToUse)
      });
      if (res.ok) {
        const data = await res.json();
        setEvalData(data);
      }
    } catch (err) {
      console.error('Failed to evaluate interventions:', err);
    }
  };

  // 1-Click Master Dynamic Simulation Runner
  const handleRunDynamicSimulation = async (overrideParams = null) => {
    const paramsToRun = overrideParams || simParams;
    setSimulating(true);
    try {
      // 1. Update live city state on backend
      const resSim = await fetch('/api/simulation/dynamic-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paramsToRun)
      });
      if (!resSim.ok) throw new Error(`Simulation failed: ${resSim.status}`);
      const updatedCity = await resSim.json();
      setCityState(updatedCity);

      // 2. Recalculate 3-Intervention Matrix dynamically
      await fetchDynamicEvaluation(paramsToRun);

      // Select target road for immediate inspection
      const targetR = updatedCity.roads.find(r => r.id === paramsToRun.accident_road_id);
      if (targetR) setSelectedRoad(targetR);
    } catch (err) {
      setError(err.message || 'Simulation execution failed');
    } finally {
      setSimulating(false);
    }
  };

  // Trigger accident directly on any chosen road
  const handleTriggerAccident = async (targetRoadId = null) => {
    const roadToCrash = targetRoadId || simParams.accident_road_id || 'ROAD_A';
    const updated = { 
      ...simParams, 
      accident_road_id: roadToCrash,
      is_accident_active: true, 
      accident_severity_pct: simParams.accident_severity_pct > 0 ? simParams.accident_severity_pct : 100 
    };
    setSimParams(updated);
    setActiveStoryStep(2);
    await handleRunDynamicSimulation(updated);
  };

  // Reset city to normal baseline
  const handleResetBaseline = async () => {
    const resetParams = {
      traffic_multiplier: 1.0,
      accident_road_id: 'ROAD_A',
      accident_severity_pct: 0,
      weather: 'clear',
      industrial_base_aqi: 45,
      is_accident_active: false
    };
    setSimParams(resetParams);
    setActiveStoryStep(1);
    setSimulating(true);
    try {
      const res = await fetch('/api/simulation/clear', { method: 'POST' });
      const data = await res.json();
      setCityState(data);
      setSelectedRoad(null);
      await fetchDynamicEvaluation(resetParams);
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  // Apply Option C
  const handleApplyIntervention = async (optionId = 'OPTION_C') => {
    try {
      setSimulating(true);
      setActiveStoryStep(4);
      const res = await fetch('/api/decision/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_id: optionId })
      });
      const data = await res.json();
      setCityState(data);
      await fetchDynamicEvaluation();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  // Step 3 Handler: Scroll to Decision Matrix
  const handleFocusDecisionMatrix = () => {
    setActiveStoryStep(3);
    if (decisionTableRef.current) {
      decisionTableRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    fetchCityState();
    fetchDynamicEvaluation();
    const interval = setInterval(fetchCityState, 6000);
    return () => clearInterval(interval);
  }, []);

  const metrics = cityState?.metrics;
  const isOnline = !error && cityState !== null;
  const hasActiveIncident = (cityState?.incidents && cityState.incidents.length > 0) || simParams.is_accident_active;

  return (
    <div className="dashboard-container" style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc' }}>
      
      {/* ========================================================================= */}
      {/* 1. ULTRA HIGH-TECH COMMAND CENTER HEADER */}
      {/* ========================================================================= */}
      <header style={{
        backgroundColor: '#0d1322',
        borderBottom: '1px solid #1e293b',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Brand & Mission Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            backgroundColor: '#0284c7',
            padding: '0.45rem',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(2, 132, 199, 0.4)'
          }}>
            <Cpu size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.04em', background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                CITYTWIN 3D
              </span>
              <span style={{
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}>
                MISSION COCKPIT
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Integrated Smart City Simulation & Decision Support Platform
            </div>
          </div>
        </div>

        {/* View Switcher & Action Modals */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          
          {/* View Mode Toggle */}
          <div style={{
            backgroundColor: '#1e293b',
            padding: '0.2rem',
            borderRadius: '0.45rem',
            display: 'flex',
            border: '1px solid #334155'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('cockpit')}
              style={{
                padding: '0.3rem 0.65rem',
                borderRadius: '0.35rem',
                border: 'none',
                backgroundColor: viewMode === 'cockpit' ? '#0284c7' : 'transparent',
                color: viewMode === 'cockpit' ? '#fff' : '#94a3b8',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cockpit View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('what-if')}
              style={{
                padding: '0.3rem 0.65rem',
                borderRadius: '0.35rem',
                border: 'none',
                backgroundColor: viewMode === 'what-if' ? '#0284c7' : 'transparent',
                color: viewMode === 'what-if' ? '#fff' : '#94a3b8',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              What-If Studio
            </button>
          </div>

          {/* Project Explainer Button */}
          <button
            onClick={() => setIsExplainerModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '0.45rem',
              border: '1px solid #38bdf8',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.2)'
            }}
            title="Read plain-English overview & pitch script for judges"
          >
            <BookOpen size={14} />
            <span>💡 How It Works & Pitch Guide</span>
          </button>

          {/* MATLAB / Simulink Engine Button */}
          <button
            onClick={() => setIsSimulinkModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '0.45rem',
              border: '1px solid #f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: '#fbbf24',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Inspect MATLAB Greenshields differential equations & Simulink block diagram"
          >
            <Layers size={14} />
            <span>📐 MATLAB Math Engine</span>
          </button>

          {/* Master Reset Button */}
          <button
            onClick={handleResetBaseline}
            disabled={simulating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.4rem 0.65rem',
              borderRadius: '0.45rem',
              border: '1px solid #475569',
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Reset City to Normal Baseline"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>

          {/* Heartbeat Status Dot */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.7rem',
            borderRadius: '9999px',
            fontSize: '0.72rem',
            fontWeight: 800,
            border: hasActiveIncident ? '1px solid #ef4444' : '1px solid #10b981',
            backgroundColor: hasActiveIncident ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            color: hasActiveIncident ? '#f87171' : '#34d399'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: hasActiveIncident ? '#ef4444' : '#10b981',
              boxShadow: hasActiveIncident ? '0 0 8px #ef4444' : '0 0 8px #10b981'
            }}></span>
            <span>{hasActiveIncident ? 'INCIDENT IN PROGRESS' : 'CITY ONLINE'}</span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. GUIDED 4-STEP HACKATHON STORYLINE BAR */}
      {/* ========================================================================= */}
      <div style={{
        backgroundColor: '#0f172a',
        borderBottom: '1px solid #1e293b',
        padding: '0.65rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.6rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>
          <Sparkles size={14} color="#38bdf8" />
          <span>GUIDED DEMO STORYLINE:</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Step 1 */}
          <button
            onClick={handleResetBaseline}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '0.4rem',
              border: activeStoryStep === 1 ? '1px solid #10b981' : '1px solid #334155',
              backgroundColor: activeStoryStep === 1 ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
              color: activeStoryStep === 1 ? '#34d399' : '#cbd5e1',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <span>1. Normal Baseline</span>
          </button>

          <ChevronRight size={14} color="#64748b" />

          {/* Step 2 */}
          <button
            onClick={() => handleTriggerAccident(simParams.accident_road_id)}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '0.4rem',
              border: activeStoryStep === 2 ? '1px solid #ef4444' : '1px solid #334155',
              backgroundColor: activeStoryStep === 2 ? 'rgba(239, 68, 68, 0.25)' : '#1e293b',
              color: activeStoryStep === 2 ? '#f87171' : '#cbd5e1',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Flame size={13} color="#ef4444" />
            <span>2. Crash {simParams.accident_road_id ? simParams.accident_road_id.replace('ROAD_', 'Road ') : 'Road A'}</span>
          </button>

          <ChevronRight size={14} color="#64748b" />

          {/* Step 3 */}
          <button
            onClick={handleFocusDecisionMatrix}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '0.4rem',
              border: activeStoryStep === 3 ? '1px solid #f59e0b' : '1px solid #334155',
              backgroundColor: activeStoryStep === 3 ? 'rgba(245, 158, 11, 0.2)' : '#1e293b',
              color: activeStoryStep === 3 ? '#fbbf24' : '#cbd5e1',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Award size={13} color="#f59e0b" />
            <span>3. Compare Intervention Options (A vs B vs C)</span>
          </button>

          <ChevronRight size={14} color="#64748b" />

          {/* Step 4 */}
          <button
            onClick={() => handleApplyIntervention('OPTION_C')}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '0.4rem',
              border: activeStoryStep === 4 ? '1px solid #38bdf8' : '1px solid #334155',
              backgroundColor: activeStoryStep === 4 ? '#0284c7' : '#1e293b',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: activeStoryStep === 4 ? '0 0 12px rgba(2, 132, 199, 0.5)' : 'none'
            }}
          >
            <Zap size={13} />
            <span>4. Dispatch Smart Action (Option C)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN DASHBOARD CONTENT */}
      {/* ========================================================================= */}
      <main style={{ padding: '1.25rem 1.5rem', maxWidth: '1720px', margin: '0 auto', width: '100%' }}>
        
        {/* Connection Error Banner */}
        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#fca5a5',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            <AlertCircle size={18} />
            <div>
              <strong>Backend Disconnected:</strong> {error}. Ensure FastAPI is running on port 8000.
            </div>
          </div>
        )}

        {/* View Mode 1: Cockpit View (Unified All-in-One Mission Control) */}
        {viewMode === 'cockpit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Top Row: 4 Core Smart City KPIs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem'
            }}>
              {/* KPI 1: Congestion */}
              <div className="card" style={{ padding: '0.85rem 1.15rem', backgroundColor: '#111827', border: '1px solid #1f2937' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span>TRAFFIC CONGESTION</span>
                  <Car size={15} color="#38bdf8" />
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: hasActiveIncident ? '#f87171' : '#f8fafc' }}>
                  {metrics ? `${Math.round(metrics.average_traffic_density * 100)}%` : '--'}
                </div>
                {/* Progress bar */}
                <div style={{ width: '100%', height: '4px', backgroundColor: '#1e293b', borderRadius: '2px', marginTop: '0.35rem', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, (metrics?.average_traffic_density || 0.4) * 100)}%`,
                    height: '100%',
                    backgroundColor: (metrics?.average_traffic_density || 0) > 0.75 ? '#ef4444' : (metrics?.average_traffic_density || 0) > 0.5 ? '#f59e0b' : '#10b981',
                    transition: 'width 0.4s ease'
                  }}></div>
                </div>
                <div style={{ fontSize: '0.7rem', color: hasActiveIncident ? '#f87171' : '#34d399', marginTop: '0.3rem' }}>
                  {hasActiveIncident ? '▲ Severe Arterial Jam' : 'Optimal Capacity Flow'}
                </div>
              </div>

              {/* KPI 2: Mean Speed */}
              <div className="card" style={{ padding: '0.85rem 1.15rem', backgroundColor: '#111827', border: '1px solid #1f2937' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span>MEAN NETWORK SPEED</span>
                  <Activity size={15} color="#10b981" />
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: hasActiveIncident ? '#f87171' : '#f8fafc' }}>
                  {metrics ? `${metrics.average_speed_kmh} km/h` : '--'}
                </div>
                <div style={{ fontSize: '0.7rem', color: hasActiveIncident ? '#f87171' : '#94a3b8', marginTop: '0.45rem' }}>
                  {hasActiveIncident ? '▼ Significant Link Delay' : 'Greenshields dynamic flow'}
                </div>
              </div>

              {/* KPI 3: Air Quality AQI */}
              <div className="card" style={{ padding: '0.85rem 1.15rem', backgroundColor: '#111827', border: '1px solid #1f2937' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span>ENVIRONMENTAL AQI</span>
                  <Wind size={15} color="#f59e0b" />
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: (metrics?.city_aqi || 0) > 75 ? '#f87171' : '#f8fafc' }}>
                  {metrics ? `${metrics.city_aqi} AQI` : '--'}
                </div>
                <div style={{ fontSize: '0.7rem', color: (metrics?.city_aqi || 0) > 75 ? '#f87171' : '#34d399', marginTop: '0.45rem' }}>
                  {metrics?.city_aqi_category || 'Good air quality'}
                </div>
              </div>

              {/* KPI 4: Emergency Response Time */}
              <div className="card" style={{ padding: '0.85rem 1.15rem', backgroundColor: '#111827', border: '1px solid #1f2937' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span>AMBULANCE RESPONSE (ETA)</span>
                  <Clock size={15} color="#8b5cf6" />
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: hasActiveIncident ? '#fbbf24' : '#f8fafc' }}>
                  {metrics ? `${metrics.emergency_response_time_min} min` : '--'}
                </div>
                <div style={{ fontSize: '0.7rem', color: hasActiveIncident ? '#fbbf24' : '#38bdf8', marginTop: '0.45rem' }}>
                  {hasActiveIncident ? 'Dijkstra bypass active' : 'Green-wave priority ready'}
                </div>
              </div>
            </div>

            {/* Middle Cockpit Layout: Left Controls (310px) | Center 3D + Table (1fr) | Right HUD (320px) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '310px minmax(500px, 1fr) 320px',
              gap: '1.25rem',
              alignItems: 'start'
            }}>
              
              {/* LEFT HUD: Interactive Simulation Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <SimulationControlBar
                  params={simParams}
                  onChangeParams={(newP) => {
                    setSimParams(newP);
                    // Live dynamic recalculation of candidate interventions as sliders move!
                    fetchDynamicEvaluation(newP);
                  }}
                  onRunSimulation={() => handleRunDynamicSimulation()}
                  onTriggerAccident={handleTriggerAccident}
                  onResetBaseline={handleResetBaseline}
                  isSimulating={simulating}
                  roads={cityState?.roads || []}
                  layout="vertical"
                />

                {/* Road Inspector Overlay (if a road was clicked) */}
                {selectedRoad && (
                  <RoadInspector
                    road={selectedRoad}
                    onClose={() => setSelectedRoad(null)}
                    onCrashRoad={(roadId) => handleTriggerAccident(roadId)}
                    onClearRoad={() => handleResetBaseline()}
                  />
                )}
              </div>

              {/* CENTER COLUMN: 3D Digital Twin City + Real-Time Decision Deck */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Active Incident Warning Alert */}
                {hasActiveIncident && (
                  <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '0.65rem',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: '#fecaca'
                  }}>
                    <ShieldAlert size={22} color="#ef4444" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: '0.8rem', lineHeight: '1.4' }}>
                      <strong>LIVE DIGITAL TWIN COLLISION ACTIVE:</strong> Corridor <strong>{simParams.accident_road_id}</strong> is {simParams.accident_severity_pct}% blocked.
                      Displaced vehicles detoured. Emergency ambulance <strong>AMB-01</strong> is navigating in 3D along the Dijkstra shortest bypass!
                    </div>
                  </div>
                )}

                {/* 3D WebGL Digital Twin Canvas */}
                <div style={{
                  backgroundColor: '#0a0f1d',
                  borderRadius: '0.85rem',
                  border: '1px solid #1e293b',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{ height: '480px', width: '100%', position: 'relative' }}>
                    <City3DCanvas
                      cityState={cityState}
                      selectedRoad={selectedRoad}
                      onSelectRoad={(road) => setSelectedRoad(road)}
                      activeAccidentRoadId={simParams.accident_road_id}
                    />
                  </div>

                  {/* 3D Viewport Footer Bar */}
                  <div style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#0d1322',
                    borderTop: '1px solid #1e293b',
                    fontSize: '0.72rem',
                    color: '#64748b',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Tip: Click any 3D road link to inspect live physics. Drag to rotate in 360°.</span>
                    <span>Engine: Three.js WebGL • Latency: {latency !== null ? `${latency} ms` : '--'}</span>
                  </div>
                </div>

                {/* 3-INTERVENTION COMPARISON MATRIX (Docked directly under the 3D map!) */}
                <div ref={decisionTableRef}>
                  <InterventionDeck
                    evalData={evalData}
                    onApplyIntervention={handleApplyIntervention}
                    onRecalculate={() => fetchDynamicEvaluation(simParams)}
                  />
                </div>

              </div>

              {/* RIGHT HUD: Roadside LED VMS Sign + Citizen Smartphone Alert + Quick Report */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <CitizenPanel
                  onReportSubmitted={fetchCityState}
                  layout="hud"
                  activeRoadId={simParams.accident_road_id}
                  roads={cityState?.roads || []}
                  isAccidentActive={hasActiveIncident}
                />
              </div>

            </div>
          </div>
        )}

        {/* View Mode 2: What-If Scenario Studio */}
        {viewMode === 'what-if' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <WhatIfPanel />
          </div>
        )}

      </main>

      {/* High-Tech Footer */}
      <footer style={{
        padding: '1rem 1.5rem',
        backgroundColor: '#0d1322',
        borderTop: '1px solid #1e293b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.75rem',
        color: '#64748b',
        marginTop: '2rem'
      }}>
        <div>CITYTWIN 3D • Real-time WebGL Digital Twin & MATLAB/Simulink Macroscopic Engine</div>
        <div>Built for Hackathon Demonstration • 100% Local & Offline Executable</div>
      </footer>

      {/* Modal 1: Project Explainer & Hackathon Pitch Guide */}
      <ProjectExplainerModal
        isOpen={isExplainerModalOpen}
        onClose={() => setIsExplainerModalOpen(false)}
      />

      {/* Modal 2: Simulink Block & Differential Equations Inspector */}
      <SimulinkModal
        isOpen={isSimulinkModalOpen}
        onClose={() => setIsSimulinkModalOpen(false)}
      />

    </div>
  );
}

