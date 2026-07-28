import org.gradle.api.artifacts.ProjectDependency

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.android.library) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.multiplatform) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.compose.multiplatform) apply false
    alias(libs.plugins.ksp) apply false
}

/** Módulos compartilhados KMP verificados por source set. */
private val sharedModulePaths = listOf(
    ":shared:core:common",
    ":shared:core:model",
    ":shared:core:testing",
    ":shared:core:designsystem",
    ":shared:core:database",
    ":shared:core:security",
    ":shared:core:backup",
    ":shared:domain:patrimonio",
    ":shared:app",
)

/** Módulos sem UI, sem plataforma e sem infraestrutura, em nenhum source set. */
private val pureModulePaths = setOf(
    ":shared:core:common",
    ":shared:core:model",
    ":shared:core:testing",
    ":shared:domain:patrimonio",
)

private val allowedProductionDependencies = mapOf(
    ":androidApp" to setOf(":shared:app"),
    ":shared:app" to setOf(
        ":shared:core:common",
        ":shared:core:model",
        ":shared:core:designsystem",
        ":shared:core:database",
        ":shared:core:security",
        ":shared:core:backup",
        ":shared:domain:patrimonio",
    ),
    // (nota: ":shared:core:model" já estava na allowlist acima antes desta issue — só a
    // declaração em shared/app/build.gradle.kts estava faltando; ver #119)
    ":shared:core:common" to emptySet<String>(),
    ":shared:core:model" to emptySet<String>(),
    // :core:testing hospeda fakes/fixtures reutilizáveis (RepositorioItensPatrimoniaisContratoTeste
    // + FakeRepositorioItensPatrimoniais); precisa conhecer o contrato e o modelo que testa, mas
    // continua sem runtime de produção (Room, SQLCipher, Keystore, Keychain) — só o contrato KMP.
    ":shared:core:testing" to emptySet<String>(),
    ":shared:core:designsystem" to setOf(":shared:core:common"),
    ":shared:core:database" to setOf(
        ":shared:core:common",
        ":shared:core:model",
        ":shared:domain:patrimonio",
    ),
    ":shared:core:security" to setOf(
        ":shared:core:common",
        ":shared:core:model",
        ":shared:domain:patrimonio",
    ),
    // Backup/restauração/exportação (#121): conhece o contrato de persistência e o modelo, nunca a
    // engine física (Room/SQLCipher) nem o cofre local (Keystore/Keychain) — o material
    // criptográfico do aparelho jamais entra no arquivo `*.savrobackup`.
    ":shared:core:backup" to setOf(
        ":shared:core:common",
        ":shared:core:model",
        ":shared:domain:patrimonio",
    ),
    ":shared:domain:patrimonio" to setOf(":shared:core:common", ":shared:core:model"),
)

private val designSystemModulePath = "shared/core/designsystem"
private val canonicalDesignSystemTokenFiles = setOf(
    "$designSystemModulePath/src/commonMain/kotlin/io/savro/designsystem/tema/SavroTokens.kt",
    "$designSystemModulePath/src/commonMain/kotlin/io/savro/designsystem/tema/SavroTheme.kt",
)
private val canonicalDesignSystemPreviewFiles = setOf(
    "$designSystemModulePath/src/androidMain/kotlin/io/savro/designsystem/componentes/SavroComponentsPreview.kt",
)
private val forbiddenDesignSystemComponentLiterals = listOf(
    Regex("Color\\s*\\("),
    Regex("Color\\."),
    Regex("0x[0-9a-fA-F]+"),
    Regex("\\b\\d+(?:\\.\\d+)?\\.dp\\b"),
    Regex("\\b\\d+(?:\\.\\d+)?\\.sp\\b"),
    Regex("RoundedCornerShape\\s*\\("),
    Regex("FontWeight\\."),
    Regex("alpha\\s*=\\s*\\d"),
    Regex("\\.copy\\s*\\(.*alpha\\s*="),
    Regex("durationMillis\\s*=\\s*\\d"),
)

/** Source sets de produção inspecionados; source sets de teste ficam fora das regras de fronteira. */
private val productionSourceSets = listOf("commonMain", "androidMain", "iosMain")

/**
 * Compose Multiplatform reaproveita o pacote `androidx.compose.*`, por isso a proibição em
 * `commonMain` é enumerada em vez de bloquear `androidx.` inteiro.
 */
/**
 * MVP1 funciona 100% sem rede (#130, critério "inspeção de tráfego Android e iOS não encontra
 * dados patrimoniais" — o gate mais barato para isso é não permitir que um cliente de rede exista
 * em primeiro lugar). Nenhum módulo `:shared:*` declara hoje uma dependência de rede; esta lista
 * existe para que introduzir uma exija passar por revisão de arquitetura explícita (#124/#125,
 * `shared:core:network`), nunca "funcionou, então ficou".
 */
private val forbiddenNetworkReferences = listOf(
    "io.ktor.client.",
    "okhttp3.",
    "com.squareup.okhttp",
    "retrofit2.",
    "java.net.HttpURLConnection",
    "java.net.URLConnection",
    "javax.net.ssl.HttpsURLConnection",
)

