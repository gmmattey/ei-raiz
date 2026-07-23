class BackendHealth {
  const BackendHealth({
    required this.releaseName,
    required this.versionNumber,
    required this.updatedAt,
  });

  factory BackendHealth.fromJson(Map<String, dynamic> json) {
    return BackendHealth(
      releaseName: _stringFrom(json['releaseName']),
      versionNumber: _stringFrom(json['versionNumber']),
      updatedAt: _dateFrom(json['updatedAt']),
    );
  }

  final String releaseName;
  final String versionNumber;
  final DateTime? updatedAt;
}

String _stringFrom(Object? source, {String fallback = ''}) {
  if (source == null) return fallback;
  if (source is String) {
    final trimmed = source.trim();
    return trimmed.isEmpty ? fallback : trimmed;
  }
  if (source is num || source is bool) return source.toString();
  return fallback;
}

DateTime? _dateFrom(Object? source) {
  final value = _stringFrom(source);
  return value.isEmpty ? null : DateTime.tryParse(value);
}
