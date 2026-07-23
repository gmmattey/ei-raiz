import 'dart:io';

import 'package:flutter/foundation.dart';

class AppEnvironment {
  static const String releaseName = 'Esquilo Invest';
  static const String version = '2.0.0';
  static const String _defaultAppScriptBaseUrl =
      'https://script.google.com/macros/s/AKfycbya0mKpePyZV79S3ta0hJf0fhhwWfeUFwfopMOsZRSuqT7EF8LiTz6dV2suOuJNWve-/exec';
  static const String _defaultDebugAppScriptApiToken =
      'esquilo-invest-mobile-debug-2026';
  static const String _envAppScriptBaseUrl = String.fromEnvironment(
    'APP_SCRIPT_BASE_URL',
  );
  static const String _envAppScriptApiToken = String.fromEnvironment(
    'APP_SCRIPT_API_TOKEN',
  );
  static final String appScriptBaseUrl = _resolveAppScriptBaseUrl();
  static final String appScriptApiToken = _resolveAppScriptApiToken();

  static String get releaseLabel => '$releaseName v$version';

  static String _resolveAppScriptBaseUrl() {
    final envUrl = _envAppScriptBaseUrl.trim();
    if (envUrl.isNotEmpty) {
      return envUrl;
    }

    // Mantem o teste de widget cobrindo o estado sem backend configurado.
    if (Platform.environment.containsKey('FLUTTER_TEST')) {
      return '';
    }

    return _defaultAppScriptBaseUrl;
  }

  static String _resolveAppScriptApiToken() {
    final envToken = _envAppScriptApiToken.trim();
    if (envToken.isNotEmpty) {
      return envToken;
    }

    // Evita acoplar o token padrao aos testes automatizados.
    if (Platform.environment.containsKey('FLUTTER_TEST')) {
      return '';
    }

    if (kDebugMode) {
      return _defaultDebugAppScriptApiToken;
    }

    return '';
  }
}