private val forbiddenCommonMainReferences = listOf(
    "android.",
    "androidx.activity",
    "androidx.appcompat",
    "androidx.biometric",
    "androidx.core.",
    "androidx.lifecycle",
    "androidx.room",
    "androidx.sqlite",
    "androidx.work",
    "androidx.compose.ui.tooling.preview",
    "androidx.compose.ui.res.",
    "net.sqlcipher",
    "java.sql.",
    "platform.UIKit",
    "platform.Foundation",
    "platform.darwin",
    "platform.LocalAuthentication",
    "platform.Security",
    "kotlinx.cinterop",
) + forbiddenNetworkReferences

private val forbiddenIosMainReferences = listOf(
    "android.",
    "androidx.activity",
    "androidx.appcompat",
    "androidx.biometric",
    "androidx.core.",
    "androidx.room",
    "androidx.sqlite",
    "androidx.work",
    "net.sqlcipher",
    "platform.Foundation.NSURLSession",
    "platform.Foundation.NSURLConnection",
    "platform.Network.",
) + forbiddenNetworkReferences

private val forbiddenAndroidMainReferences = listOf(
    "platform.UIKit",
    "platform.Foundation",
    "platform.darwin",
    "platform.LocalAuthentication",
    "platform.Security",
    "kotlinx.cinterop",
) + forbiddenNetworkReferences

/** Módulos puros não conhecem UI, plataforma, banco, rede nem serialização, em nenhum source set. */
private val forbiddenPureSourceReferences = listOf(
    "android.",
    "androidx.",
    "net.sqlcipher.",
    "java.sql.",
    "kotlinx.serialization.",
    "okhttp.",
    "retrofit2.",
    "io.ktor.client.",
    "platform.UIKit",
    "platform.Foundation",
    "kotlinx.cinterop",
)

/** `:shared:app` só alcança Material 3 através dos componentes do design system. */
private val forbiddenSharedAppReferences = listOf(
    "androidx.compose.material3.",
    "androidx.compose.material.",
)

private val forbiddenPureDependencyGroups = listOf(
    "androidx.",
    "com.android.",
    "org.jetbrains.compose",
    "net.sqlcipher",
    "org.xerial",
    "com.squareup.",
    "io.ktor",
    "org.jetbrains.kotlinx:kotlinx-serialization",
)

tasks.register("verifyArchitecture") {
    group = "verification"
    description = "Verifica o grafo Gradle e as fronteiras de source set dos módulos compartilhados."

    doLast {
        val violations = mutableListOf<String>()

        rootProject.subprojects.forEach { project ->
            val isFeature = project.path.startsWith(":shared:feature:")
            val projectDependenciesByConfiguration = project.configurations
                .filter { it.isCanBeResolved || it.isCanBeDeclared }
                .associate { configuration ->
                    configuration.name to configuration.dependencies
                        .withType(ProjectDependency::class.java)
                        .map { it.path }
                        .toSet()
                }

            projectDependenciesByConfiguration.forEach { (configuration, dependencies) ->
                val isTestConfiguration = configuration.contains("test", ignoreCase = true)

                if (!isTestConfiguration && ":shared:core:testing" in dependencies) {
                    violations += "${project.path}:$configuration não pode colocar :shared:core:testing no runtime de produção"
                }

                if (project.path == ":shared:core:testing" && !isTestConfiguration && dependencies.isNotEmpty()) {
                    violations += ":shared:core:testing só pode declarar dependências de projeto em configurações de teste; " +
                        "encontrada em $configuration: ${dependencies.sorted()}"
                }

                if (!isTestConfiguration) {
                    val allowed = allowedProductionDependencies[project.path]
                    if (allowed != null) {
                        val unexpected = dependencies - allowed
                        if (unexpected.isNotEmpty()) {
                            violations += "${project.path}:$configuration depende de ${unexpected.sorted()}, fora da allowlist ${allowed.sorted()}"
                        }
                    }

                    if (project.path in pureModulePaths) {
                        val forbiddenExternalDependencies = project.configurations
                            .getByName(configuration)
                            .dependencies
                            .filter { dependency ->
                                val coordinate = listOfNotNull(dependency.group, dependency.name).joinToString(":")
                                forbiddenPureDependencyGroups.any { coordinate.startsWith(it) }
                            }
                            .map { dependency -> "${dependency.group}:${dependency.name}" }
                        if (forbiddenExternalDependencies.isNotEmpty()) {
                            violations += "${project.path}:$configuration declara dependências proibidas ${forbiddenExternalDependencies.sorted()}"
                        }
                    }
                }

                if (isFeature) {
                    val forbiddenFeatureDependencies = dependencies.filter {
                        it.startsWith(":shared:feature:") ||
                            it == ":shared:core:database" ||
                            it == ":shared:core:network"
                    }
                    if (forbiddenFeatureDependencies.isNotEmpty()) {
                        violations += "${project.path}:$configuration não pode depender de ${forbiddenFeatureDependencies.sorted()}"
                    }
                }
            }
        }

        sharedModulePaths.forEach { modulePath ->
            val module = project(modulePath)
            val isPure = modulePath in pureModulePaths

            productionSourceSets.forEach { sourceSet ->
                val forbiddenReferences = buildList {
                    when (sourceSet) {
                        "commonMain" -> addAll(forbiddenCommonMainReferences)
                        "androidMain" -> addAll(forbiddenAndroidMainReferences)
                        "iosMain" -> addAll(forbiddenIosMainReferences)
                    }
                    if (isPure) addAll(forbiddenPureSourceReferences)
                    if (modulePath == ":shared:app") addAll(forbiddenSharedAppReferences)
                }.distinct()

                module.fileTree("src/$sourceSet/kotlin") { include("**/*.kt") }.forEach { source ->
                    val content = source.readText()
                    forbiddenReferences.forEach { forbiddenReference ->
                        if (content.contains(forbiddenReference)) {
                            violations += "$modulePath/$sourceSet contém referência proibida " +
                                "'$forbiddenReference' em ${source.relativeTo(module.projectDir)}"
                        }
                    }
                }
            }
        }

        check(violations.isEmpty()) {
            "Fronteiras arquiteturais violadas:\n${violations.joinToString("\n") { "- $it" }}"
        }
    }
}

