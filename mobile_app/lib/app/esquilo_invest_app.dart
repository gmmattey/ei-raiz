import 'package:flutter/material.dart';

import 'app_router.dart';
import 'app_theme.dart';

class EsquiloInvestApp extends StatelessWidget {
  const EsquiloInvestApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Esquilo Invest',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.themeData,
      onGenerateRoute: AppRouter.onGenerateRoute,
      initialRoute: AppRouter.dashboardRoute,
    );
  }
}
