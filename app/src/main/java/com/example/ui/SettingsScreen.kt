package com.example.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.BatteryFull
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Vibration
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.features.audio.AudioFeature
import com.example.features.battery.BatteryFeature
import com.example.features.hardware.HardwareFeature
import com.example.features.system.SystemInfoFeature
import com.example.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    currentGeminiKey: String,
    currentOpenAiKey: String,
    onSaveKeys: (String, String) -> Unit,
    onSelectVoice: (Int) -> Unit,
    onPreviewVoice: (Int) -> Unit,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val hardwareFeature = remember { HardwareFeature(context) }
    val batteryFeature = remember { BatteryFeature(context) }
    val systemInfoFeature = remember { SystemInfoFeature(context) }
    val audioFeature = remember { AudioFeature(context) }

    var isFlashlightOn by remember { mutableStateOf(false) }
    var volumeLevel by remember { mutableFloatStateOf(audioFeature.getMediaVolumePercent().toFloat()) }
    var geminiKey by remember { mutableStateOf(currentGeminiKey) }
    var openAiKey by remember { mutableStateOf(currentOpenAiKey) }
    var selectedVoice by remember { mutableIntStateOf(0) }

    val voiceList = listOf(
        Pair("Gemini Puck", "Canlı Doğal Erkek"),
        Pair("Gemini Kore", "Canlı Berrak Kadın"),
        Pair("Gemini Fenrir", "Derin Siber Erkek"),
        Pair("Gemini Aoede", "Yumuşak Kadın"),
        Pair("Sistem TTS", "Yerel Çevrimdışı")
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("AKREP Ayarlar & Donanım Merkezi", color = NeonYellow, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Geri", tint = NeonYellow)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = SpaceBlack)
            )
        },
        containerColor = SpaceBlack
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            // Developer signature card
            Card(
                colors = CardDefaults.cardColors(containerColor = DeepCharcoal),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, CyberGray),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = "Geliştirici & Lisans Bilgisi", color = NeonYellow, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = "Geliştirici: Nebi Özkan | Marka: AKREP JARVIS", color = TextWhite, fontSize = 14.sp)
                    Text(text = "Sürüm: 5.0 (Full Hardware & Real Gemini Live)", color = TextWhite.copy(alpha = 0.7f), fontSize = 12.sp)
                }
            }

            // Zero-Config Auto Gemini System Info Card
            Card(
                colors = CardDefaults.cardColors(containerColor = DeepCharcoal),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, MatrixGreen.copy(alpha = 0.5f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(imageVector = Icons.Default.GraphicEq, contentDescription = null, tint = MatrixGreen)
                            Text(text = "Oto-Gemini Asistan Motoru", color = NeonYellow, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        }
                        Surface(
                            color = MatrixGreen.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = "✓ %100 AKTİF",
                                color = MatrixGreen,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }
                    Text(
                        text = "Sisteminizde entegre Google Gemini 2.5 Flash canlı motoru otomatik olarak aktif durumdadır. Kullanıcının manuel API anahtarı girmesine gerek yoktur.",
                        color = TextWhite.copy(alpha = 0.85f),
                        fontSize = 13.sp
                    )
                }
            }

            // Real Device Hardware Diagnostics & Control Panel
            Card(
                colors = CardDefaults.cardColors(containerColor = DeepCharcoal),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, NeonYellow.copy(alpha = 0.3f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Text(text = "Gerçek Cihaz Donanım Modülleri", color = NeonYellow, fontWeight = FontWeight.Bold, fontSize = 16.sp)

                    // Flashlight Test
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Icon(imageVector = Icons.Default.FlashOn, contentDescription = null, tint = NeonYellow)
                            Text(text = "Kamera El Feneri", color = TextWhite, fontSize = 14.sp)
                        }
                        Switch(
                            checked = isFlashlightOn,
                            onCheckedChange = { state ->
                                isFlashlightOn = state
                                hardwareFeature.setFlashlight(state)
                            },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = SpaceBlack,
                                checkedTrackColor = MatrixGreen,
                                uncheckedTrackColor = CyberGray
                            )
                        )
                    }

                    HorizontalDivider(color = CyberGray)

                    // Vibration Test
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Icon(imageVector = Icons.Default.Vibration, contentDescription = null, tint = NeonYellow)
                            Text(text = "Haptik Titreşim Motoru", color = TextWhite, fontSize = 14.sp)
                        }
                        OutlinedButton(
                            onClick = { hardwareFeature.triggerVibration(300) },
                            border = BorderStroke(1.dp, NeonYellow),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text(text = "Test Et", color = NeonYellow, fontSize = 12.sp)
                        }
                    }

                    HorizontalDivider(color = CyberGray)

                    // Volume Control Slider
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                Icon(imageVector = Icons.AutoMirrored.Filled.VolumeUp, contentDescription = null, tint = NeonYellow)
                                Text(text = "Medya Ses Seviyesi", color = TextWhite, fontSize = 14.sp)
                            }
                            Text(text = "%${volumeLevel.toInt()}", color = MatrixGreen, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                        Slider(
                            value = volumeLevel,
                            onValueChange = {
                                volumeLevel = it
                                audioFeature.setMediaVolumePercent(it.toInt())
                            },
                            valueRange = 0f..100f,
                            colors = SliderDefaults.colors(
                                thumbColor = NeonYellow,
                                activeTrackColor = MatrixGreen,
                                inactiveTrackColor = CyberGray
                            )
                        )
                    }

                    HorizontalDivider(color = CyberGray)

                    // Live Hardware Status Summary
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(imageVector = Icons.Default.BatteryFull, contentDescription = null, tint = MatrixGreen, modifier = Modifier.size(18.dp))
                            Text(text = batteryFeature.getBatteryReport(), color = TextWhite.copy(alpha = 0.9f), fontSize = 12.sp)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(imageVector = Icons.Default.Memory, contentDescription = null, tint = NeonYellow, modifier = Modifier.size(18.dp))
                            Text(text = systemInfoFeature.getRamSummary(), color = TextWhite.copy(alpha = 0.9f), fontSize = 12.sp)
                        }
                    }
                }
            }

            // Voice Selector (4 Real Human Gemini Voices)
            Card(
                colors = CardDefaults.cardColors(containerColor = DeepCharcoal),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, CyberGray),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(text = "4 Gerçek İnsan Ses Profili (Gemini Voice)", color = NeonYellow, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text(text = "Gerçek Gemini insan sesi tarzınızı aşağıdaki kaydırmalı butonlardan seçip hemen dinleyebilirsiniz:", color = TextWhite.copy(alpha = 0.7f), fontSize = 12.sp)

                    // Swipeable Voice Chips
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        voiceList.forEachIndexed { index, (name, tag) ->
                            val isSelected = selectedVoice == index
                            FilterChip(
                                selected = isSelected,
                                onClick = {
                                    selectedVoice = index
                                    onSelectVoice(index)
                                    onPreviewVoice(index)
                                },
                                label = {
                                    Column {
                                        Text(text = name, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                        Text(text = tag, fontSize = 10.sp, color = if (isSelected) SpaceBlack.copy(alpha = 0.8f) else TextWhite.copy(alpha = 0.6f))
                                    }
                                },
                                leadingIcon = if (isSelected) {
                                    { Icon(imageVector = Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(16.dp)) }
                                } else null,
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = NeonYellow,
                                    selectedLabelColor = SpaceBlack,
                                    containerColor = CyberGray,
                                    labelColor = TextWhite
                                )
                            )
                        }
                    }

                    // Listen Sample Audio Button
                    OutlinedButton(
                        onClick = { onPreviewVoice(selectedVoice) },
                        border = BorderStroke(1.dp, MatrixGreen),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(imageVector = Icons.Default.PlayArrow, contentDescription = null, tint = MatrixGreen)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = "Seçili Sesin Demosunu Dinle", color = MatrixGreen, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Custom API Key Override (Optional)
            Card(
                colors = CardDefaults.cardColors(containerColor = DeepCharcoal),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, CyberGray),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(text = "Özel API Anahtarı (İsteğe Bağlı)", color = NeonYellow, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text(text = "Kendi özel Gemini API anahtarınızı tanımlamak isterseniz buraya ekleyebilirsiniz:", color = TextWhite.copy(alpha = 0.7f), fontSize = 12.sp)

                    OutlinedTextField(
                        value = geminiKey,
                        onValueChange = { geminiKey = it },
                        label = { Text("Google Gemini API Key (İsteğe Bağlı)") },
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = NeonYellow,
                            unfocusedBorderColor = CyberGray,
                            focusedLabelColor = NeonYellow,
                            unfocusedLabelColor = TextWhite
                        )
                    )

                    Button(
                        onClick = { onSaveKeys(geminiKey, openAiKey) },
                        colors = ButtonDefaults.buttonColors(containerColor = MatrixGreen),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.align(Alignment.End)
                    ) {
                        Text(text = "Ayarları Kaydet", color = SpaceBlack, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

