plugins {
    alias(libs.plugins.kotlin.jvm)
}

dependencies {
    implementation(project(":core:common"))
    implementation(project(":core:model"))
}
