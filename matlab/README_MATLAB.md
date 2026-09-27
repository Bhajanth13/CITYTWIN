# CITYTWIN — MATLAB® & Simulink® Engineering Powerhouse Suite
### BNM Institute of Technology (BNMIT) | Eco-Innovate 2026
**Theme 2: Smart City 2030 (Supported by MathWorks® & IEEE Bangalore Section)**

---

## 1. Executive Summary & Engineering Architecture
Over **75% of CITYTWIN’s computational intelligence** relies on authentic continuous-time physical modeling, differential equations, graph-theory algorithms, and multi-objective optimization developed in **MATLAB** and **Simulink**:

```
                                  [ URBAN SENSORS & ACCIDENT TELEMETRY ]
                                                    │
                                                    ▼
   ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
   │                                   MATLAB & SIMULINK CORE ENGINE                                │
   ├───────────────────────────────┬────────────────────────────────┬───────────────────────────────┤
   │    1. SIMULINK FEEDBACK       │    2. GRAPH DIJKSTRA ROUTING   │    3. GAUSSIAN PLUME AQI      │
   │  citytwin_closed_loop_sim.slx │   emergency_dijkstra_routing.m │    spatial_aqi_dispersion.m   │
   │  • LWR Density Integrator     │   • 18 Urban Corridors         │   • Pasquill-Gifford Class D  │
   │  • Closed-Loop PID Controller │   • BPR Non-Linear Edge Costs  │   • 2D/3D Plume Topography    │
   │  • Step Incident Disturbance  │   • Adaptive Green Wave        │   • School/Hospital Exposure  │
   ├───────────────────────────────┴────────────────────────────────┴───────────────────────────────┤
   │                                4. MULTI-OBJECTIVE 3D PARETO OPTIMIZER                          │
   │                                      pareto_decision_optimizer.m                               │
   │                 Evaluates Delay (J1) vs Ambulance ETA (J2) vs Emissions (J3)                   │
   │                 120 Monte Carlo Perturbations proving Option C Pareto Dominance                │
   └────────────────────────────────────────────────┬───────────────────────────────────────────────┘
                                                    │
                                                    ▼ [citytwin_matlab_telemetry.json]
                                  [ 3D WEBGL DIGITAL TWIN MISSION CONTROL ]
```

---

## 2. 1-Click Master Execution in MATLAB Online
To run the entire suite in **MATLAB Online** (`matlab.mathworks.com`):

```matlab
CITYTWIN_MASTER_SUITE
```

When this command runs, it automatically:
1. **Verifies macroscopic traffic and speed-degraded emissions equations**.
2. **Launches `citytwin_closed_loop_sim.slx`** in Simulink and renders **Figure 1** (Closed-Loop PID waveforms vs Open-Loop Gridlock).
3. **Solves the 18-corridor Dijkstra graph routing** and renders **Figure 2** (Network Topologies & Emergency Green-Wave HUD).
4. **Calculates atmospheric Gaussian plume diffusion** and renders **Figure 3** (2D Spatial AQI Heatmap & 3D Plume Topography).
5. **Computes the 3D multi-objective Pareto frontier** and renders **Figure 4** (Objective Space & Economic Benefits).
6. **Exports `citytwin_matlab_telemetry.json`** directly bridging MATLAB to the 3D WebGL Digital Twin frontend.

---

## 3. Mathematical Formulations

### Module 1: Macroscopic Traffic Flow (`traffic_flow_model.m`)
Lighthill-Whitham-Richards (LWR) conservation of vehicles:
$$\frac{\partial k}{\partial t} + \frac{\partial q}{\partial x} = 0$$

Greenshields Speed-Density relationship:
$$v(k) = v_{\text{free}} \left[ 1 - \left( \frac{k}{k_{\text{jam}}} \right)^\gamma \right]$$
* $k_{\text{jam}} = 120 \text{ veh/km}$, $v_{\text{free}} = 55 \text{ km/h}$, $\gamma = 1.2$.
* Crawl floor speed $v_{\text{min}} = 6 \text{ km/h}$ under severe gridlock.

### Module 2: Simulink Dynamic Feedback Control (`citytwin_closed_loop_sim.slx`)
Plant continuity equation:
$$\frac{dk(t)}{dt} = \frac{1}{L} \left[ q_{\text{in}}(t) - q_{\text{out}}(t) \right]$$

