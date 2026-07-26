import org.gradle.api.artifacts.ProjectDependency

plugins {
    alias(libs.plugins.android.application) apply false
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
    ":app" to emptySet<String>(),
    ":core:common" to emptySet<String>(),
    ":core:model" to emptySet<String>(),
    ":core:testing" to emptySet<String>(),
    ":domain:patrimonio" to setOf(":core:common", ":core:model"),
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

tasks.register("check") {
    group = "verification"
    description = "Executa as verificações arquiteturais do projeto Android."
    dependsOn(tasks.named("verifyArchitecture"))
}
