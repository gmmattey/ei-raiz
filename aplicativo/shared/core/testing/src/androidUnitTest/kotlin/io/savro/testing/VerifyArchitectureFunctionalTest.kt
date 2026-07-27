package io.savro.testing

import org.gradle.testkit.runner.GradleRunner
import org.gradle.testkit.runner.TaskOutcome
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.nio.file.FileVisitResult
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.SimpleFileVisitor
import java.nio.file.StandardCopyOption
import java.nio.file.attribute.BasicFileAttributes

class VerifyArchitectureFunctionalTest {
    @get:Rule
    val temporaryFolder = TemporaryFolder()

    @Test
    fun approvesTheCurrentAllowedGraph() {
        val fixture = copyGradleProject()

        val result = runTask(fixture, "verifyArchitecture").build()

        assertEquals(TaskOutcome.SUCCESS, result.task(":verifyArchitecture")?.outcome)
    }

    @Test
    fun rejectsForbiddenDomainDependency() {
        val fixture = copyGradleProject()
        appendTo(fixture.resolve("shared/domain/patrimonio/build.gradle.kts"), """

            dependencies {
                implementation(project(\":shared:app\"))
            }
        """.trimIndent())

        val result = runTask(fixture, "verifyArchitecture").buildAndFail()

        assertTrue(result.output.contains(":shared:domain:patrimonio"))
    }

    @Test
    fun rejectsTestingModuleInProductionConfiguration() {
        val fixture = copyGradleProject()
        appendTo(fixture.resolve("shared/core/model/build.gradle.kts"), """

            dependencies {
                implementation(project(\":shared:core:testing\"))
            }
        """.trimIndent())

        val result = runTask(fixture, "verifyArchitecture").buildAndFail()

        assertTrue(result.output.contains(":shared:core:testing"))
    }

    @Test
    fun rejectsForbiddenReferenceInPureSource() {
        val fixture = copyGradleProject()
        writeSource(
            fixture.resolve("shared/core/common/src/commonMain/kotlin/io/savro/common/ReferenciaProibida.kt"),
            "import android.content.Context\n",
        )

        val result = runTask(fixture, "verifyArchitecture").buildAndFail()

        assertTrue(result.output.contains("android."))
    }

    @Test
    fun rejectsPlatformReferenceInCommonMain() {
        val fixture = copyGradleProject()
        writeSource(
            fixture.resolve("shared/app/src/commonMain/kotlin/io/savro/app/VazamentoIos.kt"),
            "import platform.UIKit.UIViewController\n",
        )

        val result = runTask(fixture, "verifyArchitecture").buildAndFail()

        assertTrue(result.output.contains("commonMain"))
        assertTrue(result.output.contains("platform.UIKit"))
    }

    @Test
    fun rejectsDirectMaterialReferenceInSharedApp() {
        val fixture = copyGradleProject()
        writeSource(
            fixture.resolve("shared/app/src/commonMain/kotlin/io/savro/app/AtalhoMaterial.kt"),
            "import androidx.compose.material3.Text\n",
        )

        val result = runTask(fixture, "verifyArchitecture").buildAndFail()

        assertTrue(result.output.contains("androidx.compose.material3."))
    }

    @Test
    fun rejectsAndroidReferenceInIosSourceSet() {
        val fixture = copyGradleProject()
        writeSource(
            fixture.resolve("shared/core/designsystem/src/iosMain/kotlin/io/savro/designsystem/Vazamento.kt"),
            "import android.content.Context\n",
        )

        val result = runTask(fixture, "verifyArchitecture").buildAndFail()

        assertTrue(result.output.contains("iosMain"))
    }

    @Test
    fun rejectsVisualLiteralInDesignSystemComponent() {
        val fixture = copyGradleProject()
        writeSource(
            fixture.resolve("shared/core/designsystem/src/commonMain/kotlin/io/savro/designsystem/componentes/Violacao.kt"),
            "import androidx.compose.ui.unit.dp\nval invalid = 16.dp\n",
        )

        val result = runTask(fixture, "verifyDesignSystemTokens").buildAndFail()

        assertTrue(result.output.contains("literais visuais"))
    }

    @Test
    fun allowsVisualLiteralInCanonicalTokenFile() {
        val fixture = copyGradleProject()

        val result = runTask(fixture, "verifyDesignSystemTokens").build()

        assertEquals(TaskOutcome.SUCCESS, result.task(":verifyDesignSystemTokens")?.outcome)
    }

    @Test
    fun rejectsVisualLiteralInArbitraryThemeFile() {
        val fixture = copyGradleProject()
        writeSource(
            fixture.resolve("shared/core/designsystem/src/commonMain/kotlin/io/savro/designsystem/tema/OutroTema.kt"),
            "import androidx.compose.ui.unit.dp\nval invalid = 16.dp\n",
        )

        val result = runTask(fixture, "verifyDesignSystemTokens").buildAndFail()

        assertTrue(result.output.contains("literais visuais"))
    }

    private fun copyGradleProject(): Path {
        val destination = temporaryFolder.newFolder("fixture").toPath()
        val source = Path.of(requireNotNull(System.getProperty("savro.projeto.raiz")))
        val ignoredDirectories = setOf(".gradle", ".kotlin", "build")

        Files.walkFileTree(source, object : SimpleFileVisitor<Path>() {
            override fun preVisitDirectory(directory: Path, attributes: BasicFileAttributes): FileVisitResult {
                val relative = source.relativize(directory)
                if (relative.any { it.toString() in ignoredDirectories }) {
                    return FileVisitResult.SKIP_SUBTREE
                }
                Files.createDirectories(destination.resolve(relative))
                return FileVisitResult.CONTINUE
            }

            override fun visitFile(file: Path, attributes: BasicFileAttributes): FileVisitResult {
                val relative = source.relativize(file)
                Files.copy(file, destination.resolve(relative), StandardCopyOption.COPY_ATTRIBUTES)
                return FileVisitResult.CONTINUE
            }
        })

        return destination
    }

    private fun runTask(projectDirectory: Path, task: String): GradleRunner = GradleRunner.create()
        .withProjectDir(projectDirectory.toFile())
        .withArguments("--stacktrace", task)

    // O source set androidUnitTest compila contra o android.jar, que não expõe Files.writeString.
    private fun appendTo(file: Path, content: String) {
        file.toFile().writeText("${System.lineSeparator()}$content${System.lineSeparator()}")
    }

    private fun writeSource(file: Path, content: String) {
        Files.createDirectories(file.parent)
        file.toFile().writeText(content)
    }
}
