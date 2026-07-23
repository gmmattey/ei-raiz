import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;

import 'package:mobile_app/models/dashboard_payload.dart';

const String _baseUrl =
    'https://script.google.com/macros/s/AKfycbya0mKpePyZV79S3ta0hJf0fhhwWfeUFwfopMOsZRSuqT7EF8LiTz6dV2suOuJNWve-/exec';
const String _token = 'esquilo-invest-mobile-debug-2026';

void main() {
  test('health endpoint stays public and returns JSON', () async {
    final uri = Uri.parse(
      _baseUrl,
    ).replace(queryParameters: <String, String>{
      'format': 'json',
      'resource': 'health',
    });

    final stopwatch = Stopwatch()..start();
    final response = await http
        .get(uri)
        .timeout(const Duration(seconds: 20));
    stopwatch.stop();

    expect(response.statusCode, 200);
    expect(
      response.headers['content-type']?.toLowerCase().contains('json'),
      isTrue,
    );
    expect(response.body.trimLeft().startsWith('{'), isTrue);
    expect(stopwatch.elapsed.inSeconds, lessThan(20));
  });

  test('dashboard endpoint returns live JSON and parses into mobile payload', () async {
    final uri = Uri.parse(
      _baseUrl,
    ).replace(queryParameters: <String, String>{
      'format': 'json',
      'resource': 'dashboard',
      'token': _token,
    });

    final stopwatch = Stopwatch()..start();
    final response = await http
        .get(uri)
        .timeout(const Duration(seconds: 20));
    stopwatch.stop();

    expect(response.statusCode, 200);
    expect(
      response.headers['content-type']?.toLowerCase().contains('json'),
      isTrue,
    );
    expect(response.body.trimLeft().startsWith('{'), isTrue);
    expect(stopwatch.elapsed.inSeconds, lessThan(20));

    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    expect(decoded['ok'], isTrue);
    expect(decoded['resource'], 'dashboard');

    final payload = DashboardPayload.fromJson(
      Map<String, dynamic>.from(decoded['data'] as Map),
    );

    expect(payload.summary.totalLabel, isNotEmpty);
    expect(payload.score.value, greaterThan(0));
    expect(payload.categorySnapshots, isNotEmpty);
    expect(payload.missionTitle, isNotEmpty);
    expect(payload.snapshotFor('acoes'), isNotNull);
    expect(payload.healthFor('fundos'), isNotNull);
  });

  test('live payload exposes the full mobile command surface', () async {
    final uri = Uri.parse(
      _baseUrl,
    ).replace(queryParameters: <String, String>{
      'format': 'json',
      'resource': 'dashboard',
      'token': _token,
    });

    final response = await http
        .get(uri)
        .timeout(const Duration(seconds: 20));

    expect(response.statusCode, 200);

    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    final payload = DashboardPayload.fromJson(
      Map<String, dynamic>.from(decoded['data'] as Map),
    );

    expect(payload.mobileHome.total.label, isNotEmpty);
    expect(payload.mobileHome.variation.label, contains('%'));
    expect(payload.mobileHome.score.valueLabel, contains('/100'));
    expect(payload.intelligentAlerts.length, greaterThanOrEqualTo(1));
    expect(payload.assetRanking.items.length, greaterThanOrEqualTo(1));
    expect(payload.decisionHistory.length, greaterThanOrEqualTo(1));
    expect(payload.dataProfiles.all.length, 3);
    expect(payload.operations.canCreate, isTrue);
  });
}
