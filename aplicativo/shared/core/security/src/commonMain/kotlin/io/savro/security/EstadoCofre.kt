package io.savro.security

/**
 * Máquina de estados do cofre local (#118) — os 8 estados obrigatórios definidos pela issue e pela
 * ADR-002 ("Estratégia para Keystore, Keychain e LocalAuthentication"). 100% comum, testável em
 * `commonTest` sem tocar Keystore/Keychain reais (ver [GerenciadorCofre]).
 */
sealed class EstadoCofre {

    /** Tentando obter a chave mestra e abrir o banco físico — inclui aguardar o prompt biométrico. */
    data object Descriptografando : EstadoCofre()

    /** Cofre aberto; patrimônio pode ser exibido. */
    data object Desbloqueado : EstadoCofre()

    /** Biometria/credencial rejeitada pelo sistema nesta tentativa — usuário pode tentar de novo. */
    data class CredencialInvalida(val motivo: String) : EstadoCofre()

    /** Nenhuma biometria/credencial de dispositivo configurada ou disponível para autenticar. */
    data object BiometriaIndisponivel : EstadoCofre()

    /** Sistema recusa novas tentativas até [tentarNovamenteEmEpocaMs] (sinal nativo, não contagem própria). */
    data class BloqueioTemporario(val tentarNovamenteEmEpocaMs: Long) : EstadoCofre()

    /**
     * A chave mestra acabou de ser detectada como permanentemente inválida (biometria do aparelho
     * mudou, Keystore/Keychain foi limpo). O banco físico permanece intacto — nunca é apagado nem
     * recriado. Estado transitório: a UI reconhece a mensagem e o cofre passa a
     * [RestauracaoNecessaria].
     */
    data class ChaveInvalidada(val motivo: String) : EstadoCofre()

    /**
     * Estado de repouso após uma chave invalidada já reconhecida: sem restaurar um
     * `*.savrobackup` válido (#121, fora de escopo aqui), não há caminho de volta — nunca se tenta
     * recuperar via servidor, nunca se apaga/recria o banco silenciosamente.
     */
    data object RestauracaoNecessaria : EstadoCofre()

    /** Falha de infraestrutura não relacionada a chave/biometria (I/O, transação) — pode tentar de novo. */
    data class ErroRecuperavel(val motivo: String) : EstadoCofre()
}
