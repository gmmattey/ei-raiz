import org.gradle.api.tasks.testing.Test

plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.android.library)
}

kotlin {
    jvmToolchain(17)

    androidTarget()
    iosArm64()
    iosSimulatorArm64()

    sourceSets {
        commonTest.dependencies {
            implementation(kotlin("test"))
        }
    }
}

android {
    namespace = "io.savro.testing"
    compileSdk = 36

    defaultConfig {
        minSdk = 23
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

// O teste funcional das verificações arquiteturais roda em JVM via Gradle TestKit; o único source
// set JVM deste módulo KMP é androidUnitTest.
dependencies {
    testImplementation(gradleTestKit())
    testImplementation(libs.junit)
}

tasks.withType<Test>().configureEach {
    systemProperty("savro.projeto.raiz", rootProject.projectDir.absolutePath)
}