Closed-Loop PID Control Law:
$$u_{\text{green}}(t) = u_0 + K_p \, e(t) + K_i \int_0^t e(\tau) \, d\tau + K_d \, \frac{de(t)}{dt}$$
* Error: $e(t) = k(t) - k_{\text{target}}$ where $k_{\text{target}} = 45 \text{ veh/km}$.
* Gains: $K_p = 0.018$, $K_i = 0.006$, $K_d = 0.002$.
* Saturation bounds: $u_{\text{green}} \in [0.10, 0.90]$.

### Module 3: Graph-Theory Emergency Dijkstra Routing (`emergency_dijkstra_routing.m`)
Bureau of Public Roads (BPR) non-linear link travel time function:
$$t_e = \frac{L_e}{v_{0, e}} \left[ 1 + \alpha \left( \frac{V_e}{C_e} \right)^\beta \right] \times 60 \quad [\text{minutes}]$$
* Normal Ambulance ETA (Silk Board $\to$ Victoria Hospital): **8.4 min**.
* Unmanaged Incident (Sony World Crash Detour): **26.8 min** (+219% delay).
* Option C Dynamic Green Wave: **7.1 min** (-73.5% reduction).

### Module 4: Atmospheric Gaussian Plume Dispersion (`spatial_aqi_dispersion.m`)
2D/3D Steady-State Atmospheric Diffusion:
$$C(x, y) = \sum_{i} \frac{Q_i}{2\pi u \, \sigma_y(x') \, \sigma_z(x')} \exp\left( -\frac{y'^2}{2\sigma_y(x')^2} \right) \left[ 1 + \exp\left( -\frac{2H^2}{\sigma_z(x')^2} \right) \right]$$
* Meteorology: Wind speed $u = 3.2\text{ m/s}$, advection angle $\theta = 45^\circ$ (South-West to North-East).
* Urban Pasquill-Gifford dispersion coefficients: $\sigma_y(x) = 0.16 x^{0.85}$, $\sigma_z(x) = 0.12 x^{0.78}$.
* Sensitive receptors evaluated: Bethany High School, St. John's Hospital, Koramangala Residential Block.

### Module 5: Multi-Objective 3D Pareto Decision Optimizer (`pareto_decision_optimizer.m`)
Objective vector:
$$\min_{\mathbf{x}} \mathbf{J}(\mathbf{x}) = \begin{bmatrix} J_1(\text{Delay, veh-h}) \\ J_2(\text{Ambulance ETA, min}) \\ J_3(\text{Emissions, kg CO}_2) \end{bmatrix}$$

Pareto Dominance Criterion:
$$\mathbf{x}_C \prec \mathbf{x}_A \iff \forall i, J_i(\mathbf{x}_C) \le J_i(\mathbf{x}_A) \land \exists j, J_j(\mathbf{x}_C) < J_j(\mathbf{x}_A)$$
* Evaluates 120 Monte Carlo perturbation scenarios with stochastic demand surges ($\pm 25\%$) proving Option C strictly dominates Options A & B.

---

## 4. Repository File Catalog
| File Name | Purpose | Output |
| :--- | :--- | :--- |
| `CITYTWIN_MASTER_SUITE.m` | Grand master orchestrator running all 5 modules | 4 Figures + Telemetry JSON |
| `run_city_sim.m` | Automated test runner (redirects to Master Suite) | Command Window + Visuals |
| `build_closed_loop_simulink.m` | Programmatically compiles Simulink block diagram | `citytwin_closed_loop_sim.slx` |
| `run_simulink_and_plot.m` | Simulates open-loop vs PID control waveforms | Figure 1 (4 subplots) |
| `emergency_dijkstra_routing.m` | 18-node directed graph Dijkstra emergency routing | Figure 2 (4 subplots) |
| `spatial_aqi_dispersion.m` | 2D/3D atmospheric Gaussian plume dispersion | Figure 3 (4 subplots) |
| `pareto_decision_optimizer.m` | 3D multi-objective Pareto trade-off optimization | Figure 4 (4 subplots) |
| `citytwin_matlab_telemetry.json` | Real-time simulation metrics exported for 3D Web UI | JSON data bridge |
| `MATLAB_JUDGES_DEFENSE_GUIDE.md` | Word-for-word pitch and defense Q&A for BNMIT judges | Presentation Guide |
