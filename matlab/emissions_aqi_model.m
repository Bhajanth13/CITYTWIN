% =========================================================================
% CITYTWIN — Environmental Emissions & Air Quality Index (AQI) Model
% Relationship: Congestion -> Idle Time -> Emission Surge -> AQI Degradation
% =========================================================================

function [aqi, co2_kg_hr, nox_g_hr, pm25_g_hr, aqi_category] = emissions_aqi_model(...
    vehicle_count, average_speed, length_km, density)
    
    % 1. Vehicle Kilometers Traveled per hour (VKT)
    vkt = vehicle_count * length_km;
    
    % 2. Speed-Dependent Emission Multiplier:
    % When vehicles drop below 20 km/h, stop-and-go acceleration and idle
    % engine burning causes exponential spikes in particulate matter and NOx.
    if average_speed >= 45.0
        speed_factor = 1.0;
    elseif average_speed >= 30.0
        speed_factor = 1.35;
    elseif average_speed >= 15.0
        speed_factor = 2.10;
    else
        % Severe crawl / stop-and-go
        speed_factor = 3.20;
    end
    
    % Baseline emission factors (per VKT)
    co2_base = 0.160;   % kg CO2 / vehicle-km
    nox_base = 0.450;   % g NOx / vehicle-km
    pm25_base = 0.035;  % g PM2.5 / vehicle-km
    
    co2_kg_hr = vkt * co2_base * speed_factor;
    nox_g_hr = vkt * nox_base * speed_factor;
    pm25_g_hr = vkt * pm25_base * speed_factor;
    
    % 3. Simulated Air Quality Index (AQI) Mapping
    % Ambient baseline urban AQI = 45 (Good)
    % Additional AQI = proportional to vehicle density and speed degradation
    ambient_baseline = 45.0;
    aqi_impact = (density * 55.0) * (speed_factor^0.8);
    aqi = round(ambient_baseline + aqi_impact);
    
    % 4. AQI Category Thresholds (Standard EPA / CPCB)
    if aqi <= 50
        aqi_category = "Good";
    elseif aqi <= 100
        aqi_category = "Moderate";
    elseif aqi <= 150
        aqi_category = "Unhealthy for Sensitive Groups";
    elseif aqi <= 200
        aqi_category = "Unhealthy";
    else
        aqi_category = "Severe / Hazardous";
    end
end
