package io.savro.testing

import org.gradle.testkit.runner.GradleRunner
import org.gradle.testkit.runner.TaskOutcome
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.File
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
        val fixture = copyAndroidProject()

        val result = runVerifier(fixture).build()

        assertEquals(TaskOutcome.SUCCESS, result.task(":verifyArchitecture")?.outcome)
    }

    @Test
    fun rejectsForbiddenDomainDependency() {
        val fixture = copyAndroidProject()
        appendTo(fixture.resolve("domain/patrimonio/build.gradle.kts"), """

            dependencies {
                implementation(project(\":app\"))
            }
        """.trimIndent())

        val result = runVerifier(fixture).buildAndFail()

        assertTrue(result.output.contains(":domain:patrimonio"))
    }

    @Test
    fun rejectsTestingModuleInProductionConfiguration() {
        val fixture = copyAndroidProject()
        appendTo(fixture.resolve("core/model/build.gradle.kts"), """

            dependencies {
                implementation(project(\":core:testing\"))
            }
        """.trimIndent())

        val result = runVerifier(fixture).buildAndFail()

        assertTrue(result.output.contains(":core:testing"))
    }

    @Test
    fun rejectsForbiddenReferenceInPureSource() {
        val fixture = copyAndroidProject()
        val source = fixture.resolve("core/common/src/main/kotlin/io/savro/common/ReferênciaProibida.kt")
        Files.createDirectories(source.parent)
        Files.writeString(source, "import android.content.Context\n")

        val result = runVerifier(fixture).buildAndFail()

        assertTrue(result.output.contains("android."))
    }

    @Test
    fun rejectsVisualLiteralInDesignSystemComponent() {
        val fixture = copyAndroidProject()
        val source = fixture.resolve("core/designsystem/src/main/java/io/savro/designsystem/componentes/Violacao.kt")
        Files.createDirectories(source.parent)
        Files.writeString(source, "import androidx.compose.ui.unit.dp\nval invalid = 16.dp\n")

        val result = runTask(fixture, "verifyDesignSystemTokens").buildAndFail()

        assertTrue(result.output.contains("literais visuais"))
    }

    private fun copyAndroidProject(): Path {
        val destination = temporaryFolder.newFolder("fixture").toPath()
        val source = Path.of(requireNotNull(System.getProperty("savro.android.root")))

        Files.walkFileTree(source, object : SimpleFileVisitor<Path>() {
            override fun preVisitDirectory(directory: Path, attributes: BasicFileAttributes): FileVisitResult {
                val relative = source.relativize(directory)
                if (relative.any { it.toString() == ".gradle" || it.toString() == "build" }) {
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

    private fun runVerifier(projectDirectory: Path): GradleRunner = GradleRunner.create()
        .withProjectDir(projectDirectory.toFile())
        .withArguments("--stacktrace", "verifyArchitecture")

    private fun runTask(projectDirectory: Path, task: String): GradleRunner = GradleRunner.create()
        .withProjectDir(projectDirectory.toFile())
        .withArguments("--stacktrace", task)

    private fun appendTo(file: Path, content: String) {
        Files.writeString(file, "${System.lineSeparator()}$content${System.lineSeparator()}")
    }
}
