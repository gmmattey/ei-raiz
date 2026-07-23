import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/config/app_environment.dart';
import '../models/backend_health.dart';
import '../models/dashboard_payload.dart';

class AppScriptApiException implements Exception {
  const AppScriptApiException(this.message);

  final String message;

  @override
  String toString() => message;
}

class AppScriptDashboardService {
  AppScriptDashboardService({http.Client? client})
    : _client = client ?? http.Client();

  final http.Client _client;

  bool get isConfigured => AppEnvironment.appScriptBaseUrl.trim().isNotEmpty;

  Future<DashboardPayload> fetchDashboard() async {
    final body = await _getResource('dashboard');
    final data = _mapFrom(body['data']);
    return DashboardPayload.fromJson(data);
  }

  Future<BackendHealth> fetchHealth() async {
    final body = await _getResource('health');
    final data = _mapFrom(body['data']);
    return BackendHealth.fromJson(data);
  }

  Future<String> fetchAiAnalysis() async {
    final body = await _getResource('ai-analysis');
    final data = _mapFrom(body['data']);
    final analysis = data['analysis'];
    if (analysis is String && analysis.trim().isNotEmpty) {
      return analysis.trim();
    }
    throw const AppScriptApiException('A resposta da Esquilo IA veio vazia.');
  }

  void dispose() {
    _client.close();
  }

  Future<Map<String, dynamic>> _getResource(String resource) async {
    if (!isConfigured) {
      throw const AppScriptApiException(
        'Defina APP_SCRIPT_BASE_URL para conectar o AppScript.',
      );
    }

    final uri = _buildUri(resource);
    final response = await _client
        .get(uri)
        .timeout(const Duration(seconds: 20));

    _throwIfHtmlResponse(response);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw AppScriptApiException(
        'O AppScript respondeu com HTTP ${response.statusCode}.',
      );
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map) {
      throw const AppScriptApiException(
        'O AppScript nao retornou um envelope JSON valido.',
      );
    }

    final body = decoded.map((key, value) => MapEntry(key.toString(), value));

    if (body['ok'] == true) {
      return body;
    }

    throw AppScriptApiException(
      _stringFrom(body['error'], fallback: 'Falha ao consultar o AppScript.'),
    );
  }

  void _throwIfHtmlResponse(http.Response response) {
    final host = response.request?.url.host.toLowerCase() ?? '';
    if (host.contains('accounts.google.com')) {
      throw const AppScriptApiException(
        'O Web App do AppScript foi publicado com acesso restrito e redirecionou para login Google. Reimplante o /exec com acesso compativel com o app mobile.',
      );
    }

    if (response.statusCode == 401) {
      throw const AppScriptApiException(
        'O Web App do AppScript recusou a chamada com HTML de autenticacao. Revise o acesso do deploy e publique novamente o /exec.',
      );
    }

    final contentType = response.headers['content-type']?.toLowerCase() ?? '';
    final normalizedBody = response.body.trimLeft().toLowerCase();
    final looksLikeHtml =
        contentType.contains('text/html') ||
        normalizedBody.startsWith('<!doctype html') ||
        normalizedBody.startsWith('<html');

    if (looksLikeHtml) {
      throw const AppScriptApiException(
        'O Web App do AppScript respondeu HTML em vez de JSON. Verifique a rota /exec e a configuracao de acesso do deploy.',
      );
    }
  }

  Uri _buildUri(String resource) {
    final baseUri = Uri.parse(AppEnvironment.appScriptBaseUrl);
    final query = <String, String>{
      ...baseUri.queryParameters,
      'format': 'json',
      'resource': resource,
    };

    if (AppEnvironment.appScriptApiToken.isNotEmpty) {
      query['token'] = AppEnvironment.appScriptApiToken;
    }

    return baseUri.replace(queryParameters: query);
  }

  Map<String, dynamic> _mapFrom(Object? value) {
    if (value is Map<String, dynamic>) {
      return value;
    }
    if (value is Map) {
      return value.map((key, data) => MapEntry(key.toString(), data));
    }
    return const <String, dynamic>{};
  }

  String _stringFrom(Object? value, {String fallback = ''}) {
    if (value is String && value.trim().isNotEmpty) {
      return value.trim();
    }
    if (value is num || value is bool) {
      return value.toString();
    }
    return fallback;
  }
}
