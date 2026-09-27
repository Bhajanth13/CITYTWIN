% =========================================================================
% CITYTWIN — Atmospheric Gaussian Plume Dispersion & Spatial AQI Simulation
% Script: spatial_aqi_dispersion.m
%
% Purpose:
%   1. Implements the 2D/3D Atmospheric Gaussian Plume Diffusion Equation
%      under Pasquill-Gifford Class D (Neutral Urban) atmospheric conditions.
%   2. Simulates line-source vehicular exhaust emissions (PM2.5, NOx, CO2).
%   3. Evaluates downwind toxic advection during corridor gridlock vs
%      Option C dynamic traffic smoothing and emission dispersion.
%   4. Renders Figure 3: 2D Contour Heatmap, 3D Plume Topography, and
%      Receptor Exposure Risk Analysis.
% =========================================================================

function [X_grid, Y_grid, AQI_incident_grid, AQI_optC_grid] = spatial_aqi_dispersion()

    fprintf('\n----------------------------------------------------\n');
    fprintf('  COMPUTING ATMOSPHERIC GAUSSIAN PLUME DISPERSION   \n');
    fprintf('----------------------------------------------------\n');

    % 1. Spatial Domain Grid (10 km x 10 km urban Bengaluru grid)
    x = linspace(-5.0, 5.0, 160); % km
    y = linspace(-5.0, 5.0, 160); % km
    [X_grid, Y_grid] = meshgrid(x, y);

    % Ambient background AQI
    ambient_aqi = 45.0;

    % 2. Meteorological & Atmospheric Transport Parameters
    wind_speed = 3.2;         % m/s
    wind_angle_deg = 45.0;     % Wind blowing towards North-East (from SW)
    theta = deg2rad(wind_angle_deg);
    u_x = wind_speed * cos(theta);
    u_y = wind_speed * sin(theta);

    % Source Locations (Corridor centers in km)
    % Incident Site: Sony World Corridor (X = 1.5, Y = -1.0)
    sources = [ ...
         1.5, -1.0, 280.0, 110.0; % Sony World (Incident Site: Open-Loop vs Opt C)
         0.0, -4.0,  95.0,  70.0; % Silk Board
         1.2, -2.2, 140.0,  75.0; % Koramangala 80ft
         1.2,  0.8, 120.0,  80.0; % Domlur
        -0.5,  2.0,  85.0,  65.0; % MG Road
        -1.5, -3.2,  75.0,  60.0  % Jayanagar
    ];

    AQI_incident_grid = ambient_aqi * ones(size(X_grid));
    AQI_optC_grid = ambient_aqi * ones(size(X_grid));

    % Pasquill-Gifford dispersion parameters (Urban Class D)
    % sigma_y(d) = a * d^b, sigma_z(d) = c * d^d
    calc_sigma_y = @(d_km) max(0.08, 0.16 .* (d_km.^0.85));
    calc_sigma_z = @(d_km) max(0.05, 0.12 .* (d_km.^0.78));

    for s = 1:size(sources, 1)
        src_x = sources(s, 1);
        src_y = sources(s, 2);
        Q_inc  = sources(s, 3); % Emission source strength (Incident)
        Q_optC = sources(s, 4); % Emission source strength (Option C)

        % Coordinate transformation aligned with wind direction
        dx = X_grid - src_x;
        dy = Y_grid - src_y;

        % Downwind distance along wind vector (x_down) and crosswind (y_cross)
        x_down  =  dx .* cos(theta) + dy .* sin(theta);
        y_cross = -dx .* sin(theta) + dy .* cos(theta);

        % Plume only disperses downwind (x_down > 0)
        mask = x_down > 0;
        d_down = max(0.02, x_down);

        sig_y = calc_sigma_y(d_down);
        sig_z = calc_sigma_z(d_down);

        % 2D Ground-level Gaussian Plume Diffusion Equation
        plume_kernel = (1.0 ./ (2.0 * pi * wind_speed * sig_y .* sig_z)) .* ...
                       exp(- (y_cross.^2) ./ (2.0 * (sig_y.^2)));

        plume_kernel(~mask) = 0.0;

        AQI_incident_grid = AQI_incident_grid + (Q_inc * plume_kernel * 0.12);
        AQI_optC_grid     = AQI_optC_grid     + (Q_optC * plume_kernel * 0.12);
    end

    % Cap maximum realistic AQI at 320 (Hazardous)
    AQI_incident_grid = min(320.0, AQI_incident_grid);
    AQI_optC_grid     = min(320.0, AQI_optC_grid);

    % Sensitive Receptors (Coordinates and Names)
    receptors = [ ...
         1.8, -0.6;  % Bethany High School
         0.8, -0.2;  % St. John's Medical Center
         2.2, -1.8;  % Koramangala Residential Block
        -2.2,  0.0   % Victoria Hospital Trauma Hub
    ];
    rec_names = {'Bethany School', 'St. John Hospital', 'Koramangala Res.', 'Victoria Hospital'};

    % -----------------------------------------------------------------
    % 3. Render Figure 3: Atmospheric Dispersion & Spatial Heatmap
    % -----------------------------------------------------------------
    fig3 = figure(3);
    set(fig3, 'Name', 'CITYTWIN — Atmospheric Gaussian Plume Dispersion & Spatial AQI Simulation', ...
              'Color', 'w', 'Units', 'normalized', 'Position', [0.06, 0.06, 0.88, 0.84]);

    % Subplot 1: 2D Spatial AQI Heatmap (Incident Gridlock)
    subplot(2, 2, 1);
    levels = 40:20:260;
    contourf(X_grid, Y_grid, AQI_incident_grid, levels, 'LineColor', 'none'); hold on;
    colormap(gca, turbo);
    cb1 = colorbar;
    cb1.Label.String = 'Air Quality Index (AQI)';
    cb1.Label.FontSize = 9;
    caxis([40, 240]);

    % Overlay wind vector
    quiver(X_grid(1:20:end, 1:20:end), Y_grid(1:20:end, 1:20:end), ...
           u_x * ones(size(X_grid(1:20:end, 1:20:end))), ...
           u_y * ones(size(Y_grid(1:20:end, 1:20:end))), ...
           0.45, 'w', 'LineWidth', 1.2);

    % Mark Incident site and Receptors
    plot(1.5, -1.0, 'kp', 'MarkerSize', 14, 'MarkerFaceColor', 'r');
    for r = 1:size(receptors, 1)
        plot(receptors(r, 1), receptors(r, 2), 'ks', 'MarkerSize', 8, 'MarkerFaceColor', 'y');
        text(receptors(r, 1)+0.15, receptors(r, 2), rec_names{r}, ...
             'FontSize', 7, 'Color', 'w', 'FontWeight', 'bold');
    end
    title('\bf\fontsize{11}Incident State: Severe Exhaust Toxic Hotspot', 'Interpreter', 'tex');
    xlabel('East-West Coordinate (km)');
    ylabel('North-South Coordinate (km)');
    legend({'AQI Contours', 'Wind Vector (\theta=45^\circ, 3.2m/s)', 'Incident (Sony World)', 'Sensitive Receptors'}, ...
           'Location', 'northwest', 'FontSize', 7);
    axis equal; grid on; box on;

    % Subplot 2: Option C Spatial AQI Heatmap (Active Traffic Smoothing)
    subplot(2, 2, 2);
    contourf(X_grid, Y_grid, AQI_optC_grid, levels, 'LineColor', 'none'); hold on;
    colormap(gca, turbo);
    cb2 = colorbar;
    cb2.Label.String = 'Air Quality Index (AQI)';
    cb2.Label.FontSize = 9;
    caxis([40, 240]);

    plot(1.5, -1.0, 'kp', 'MarkerSize', 14, 'MarkerFaceColor', 'g');
    for r = 1:size(receptors, 1)
        plot(receptors(r, 1), receptors(r, 2), 'ks', 'MarkerSize', 8, 'MarkerFaceColor', 'y');
        text(receptors(r, 1)+0.15, receptors(r, 2), rec_names{r}, ...
             'FontSize', 7, 'Color', 'w', 'FontWeight', 'bold');
    end
    title('\bf\fontsize{11}Option C: Mitigated Dispersion via Dynamic Balancing', 'Interpreter', 'tex');
    xlabel('East-West Coordinate (km)');
    ylabel('North-South Coordinate (km)');
    legend({'AQI Contours', 'Controlled Corridor', 'Protected Receptors'}, ...
           'Location', 'northwest', 'FontSize', 7);
    axis equal; grid on; box on;

    % Subplot 3: 3D Gaussian Plume Surface Topography
    subplot(2, 2, 3);
    surf(X_grid(1:3:end, 1:3:end), Y_grid(1:3:end, 1:3:end), ...
         AQI_incident_grid(1:3:end, 1:3:end), 'EdgeColor', 'none');
    colormap(gca, hot);
    view(-35, 48);
    title('\bf\fontsize{11}3D Urban Pollutant Dispersion Topography', 'Interpreter', 'tex');
    xlabel('X (km)'); ylabel('Y (km)'); zlabel('AQI Concentration');
    zlim([30, 260]);
    grid on; box on; lighting gouraud; camlight;

    % Subplot 4: Sensitive Receptor Exposure Comparison
    subplot(2, 2, 4);
    rec_aqi_inc = interp2(X_grid, Y_grid, AQI_incident_grid, receptors(:, 1), receptors(:, 2));
    rec_aqi_opt = interp2(X_grid, Y_grid, AQI_optC_grid, receptors(:, 1), receptors(:, 2));

    bar_x = 1:size(receptors, 1);
    bar_w = 0.32;
    bar(bar_x - bar_w/2, rec_aqi_inc, bar_w, 'FaceColor', [0.85, 0.20, 0.20], 'DisplayName', 'Incident Exposure'); hold on;
    bar(bar_x + bar_w/2, rec_aqi_opt, bar_w, 'FaceColor', [0.15, 0.75, 0.35], 'DisplayName', 'Option C Protected');
    yline(100, 'k--', 'Moderate AQI Ceiling (100)');
    yline(150, 'r--', 'Unhealthy Threshold (150)');
    set(gca, 'XTick', bar_x, 'XTickLabel', rec_names, 'FontSize', 8);
    xtickangle(15);
    ylabel('Local AQI Level');
    title('\bf\fontsize{11}Public Health Impact: Exposure at Key City Hubs', 'Interpreter', 'tex');
    legend('Location', 'northeast', 'FontSize', 8);
    grid on; box on;
    ylim([0, 230]);

    fprintf('Atmospheric Gaussian Plume Dispersion plot generated successfully (Figure 3).\n');
end