tasks.register("verifyDesignSystemTokens") {
    group = "verification"
    description = "Impede literais visuais em componentes do design system Savro."

    doLast {
        val violations = productionSourceSets.flatMap { sourceSet ->
            val sourceDirectory = rootProject.file("$designSystemModulePath/src/$sourceSet/kotlin")
            if (!sourceDirectory.exists()) {
                emptyList()
            } else {
                sourceDirectory.walkTopDown()
                    .filter { file ->
                        val relativePath = file.relativeTo(rootProject.projectDir).invariantSeparatorsPath
                        file.isFile &&
                            file.extension == "kt" &&
                            relativePath !in canonicalDesignSystemTokenFiles &&
                            relativePath !in canonicalDesignSystemPreviewFiles
                    }
                    .flatMap { file ->
                        file.readLines().mapIndexedNotNull { index, line ->
                            if (forbiddenDesignSystemComponentLiterals.any { it.containsMatchIn(line) }) {
                                "${file.relativeTo(rootProject.projectDir)}:${index + 1}: $line"
                            } else {
                                null
                            }
                        }
                    }
                    .toList()
            }
        }

        check(violations.isEmpty()) {
            "Componentes do design system não podem conter literais visuais:\n${violations.joinToString("\n") { "- $it" }}"
        }
    }
}

/** Referências de rede em Swift — nomes das APIs nativas da Apple, não pacotes Kotlin. */
private val forbiddenIosAppNetworkReferences = listOf(
    "URLSession",
    "NSURLSession",
    "NSURLConnection",
    "CFNetwork",
    "Alamofire",
    "dataTask(with:",
)

tasks.register("verifyNoNetworkAccess") {
    group = "verification"
    description = "Falha se surgir cliente de rede em :androidApp ou no host iOS (#130 — MVP1 é 100% offline)."

    doLast {
        val violations = mutableListOf<String>()

        val androidAppMain = rootProject.file("androidApp/src/main/kotlin")
        if (androidAppMain.exists()) {
            androidAppMain.walkTopDown().filter { it.isFile && it.extension == "kt" }.forEach { source ->
                val content = source.readText()
                forbiddenNetworkReferences.forEach { forbiddenReference ->
                    if (content.contains(forbiddenReference)) {
                        violations += ":androidApp contém referência de rede proibida " +
                            "'$forbiddenReference' em ${source.relativeTo(rootProject.projectDir)}"
                    }
                }
            }
        }

        val iosAppSources = rootProject.file("iosApp/iosApp")
        if (iosAppSources.exists()) {
            iosAppSources.walkTopDown().filter { it.isFile && it.extension == "swift" }.forEach { source ->
                val content = source.readText()
                forbiddenIosAppNetworkReferences.forEach { forbiddenReference ->
                    if (content.contains(forbiddenReference)) {
                        violations += ":iosApp contém referência de rede proibida " +
                            "'$forbiddenReference' em ${source.relativeTo(rootProject.projectDir)}"
                    }
                }
            }
        }

        check(violations.isEmpty()) {
            "Rede detectada fora do escopo aprovado do MVP1 (ver documentacao/arquitetura/seguranca/" +
                "auditoria-rede-savro.md):\n${violations.joinToString("\n") { "- $it" }}"
        }
    }
}

tasks.register("check") {
    group = "verification"
    description = "Executa as verificações arquiteturais do projeto Savro."
    dependsOn(tasks.named("verifyArchitecture"))
    dependsOn(tasks.named("verifyDesignSystemTokens"))
    dependsOn(tasks.named("verifyNoNetworkAccess"))
}
