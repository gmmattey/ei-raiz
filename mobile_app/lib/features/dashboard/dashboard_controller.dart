import 'package:flutter/foundation.dart';

import '../../models/backend_health.dart';
import '../../models/dashboard_payload.dart';
import '../../services/app_script_dashboard_service.dart';

class DashboardController extends ChangeNotifier {
  DashboardController(this._service);

  final AppScriptDashboardService _service;

  DashboardPayload? _dashboard;
  BackendHealth? _backendHealth;
  String? _dashboardErrorMessage;
  String? _aiErrorMessage;
  String? _aiAnalysis;
  bool _isLoading = false;
  bool _isAiLoading = false;

  DashboardPayload? get dashboard => _dashboard;
  BackendHealth? get backendHealth => _backendHealth;
  String? get dashboardErrorMessage => _dashboardErrorMessage;
  String? get aiErrorMessage => _aiErrorMessage;
  String? get aiAnalysis => _aiAnalysis;
  bool get isLoading => _isLoading;
  bool get isAiLoading => _isAiLoading;
  bool get isConfigured => _service.isConfigured;

  Future<void> loadDashboard() async {
    if (!isConfigured) {
      _dashboardErrorMessage =
          'Defina APP_SCRIPT_BASE_URL e, se necessario, APP_SCRIPT_API_TOKEN.';
      notifyListeners();
      return;
    }

    _isLoading = true;
    _dashboardErrorMessage = null;
    notifyListeners();

    try {
      _dashboard = await _service.fetchDashboard();
      try {
        _backendHealth = await _service.fetchHealth();
      } catch (_) {
        _backendHealth = null;
      }
    } on AppScriptApiException catch (error) {
      _dashboardErrorMessage = error.message;
    } catch (_) {
      _dashboardErrorMessage = 'Falha inesperada ao carregar a carteira.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshAiAnalysis() async {
    if (!isConfigured) {
      _aiErrorMessage =
          'Defina APP_SCRIPT_BASE_URL e, se necessario, APP_SCRIPT_API_TOKEN.';
      notifyListeners();
      return;
    }

    _isAiLoading = true;
    _aiErrorMessage = null;
    notifyListeners();

    try {
      _aiAnalysis = await _service.fetchAiAnalysis();
      _aiErrorMessage = null;
    } on AppScriptApiException catch (error) {
      _aiErrorMessage = error.message;
    } catch (_) {
      _aiErrorMessage = 'Falha inesperada ao carregar a Esquilo IA.';
    } finally {
      _isAiLoading = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _service.dispose();
    super.dispose();
  }
}
