package io.savro.app

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class BootstrapInstrumentedTest {
    @Test
    fun applicationContextUsesDevApplicationId() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext

        assertEquals("io.savro.app.dev", context.packageName)
    }
}
