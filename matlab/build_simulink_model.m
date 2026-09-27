% =========================================================================
% CITYTWIN — Simulink Model Generator
% Script: build_simulink_model.m
% Purpose: Programmatically builds the 'citytwin_traffic_sim' Simulink model
%          for demonstrating dynamic traffic & environmental simulation.
% =========================================================================

model_name = 'citytwin_traffic_sim';

% Close existing model if open without saving
if bdIsLoaded(model_name)
    close_system(model_name, 0);
end

% Create new Simulink model
new_system(model_name);
open_system(model_name);

disp(['Creating Simulink Model: ', model_name, ' ...']);

% 1. Add Input Source Blocks (Inflow & Road Capacity)
add_block('simulink/Sources/Constant', [model_name, '/Inflow_Rate'], ...
    'Value', '450', 'Position', [60, 80, 120, 110]);

add_block('simulink/Sources/Constant', [model_name, '/Road_Capacity'], ...
    'Value', '1000', 'Position', [60, 160, 120, 190]);

add_block('simulink/Sources/Step', [model_name, '/Accident_Blockage_Step'], ...
    'Time', '20', 'Before', '0', 'After', '1', 'Position', [60, 240, 120, 270]);

% 2. Add Math Blocks (Density = Inflow / Capacity)
add_block('simulink/Math Operations/Divide', [model_name, '/Density_Calc'], ...
    'Position', [200, 100, 240, 150]);

% 3. Add Integrator Block (Vehicle Accumulation)
add_block('simulink/Continuous/Integrator', [model_name, '/Vehicle_Accumulator'], ...
    'InitialCondition', '350', 'Position', [320, 105, 360, 145]);

% 4. Add Gain Block (Speed Factor Degradation)
add_block('simulink/Math Operations/Gain', [model_name, '/Speed_Factor'], ...
    'Gain', '-0.65', 'Position', [420, 110, 460, 140]);

% 5. Add Sum & Saturation Blocks (Speed Floor)
add_block('simulink/Math Operations/Bias', [model_name, '/Base_Speed_Bias'], ...
    'Bias', '50', 'Position', [510, 110, 550, 140]);

add_block('simulink/Discontinuities/Saturation', [model_name, '/Speed_Limiter'], ...
    'UpperLimit', '50', 'LowerLimit', '8', 'Position', [600, 110, 640, 140]);

% 6. Add Environmental Emission Calculation Gain
add_block('simulink/Math Operations/Gain', [model_name, '/AQI_Emissions_Transfer'], ...
    'Gain', '1.42', 'Position', [510, 210, 560, 250]);

% 7. Add Output Scopes
add_block('simulink/Sinks/Scope', [model_name, '/Congestion_Scope'], ...
    'Position', [720, 110, 760, 140]);

add_block('simulink/Sinks/Scope', [model_name, '/AQI_Impact_Scope'], ...
    'Position', [720, 215, 760, 245]);

% Connect Blocks
add_line(model_name, 'Inflow_Rate/1', 'Density_Calc/1');
add_line(model_name, 'Road_Capacity/1', 'Density_Calc/2');
add_line(model_name, 'Density_Calc/1', 'Vehicle_Accumulator/1');
add_line(model_name, 'Vehicle_Accumulator/1', 'Speed_Factor/1');
add_line(model_name, 'Speed_Factor/1', 'Base_Speed_Bias/1');
add_line(model_name, 'Base_Speed_Bias/1', 'Speed_Limiter/1');
add_line(model_name, 'Speed_Limiter/1', 'Congestion_Scope/1');
add_line(model_name, 'Vehicle_Accumulator/1', 'AQI_Emissions_Transfer/1');
add_line(model_name, 'AQI_Emissions_Transfer/1', 'AQI_Impact_Scope/1');

% Save System
save_system(model_name);
disp(['Successfully created and saved Simulink model: ', model_name, '.slx']);
