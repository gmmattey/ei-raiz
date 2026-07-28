package io.savro.backup

/**
 * Falhas possíveis de backup, restauração e exportação (#121).
 *
 * Regra de ouro do formato: **tudo que só se descobre depois de tentar decifrar vira
 * [ArquivoInvalido]** — senha errada, byte adulterado, arquivo truncado no meio do corpo e
 * conteúdo interno inconsistente são indistinguíveis para quem chama e para quem lê a tela. Isso
 * é deliberado: revelar "a senha está errada, mas o arquivo está íntegro" transforma o arquivo em
 * oráculo de senha para quem o roubou.
 *
 * [VersaoFormatoIncompativel] e [EsquemaIncompativel] são exceções conscientes e seguras: essas
 * informações estão no cabeçalho em texto claro, não dependem da senha e não dizem nada sobre o
 * conteúdo — sem elas o usuário ficaria sem saber que precisa atualizar o app.
 */
sealed class ErroBackup {

    /** Arquivo não é um backup válido para esta senha. Não detalha o motivo, por segurança. */
    data object ArquivoInvalido : ErroBackup()

    /** Cabeçalho legível, mas gerado por uma versão de formato que este app não conhece. */
    data class VersaoFormatoIncompativel(val versaoDoArquivo: Int, val versaoSuportada: Int) : ErroBackup()

    /** Backup de um schema mais novo que o do app instalado — restaurar perderia dados. */
    data class EsquemaIncompativel(val versaoDoArquivo: Int, val versaoSuportada: Int) : ErroBackup()

    /** Senha escolhida não atende ao mínimo exigido na criação do backup. */
    data object SenhaFraca : ErroBackup()

    /**
     * `iteracoesKdf` passado para [CodecArquivoBackup.gerar] está fora do intervalo aceito (< 1 ou
     * acima de [FormatoBackup.ITERACOES_MAXIMAS_ACEITAS]). Diferente de [ArquivoInvalido], não é
     * sobre um arquivo lido de fora: é defesa em profundidade num parâmetro de **geração** — hoje
     * só o próprio app chama `gerar()` com esse valor (não há entrada de usuário direta nele), mas
     * o contrato do codec não deveria depender só de quem chama se comportar.
     */
    data class IteracoesKdfInvalidas(val solicitadas: Int) : ErroBackup()

    /** Falha ao ler ou escrever no cofre local (não é problema do arquivo de backup). */
    data class FalhaDeCofre(val detalhe: String) : ErroBackup()

    /** Falha de I/O ou do seletor nativo de arquivos da plataforma. */
    data class FalhaDeArquivo(val detalhe: String) : ErroBackup()

    /** Usuário fechou o seletor nativo sem escolher — não é erro, mas encerra o fluxo. */
    data object CanceladoPeloUsuario : ErroBackup()
}
