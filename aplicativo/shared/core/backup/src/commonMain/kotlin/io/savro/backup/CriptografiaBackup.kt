package io.savro.backup

/**
 * Única fronteira criptográfica do backup (#121). Nenhuma primitiva é implementada aqui nem nas
 * implementações de plataforma: cada `actual` só chama a biblioteca criptográfica auditada do
 * sistema operacional — JCA/Conscrypt(BoringSSL) no Android, CommonCrypto no iOS. O Savro não
 * escreve AES, GCM nem PBKDF2 em linha nenhuma.
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

    /** PBKDF2-HMAC-SHA1 (RFC 8018). [senhaAscii] já vem codificada conforme documentado acima. */
    fun derivarChave(senhaAscii: String, salt: ByteArray, iteracoes: Int, tamanhoBytes: Int): ByteArray

    /** AES-256-GCM. Devolve `cifra || tag(16)`. */
    fun cifrar(chave: ByteArray, nonce: ByteArray, dadosAutenticados: ByteArray, texto: ByteArray): ByteArray

    /**
     * AES-256-GCM. Devolve o texto claro, ou `null` quando a tag não confere — senha errada,
     * cabeçalho adulterado, corpo adulterado e corpo truncado caem todos neste mesmo `null`, de
     * propósito (ver [ErroBackup]).
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
