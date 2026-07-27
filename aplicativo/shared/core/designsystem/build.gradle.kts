plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.android.library)
    alias(libs.plugins.compose.multiplatform)
    alias(libs.plugins.kotlin.compose)
}

kotlin {
    jvmToolchain(17)

    // expect/actual class (ComposeUiTestBase, ponte de teste comum ↔ Robolectric/XCTest) ainda é
    // Beta na 2.3.10; suprime o aviso em vez de reintroduzir duplicação por plataforma.
    compilerOptions {
        freeCompilerArgs.add("-Xexpect-actual-classes")
    }

    androidTarget()
    iosArm64()
    iosSimulatorArm64()

    sourceSets {
        commonMain.dependencies {
            // Runtime, foundation e ui são API porque aparecem na assinatura dos componentes.
            api(libs.compose.runtime)
            api(libs.compose.foundation)
            api(libs.compose.ui)
            // Material 3 fica em implementation de propósito: consumidores só chegam nele através
            // dos componentes Savro (fronteira da ADR-002).
            implementation(libs.compose.material3)
            implementation(libs.compose.components.resources)
        }
        commonTest.dependencies {
            implementation(kotlin("test"))
            implementation(libs.compose.ui.test)
        }
        androidUnitTest.dependencies {
            implementation(libs.robolectric)
        }
    }
}

compose.resources {
    publicResClass = false
    packageOfResClass = "io.savro.designsystem.recursos"
    generateResClass = always
}

android {
    namespace = "io.savro.designsystem"
    compileSdk = 36

    defaultConfig {
        minSdk = 23
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    // `runComposeUiTest` (commonTest) roda no target Android via Robolectric, sem device/emulador.
    testOptions {
        unitTests.isIncludeAndroidResources = true
    }
}

// `ui-test-manifest` (activity host do Compose UI Test) é debug-only de propósito — não deve
// vazar para o manifest de release. Sem ela, o variant de release não tem como hospedar
// `runComposeUiTest`; desabilita só o unit test de release, o de debug já cobre o mesmo código.
androidComponents {
    beforeVariants(selector().withBuildType("release")) { variant ->
        variant.enableUnitTest = false
    }
}

// Ferramentas de preview e teste instrumentado são específicas do target Android.
dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui.tooling.preview)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    androidTestImplementation(libs.androidx.junit)
}
