package io.savro.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview

/** Host Android: só ciclo de vida e composição da raiz compartilhada (`:shared:app`). */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SavroApp()
        }
    }
}

@Preview
@Composable
private fun SavroAppPreview() {
    SavroApp()
}
