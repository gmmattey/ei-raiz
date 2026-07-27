pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

plugins {
    // Auto-provisiona o JDK do toolchain (17) quando não houver instalação local compatível.
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "savro"

include(":shared:core:common")
include(":shared:core:model")
include(":shared:core:testing")
include(":shared:core:designsystem")
include(":shared:core:database")
include(":shared:core:security")
include(":shared:domain:patrimonio")
include(":shared:app")
include(":androidApp")

// :iosApp é projeto Xcode e fica fora do grafo Gradle (ADR-002); consome o framework
// produzido por :shared:app via embedAndSignAppleFrameworkForXcode.
