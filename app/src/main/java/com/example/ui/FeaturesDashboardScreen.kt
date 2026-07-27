package com.example.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.PhoneInTalk
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.features.assistant.AssistantCapabilities
import com.example.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeaturesDashboardScreen(
    onBack: () -> Unit,
    onFeatureClick: (String) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }

    val filteredFeatures = remember(searchQuery) {
        if (searchQuery.isBlank()) {
            AssistantCapabilities.FEATURES_LIST
        } else {
            AssistantCapabilities.FEATURES_LIST.filter { it.contains(searchQuery, ignoreCase = true) }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("AKREP JARVIS HUD Dashboard", color = NeonYellow, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text("50 Aktif Siber & Yapay Zeka Özellik Sistemi", color = TextWhite.copy(alpha = 0.7f), fontSize = 12.sp)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Geri",
                            tint = NeonYellow
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DeepCharcoal)
            )
        },
        containerColor = SpaceBlack
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // HUD Summary Banner
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = DeepCharcoal),
                border = BorderStroke(1.dp, MatrixGreen.copy(alpha = 0.6f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(50.dp)
                            .clip(RoundedCornerShape(25.dp))
                            .background(
                                Brush.radialGradient(
                                    colors = listOf(MatrixGreen, DeepCharcoal)
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.GraphicEq,
                            contentDescription = null,
                            tint = SpaceBlack,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Sistem Durumu: %100 GERÇEK ZAMANLI",
                            color = MatrixGreen,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                        Text(
                            text = AssistantCapabilities.getSummary(),
                            color = TextWhite.copy(alpha = 0.85f),
                            fontSize = 12.sp
                        )
                    }
                }
            }

            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = { Text("50 Özellik İçinde Ara...", color = TextWhite.copy(alpha = 0.7f)) },
                leadingIcon = {
                    Icon(imageVector = Icons.Default.Search, contentDescription = null, tint = NeonYellow)
                },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = NeonYellow,
                    unfocusedBorderColor = CyberGray,
                    focusedTextColor = TextWhite,
                    unfocusedTextColor = TextWhite
                ),
                shape = RoundedCornerShape(12.dp)
            )

            // Features List
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                itemsIndexed(filteredFeatures) { index, featureItem ->
                    FeatureCardItem(
                        itemText = featureItem,
                        onClick = { onFeatureClick(featureItem) }
                    )
                }
            }
        }
    }
}

@Composable
fun FeatureCardItem(
    itemText: String,
    onClick: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = DeepCharcoal),
        border = BorderStroke(1.dp, CyberGray),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.weight(1f)
            ) {
                Icon(
                    imageVector = when {
                        itemText.contains("Ses") || itemText.contains("Gemini") -> Icons.Default.GraphicEq
                        itemText.contains("Kamera") || itemText.contains("Flaş") -> Icons.Default.FlashOn
                        itemText.contains("Arama") || itemText.contains("SMS") -> Icons.Default.PhoneInTalk
                        itemText.contains("RAM") || itemText.contains("Depolama") -> Icons.Default.Memory
                        else -> Icons.Default.Security
                    },
                    contentDescription = null,
                    tint = NeonYellow,
                    modifier = Modifier.size(22.dp)
                )

                Text(
                    text = itemText,
                    color = TextWhite,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            Icon(
                imageVector = Icons.Default.CheckCircle,
                contentDescription = "Aktif",
                tint = MatrixGreen,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}
