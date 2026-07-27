package io.savro.app

import android.content.Context
import androidx.fragment.app.FragmentActivity
import io.savro.database.ProvedorChaveMestraAndroid
import io.savro.database.RelogioDoSistemaAndroid
import io.savro.database.RepositorioItensPatrimoniaisRoom
import io.savro.security.AutenticadorBiometricoAndroid
import io.savro.security.GerenciadorCofre
import io.savro.security.PreferenciasCofreAndroid
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

/**
 * Composição do cofre no host Android (#118) — a #180 deixou este wiring deliberadamente
 * pendente ("`:shared:app`/`:androidApp` não consomem `:shared:core:database` ainda", ver
 * `documentacao/arquitetura/validacoes/117-O-decisao-persistencia-180.md`). `:androidApp` só
 * constrói e mantém esta classe; não conhece Keystore, Room nem BiometricPrompt diretamente —
 * essa fronteira continua só em `:shared:core:database`/`:shared:core:security`.
 *
 * Limitação conhecida e não escondida: uma nova instância é criada a cada `onCreate` da Activity
 * (inclusive em recriação por rotação), então o estado do cofre reinicia nesse caso — não há
 * retenção via `ViewModel` nesta primeira versão. Aceitável para o MVP porque a orientação
 * suportada é portrait único (mesma política do host iOS).
 */
class ComposicaoCofreAndroid(activity: FragmentActivity) {
    private val context: Context = activity.applicationContext
    private val escopo = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    val autenticador = AutenticadorBiometricoAndroid(context)

    val gerenciadorCofre: GerenciadorCofre = run {
        val provedorChaveMestra = ProvedorChaveMestraAndroid(context)
        val repositorio = RepositorioItensPatrimoniaisRoom(context, provedorChaveMestra)
        val preferencias = PreferenciasCofreAndroid(context)
        GerenciadorCofre(
            provedorChaveMestra = provedorChaveMestra,
            repositorio = repositorio,
            autenticador = autenticador,
            preferencias = preferencias,
            relogio = RelogioDoSistemaAndroid,
            escopo = escopo,
        )
    }

    init {
        autenticador.vincularAtividade(activity)
    }
}
