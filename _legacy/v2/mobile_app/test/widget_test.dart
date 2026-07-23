import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app/app/esquilo_invest_app.dart';

void main() {
  testWidgets('shows a friendly empty state when backend is missing', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const EsquiloInvestApp());
    await tester.pumpAndSettle();

    expect(find.text('Ambiente sem conexao'), findsOneWidget);
    expect(
      find.textContaining('A carteira ainda nao esta pronta para leitura'),
      findsOneWidget,
    );
  });
}
