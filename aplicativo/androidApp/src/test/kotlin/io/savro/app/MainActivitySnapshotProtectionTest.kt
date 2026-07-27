package io.savro.app

import android.os.Build
import android.view.WindowManager
import org.junit.Assert.assertNotEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Confirma que `FLAG_SECURE` é aplicado logo em `onCreate` (#118: "Conteúdo sensível não aparece
 * em screenshots/app switcher"). Não avança o looper do Robolectric de propósito — a composição
 * completa (que abriria o cofre de verdade via Room/Keystore) não é o alvo deste teste.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [Build.VERSION_CODES.UPSIDE_DOWN_CAKE])
class MainActivitySnapshotProtectionTest {

    @Test
    fun onCreate_aplicaFlagSecure() {
        val activity = Robolectric.buildActivity(MainActivity::class.java).create().get()

        val flags = activity.window.attributes.flags
        assertNotEquals(0, flags and WindowManager.LayoutParams.FLAG_SECURE)
    }
}
