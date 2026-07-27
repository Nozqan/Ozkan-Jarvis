package com.example.ui

import android.Manifest
import android.content.pm.PackageManager
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.example.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PermissionsScreen(
    onPermissionsBack: () -> Unit,
    onRequestAllPermissions: () -> Unit
) {
    val context = LocalContext.current

    val permissionItems = listOf(
        Pair("Mikrofon Erişimi (Sesli Komut & Dinleme)", Manifest.permission.RECORD_AUDIO),
        Pair("Kamera & Fener Kontrolü", Manifest.permission.CAMERA),
        Pair("Rehber & Arama Yönetimi", Manifest.permission.READ_CONTACTS),
        Pair("Telefon Araması Yapma", Manifest.permission.CALL_PHONE),
        Pair("Sistem Bildirim & Arka Plan Erişimi", Manifest.permission.WAKE_LOCK)
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("AKREP Sistem İzinleri", color = NeonYellow) },
                navigationIcon = {
                    IconButton(onClick = onPermissionsBack) {
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
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "AKREP JARVIS'in kusursuz çalışabilmesi için gerekli olan tüm mutlak sistem izinleri aşağıdadır. Nebi Özkan güvenlik protokolü gereği tüm izinler aktif olmalıdır.",
                color = TextWhite.copy(alpha = 0.8f),
                fontSize = 14.sp
            )

            permissionItems.forEach { (label, permission) ->
                val isGranted = ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
                Card(
                    colors = CardDefaults.cardColors(containerColor = DeepCharcoal),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = label,
                                color = TextWhite,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium
                            )
                            Text(
                                text = if (isGranted) "Erişim Verildi" else "İzin Bekleniyor",
                                color = if (isGranted) MatrixGreen else AkrepRed,
                                fontSize = 12.sp
                            )
                        }
                        Icon(
                            imageVector = if (isGranted) Icons.Default.CheckCircle else Icons.Default.Warning,
                            contentDescription = "Durum",
                            tint = if (isGranted) MatrixGreen else AkrepRed
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = onRequestAllPermissions,
                colors = ButtonDefaults.buttonColors(containerColor = NeonYellow),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(text = "Tüm İzinleri Ver / Güncelle", color = SpaceBlack, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
        }
    }
}

