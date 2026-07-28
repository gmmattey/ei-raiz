package io.savro.backup

/**
 * Única fronteira criptográfica do backup (#121). Nenhuma primitiva é implementada aqui nem nas
 * implementações de plataforma: cada `actual` só chama bibliotecas/APIs criptográficas públicas e
 * auditadas do sistema operacional — JCA/Conscrypt(BoringSSL) + Bouncy Castle (KDF) no Android,
 * CommonCrypto público no iOS. O Savro não escreve AES, HMAC nem PBKDF2 em linha nenhuma.
 *
 * **Construção *encrypt-then-MAC*, não GCM.** O binding padrão do Kotlin/Native para CommonCrypto
 * não expõe modo GCM (`kCCModeGCM`/`CCCryptorGCM*` são SPI privada da Apple, `CommonCryptorSPI.h`,
 * fora do module map público) — usar essa SPI foi avaliado e rejeitado (ver histórico do PR #228).
 * A cifra é **AES-256-CTR + HMAC-SHA256** com duas subchaves distintas derivadas do mesmo KDF
 * (ver [FormatoBackup.TAMANHO_CHAVE]): `chave[0..31]` cifra, `chave[32..63]` autentica. Nunca a
 * mesma subchave para as duas coisas. Detalhe completo em `formato-savrobackup.md` §3.2.
 *
 * **Codificação da senha (regra do formato, não detalhe de implementação):** a senha do usuário
 * chega aqui já convertida para uma *string hexadecimal ASCII minúscula dos seus bytes UTF-8*
 * (ver [CodificadorSenha]). Isso existe por um motivo concreto de interoperabilidade: os
 * provedores de PBKDF2 discordam sobre como transformar `char[]` em bytes — o Bouncy Castle do
 * Android usa truncamento de 8 bits, Conscrypt e CommonCrypto usam UTF-8. Para senha com acento,
 * "o mesmo backup" derivaria chaves diferentes conforme a versão de Android ou a plataforma.
 * Passando só ASCII, todos os provedores concordam byte a byte.
 */
internal expect object CriptografiaBackup {

    /** Bytes do gerador seguro do sistema (`SecureRandom` / `SecRandomCopyBytes`). */
    fun bytesAleatorios(quantidade: Int): ByteArray

    /**
     * PBKDF2-HMAC-SHA256 (RFC 8018). [senhaAscii] já vem codificada conforme documentado acima.
     * [tamanhoBytes] é sempre [FormatoBackup.TAMANHO_CHAVE] (64 = chave de cifra + chave de MAC).
     */
    fun derivarChave(senhaAscii: String, salt: ByteArray, iteracoes: Int, tamanhoBytes: Int): ByteArray

    /**
     * *Encrypt-then-MAC*: AES-256-CTR(chave[0..31], nonce, texto), depois
     * HMAC-SHA256(chave[32..63], dadosAutenticados || ciphertext). Devolve `ciphertext || tag(32)`.
     */
    fun cifrar(chave: ByteArray, nonce: ByteArray, dadosAutenticados: ByteArray, texto: ByteArray): ByteArray

    /**
     * Verifica a tag HMAC-SHA256 **antes** de decifrar (verify-then-decrypt) em tempo constante, e
     * só então roda AES-256-CTR. Devolve o texto claro, ou `null` quando a tag não confere — senha
     * errada, cabeçalho adulterado, corpo adulterado e corpo truncado caem todos neste mesmo
     * `null`, de propósito (ver [ErroBackup]).
     */
    fun decifrar(chave: ByteArray, nonce: ByteArray, dadosAutenticados: ByteArray, cifra: ByteArray): ByteArray?
}

/** Conversão senha -> ASCII hexadecimal dos bytes UTF-8. Ver o motivo em [CriptografiaBackup]. */
internal object CodificadorSenha {
    private const val DIGITOS = "0123456789abcdef"

    fun paraAsciiHex(senha: String): String {
        val bytes = senha.encodeToByteArray()
        val saida = StringBuilder(bytes.size * 2)
        bytes.forEach { valor ->
            val inteiro = valor.toInt() and 0xFF
            saida.append(DIGITOS[inteiro shr 4])
            saida.append(DIGITOS[inteiro and 0xF])
        }
        return saida.toString()
    }
}
