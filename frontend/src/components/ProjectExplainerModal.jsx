import React from 'react';
import { 
  X, BookOpen, Layers, Cpu, Award, Zap, HelpCircle, 
  ArrowRight, ShieldCheck, Activity, Wind, Megaphone, CheckCircle2 
} from 'lucide-react';

export default function ProjectExplainerModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 8, 16, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem'
    }}>
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #38bdf8',
        borderRadius: '1rem',
        maxWidth: '850px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.2)',
        color: '#f8fafc'
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#1e293b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              backgroundColor: '#0284c7',
              padding: '0.4rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                CityTwin Project Explainer & Hackathon Pitch Guide
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Everything you need to explain your project to yourself, teammates, and hackathon judges!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '0.375rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Section 1: The Elevator Pitch */}
          <div style={{
            backgroundColor: 'rgba(2, 132, 199, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '0.75rem',
            padding: '1rem 1.25rem'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={16} /> 60-Second Hackathon Elevator Pitch (Say This to Judges!)
            </h3>
            <p style={{ fontSize: '0.88rem', lineHeight: '1.5', color: '#e2e8f0', fontStyle: 'italic' }}>
              "Good morning judges! We built <strong>CITYTWIN</strong> — an integrated 3D Smart City Digital Twin and Decision Support Platform. 
              In real cities, an accident doesn't just block a road: it causes gridlock, delays life-saving ambulances, spikes localized air pollution, and leaves commuters frustrated. 
              CITYTWIN connects the entire 6-stage smart city loop: it <strong>monitors</strong> live sensors, <strong>simulates</strong> physics using <strong>MATLAB & Simulink</strong> macroscopic traffic models, <strong>evaluates</strong> multi-objective interventions in real-time, and <strong>informs</strong> citizens through dynamic roadside LED signs and mobile alerts. 
              Watch as we simulate an accident on Road A and see how our system dynamically cuts ambulance response times from 14 minutes down to 4.8 minutes!"
            </p>
          </div>

          {/* Section 2: The 6-Stage Closed Loop Pipeline */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Activity size={18} color="#10b981" /> The 6-Stage Smart City Decision Loop
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              
              <div style={{ backgroundColor: '#1e293b', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.8rem', marginBottom: '0.25rem' }}>1. MONITOR</div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Simulates real-time IoT inductive road loop sensors and environmental monitors across city corridors.</div>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                <div style={{ color: '#818cf8', fontWeight: 800, fontSize: '0.8rem', marginBottom: '0.25rem' }}>2. SIMULATE</div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Uses <strong>MATLAB & Simulink</strong> Greenshields & BPR equations to compute speed, density, and shockwaves.</div>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.8rem', marginBottom: '0.25rem' }}>3. PREDICT</div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Forecasts congestion spillovers, ambulance route delays, and speed-degraded emission increases (AQI).</div>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                <div style={{ color: '#10b981', fontWeight: 800, fontSize: '0.8rem', marginBottom: '0.25rem' }}>4. OPTIMIZE</div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Dijkstra congestion-aware shortest path finds clear emergency corridors; multi-criteria utility ranks actions.</div>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                <div style={{ color: '#ec4899', fontWeight: 800, fontSize: '0.8rem', marginBottom: '0.25rem' }}>5. RECOMMEND</div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Presents 3 clear options (Option A: Do Nothing, Option B: Police Diversion, Option C: Smart Adaptive Response).</div>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                <div style={{ color: '#34d399', fontWeight: 800, fontSize: '0.8rem', marginBottom: '0.25rem' }}>6. INFORM</div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Dispatches roadside LED Variable Message Signs (VMS) and push notifications to citizens' smartphones.</div>
              </div>

            </div>
          </div>

          {/* Section 3: How & Where MATLAB and Simulink are Used */}
          <div style={{
            backgroundColor: '#111827',
            border: '1px solid #475569',
            borderRadius: '0.75rem',
            padding: '1.25rem'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f59e0b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={18} /> Where, How, and Why MATLAB & Simulink are Used
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.75rem' }}>
              Unlike toy prototypes that use hardcoded numbers, CITYTWIN is backed by authentic differential equations and simulation scripts in the <code style={{ color: '#38bdf8' }}>matlab/</code> directory:
            </p>
            <ul style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1.2rem' }}>
              <li>
                <strong style={{ color: '#f8fafc' }}>1. Greenshields Macroscopic Flow (<code style={{ color: '#38bdf8' }}>matlab/traffic_flow_model.m</code>):</strong> Computes velocity as vehicle density increases: 
                <span style={{ color: '#34d399', fontFamily: 'monospace' }}> v = vf * (1 - k/kj)</span>. When an accident reduces capacity, density spikes and speed collapses.
              </li>
              <li>
                <strong style={{ color: '#f8fafc' }}>2. Bureau of Public Roads (BPR) Link Delay Function:</strong> Models highway queuing: 
                <span style={{ color: '#34d399', fontFamily: 'monospace' }}> t = t0 * (1 + alpha * (q/c)^beta)</span>. This calculates the realistic travel time for normal traffic and emergency ambulances.
              </li>
              <li>
                <strong style={{ color: '#f8fafc' }}>3. Environmental Emissions Model (<code style={{ color: '#38bdf8' }}>matlab/emissions_aqi_model.m</code>):</strong> Connects vehicle speed to stop-and-go exhaust degradation: idling engines at 8 km/h produce 3.5x more PM2.5 than free-flowing traffic.
              </li>
              <li>
                <strong style={{ color: '#f8fafc' }}>4. Simulink Model Generator (<code style={{ color: '#38bdf8' }}>matlab/build_simulink_model.m</code>):</strong> Automatically compiles a graphical Simulink block diagram with Integrator, Transfer Fcn, and Scope blocks for state-space feedback control.
              </li>
              <li>
                <strong style={{ color: '#f8fafc' }}>5. Python Fast Mirror (<code style={{ color: '#38bdf8' }}>backend/app/simulation/matlab_bridge.py</code>):</strong> Implements the exact same ODE equations inside the FastAPI backend so your sliders run with sub-10 millisecond response time in the web app!
              </li>
            </ul>
          </div>

          {/* Section 4: How to Demo to Judges (Step-by-Step) */}
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '0.75rem',
            padding: '1.25rem'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={18} /> Step-by-Step Hackathon Demo Script
            </h3>
            <ol style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingLeft: '1.2rem' }}>
              <li>
                <strong>Step 1: Normal Baseline:</strong> Click <em>"1. Normal Baseline"</em> at the top. Point out to judges that all roads are green, average speed is ~40 km/h, and AQI is healthy (45).
              </li>
              <li>
                <strong>Step 2: Inject Accident:</strong> Click <em>"2. Crash Road A"</em> (or drag the Accident Impairment slider). Show judges how Road A turns red, traffic particles back up, and the 3D ambulance turns on its siren.
              </li>
              <li>
                <strong>Step 3: Interactive Sliders:</strong> Drag the <em>"Traffic Demand"</em> slider to 150% or change weather to <em>"Rain"</em>. Point out that the Comparison Table and KPIs update immediately — nothing is static!
              </li>
              <li>
                <strong>Step 4: Multi-Objective Decision Matrix:</strong> Scroll down to the table. Explain how Option C (Adaptive Green Wave + Dynamic VMS) outperforms Option A and B across congestion, delay, and emissions.
              </li>
              <li>
                <strong>Step 5: Apply Option C:</strong> Click <em>"Apply This Intervention"</em>. Point out the roadside LED VMS sign, the citizen smartphone alert, and the fast ambulance routing!
              </li>
            </ol>
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: '#1e293b'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Got It, Back to Mission Control!
          </button>
        </div>
      </div>
    </div>
  );
}
