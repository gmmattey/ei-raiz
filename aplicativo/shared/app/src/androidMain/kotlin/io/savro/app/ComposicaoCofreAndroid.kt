package io.savro.app

import android.content.Context
import androidx.fragment.app.FragmentActivity
import io.savro.backup.AreaTemporariaBackupAndroid
import io.savro.backup.ArquivosDoSistemaAndroid
import io.savro.backup.ServicoBackup
import io.savro.database.EsquemaSavro
import io.savro.database.ProvedorChaveMestraAndroid
import io.savro.database.RelogioDoSistemaAndroid
import io.savro.database.RepositorioItensPatrimoniaisRoom
import io.savro.domain.patrimonio.ServicoPatrimonio
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

    private val preferenciasCofre = PreferenciasCofreAndroid(context)

    private val provedorChaveMestra = ProvedorChaveMestraAndroid(context)
    private val repositorio = RepositorioItensPatrimoniaisRoom(context, provedorChaveMestra)

    val gerenciadorCofre: GerenciadorCofre = GerenciadorCofre(
        provedorChaveMestra = provedorChaveMestra,
        repositorio = repositorio,
        autenticador = autenticador,
        preferencias = preferenciasCofre,
        relogio = RelogioDoSistemaAndroid,
        escopo = escopo,
    )

    /** Cadastro manual de patrimônio (issue #119) — mesma conexão de banco do [gerenciadorCofre]. */
    val servicoPatrimonio = ServicoPatrimonio(repositorio, RelogioDoSistemaAndroid)

    /**
     * Backup, restauração e exportação (issue #121) — mesma conexão de banco, e o Storage Access
     * Framework ligado a esta Activity (os launchers precisam ser registrados ainda no `onCreate`).
     */
    val servicoBackup = ServicoBackup(
        repositorio = repositorio,
        preferencias = PreferenciasRestauraveisDoCofre(preferenciasCofre),
        arquivos = ArquivosDoSistemaAndroid(activity),
        areaTemporaria = AreaTemporariaBackupAndroid(context),
        relogio = RelogioDoSistemaAndroid,
        versaoEsquemaAtual = EsquemaSavro.VERSAO_ATUAL,
    )

    init {
        autenticador.vincularAtividade(activity)
    }
}
