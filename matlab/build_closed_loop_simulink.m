% =========================================================================
% CITYTWIN — Programmatic Closed-Loop Simulink Architecture Generator
% Script: build_closed_loop_simulink.m
% 
% Purpose: Programmatically constructs 'citytwin_closed_loop_sim.slx'
%          featuring:
%          1. Non-linear Traffic Flow Plant (Continuity: dk/dt = (q_in - q_out)/L)
%          2. Dynamic Disturbance Injection (Accident at t = 25s)
%          3. Closed-Loop PID Controller for Adaptive Green-Light Duty Cycle
%          4. Emissions & AQI Environmental Subsystem
%          5. Dual Real-time Visualization Scopes + Workspace Telemetry Export
% =========================================================================

function model_name = build_closed_loop_simulink()
    model_name = 'citytwin_closed_loop_sim';

    fprintf('====================================================\n');
    fprintf('   CITYTWIN: Generating Closed-Loop Simulink Model  \n');
    fprintf('   Model Name: %s.slx\n', model_name);
    fprintf('====================================================\n');

    % 1. Close existing instance if open without saving dialog
    if bdIsLoaded(model_name)
        close_system(model_name, 0);
    end

    % 2. Create new Simulink Model
    new_system(model_name);
    open_system(model_name);

    % Configure model simulation parameters (0 to 60 seconds, fixed step ODE4)
    set_param(model_name, 'StopTime', '60.0');
    set_param(model_name, 'Solver', 'ode4');
    set_param(model_name, 'FixedStep', '0.1');

    % ---------------------------------------------------------------------
    % SECTION A: Reference Setpoint & Control Loop
    % ---------------------------------------------------------------------
    % Optimal target density: 45 veh/km (prevents congestion breakdown)
    add_block('simulink/Sources/Constant', [model_name, '/Density_Setpoint'], ...
        'Value', '45.0', 'Position', [40, 60, 90, 90]);

    % Error Comparator: e(t) = Setpoint - Feedback Density
    add_block('simulink/Math Operations/Sum', [model_name, '/Error_Sum'], ...
        'Inputs', '+-', 'Position', [140, 65, 170, 95]);

    % Proportional Gain Kp
    add_block('simulink/Math Operations/Gain', [model_name, '/Kp_Gain'], ...
        'Gain', '0.018', 'Position', [220, 40, 270, 70]);

    % Integral Gain Ki + Integrator
    add_block('simulink/Math Operations/Gain', [model_name, '/Ki_Gain'], ...
        'Gain', '0.006', 'Position', [220, 100, 270, 130]);
    add_block('simulink/Continuous/Integrator', [model_name, '/Ki_Integrator'], ...
        'InitialCondition', '0.0', 'Position', [300, 100, 340, 130]);

    % Derivative Gain Kd + Derivative
    add_block('simulink/Math Operations/Gain', [model_name, '/Kd_Gain'], ...
        'Gain', '0.002', 'Position', [220, 160, 270, 190]);
    add_block('simulink/Continuous/Derivative', [model_name, '/Kd_Derivative'], ...
        'Position', [300, 160, 340, 190]);

    % PID Sum
    add_block('simulink/Math Operations/Sum', [model_name, '/PID_Sum'], ...
        'Inputs', '+++', 'Position', [380, 85, 410, 135]);

    % Nominal Green-Time Duty Cycle (0.50) + Limiter [0.10, 0.90]
    add_block('simulink/Math Operations/Bias', [model_name, '/Nominal_Green_Bias'], ...
        'Bias', '0.50', 'Position', [440, 95, 490, 125]);

    add_block('simulink/Discontinuities/Saturation', [model_name, '/Green_Limiter'], ...
        'UpperLimit', '0.90', 'LowerLimit', '0.10', 'Position', [520, 95, 560, 125]);

    % ---------------------------------------------------------------------
    % SECTION B: Disturbance Injection (Corridor Accident at t = 25s)
    % ---------------------------------------------------------------------
    % Accident cuts corridor capacity by 70% at t = 25s
    add_block('simulink/Sources/Step', [model_name, '/Incident_Disturbance_Step'], ...
        'Time', '25.0', 'Before', '1.0', 'After', '0.30', 'Position', [440, 220, 480, 250]);

    % Maximum Intersection Capacity (1800 veh/hr)
    add_block('simulink/Sources/Constant', [model_name, '/Max_Capacity'], ...
        'Value', '1800.0', 'Position', [440, 160, 480, 190]);

    % Dynamic Discharge Capacity = Max_Capacity * Incident_Factor * Green_Duty
    add_block('simulink/Math Operations/Product', [model_name, '/Discharge_Calc'], ...
        'Inputs', '***', 'Position', [610, 110, 650, 170]);

    % ---------------------------------------------------------------------
    % SECTION C: Traffic Plant Dynamics (Lighthill-Whitham-Richards Model)
    % dk/dt = (q_in - q_out) / Road_Length
    % ---------------------------------------------------------------------
    % Inflow demand (Vehicles/hr approaching intersection)
    add_block('simulink/Sources/Constant', [model_name, '/Inflow_Demand'], ...
        'Value', '1250.0', 'Position', [610, 40, 660, 70]);

    % Inflow minus Outflow: q_net = q_in - q_out
    add_block('simulink/Math Operations/Sum', [model_name, '/Net_Flow_Sum'], ...
        'Inputs', '+-', 'Position', [700, 45, 730, 85]);

    % Division by Segment Length (L = 2.2 km)
    add_block('simulink/Math Operations/Gain', [model_name, '/Inv_Length_Gain'], ...
        'Gain', num2str(1.0 / 2.2), 'Position', [760, 50, 800, 80]);

    % Integrator: Accumulated Vehicle Density k(t) [veh/km]
    % Initial density = 42 veh/km (fluid flow)
    add_block('simulink/Continuous/Integrator', [model_name, '/Density_Plant_Integrator'], ...
        'InitialCondition', '42.0', 'Position', [830, 50, 870, 80]);

    % ---------------------------------------------------------------------
    % SECTION D: Greenshields Speed & Environmental AQI Subsystems
    % v(k) = 55 * (1 - k / 120), bounded >= 6 km/h
    % ---------------------------------------------------------------------
    % Jam Density = 120 veh/km
    add_block('simulink/Math Operations/Gain', [model_name, '/Density_Ratio_Gain'], ...
        'Gain', num2str(-55.0 / 120.0), 'Position', [920, 50, 970, 80]);

    add_block('simulink/Math Operations/Bias', [model_name, '/Free_Speed_Bias'], ...
        'Bias', '55.0', 'Position', [1000, 50, 1040, 80]);

    add_block('simulink/Discontinuities/Saturation', [model_name, '/Speed_Limiter'], ...
        'UpperLimit', '55.0', 'LowerLimit', '6.0', 'Position', [1070, 50, 1110, 80]);

    % Environmental Emission Multiplier: AQI Impact
    add_block('simulink/Math Operations/Gain', [model_name, '/AQI_Impact_Gain'], ...
        'Gain', '1.65', 'Position', [920, 140, 970, 170]);

    add_block('simulink/Math Operations/Bias', [model_name, '/Ambient_AQI_Bias'], ...
        'Bias', '45.0', 'Position', [1000, 140, 1040, 170]);

    % ---------------------------------------------------------------------
    % SECTION E: Visual Scopes & Workspace Logging Blocks
    % ---------------------------------------------------------------------
    % Scope 1: Traffic Dynamics (Signals: 1: Density k(t), 2: Speed v(t))
    add_block('simulink/Sinks/Scope', [model_name, '/Traffic_Dynamics_Scope'], ...
        'NumInputPorts', '2', 'Position', [1160, 45, 1200, 85]);

    % Scope 2: Green-Time Control Signal u(t)
    add_block('simulink/Sinks/Scope', [model_name, '/PID_GreenTime_Scope'], ...
        'Position', [610, 220, 650, 250]);

    % Scope 3: Air Quality Degradation AQI(t)
    add_block('simulink/Sinks/Scope', [model_name, '/AirQuality_AQI_Scope'], ...
        'Position', [1160, 140, 1200, 170]);

    % To Workspace Blocks for Telemetry Logging
    add_block('simulink/Sinks/To Workspace', [model_name, '/Log_Density'], ...
        'VariableName', 'sim_density', 'SaveFormat', 'Array', 'Position', [940, -10, 1010, 20]);

    add_block('simulink/Sinks/To Workspace', [model_name, '/Log_Speed'], ...
        'VariableName', 'sim_speed', 'SaveFormat', 'Array', 'Position', [1140, -10, 1210, 20]);

    add_block('simulink/Sinks/To Workspace', [model_name, '/Log_GreenTime'], ...
        'VariableName', 'sim_green', 'SaveFormat', 'Array', 'Position', [610, 270, 680, 300]);

    add_block('simulink/Sinks/To Workspace', [model_name, '/Log_AQI'], ...
        'VariableName', 'sim_aqi', 'SaveFormat', 'Array', 'Position', [1140, 195, 1210, 225]);

    add_block('simulink/Sources/Clock', [model_name, '/Sim_Clock'], ...
        'Position', [940, -60, 970, -40]);

    add_block('simulink/Sinks/To Workspace', [model_name, '/Log_Time'], ...
        'VariableName', 'sim_time', 'SaveFormat', 'Array', 'Position', [1000, -65, 1060, -35]);

    % ---------------------------------------------------------------------
    % SECTION F: Signal Wiring & Routing
    % ---------------------------------------------------------------------
    % Feedback Density to Error Sum
    add_line(model_name, 'Density_Setpoint/1', 'Error_Sum/1');
    add_line(model_name, 'Error_Sum/1', 'Kp_Gain/1');
    add_line(model_name, 'Error_Sum/1', 'Ki_Gain/1');
    add_line(model_name, 'Error_Sum/1', 'Kd_Gain/1');

    % Integrator and Derivative wiring
    add_line(model_name, 'Ki_Gain/1', 'Ki_Integrator/1');
    add_line(model_name, 'Kd_Gain/1', 'Kd_Derivative/1');

    % PID Sum inputs
    add_line(model_name, 'Kp_Gain/1', 'PID_Sum/1');
    add_line(model_name, 'Ki_Integrator/1', 'PID_Sum/2');
    add_line(model_name, 'Kd_Derivative/1', 'PID_Sum/3');

    % Green time bias & limiter
    add_line(model_name, 'PID_Sum/1', 'Nominal_Green_Bias/1');
    add_line(model_name, 'Nominal_Green_Bias/1', 'Green_Limiter/1');

    % Green time logging & scope
    add_line(model_name, 'Green_Limiter/1', 'PID_GreenTime_Scope/1');
    add_line(model_name, 'Green_Limiter/1', 'Log_GreenTime/1');

    % Discharge multiplier inputs: [Green_Time, Max_Capacity, Disturbance]
    add_line(model_name, 'Green_Limiter/1', 'Discharge_Calc/1');
    add_line(model_name, 'Max_Capacity/1', 'Discharge_Calc/2');
    add_line(model_name, 'Incident_Disturbance_Step/1', 'Discharge_Calc/3');

    % Traffic net flow summation: Inflow - Discharge
    add_line(model_name, 'Inflow_Demand/1', 'Net_Flow_Sum/1');
    add_line(model_name, 'Discharge_Calc/1', 'Net_Flow_Sum/2');

    % Net flow into road segment gain -> Integrator
    add_line(model_name, 'Net_Flow_Sum/1', 'Inv_Length_Gain/1');
    add_line(model_name, 'Inv_Length_Gain/1', 'Density_Plant_Integrator/1');

    % Density output wiring
    add_line(model_name, 'Density_Plant_Integrator/1', 'Traffic_Dynamics_Scope/1');
    add_line(model_name, 'Density_Plant_Integrator/1', 'Log_Density/1');
    add_line(model_name, 'Density_Plant_Integrator/1', 'Density_Ratio_Gain/1');
    add_line(model_name, 'Density_Plant_Integrator/1', 'AQI_Impact_Gain/1');

    % Feedback Loop: Connect density output back to Error_Sum port 2
    add_line(model_name, 'Density_Plant_Integrator/1', 'Error_Sum/2');

    % Greenshields Speed calculations
    add_line(model_name, 'Density_Ratio_Gain/1', 'Free_Speed_Bias/1');
    add_line(model_name, 'Free_Speed_Bias/1', 'Speed_Limiter/1');
    add_line(model_name, 'Speed_Limiter/1', 'Traffic_Dynamics_Scope/2');
    add_line(model_name, 'Speed_Limiter/1', 'Log_Speed/1');

    % Environmental AQI calculations
    add_line(model_name, 'AQI_Impact_Gain/1', 'Ambient_AQI_Bias/1');
    add_line(model_name, 'Ambient_AQI_Bias/1', 'AirQuality_AQI_Scope/1');
    add_line(model_name, 'Ambient_AQI_Bias/1', 'Log_AQI/1');

    % Clock logging
    add_line(model_name, 'Sim_Clock/1', 'Log_Time/1');

    % 3. Save Model to .slx
    save_system(model_name);
    fprintf('SUCCESS: Model ''%s.slx'' saved successfully!\n', model_name);
    fprintf('You can double-click scopes or run ''run_simulink_and_plot''!\n\n');
end
