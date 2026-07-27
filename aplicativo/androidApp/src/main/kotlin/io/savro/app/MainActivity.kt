package io.savro.app

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.compose.setContent
import androidx.fragment.app.FragmentActivity

/**
 * Host Android: ciclo de vida, composição da raiz compartilhada (`:shared:app`) e o que só o
 * Android sabe fazer — `FLAG_SECURE` (bloqueia screenshot e oculta o conteúdo no Recents) e
 * vincular/desvincular a Activity ao prompt biométrico (#118). Nenhuma regra de negócio vive aqui.
 *
 * `FragmentActivity` (em vez de `ComponentActivity`) porque `BiometricPrompt` exige uma
 * `FragmentActivity`/`Fragment` — `FragmentActivity` já estende `ComponentActivity`, então
 * `setContent` do Compose continua funcionando sem alteração.
 */
class MainActivity : FragmentActivity() {

    private var composicaoCofre: ComposicaoCofreAndroid? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Nunca deixa o conteúdo do cofre aparecer em screenshot, gravação de tela ou na
        // miniatura do app switcher (#118, "Nenhum dado patrimonial aparece em screenshots").
        window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)

        val composicao = ComposicaoCofreAndroid(this).also { composicaoCofre = it }

        setContent {
            SavroApp(gerenciador = composicao.gerenciadorCofre)
        }
    }

    override fun onResume() {
        super.onResume()
        val composicao = composicaoCofre ?: return
        composicao.autenticador.vincularAtividade(this)
        composicao.gerenciadorCofre.notificarAppEmPrimeiroPlano()
    }

    override fun onPause() {
        val composicao = composicaoCofre
        composicao?.autenticador?.desvincularAtividade(this)
        composicao?.gerenciadorCofre?.notificarAppEmSegundoPlano()
        super.onPause()
    }
}
