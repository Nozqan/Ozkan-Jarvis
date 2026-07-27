package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val AkrepDarkColorScheme = darkColorScheme(
    primary = NeonYellow,
    onPrimary = SpaceBlack,
    secondary = AkrepRed,
    onSecondary = TextWhite,
    tertiary = MatrixGreen,
    background = SpaceBlack,
    onBackground = TextWhite,
    surface = DeepCharcoal,
    onSurface = TextWhite
)

@Composable
fun MyApplicationTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = AkrepDarkColorScheme,
        typography = Typography,
        content = content
    )
}
