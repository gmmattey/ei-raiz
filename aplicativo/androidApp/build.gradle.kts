import java.util.Base64

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

// Assinatura de upload (#241): nunca versionada. As variáveis vêm do ambiente (CI) ou de
// gradle.properties local (fora do controle de versão, ver .gitignore). Sem elas, o buildType
// release simplesmente não recebe signingConfig — falha explícita do Gradle no bundleRelease em
// vez de assinar silenciosamente com uma chave de debug.
val uploadKeystorePath: String? = System.getenv("SAVRO_UPLOAD_KEYSTORE_PATH")
val uploadKeystoreBase64: String? = System.getenv("SAVRO_UPLOAD_KEYSTORE_BASE64")
val uploadStorePassword: String? = System.getenv("SAVRO_UPLOAD_STORE_PASSWORD")
val uploadKeyAlias: String? = System.getenv("SAVRO_UPLOAD_KEY_ALIAS")
val uploadKeyPassword: String? = System.getenv("SAVRO_UPLOAD_KEY_PASSWORD")

// Reconstrói o keystore em um arquivo temporário quando só o base64 está disponível (CI). O
// workflow que injeta SAVRO_UPLOAD_KEYSTORE_BASE64 é responsável por apagar esse arquivo depois
// (rm -f com `if: always()`), não este build script.
val resolvedUploadKeystoreFile: File? = when {
    uploadKeystorePath != null -> file(uploadKeystorePath)
    uploadKeystoreBase64 != null -> {
        val decoded = Base64.getDecoder().decode(uploadKeystoreBase64)
        File.createTempFile("savro-upload-keystore-", ".jks").apply {
            writeBytes(decoded)
            deleteOnExit()
        }
    }
    else -> null
}

val uploadSigningAvailable =
    resolvedUploadKeystoreFile != null &&
        uploadStorePassword != null &&
        uploadKeyAlias != null &&
        uploadKeyPassword != null

android {
    namespace = "io.savro.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "io.savro.app"
        minSdk = 23
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    flavorDimensions += "environment"
    productFlavors {
        create("dev") {
            dimension = "environment"
        }
    }

    if (uploadSigningAvailable) {
        signingConfigs {
            create("upload") {
                storeFile = resolvedUploadKeystoreFile
                storePassword = uploadStorePassword
                keyAlias = uploadKeyAlias
                keyPassword = uploadKeyPassword
            }
        }
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".dev"
            versionNameSuffix = "-dev"
        }
        release {
            isMinifyEnabled = false
            isDebuggable = false
            if (uploadSigningAvailable) {
                signingConfig = signingConfigs.getByName("upload")
            }
        }
    }

    buildFeatures {
        buildConfig = true
        compose = true
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

kotlin {
    jvmToolchain(17)
}

dependencies {
    implementation(project(":shared:app"))
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.compose.ui.tooling.preview)
    // FragmentActivity (BiometricPrompt exige) — mesma dependência já usada por :shared:app.
    implementation(libs.androidx.biometric)
    debugImplementation(libs.androidx.compose.ui.tooling)

    testImplementation(libs.junit)
    testImplementation(libs.robolectric)
    testImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
}
