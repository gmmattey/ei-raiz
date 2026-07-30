plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.android.library)
    alias(libs.plugins.ksp)
    id("org.jetbrains.kotlin.native.cocoapods")
}

kotlin {
    jvmToolchain(17)

    androidTarget()
    iosArm64()
    iosSimulatorArm64()

    // Decisão de biblioteca (#180, ver documentacao/arquitetura/validacoes/117-O-decisao-persistencia-180.md):
    // Android usa Room 2.8.4 + SQLCipher (net.zetetic:sqlcipher-android 4.17.0), engine Android-only
    // (SupportOpenHelperFactory não existe para Kotlin/Native). iOS usa SQLCipher nativo via
    // CocoaPods + cinterop, com DAO escrito à mão sobre a API C do SQLite/SQLCipher — Room não tem
    // driver KMP com suporte a SQLCipher no iOS. Cinterop com pods não compila em host não-mac
    // (mingw_x64/Linux); ver `kotlin.native.ignoreDisabledTargets=true` em gradle.properties e o
    // comentário no job `ios-compilacao-linux` do workflow de CI.
    cocoapods {
        version = "0.0.1"
        summary = "Persistência cifrada do cofre Savro (schema comum + engine SQLCipher no iOS)"
        homepage = "https://savro.app"
        ios.deploymentTarget = "16.0"

        pod("SQLCipher") {
            version = "4.9.0"
        }
    }

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
            implementation(libs.androidx.room.runtime)
            implementation(libs.androidx.room.ktx)
            implementation(libs.androidx.sqlite)
            implementation(libs.sqlcipher.android)
            implementation(libs.kotlinx.coroutines.android)
        }
        val androidUnitTest by getting {
            dependencies {
                implementation(libs.androidx.room.testing)
                implementation(libs.robolectric)
                implementation(libs.androidx.junit)
            }
        }
        val androidInstrumentedTest by getting {
            // Não é automático em KMP: sem isso, androidInstrumentedTest não enxerga
            // `RepositorioItensPatrimoniaisContratoTeste`/`FakeProvedorChaveMestra` (commonTest) —
            // é exatamente esse contrato comum, rodando contra a fábrica SQLCipher real (default de
            // RepositorioItensPatrimoniaisRoom, sem troca por FrameworkSQLiteOpenHelperFactory),
            // que fecha a lacuna da #247 (nunca existia teste real de device pra esse caminho).
            dependsOn(commonTest.get())
            dependencies {
                implementation(libs.androidx.junit)
                implementation(libs.androidx.test.runner)
            }
        }
    }
}

android {
    namespace = "io.savro.database"
    compileSdk = 36

    defaultConfig {
        minSdk = 23
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
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

dependencies {
    add("kspAndroid", libs.androidx.room.compiler)
    // "test (Android)" = androidUnitTest (JVM/Robolectric) — precisa do processor pra gerar o
    // *_Impl do banco Room v1 usado só em RoomMigrationTest.
    add("kspAndroidTest", libs.androidx.room.compiler)
    // "androidTest (Android)" = androidInstrumentedTest (device/emulador real) — mantém o
    // processor disponível mesmo que nenhum teste instrumentado rode nesta sessão/CI.
    add("kspAndroidAndroidTest", libs.androidx.room.compiler)
}

ksp {
    // Schemas versionados exportados para teste de migration real (MigrationTestHelper) — ver
    // RoomMigrationInstrumentedTest / RoomMigrationTest.
    arg("room.schemaLocation", "$projectDir/schemas")
    arg("room.generateKotlin", "true")
}
