package io.savro.testing

import java.nio.file.Path
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Gate de regressão do inventário de dependências (#130, critério de aceite "dependências possuem
 * inventário... testes impedem regressão"). Lê o catálogo de versões real (`gradle/libs.versions.toml`)
 * e falha se aparecer uma chave em `[libraries]` que não está espelhada em [BIBLIOTECAS_REGISTRADAS]
 * — a mesma lista documentada, com finalidade/licença/dados acessados, em
 * `documentacao/arquitetura/seguranca/inventario-dependencias-savro.md`.
 *
 * Adicionar uma dependência nova exige três passos: (1) declarar em `libs.versions.toml`,
 * (2) adicionar a mesma chave em [BIBLIOTECAS_REGISTRADAS], (3) documentar finalidade, versão,
 * licença, dados acessados e justificativa no inventário. Pular o passo 2 quebra este teste. Pular
 * o passo 3 não quebra nada automaticamente — é uma lacuna honesta do gate, registrada no próprio
 * documento de inventário.
 */
class VerifyDependencyInventoryTest {

    @Test
    fun nenhumaBibliotecaNovaEntraSemAtualizarOInventarioDeDependencias() {
        val raiz = Path.of(requireNotNull(System.getProperty("savro.projeto.raiz")))
        val catalogo = raiz.resolve("gradle/libs.versions.toml").toFile().readText()

        val chavesDeclaradas = extrairChavesDeBibliotecas(catalogo)
        val naoRegistradas = chavesDeclaradas - BIBLIOTECAS_REGISTRADAS

        assertTrue(
            "Biblioteca(s) declarada(s) em gradle/libs.versions.toml sem registro no inventário de " +
                "dependências (documentacao/arquitetura/seguranca/inventario-dependencias-savro.md): " +
                "$naoRegistradas. Documente finalidade/licença/dados acessados e adicione a chave em " +
                "VerifyDependencyInventoryTest.BIBLIOTECAS_REGISTRADAS antes de prosseguir.",
            naoRegistradas.isEmpty(),
        )
    }

    private fun extrairChavesDeBibliotecas(catalogo: String): Set<String> {
        val secaoLibraries = catalogo
            .substringAfter("[libraries]", missingDelimiterValue = "")
            .substringBefore("[plugins]")
        return Regex("""^([A-Za-z0-9_-]+)\s*=""", RegexOption.MULTILINE)
            .findAll(secaoLibraries)
            .map { it.groupValues[1] }
            .toSet()
    }

    private companion object {
        // Espelha exatamente as chaves de [libraries] em gradle/libs.versions.toml, documentadas em
        // inventario-dependencias-savro.md — mantenha as duas listas em sincronia.
        val BIBLIOTECAS_REGISTRADAS = setOf(
            "compose-runtime",
            "compose-foundation",
            "compose-ui",
            "compose-ui-backhandler",
            "compose-material3",
            "compose-material-icons-extended",
            "compose-components-resources",
            "compose-ui-test",
            "robolectric",
            "androidx-activity-compose",
            "androidx-compose-bom",
            "androidx-compose-ui-tooling",
            "androidx-compose-ui-tooling-preview",
            "androidx-compose-ui-test-junit4",
            "androidx-compose-ui-test-manifest",
            "junit",
            "androidx-junit",
            "androidx-espresso-core",
            "androidx-room-runtime",
            "androidx-room-ktx",
            "androidx-room-compiler",
            "androidx-room-testing",
            "androidx-sqlite",
            "sqlcipher-android",
            "kotlinx-coroutines-core",
            "kotlinx-coroutines-test",
            "kotlinx-coroutines-android",
            "androidx-biometric",
            "androidx-activity",
            "bouncycastle-provider",
        )
    }
}
