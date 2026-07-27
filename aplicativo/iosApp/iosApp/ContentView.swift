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
