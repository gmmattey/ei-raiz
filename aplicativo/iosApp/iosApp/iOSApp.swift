import SwiftUI
import SavroApp

@main
struct iOSApp: App {
    @Environment(\.scenePhase) private var scenePhase
    private let gerenciadorCofre = SavroViewControllerKt.GerenciadorCofreParaCicloDeVida()

    var body: some Scene {
        WindowGroup {
            // `ContentView()` precisa manter a mesma posição estrutural na `ZStack` em qualquer
            // `scenePhase` — é isso que garante que o SwiftUI nunca invalide a identidade da
            // `ComposeView` (`ContentView.swift`) e, com isso, nunca recrie o `UIViewController`
            // do Compose. Envolver `ContentView()` num `if`/`AnyView` condicional aqui quebraria a
            // preservação de `rememberSaveable` entre background e foreground (#119, ver
            // `SavroAppViewController()` em `SavroViewController.kt`) mesmo sem tocar em nenhum
            // código Kotlin.
            ZStack {
                ContentView()
                if scenePhase != .active {
                    SnapshotProtectionOverlay()
                }
            }
            .ignoresSafeArea(.keyboard)
            .onChange(of: scenePhase) { novaFase in
                switch novaFase {
                case .background:
                    gerenciadorCofre.notificarAppEmSegundoPlano()
                case .active:
                    gerenciadorCofre.notificarAppEmPrimeiroPlano()
                default:
                    break
                }
            }
        }
    }
}
