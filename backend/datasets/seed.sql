CREATE TABLE IF NOT EXISTS demo_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset_name TEXT NOT NULL,
  record_count INTEGER NOT NULL,
  summary TEXT NOT NULL
);

INSERT INTO demo_metrics (dataset_name, record_count, summary) VALUES
('electricity_usage', 10000, 'Synthetic smart-meter telemetry for city electricity demand'),
('water_consumption', 10000, 'Residential and civic water demand profiles'),
('air_quality', 10000, 'Pollution and weather observations'),
('tree_plantation', 10000, 'Canopy survival and carbon capture records'),
('waste_management', 10000, 'Waste collection and bin fill status'),
('renewable_energy', 10000, 'Solar and wind generation telemetry'),
('carbon_emissions', 10000, 'Sector emissions and reduction targets'),
('citizen_reports', 10000, 'Citizen complaints and officer assignments');
