import SwiftUI
import SavroApp

/// Host iOS: só embrulha a raiz compartilhada produzida por `:shared:app`.
/// Nenhuma regra de negócio vive aqui.
struct ComposeView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> UIViewController {
        SavroViewControllerKt.SavroAppViewController()
    }

    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
}

struct ContentView: View {
    var body: some View {
        ComposeView()
            .ignoresSafeArea(.all)
    }
}

/// Cobre o conteúdo sensível durante a transição para o segundo plano e no seletor de apps
/// (#118: "Nunca mostrar patrimônio ... no app switcher ou durante transições"). SwiftUI não tem
/// um equivalente direto ao `FLAG_SECURE` do Android — este overlay é a técnica recomendada pela
/// Apple para o mesmo efeito (cobrir o snapshot que o sistema tira ao entrar em background).
struct SnapshotProtectionOverlay: View {
    var body: some View {
        VisualEffectBlur(style: .systemMaterialDark)
            .ignoresSafeArea()
    }
}

private struct VisualEffectBlur: UIViewRepresentable {
    var style: UIBlurEffect.Style

    func makeUIView(context: Context) -> UIVisualEffectView {
        UIVisualEffectView(effect: UIBlurEffect(style: style))
    }

    func updateUIView(_ uiView: UIVisualEffectView, context: Context) {
        uiView.effect = UIBlurEffect(style: style)
    }
}
