package io.savro.designsystem

/**
 * Base comum para testes que usam `runComposeUiTest`. A implementação `actual` de `androidUnitTest`
 * anota a classe com o runner do Robolectric, exigido pelo Compose UI Test para simular o ambiente
 * Android sem device nem emulador. A implementação `actual` de `iosTest` fica vazia — a execução
 * real do teste em iOS depende de XCTest via host macOS (fora deste ambiente).
 */
expect abstract class ComposeUiTestBase()
