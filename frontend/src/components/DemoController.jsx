import React, { useState } from 'react';
import { Play, SkipForward, RotateCcw, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

export default function DemoController({
  onStepChange,
  currentStep,
  onResetCity,
  onSimulateAccident,
  onApplyOptimal
}) {
  const steps = [
    {
      num: 1,
      title: "1. NORMAL CITY",
      desc: "Baseline conditions: free-flowing traffic, normal AQI (45), ambulance standby at Central Station.",
      actionLabel: "Observe Baseline",
      action: onResetCity
    },
    {
      num: 2,
      title: "2. SIMULATE ACCIDENT",
      desc: "Accident strikes Central Hospital Arterial (Road A). Road becomes impassable and blocked.",
      actionLabel: "Trigger Accident",
      action: onSimulateAccident
    },
    {
      num: 3,
      title: "3. PREDICT IMPACT",
      desc: "Simulate physics: 480 displaced vehicles spill over to Road B & C; speed drops; AQI worsens.",
      actionLabel: "Predict Impact",
      action: null
    },
    {
      num: 4,
      title: "4. TEST INTERVENTIONS",
      desc: "Engine forks city state to simulate Option A (Do Nothing), Option B (Reroute), and Option C (Priority + Rerouting).",
      actionLabel: "Run Interventions",
      action: null
    },
    {
      num: 5,
      title: "5. COMPARISON MATRIX",
      desc: "Inspect multi-criteria comparison table evaluating delay, congestion, and emissions.",
      actionLabel: "Compare Options",
      action: null
    },
    {
      num: 6,
      title: "6. RECOMMENDATION",
      desc: "Transparent utility scoring identifies Option C (Emergency Priority + Rerouting) with explainable reasons.",
      actionLabel: "View Recommendation",
      action: null
    },
    {
      num: 7,
      title: "7. CITIZEN ALERTS",
      desc: "Generate simulated mobile push notification and roadside digital Variable Message Sign (VMS).",
      actionLabel: "Broadcast Alerts",
      action: null
    },
    {
      num: 8,
      title: "8. APPLY OPTIMAL RESPONSE",
      desc: "Execute Option C on the live network: congestion falls, ambulance route clears (6.0 min), pollution drops.",
      actionLabel: "Apply to City",
      action: onApplyOptimal
    }
  ];

  const handleNextStep = async () => {
    const next = (currentStep + 1) > 8 ? 1 : currentStep + 1;
    onStepChange(next);
    const stepObj = steps[next - 1];
    if (stepObj?.action) {
      await stepObj.action();
    }
  };

  const handleSelectStep = async (stepNum) => {
    onStepChange(stepNum);
    const stepObj = steps[stepNum - 1];
    if (stepObj?.action) {
      await stepObj.action();
    }
  };

  return (
    <div style={{
      backgroundColor: '#0f172a',
      border: '1px solid #38bdf8',
      borderRadius: '0.75rem',
      padding: '1.25rem',
      boxShadow: '0 0 25px rgba(56, 189, 248, 0.15)',
      marginBottom: '1.25rem'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={20} color="#38bdf8" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f9fafb' }}>
            HACKATHON DEMO MODE — 8-Stage Interactive Walkthrough
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => handleSelectStep(1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.4rem 0.75rem',
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '0.375rem',
              color: '#cbd5e1',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={13} />
            <span>Restart Demo</span>
          </button>
          <button
            onClick={handleNextStep}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 1rem',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <span>Next Stage ({currentStep}/8)</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Stepper Dots / Bars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.4rem', marginBottom: '1rem' }}>
        {steps.map((s) => {
          const isActive = s.num === currentStep;
          const isPassed = s.num < currentStep;
          return (
            <button
              key={s.num}
              onClick={() => handleSelectStep(s.num)}
              style={{
                backgroundColor: isActive ? '#38bdf8' : isPassed ? '#059669' : '#1e293b',
                color: isActive ? '#0b0f19' : isPassed ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '0.25rem',
                padding: '0.4rem 0.2rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
              title={s.title}
            >
              Step {s.num}
            </button>
          );
        })}
      </div>

      {/* Current Step Spotlight Card */}
      <div style={{
        backgroundColor: '#111827',
        border: '1px solid #1e293b',
        borderRadius: '0.5rem',
        padding: '0.85rem 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.2rem' }}>
            {steps[currentStep - 1]?.title}
          </div>
          <p style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
            {steps[currentStep - 1]?.desc}
          </p>
        </div>

        {steps[currentStep - 1]?.action && (
          <button
            onClick={() => steps[currentStep - 1].action()}
            style={{
              padding: '0.45rem 0.9rem',
              backgroundColor: currentStep === 2 ? '#dc2626' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {steps[currentStep - 1].actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
