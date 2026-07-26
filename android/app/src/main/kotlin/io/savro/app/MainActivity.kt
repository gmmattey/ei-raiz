package io.savro.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SavroBootstrap()
        }
    }
}

@Composable
private fun SavroBootstrap() {
    Text(text = "Savro bootstrap")
}

@Preview
@Composable
private fun SavroBootstrapPreview() {
    SavroBootstrap()
}
