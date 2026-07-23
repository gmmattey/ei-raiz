# Prompt 11 - Repositórios, serviços e modelos

Você vai organizar a camada de dados do app Flutter do Esquilo Invest.

Objetivo desta etapa:
tirar lógica espalhada de widget e consolidar contratos de leitura, importação, perfil e histórico.

Arquivos esperados:
- `lib/repositories/dashboard_repository.dart`
- `lib/repositories/import_repository.dart`
- `lib/repositories/profile_repository.dart`
- `lib/repositories/history_repository.dart`
- `lib/services/app_script_dashboard_service.dart`
- `lib/services/ai_analysis_service.dart`
- `lib/services/backend_health_service.dart`
- `lib/models/import_preview_payload.dart`
- `lib/models/user_context.dart`
- `lib/models/history_snapshot.dart`

Regras:
- manter o que já existir e estiver bom
- não duplicar responsabilidade entre repository e service
- service chama fonte externa
- repository organiza caso de uso para a interface
- modelo deve refletir o contrato real
- lidar com erros de forma padronizada
- preparar terreno para importação, snapshots e contexto do usuário

Quero como saída:
- arquivos completos
- contratos coerentes
- separação clara entre serviço, repositório e modelo
