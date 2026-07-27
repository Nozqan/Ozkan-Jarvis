package com.example.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*
import kotlin.math.sin

@Composable
fun MainScreen(
    isListening: Boolean,
    isThinking: Boolean,
    isSpeaking: Boolean = false,
    statusText: String,
    lastUserText: String,
    lastAiReply: String,
    onToggleListen: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenPermissions: () -> Unit,
    onOpenFeaturesDashboard: () -> Unit,
    onClearHistory: () -> Unit,
    onSpeakAgain: () -> Unit,
    onQuickCommand: (String) -> Unit = {}
) {
    var showClearDialog by remember { mutableStateOf(false) }

    val quickCommands = listOf(
        "⚡ Feneri Yak",
        "🔋 Pil Durumu",
        "🌐 HUD Raporu",
        "📝 Not Al",
        "📷 Fotoğraf Çek",
        "🎵 Şarkı Atla",
        "🔊 Sistem Durumu"
    )

    if (showClearDialog) {
        AlertDialog(
            onDismissRequest = { showClearDialog = false },
            title = { Text("Konuşma Geçmişini Sil", color = NeonYellow) },
            text = { Text("Tüm konuşma geçmişini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.", color = TextWhite) },
            confirmButton = {
                TextButton(onClick = {
                    showClearDialog = false
                    onClearHistory()
                }) {
                    Text("Sil", color = AkrepRed, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showClearDialog = false }) {
                    Text("İptal", color = TextWhite)
                }
            },
            containerColor = DeepCharcoal
        )
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceBlack)
            .padding(16.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Top Header: Sun Logo & Branding
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(top = 16.dp)
            ) {
                // Glowing Sun Logo
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(RoundedCornerShape(32.dp))
                        .background(
                            Brush.radialGradient(
                                colors = listOf(NeonYellow, AkrepRed, Color.Transparent)
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Canvas(modifier = Modifier.size(44.dp)) {
                        drawCircle(color = NeonYellow, radius = size.minDimension / 3)
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "AKREP JARVIS LIVE",
                    color = NeonYellow,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.sp
                )

                Text(
                    text = "Geliştirici: Nebi Özkan | Marka: AKREP",
                    color = TextWhite.copy(alpha = 0.7f),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Quick Command Action Chips (Horizontal Scrollable)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(horizontal = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    quickCommands.forEach { cmd ->
                        SuggestionChip(
                            onClick = { onQuickCommand(cmd) },
                            label = { Text(text = cmd, fontSize = 11.sp, color = TextWhite) },
                            colors = SuggestionChipDefaults.suggestionChipColors(
                                containerColor = DeepCharcoal
                            ),
                            border = BorderStroke(1.dp, CyberGray)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Status Box
                Surface(
                    shape = RoundedCornerShape(24.dp),
                    color = DeepCharcoal,
                    border = BorderStroke(
                        1.5.dp,
                        if (isListening) MatrixGreen else if (isSpeaking) Color(0xFF00E5FF) else if (isThinking) AkrepRed else NeonYellow.copy(alpha = 0.5f)
                    ),
                    modifier = Modifier.padding(horizontal = 16.dp)
                ) {
                    val currentStatusMsg = when {
                        isListening -> "Söyle gelsin kral, dinliyorum..."
                        isSpeaking -> "🔊 Gemini Canlı İnsan Sesi Konuşuyor..."
                        isThinking -> "Akrep düşünüyor..."
                        else -> statusText
                    }
                    Text(
                        text = currentStatusMsg,
                        color = if (isListening) MatrixGreen else if (isSpeaking) Color(0xFF00E5FF) else if (isThinking) AkrepRed else TextWhite,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                        textAlign = TextAlign.Center
                    )
                }
            }

            // Center: Fluid Sound Waves & Live Dialogue Display
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                verticalArrangement = Arrangement.Center
            ) {
                // Waveform Visualizer
                WaveformVisualizer(isListening = isListening, isThinking = isThinking, isSpeaking = isSpeaking)

                Spacer(modifier = Modifier.height(16.dp))

                // Dialogue transcript card
                if (lastUserText.isNotBlank() || lastAiReply.isNotBlank()) {
                    Box(
                        modifier = Modifier.fillMaxWidth(0.92f)
                    ) {
                        Card(
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = DeepCharcoal),
                            border = BorderStroke(1.dp, CyberGray),
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(min = 90.dp, max = 180.dp)
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp).padding(end = 36.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                if (lastUserText.isNotBlank()) {
                                    Text(
                                        text = "Sen: $lastUserText",
                                        color = NeonYellow,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                                if (lastAiReply.isNotBlank()) {
                                    Text(
                                        text = "Jarvis: $lastAiReply",
                                        color = MatrixGreen,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }
                        }

                        Row(
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .padding(8.dp),
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            IconButton(
                                onClick = onSpeakAgain,
                                modifier = Modifier.size(32.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.VolumeUp,
                                    contentDescription = "Tekrar Seslendir",
                                    tint = NeonYellow
                                )
                            }
                            IconButton(
                                onClick = { showClearDialog = true },
                                modifier = Modifier.size(32.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Delete,
                                    contentDescription = "Geçmişi Temizle",
                                    tint = AkrepRed
                                )
                            }
                        }
                    }
                }
            }

            // Bottom: 4 Action Buttons with HUD Features
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 20.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // HUD 50 Features Dashboard Button
                IconButton(
                    onClick = onOpenFeaturesDashboard,
                    modifier = Modifier
                        .size(50.dp)
                        .shadow(8.dp, RoundedCornerShape(25.dp))
                        .background(DeepCharcoal, RoundedCornerShape(25.dp))
                ) {
                    Icon(
                        imageVector = Icons.Default.GraphicEq,
                        contentDescription = "50 Özellik HUD",
                        tint = MatrixGreen
                    )
                }

                // Permissions Button
                IconButton(
                    onClick = onOpenPermissions,
                    modifier = Modifier
                        .size(50.dp)
                        .shadow(8.dp, RoundedCornerShape(25.dp))
                        .background(DeepCharcoal, RoundedCornerShape(25.dp))
                ) {
                    Icon(
                        imageVector = Icons.Default.Security,
                        contentDescription = "İzinler",
                        tint = NeonYellow
                    )
                }

                // Center Listen Button (Main 3D Oval Button)
                Box(
                    modifier = Modifier
                        .height(58.dp)
                        .width(150.dp)
                        .shadow(12.dp, RoundedCornerShape(29.dp))
                        .clip(RoundedCornerShape(29.dp))
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(AkrepRed, NeonYellow)
                            )
                        )
                        .clickable { onToggleListen() },
                    contentAlignment = Alignment.Center
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Mic,
                            contentDescription = "Dinle",
                            tint = SpaceBlack,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (isListening) "DİNLİYOR" else "DİNLEMEDE",
                            color = SpaceBlack,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            letterSpacing = 1.sp
                        )
                    }
                }

                // Settings Button
                IconButton(
                    onClick = onOpenSettings,
                    modifier = Modifier
                        .size(50.dp)
                        .shadow(8.dp, RoundedCornerShape(25.dp))
                        .background(DeepCharcoal, RoundedCornerShape(25.dp))
                ) {
                    Icon(
                        imageVector = Icons.Default.Settings,
                        contentDescription = "Ayarlar",
                        tint = NeonYellow
                    )
                }
            }
        }
    }
}

