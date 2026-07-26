package io.savro.app

import org.junit.Assert.assertEquals
import org.junit.Test

class BootstrapUnitTest {
    @Test
    fun applicationIdMatchesProductionIdentity() {
        assertEquals("io.savro.app", BuildConfig.APPLICATION_ID.removeSuffix(".dev"))
    }
}
