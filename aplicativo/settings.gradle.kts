pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
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
include(":shared:domain:patrimonio")
include(":shared:app")
include(":androidApp")

// :iosApp é projeto Xcode e fica fora do grafo Gradle (ADR-002); consome o framework
// produzido por :shared:app via embedAndSignAppleFrameworkForXcode.
