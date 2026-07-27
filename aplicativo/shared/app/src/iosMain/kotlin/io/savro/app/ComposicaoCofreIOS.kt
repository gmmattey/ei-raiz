package io.savro.app

import io.savro.database.ProvedorChaveMestraIOS
import io.savro.database.RelogioDoSistemaIOS
import io.savro.database.RepositorioItensPatrimoniaisSQLCipher
import io.savro.domain.patrimonio.ServicoPatrimonio
import io.savro.security.AutenticadorBiometricoIOS
import io.savro.security.GerenciadorCofre
import io.savro.security.PreferenciasCofreIOS
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

/**
 * Composição do cofre no host iOS (#118) — mesmo papel de [ComposicaoCofreAndroid], mas sem
 * precisar de nenhuma referência de Activity/ViewController: Keychain e `LAContext` não exigem
 * vínculo com uma tela específica, diferente do `BiometricPrompt` do Android.
 *
 * Vive inteira em `iosMain`; `:iosApp` nunca vê `ProvedorChaveMestraIOS`, `LAContext` nem
 * SQLCipher diretamente — só o [GerenciadorCofre] exposto por [SavroAppViewController].
 */
internal object ComposicaoCofreIOS {
    private val escopo = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    private val provedorChaveMestra by lazy { ProvedorChaveMestraIOS() }
    private val repositorio by lazy { RepositorioItensPatrimoniaisSQLCipher(provedorChaveMestra, RelogioDoSistemaIOS) }

    val gerenciadorCofre: GerenciadorCofre by lazy {
        GerenciadorCofre(
            provedorChaveMestra = provedorChaveMestra,
            repositorio = repositorio,
            autenticador = AutenticadorBiometricoIOS(),
            preferencias = PreferenciasCofreIOS(),
            relogio = RelogioDoSistemaIOS,
            escopo = escopo,
        )
    }

    /** Cadastro manual de patrimônio (issue #119) — mesma conexão de banco do [gerenciadorCofre]. */
    val servicoPatrimonio: ServicoPatrimonio by lazy { ServicoPatrimonio(repositorio, RelogioDoSistemaIOS) }
}
