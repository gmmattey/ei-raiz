CREATE INDEX idx_users_device_id
  ON users(device_id);

CREATE INDEX idx_imports_user_created_at
  ON imports(user_id, created_at DESC);

CREATE INDEX idx_imports_portfolio_created_at
  ON imports(portfolio_id, created_at DESC);

CREATE INDEX idx_imports_status_created_at
  ON imports(status, created_at DESC);

CREATE INDEX idx_import_rows_import_row_number
  ON import_rows(import_id, row_number);

CREATE INDEX idx_import_rows_import_resolution_status
  ON import_rows(import_id, resolution_status);

CREATE INDEX idx_assets_asset_type_display_name
  ON assets(asset_type_id, display_name);

CREATE INDEX idx_assets_code
  ON assets(code);

CREATE INDEX idx_assets_normalized_name
  ON assets(normalized_name);

CREATE INDEX idx_portfolio_positions_portfolio_asset
  ON portfolio_positions(portfolio_id, asset_id);

CREATE INDEX idx_portfolio_positions_portfolio_source_kind
  ON portfolio_positions(portfolio_id, source_kind);

CREATE INDEX idx_portfolio_positions_platform
  ON portfolio_positions(platform_id);

CREATE INDEX idx_planned_orders_portfolio_status
  ON planned_orders(portfolio_id, status);

CREATE INDEX idx_planned_orders_asset
  ON planned_orders(asset_id);

CREATE INDEX idx_portfolio_contributions_portfolio_month
  ON portfolio_contributions(portfolio_id, contribution_month);

CREATE INDEX idx_portfolio_contributions_platform
  ON portfolio_contributions(platform_id);

CREATE INDEX idx_portfolio_snapshots_portfolio_reference_date
  ON portfolio_snapshots(portfolio_id, reference_date DESC);

CREATE INDEX idx_portfolio_snapshots_import
  ON portfolio_snapshots(import_id);

CREATE INDEX idx_portfolio_snapshot_positions_snapshot_asset
  ON portfolio_snapshot_positions(snapshot_id, asset_id);

CREATE INDEX idx_portfolio_snapshot_positions_platform
  ON portfolio_snapshot_positions(platform_id);

CREATE INDEX idx_portfolio_analyses_snapshot_created_at
  ON portfolio_analyses(snapshot_id, created_at DESC);

CREATE INDEX idx_portfolio_analyses_portfolio_created_at
  ON portfolio_analyses(portfolio_id, created_at DESC);

CREATE INDEX idx_portfolio_analyses_status_created_at
  ON portfolio_analyses(status, created_at DESC);

CREATE INDEX idx_analysis_insights_analysis_priority
  ON analysis_insights(analysis_id, priority);

CREATE INDEX idx_external_market_references_asset_reference_date
  ON external_market_references(asset_id, reference_date DESC);

CREATE INDEX idx_external_market_references_source_external_code
  ON external_market_references(source_id, external_code);

CREATE INDEX idx_operational_events_user_created_at
  ON operational_events(user_id, created_at DESC);

CREATE INDEX idx_operational_events_portfolio_created_at
  ON operational_events(portfolio_id, created_at DESC);

CREATE INDEX idx_operational_events_import_created_at
  ON operational_events(import_id, created_at DESC);

CREATE INDEX idx_operational_events_type_created_at
  ON operational_events(event_type, created_at DESC);
