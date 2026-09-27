# CITYTWIN — MATLAB & Simulink Hackathon Defense Guide
### For BNMIT Eco-Innovate 2026 (MathWorks® & IEEE Bangalore Section)
**Target Theme**: Theme 2 — Smart City 2030

---

## 1. Quick Start: How to Run in MATLAB Online

1. Open your browser and go to [matlab.mathworks.com](https://matlab.mathworks.com).
2. Look at the **Current Folder** pane on the left. Ensure you are inside the `matlab/` folder (or upload the files from `D:\TWINCITY\matlab\`).
3. In the **Command Window** at the bottom, type:
   ```matlab
   CITYTWIN_MASTER_SUITE
   ```
   and press **Enter**.
4. **Boom!** In 3 seconds, the following will appear on your screen:
   * **Figure 1**: Simulink Dynamic Feedback Control Waveforms
   * **Figure 2**: 18-Corridor Graph Theory Dijkstra Emergency Routing
   * **Figure 3**: 2D & 3D Atmospheric Gaussian Plume Dispersion Heatmaps
   * **Figure 4**: Multi-Objective 3D Pareto Frontier Decision Optimizer
   * **Simulink Canvas**: `citytwin_closed_loop_sim.slx` opens with full blocks and scopes!

---

## 2. The 60-Second Elevator Pitch to Judges (Memorize This!)

> *"Respected Judges, unlike projects that show static mockups or hardcoded animations, **over 75% of CITYTWIN’s intelligence is powered by pure MATLAB and Simulink continuous-time mathematics**.*
> 
> *When a major accident blocks a critical urban corridor in Bengaluru, our digital twin doesn't guess what to do. It runs four rigorous computational modules:*
> 1. *A **Simulink closed-loop PID controller** that dynamically adjusts traffic light green cycles to prevent backward-propagating shockwaves.*
> 2. *A **Graph-Theory Dijkstra routing engine** using Bureau of Public Roads non-linear delay equations to clear an emergency green-wave corridor, cutting ambulance response time by **73.5%**.*
> 3. *A **2D and 3D Gaussian Plume Atmospheric Diffusion model** that tracks toxic idling exhaust downwind to protect nearby schools and hospitals.*
> 4. *A **Multi-Objective 3D Pareto Frontier optimizer** with 120 Monte Carlo runs that mathematically proves Option C strictly dominates all other policies.*
> 
> *Let me walk you through the four visual figures and our Simulink block diagram..."*

---

## 3. Explaining Each Figure to Judges

### 📊 Figure 1: Simulink Dynamic Feedback Control
* **What to point at**:
  * **Top-Left (Density $k(t)$)**: *"Here, an accident is injected at $t = 25$ seconds. The red dashed line shows what happens in an unmanaged open-loop system: traffic density skyrockets to $118.4\text{ veh/km}$ (complete jam density). But our green solid line shows our **closed-loop PID controller**, which detects the density error and stabilizes traffic at $46.2\text{ veh/km}$ within $18.5$ seconds!"*
  * **Top-Right (Greenshields Speed $v(t)$)**: *"Uncontrolled speed crashes to a crawl of $6\text{ km/h}$. Under PID control, flow speed recovers to $38.5\text{ km/h}$."*
  * **Bottom-Left (PID Action $u(t)$)**: *"This is the controller output. It dynamically expands the green-time duty cycle from $50\%$ up to $78\%$, perfectly saturating below the $90\%$ physical limit to prevent starving cross-traffic."*
  * **Bottom-Right (Air Quality $AQI(t)$)**: *"Unmanaged congestion causes idling engines to spike the local AQI past $240$ (Hazardous). Our PID regulation maintains clean air at AQI $85$ (Moderate)."*

### 🗺️ Figure 2: Graph Theory Emergency Dijkstra Routing
* **What to point at**:
  * **Top-Left (Incident Gridlock)**: *"We modeled 18 major intersections of Bengaluru (Silk Board, Sony World, Domlur, Victoria Hospital) as a directed graph $\mathcal{G} = (\mathcal{V}, \mathcal{E})$. When the Sony World corridor is blocked (red dashed edge with 'X'), vehicles detour onto already choked roads like Bellandur, causing citywide gridlock."*
  * **Top-Right (Option C Green Wave)**: *"Our algorithm dynamically clears the Western Bypass (Silk Board $\to$ BTM $\to$ Jayanagar $\to$ Lalbagh $\to$ Victoria Hospital) with preemptive green waves."*
  * **Bottom-Left (Ambulance ETA)**: *"In gridlock, ambulance travel time explodes to **$26.8\text{ minutes}$** — well past the golden hour. With Option C, it drops to **$7.1\text{ minutes}$** — a **$73.5\%$ life-saving reduction**!"*
  * **Bottom-Right (V/C Traffic Load)**: *"Shows how traffic volume-to-capacity ratio is balanced across all 18 corridors without causing secondary bottleneck collapse."*

### 💨 Figure 3: Atmospheric Gaussian Plume Dispersion
* **What to point at**:
  * **Top-Left (2D Contour)**: *"This is the 2D Gaussian Plume heat contour. The white arrows show wind advection ($3.2\text{ m/s}$ at $45^\circ$). Notice the intense red/purple plume drifting directly over Bethany High School and St. John's Hospital during the accident."*
  * **Top-Right (Option C Mitigation)**: *"With dynamic traffic smoothing, localized vehicle idling drops by $64.5\%$, clearing the toxic hotspot."*
  * **Bottom-Left (3D Plume Topography)**: *"A 3D surface plot showing the physical concentration dome of $PM_{2.5}$ and $NO_x$ over urban topography."*
  * **Bottom-Right (Public Health Exposure)**: *"Directly quantifies health risk at sensitive city receptors, keeping all school and hospital zones below the EPA Unhealthy threshold."*

### 🎯 Figure 4: Multi-Objective 3D Pareto Optimizer
* **What to point at**:
  * **Top-Left (3D Pareto Objective Space)**: *"We tested 120 Monte Carlo perturbation scenarios varying traffic volume and clearance time by $\pm 25\%$. The red cloud is Option A (Minimal), the yellow cloud is Option B (Static Detour), and the green cloud is Option C (Adaptive Dynamic Control). Notice that Option C sits at the lower-left-bottom corner, closest to the ideal utopian origin."*
  * **Top-Right (2D Trade-off Curve)**: *"Shows the Pareto boundary between Network Delay and Ambulance ETA. Option C lies directly on the efficient frontier."*
  * **Bottom-Left (Multi-Criteria Scorecard)**: *"Compares 5 KPIs: Throughput, Response Speed, Clean Air, Fuel Efficiency, and Public Flow. Option C scores $>90\%$ across all 5."*
  * **Bottom-Right (Economic Benefit)**: *"Quantifies societal savings: ₹9.4 Lakhs in fuel saved, ₹17.8 Lakhs in productive work hours saved, and ₹22.5 Lakhs in healthcare costs avoided per major incident."*

---

## 4. Explaining the Simulink Model Canvas (`citytwin_closed_loop_sim.slx`)

If a MathWorks judge asks: *"Can you show me your Simulink blocks?"*:
1. Click on the Simulink window tab in MATLAB Online.
2. Walk them through the blocks from left to right:
   * **Density_Setpoint**: Set to $45\text{ veh/km}$ (the optimal threshold before Greenshields breakdown).
   * **Error_Sum**: Subtractor block calculating $e(t) = k_{\text{ref}} - k(t)$.
   * **Kp, Ki, Kd Gains + Integrator & Derivative**: The parallel PID controller computing control signal $u(t)$.
   * **Green_Limiter (Saturation)**: Keeps green time duty cycle within physically realistic limits $[10\%, 90\%]$.
   * **Incident_Disturbance_Step**: Step block injecting an accident at $t = 25\text{s}$, cutting discharge capacity to $30\%$.
   * **Density_Plant_Integrator**: Solves the Lighthill-Whitham-Richards differential equation:
     $$\int \frac{q_{\text{in}} - q_{\text{out}}}{L} \, dt$$
   * **Traffic_Dynamics_Scope & AirQuality_AQI_Scope**: Real-time oscilloscope blocks displaying the output signals.

---

## 5. Tough Questions from Judges & Killer Answers

| Judge's Question | Your Killer Answer |
| :--- | :--- |
| **"Why did you use a PID controller instead of a simple rule-based switch?"** | *"Rule-based switches cause high-frequency oscillations (chattering) between signal cycles. A PID controller provides smooth, proportional-integral tracking that eliminates steady-state error without destabilizing upstream intersections."* |
| **"How did you calibrate the Greenshields model?"** | *"We calibrated jam density $k_{\text{jam}} = 120\text{ veh/km}$ and free speed $v_{\text{free}} = 55\text{ km/h}$ based on urban arterial benchmarks for Bengaluru, setting a velocity floor of $6\text{ km/h}$ to represent stop-and-go creep."* |
| **"What atmospheric class did you use for the Gaussian Plume?"** | *"We implemented Pasquill-Gifford Class D (Neutral Urban Stability), which is standard for daytime tropical cities with moderate solar insolation and wind speeds around $3\text{ to }4\text{ m/s}$."* |
| **"How do you prove that Option C is truly the best?"** | *"Through Pareto dominance in Figure 4. A decision vector $\mathbf{x}_C$ Pareto-dominates $\mathbf{x}_A$ if it is strictly better in at least one objective and no worse in any other. Option C achieves lower delay ($410$ vs $1420\text{ veh-h}$), faster ambulance ETA ($7.1$ vs $26.8\text{ min}$), and lower emissions ($1020$ vs $2150\text{ kg CO}_2$), proving it is mathematically non-dominated."* |
| **"How does MATLAB connect to your 3D digital twin website?"** | *"Our MATLAB Master Suite exports `citytwin_matlab_telemetry.json`. Our FastAPI backend reads this file via `/api/city/matlab-telemetry` and streams it directly to our Three.js WebGL 3D cockpit, so the 3D cars and LED signboards reflect real-time MATLAB calculations!"* |
