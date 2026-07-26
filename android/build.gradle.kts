import org.gradle.api.artifacts.ProjectDependency

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.android.library) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.kotlin.jvm) apply false
}

private val pureModulePaths = setOf(
    ":core:common",
    ":core:model",
    ":core:testing",
    ":domain:patrimonio",
)

private val allowedProductionDependencies = mapOf(
    ":app" to setOf(":core:designsystem"),
    ":core:common" to emptySet<String>(),
    ":core:model" to emptySet<String>(),
    ":core:testing" to emptySet<String>(),
    ":core:designsystem" to emptySet<String>(),
    ":domain:patrimonio" to setOf(":core:common", ":core:model"),
)

private val designSystemSourceDirectory = "core/designsystem/src/main"
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

private val forbiddenPureSourceReferences = listOf(
    "android.",
    "androidx.compose.",
    "androidx.room.",
    "androidx.sqlite.",
    "net.sqlcipher.",
    "java.sql.",
    "kotlinx.serialization.",
    "okhttp.",
    "retrofit2.",
    "io.ktor.client.",
)

private val forbiddenPureDependencyGroups = listOf(
    "androidx.",
    "com.android.",
    "net.sqlcipher",
    "org.xerial",
    "com.squareup.",
    "io.ktor",
    "org.jetbrains.kotlinx:kotlinx-serialization",
)

tasks.register("verifyArchitecture") {
    group = "verification"
    description = "Verifica o grafo Gradle e as fronteiras dos módulos Android puros."

    doLast {
        val violations = mutableListOf<String>()

        rootProject.subprojects.forEach { project ->
            val isFeature = project.path.startsWith(":feature:")
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

                if (!isTestConfiguration && ":core:testing" in dependencies) {
                    violations += "${project.path}:$configuration não pode colocar :core:testing no runtime de produção"
                }

                if (project.path == ":core:testing" && !isTestConfiguration && dependencies.isNotEmpty()) {
                    violations += ":core:testing só pode declarar dependências de projeto em configurações de teste; " +
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
                        it.startsWith(":feature:") || it == ":core:database" || it == ":core:network"
                    }
                    if (forbiddenFeatureDependencies.isNotEmpty()) {
                        violations += "${project.path}:$configuration não pode depender de ${forbiddenFeatureDependencies.sorted()}"
                    }
                }
            }
        }

        pureModulePaths.forEach { modulePath ->
            val project = project(modulePath)
            val kotlinSources = project.fileTree("src/main") {
                include("**/*.kt")
            }

            kotlinSources.forEach { source ->
                val content = source.readText()
                forbiddenPureSourceReferences.forEach { forbiddenReference ->
                    if (content.contains(forbiddenReference)) {
                        violations += "$modulePath contém referência proibida '$forbiddenReference' em ${source.relativeTo(project.projectDir)}"
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
        val sourceDirectory = rootProject.file(designSystemSourceDirectory)
        if (!sourceDirectory.exists()) return@doLast

        val violations = sourceDirectory.walkTopDown()
            .filter { file ->
                file.isFile &&
                    file.extension == "kt" &&
                    !file.invariantSeparatorsPath.contains("/tema/") &&
                    !file.name.endsWith("Preview.kt")
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

        check(violations.isEmpty()) {
            "Componentes do design system não podem conter literais visuais:\n${violations.joinToString("\n") { "- $it" }}"
        }
    }
}

tasks.register("check") {
    group = "verification"
    description = "Executa as verificações arquiteturais do projeto Android."
    dependsOn(tasks.named("verifyArchitecture"))
    dependsOn(tasks.named("verifyDesignSystemTokens"))
}
