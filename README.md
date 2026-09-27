# CITYTWIN — Integrated Smart City Simulation & Decision Support Platform

> **Hackathon Prototype** | Developed with Python (FastAPI), React (Vite), and MATLAB / Simulink.  
> Transforming municipal operations: **MONITOR → SIMULATE → PREDICT → OPTIMIZE → RECOMMEND → INFORM**

---

## 1. Project Overview
**CITYTWIN** is a virtual digital-twin prototype of an urban road network. It empowers city administrators, transit authorities, and emergency dispatchers to monitor baseline traffic and environmental conditions, simulate major road accidents, predict multi-domain ripple effects, test alternative interventions, receive transparent decision recommendations, and broadcast real-time guidance to citizens and traffic displays.

---

## 2. The Problem
Urban incidents (such as major road collisions) create complex cross-domain cascades:
* **Traffic Gridlock**: Blocking a core arterial triggers uncoordinated vehicle spillover onto unprepared neighborhood roads.
* **Emergency Delays**: Critical trauma units and ambulances get caught in congestion shockwaves, dangerously increasing response latency.
* **Environmental Spikes**: Stop-and-go vehicle crawling escalates idle fuel consumption, causing sudden local Air Quality Index (AQI) spikes.
* **Information Delay**: Citizens and motorists lack proactive route guidance, exacerbating the bottleneck.

---

## 3. The Solution
CITYTWIN models these cross-domain interactions within a unified operations platform. When an incident occurs, the platform automatically:
1. Simulates physical capacity collapse and vehicle spillover.
2. Evaluates candidate interventions (**Do Nothing**, **Reroute Traffic**, **Emergency Priority + Rerouting**) on isolated state clones.
3. Ranks interventions using a transparent multi-criteria utility score.
4. Explains **WHY** the top action was recommended.
5. Emits simulated public mobile alerts and roadside digital Variable Message Sign (VMS) instructions.

---

## 4. Four Smart City Domains Covered

| Domain | Integrated Platform Capabilities |
|---|---|
| **1. Intelligent Traffic & Mobility** | Density ratio ($\rho = V/C$), Greenshields speed degradation, BPR travel time, congestion levels, capacity drop, Dijkstra graph rerouting. |
| **2. Public Safety & Emergency Response** | Incident injection, active blockage tracking, ambulance dynamic routing, emergency green-wave signal priority, response time minimization. |
| **3. Environmental Monitoring** | Speed-degraded Vehicle Kilometers Traveled (VKT) emission surge, CO2, NOx, PM2.5 tracking, localized AQI estimation. |
| **4. Citizen Engagement** | Public mobile push alerts, roadside digital Variable Message Signs (VMS), and citizen incident reporting. |

---

## 5. Technology Stack & Architecture

```text
                 CITYTWIN OPERATIONS DASHBOARD (React + Vite)
                                     │
                 REST API / CORS (FastAPI @ http://localhost:8000)
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
   City Simulator              Routing Engine            Decision Engine
  (Physical Bridge)           (Dijkstra Path)        (Multi-Criteria Score)
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     │
                     MATLAB / Simulink Continuum Model
              (LWR Macroscopic Flow PDE & Emissions Generator)
```

- **Backend**: Python 3.14 + FastAPI, Uvicorn, Pydantic, Pytest (16/16 test coverage).
- **Frontend**: React 18, Vite 6, Tailwind CSS v4, Lucide-React, 3D WebGL Digital Twin (Three.js @ 60 FPS) with dynamic traffic particle flow, 3D trauma ambulance, and responsive 2D SVG command center.
- **Physical Modeling**: MATLAB (`.m` functions) & Simulink closed-loop block diagram generator (`build_closed_loop_simulink.m`, `CITYTWIN_MASTER_SUITE.m`).
- **Architecture Presentation**: `full_stack_architecture_slide.html` (interactive 4-layer visual) and `CITYTWIN_ECO_INNOVATE_PRESENTATION_SPECS.txt` (15-slide pitch deck).

---

## 6. How the Simulation Works (Physical & Mathematical Modeling)

### A. Macroscopic Traffic Flow Model (`matlab/traffic_flow_model.m`)
Governed by the **Lighthill-Whitham-Richards (LWR)** continuum PDE and **Greenshields** speed-density relation:
$$v(\rho) = v_{\text{free}} \cdot \left[1 - \left(\frac{\rho}{\rho_{\text{jam}}}\right)^{1.2}\right]$$
where:
* $\rho = \frac{V}{C}$ (traffic density ratio = volume / capacity).
* $v_{\text{free}}$ is the link speed limit.
* Minimum speed floor is constrained to $8 \text{ km/h}$ under extreme gridlock.

### B. Link Travel Time Function (Bureau of Public Roads - BPR)
$$t = t_0 \cdot \left[1 + 0.20 \cdot \left(\frac{V}{C}\right)^{3.5}\right]$$
* $t_0$ is free-flow travel time (minutes).
* If a road is blocked by an accident, travel time becomes $999 \text{ min}$ ($\infty$ penalty).

