% =========================================================================
% CITYTWIN — Macroscopic Traffic Flow Simulation Model
% Framework: Lighthill-Whitham-Richards (LWR) & Greenshields Continuum Model
% For: Hackathon Prototype Simulation & Decision Support Platform
% =========================================================================

function [speed, travel_time_min, congestion_level, density] = traffic_flow_model(...
    vehicle_count, capacity, length_km, free_flow_speed, is_blocked)
    
    % Input Validation & Defaults
    if nargin < 5
        is_blocked = false;
    end
    
    % 1. Handle Complete Road Blockage (e.g. Major Accident)
    if is_blocked
        density = 1.0; % Jam density reached
        speed = 5.0;   % Minimum crawl speed (km/h) for stranded vehicles
        travel_time_min = 999.0; % Infinite/impassable route penalty
        congestion_level = "BLOCKED";
        return;
    end
    
    % 2. Calculate Traffic Density Ratio (rho = V / C)
    density = vehicle_count / max(capacity, 1);
    
    % 3. Greenshields Speed-Density Curve:
    % v(rho) = v_free * (1 - (rho / rho_jam)^gamma)
    % Minimum speed floor set to 8 km/h for heavy gridlock
    gamma = 1.2;
    speed_factor = max(0.12, 1.0 - (min(density, 1.2) / 1.2)^gamma);
    speed = free_flow_speed * speed_factor;
    speed = max(speed, 8.0); % speed cannot fall below 8 km/h unless fully blocked
    
    % 4. Bureau of Public Roads (BPR) Travel Time Calculation:
    % t = t_0 * [1 + alpha * (V / C)^beta]
    % where t_0 is free-flow travel time (hours -> converted to minutes)
    alpha = 0.20;
    beta = 3.5;
    free_flow_time_min = (length_km / free_flow_speed) * 60.0;
    travel_time_min = free_flow_time_min * (1.0 + alpha * (density^beta));
    
    % 5. Categorize Congestion Level
    if density < 0.40
        congestion_level = "LOW";
    elseif density < 0.70
        congestion_level = "MODERATE";
    elseif density < 0.90
        congestion_level = "HIGH";
    else
        congestion_level = "SEVERE";
    end
end
