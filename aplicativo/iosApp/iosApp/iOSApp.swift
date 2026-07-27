import SwiftUI
import SavroApp

@main
struct iOSApp: App {
    @Environment(\.scenePhase) private var scenePhase
    private let gerenciadorCofre = SavroViewControllerKt.GerenciadorCofreParaCicloDeVida()

    var body: some Scene {
        WindowGroup {
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
