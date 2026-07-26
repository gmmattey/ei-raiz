import org.gradle.api.tasks.testing.Test

plugins {
    alias(libs.plugins.kotlin.jvm)
}

dependencies {
    testImplementation(gradleTestKit())
    testImplementation(libs.junit)
}

tasks.withType<Test>().configureEach {
    useJUnit()
    systemProperty("savro.android.root", rootProject.projectDir.absolutePath)
}