@Composable
fun WaveformVisualizer(isListening: Boolean, isThinking: Boolean, isSpeaking: Boolean = false) {
    val infiniteTransition = rememberInfiniteTransition(label = "waves")
    val phase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(if (isSpeaking) 800 else 1200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "phase"
    )

    Canvas(
        modifier = Modifier
            .fillMaxWidth()
            .height(130.dp)
            .padding(horizontal = 24.dp)
    ) {
        val width = size.width
        val height = size.height
        val centerY = height / 2f

        if (isSpeaking) {
            // Equalizer Bars when Gemini is Speaking
            val barCount = 20
            val barWidth = width / (barCount * 1.8f)
            val spacing = (width - (barCount * barWidth)) / (barCount + 1)

            for (i in 0 until barCount) {
                val x = spacing + i * (barWidth + spacing)
                val barPhase = phase + (i * 18f)
                val barHeight = 20f + (sin(barPhase * Math.PI / 180f).toFloat() + 1f) * 35f
                val topY = centerY - (barHeight / 2f)

                val barColor = when (i % 3) {
                    0 -> Color(0xFF00E5FF) // Neon Cyan
                    1 -> NeonYellow
                    else -> MatrixGreen
                }

                drawRoundRect(
                    color = barColor,
                    topLeft = androidx.compose.ui.geometry.Offset(x, topY),
                    size = androidx.compose.ui.geometry.Size(barWidth, barHeight),
                    cornerRadius = androidx.compose.ui.geometry.CornerRadius(6f, 6f)
                )
            }
        } else {
            val amplitude = if (isListening) 45f else if (isThinking) 28f else 10f
            val frequency = if (isListening) 0.035f else 0.018f

            // Yellow Outer Wave
            val yellowPath = androidx.compose.ui.graphics.Path().apply {
                moveTo(0f, centerY)
                for (x in 0..width.toInt() step 4) {
                    val y = centerY + sin((x * frequency) + (phase * Math.PI / 180f).toFloat()) * amplitude
                    lineTo(x.toFloat(), y)
                }
            }
            drawPath(yellowPath, color = NeonYellow, style = Stroke(width = 4f))

            // Red Middle Wave
            val redPath = androidx.compose.ui.graphics.Path().apply {
                moveTo(0f, centerY)
                for (x in 0..width.toInt() step 4) {
                    val y = centerY + sin((x * frequency * 1.3f) - (phase * Math.PI / 180f).toFloat()) * (amplitude * 0.75f)
                    lineTo(x.toFloat(), y)
                }
            }
            drawPath(redPath, color = AkrepRed, style = Stroke(width = 3f))

            // Green Inner Wave
            val greenPath = androidx.compose.ui.graphics.Path().apply {
                moveTo(0f, centerY)
                for (x in 0..width.toInt() step 4) {
                    val y = centerY + sin((x * frequency * 0.7f) + (phase * 1.5f * Math.PI / 180f).toFloat()) * (amplitude * 0.45f)
                    lineTo(x.toFloat(), y)
                }
            }
            drawPath(greenPath, color = MatrixGreen, style = Stroke(width = 2.5f))
        }
    }
}
