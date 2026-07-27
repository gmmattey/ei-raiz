plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.android.library)
    alias(libs.plugins.compose.multiplatform)
    alias(libs.plugins.kotlin.compose)
}

kotlin {
    jvmToolchain(17)

    androidTarget()

    listOf(iosArm64(), iosSimulatorArm64()).forEach { iosTarget ->
        iosTarget.binaries.framework {
            baseName = "SavroApp"
            isStatic = true
        }
    }

    sourceSets {
        commonMain.dependencies {
            api(project(":shared:core:designsystem"))
            implementation(project(":shared:core:common"))
            implementation(project(":shared:core:database"))
            // api (não implementation): :androidApp precisa enxergar `GerenciadorCofre` e
            // `AutenticadorBiometricoAndroid` para o wiring de ciclo de vida (vincular Activity ao
            // BiometricPrompt, notificar background/foreground) — inevitável porque `BiometricPrompt`
            // exige uma referência de Activity viva, diferente do Keychain/LAContext do iOS.
            api(project(":shared:core:security"))
            implementation(project(":shared:domain:patrimonio"))
            implementation(libs.compose.runtime)
            implementation(libs.compose.foundation)
            implementation(libs.compose.components.resources)
            implementation(libs.kotlinx.coroutines.core)
        }
        commonTest.dependencies {
            implementation(kotlin("test"))
        }
        androidMain.dependencies {
            implementation(libs.androidx.biometric)
        }
    }
}

compose.resources {
    publicResClass = false
    packageOfResClass = "io.savro.app.recursos"
    generateResClass = always
}

android {
    namespace = "io.savro.app.shared"
    compileSdk = 36

    defaultConfig {
        minSdk = 23
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