### C. Environmental Emission & AQI Model (`matlab/emissions_aqi_model.m`)
When average speed falls below $20 \text{ km/h}$, stop-and-go acceleration and idle engine burning multiply emission factors:
$$E_{\text{link}} = \text{VKT} \cdot \text{factor}_{\text{baseline}} \cdot S(v)$$
Simulated AQI is mapped based on link density and speed degradation factor $S(v)$.

---

## 7. Decision & Recommendation Engine

When an accident occurs, the Intervention Engine executes 3 isolated simulation clones:
1. **Option A: Do Nothing** (No coordination; vehicles cram into nearest single road, ambulance delayed).
2. **Option B: Redirect Traffic** (Early dynamic diversion across North and East bypasses).
3. **Option C: Emergency Priority + Rerouting** (Traffic redistribution + Emergency green-wave signal priority for the ambulance).

### Transparent Multi-Criteria Scoring:
$$\text{Score} = 0.45 \cdot \Delta T_{\text{ambulance}} + 0.35 \cdot \Delta C_{\text{congestion}} + 0.20 \cdot \Delta E_{\text{AQI}}$$
Every score and percentage improvement is derived from underlying physics rather than arbitrary numbers.

---

## 8. Installation & Setup

### Prerequisites
* Windows OS with PowerShell or Command Prompt
* Python 3.10+ (Python 3.14 supported)
* Node.js v18+ and npm (Node.js v24 installed)

### Quick 1-Click Launch (Recommended)
Double-click `start.bat` in the project root or run in PowerShell:
```powershell
.\start.ps1
```
This opens both the FastAPI backend (`http://127.0.0.1:8000`) and the React dashboard (`http://localhost:5173`).

---

## 9. Manual Launch

### Backend
```powershell
.\.venv\Scripts\python.exe backend\run.py
```
* Interactive API Documentation (Swagger): `http://127.0.0.1:8000/docs`

### Frontend
```powershell
cmd.exe /c "npm.cmd --prefix frontend run dev"
```
* Dashboard URL: `http://localhost:5173`

### Run Automated Tests
```powershell
.\.venv\Scripts\python.exe -m pytest backend/tests
```

---

## 10. Hackathon Demonstration Guide (1-Minute Judge Walkthrough)

To present this to judges:
1. Open the dashboard at `http://localhost:5173`.
2. Click **"🚀 START DEMO MODE"** in the top navigation bar.
3. Advance through the 8 stages using the stepper:
   * **Stage 1 (Normal City)**: Show free-flow traffic (green links) and baseline AQI.
   * **Stage 2 (Simulate Accident)**: Click **"Simulate Major Accident (Road A)"** to trigger blockage.
   * **Stage 3 (Predict Impact)**: Point out the red aura on Road A, spillover onto Road B & C, and the ambulance detour.
   * **Stage 4 & 5 (Comparison Matrix)**: Switch to the **Intervention Engine** tab and show the comparison table.
   * **Stage 6 (Recommendation)**: Highlight the **"Why?"** explainability cards for Option C.
   * **Stage 7 (Citizen Alerts)**: Switch to the **Citizen Alerts** tab and show the public push alert and the LED highway sign (VMS).
   * **Stage 8 (Apply Optimization)**: Click **"Apply Intervention"** and watch the city metrics recover.
4. Click the **"MATLAB / Simulink"** header button to show the continuous-time block diagrams and differential equations.

---

## 11. Important Project Boundaries

| Prototype Simulation (What We Built) | Real-World Municipal Deployment (Future Scope) |
|---|---|
| Virtual 18-road network with calibrated synthetic traffic. | SCATS / SCOOT physical traffic light controllers. |
| Macroscopic Greenshields & BPR mathematical engine. | Live loop inductive sensors and camera computer vision feeds. |
| Simulated mobile push broadcast and VMS graphics. | Integration with city Variable Message Signs and 511 citizen apps. |
| Dijkstra algorithmic routing engine. | City-wide GPS satellite navigation routing integration. |

---

## 12. MATLAB & Simulink Directory (`matlab/`)
* `CITYTWIN_MASTER_SUITE.m`: Master runner that executes all 4 modules and writes `citytwin_matlab_telemetry.json` bridge telemetry.
* `traffic_flow_model.m`: Standalone LWR continuum and Greenshields speed-density function.
* `emissions_aqi_model.m`: Speed-degraded vehicle emission factor and AQI function.
* `spatial_aqi_dispersion.m`: 2D Gaussian plume Gaussian puff atmospheric pollution dispersion field.
* `emergency_dijkstra_routing.m`: Graph-theoretic dynamic Dijkstra routing engine with congestion-weighted edges.
* `pareto_decision_optimizer.m`: Multi-objective Pareto frontier decision matrix with weighted utility scoring.
* `build_closed_loop_simulink.m`: Programmatic generator for `citytwin_closed_loop_sim.slx` closed-loop Simulink model.
* `run_simulink_and_plot.m`: Simulink runner script with 4-panel subplots (Flow, Speed, Emissions, Routing Delay).
* `MATLAB_JUDGES_DEFENSE_GUIDE.md`: Pitch script, mathematical defense formulas, and Q&A answers for MathWorks/IEEE evaluators.
* `README_MATLAB.md`: Complete guide for demonstrating within the MATLAB environment.
