plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.android.library)
}

kotlin {
    jvmToolchain(17)

    // `CriptografiaBackup` é `expect object` (fronteira criptográfica única, sem estado). O aviso
    // de "Beta" para expect/actual de classes/objetos é conhecido e não indica risco aqui.
    compilerOptions {
        freeCompilerArgs.add("-Xexpect-actual-classes")
    }

    androidTarget()
    iosArm64()
    iosSimulatorArm64()

    sourceSets {
        commonMain.dependencies {
            implementation(project(":shared:core:common"))
            implementation(project(":shared:core:model"))
            implementation(project(":shared:domain:patrimonio"))
            implementation(libs.kotlinx.coroutines.core)
        }
        commonTest.dependencies {
            implementation(kotlin("test"))
            implementation(libs.kotlinx.coroutines.test)
        }
        androidMain.dependencies {
            // ActivityResultContracts (SAF: ACTION_CREATE_DOCUMENT / ACTION_OPEN_DOCUMENT).
            implementation(libs.androidx.activity)
            implementation(libs.kotlinx.coroutines.android)
            // PBKDF2-HMAC-SHA256 (PR #228): só a API leve de PKCS5S2ParametersGenerator, nunca
            // Security.addProvider — ver docstring de CriptografiaBackup.android.kt.
            implementation(libs.bouncycastle.provider)
        }
        val androidUnitTest by getting {
            dependencies {
                implementation(libs.robolectric)
                implementation(libs.androidx.junit)
            }
        }
    }
}

android {
    namespace = "io.savro.backup"
    compileSdk = 36

    defaultConfig {
        minSdk = 23
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    testOptions {
        unitTests.isIncludeAndroidResources = true
        unitTests.isReturnDefaultValues = true
    }
}
