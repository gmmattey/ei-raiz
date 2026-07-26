package io.savro.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import io.savro.designsystem.tema.SavroTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SavroTheme {
                SavroBootstrap()
            }
        }
    }
}

@Composable
private fun SavroBootstrap() {
    Text(text = stringResource(R.string.savro_bootstrap))
}

@Preview
@Composable
private fun SavroBootstrapPreview() {
    SavroTheme {
        SavroBootstrap()
    }
}
