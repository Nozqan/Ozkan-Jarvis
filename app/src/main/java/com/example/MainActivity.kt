package com.example

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.*
import androidx.core.content.ContextCompat
import com.example.ai.GeminiAiClient
import com.example.araclar.CommandExecutor
import com.example.araclar.SpeechHelper
import com.example.servis.AkrepForegroundService
import com.example.ui.MainScreen
import com.example.ui.PermissionsScreen
import com.example.ui.SettingsScreen
import com.example.ui.theme.MyApplicationTheme
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private lateinit var aiClient: GeminiAiClient
    private lateinit var commandExecutor: CommandExecutor
    private lateinit var speechHelper: SpeechHelper

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        // Handle permission results
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        aiClient = GeminiAiClient()
        commandExecutor = CommandExecutor(this)

        // Start background foreground service
        val serviceIntent = Intent(this, AkrepForegroundService::class.java)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }

        // Request necessary permissions
        checkAndRequestPermissions()

        setContent {
            MyApplicationTheme {
                var currentScreen by remember { mutableStateOf("MAIN") }
                var isListening by remember { mutableStateOf(false) }
                var isThinking by remember { mutableStateOf(false) }
                var isSpeaking by remember { mutableStateOf(false) }
                var statusText by remember { mutableStateOf("Beni uyandırmak için 'Akrep' deyin...") }
                var lastUserText by remember { mutableStateOf("") }
                var lastAiReply by remember { mutableStateOf("Emrindeyim kral, AKREP JARVIS aktif.") }
                var selectedVoiceIndex by remember { mutableIntStateOf(0) }

                val geminiVoiceNames = listOf("Puck", "Kore", "Fenrir", "Aoede")

                fun speakReply(textToSpeak: String) {
                    if (textToSpeak.isBlank()) return
                    if (selectedVoiceIndex < geminiVoiceNames.size) {
                        val voiceName = geminiVoiceNames[selectedVoiceIndex]
                        CoroutineScope(Dispatchers.Main).launch {
                            val audioBytes = aiClient.fetchGeminiVoiceAudio(textToSpeak, voiceName)
                            if (audioBytes != null && audioBytes.isNotEmpty()) {
                                speechHelper.playAudioBytes(audioBytes)
                            } else {
                                speechHelper.speak(textToSpeak)
                            }
                        }
                    } else {
                        speechHelper.speak(textToSpeak)
                    }
                }

                val handleQuery: (String) -> Unit = { queryText ->
                    lastUserText = queryText
                    isListening = false
                    isThinking = true
                    statusText = "Akrep düşünüyor..."

                    CoroutineScope(Dispatchers.Main).launch {
                        val response = aiClient.askAkrep(queryText)
                        isThinking = false
                        lastAiReply = response.replyText
                        statusText = "Beni uyandırmak için 'Akrep' deyin..."
                        speakReply(response.replyText)

                        response.actionJson?.let { action ->
                            commandExecutor.executeAction(action) { resultMsg ->
                                lastAiReply = "$lastAiReply\n[İşlem: $resultMsg]"
                                speakReply(resultMsg)
                            }
                        }
                    }
                }

                speechHelper = remember {
                    SpeechHelper(
                        context = this,
                        onSpeechResult = { spokenText ->
                            handleQuery(spokenText)
                        },
                        onListeningStateChanged = { listening ->
                            isListening = listening
                        },
                        onSpeakingStateChanged = { speaking ->
                            isSpeaking = speaking
                        }
                    )
                }

                when (currentScreen) {
                    "MAIN" -> {
                        MainScreen(
                            isListening = isListening,
                            isThinking = isThinking,
                            isSpeaking = isSpeaking,
                            statusText = statusText,
                            lastUserText = lastUserText,
                            lastAiReply = lastAiReply,
                            onToggleListen = {
                                if (isListening) {
                                    speechHelper.stopListening()
                                } else {
                                    speechHelper.startListening()
                                }
                            },
                            onOpenSettings = { currentScreen = "SETTINGS" },
                            onOpenPermissions = { currentScreen = "PERMISSIONS" },
                            onOpenFeaturesDashboard = { currentScreen = "FEATURES" },
                            onClearHistory = {
                                lastUserText = ""
                                lastAiReply = "Geçmiş temizlendi kral."
                            },
                            onSpeakAgain = {
                                speakReply(lastAiReply)
                            },
                            onQuickCommand = { commandText ->
                                handleQuery(commandText)
                            }
                        )
                    }
                    "FEATURES" -> {
                        com.example.ui.FeaturesDashboardScreen(
                            onBack = { currentScreen = "MAIN" },
                            onFeatureClick = { featureName ->
                                handleQuery(featureName)
                                currentScreen = "MAIN"
                            }
                        )
                    }
                    "SETTINGS" -> {
                        SettingsScreen(
                            currentGeminiKey = "",
                            currentOpenAiKey = "",
                            onSaveKeys = { gemini, openai ->
                                aiClient.updateKeys(gemini, openai)
                                currentScreen = "MAIN"
                            },
                            onSelectVoice = { voiceIndex ->
                                selectedVoiceIndex = voiceIndex
                                speechHelper.setVoiceStyle(voiceIndex)
                            },
                            onPreviewVoice = { voiceIndex ->
                                speechHelper.previewVoiceSample(voiceIndex)
                            },
                            onBack = { currentScreen = "MAIN" }
                        )
                    }
                    "PERMISSIONS" -> {
                        PermissionsScreen(
                            onPermissionsBack = { currentScreen = "MAIN" },
                            onRequestAllPermissions = { checkAndRequestPermissions() }
                        )
                    }
                }
            }
        }
    }

    private fun checkAndRequestPermissions() {
        val permissionsToRequest = mutableListOf<String>()
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.RECORD_AUDIO)
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.CAMERA)
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.READ_CONTACTS)
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.CALL_PHONE)
        }
        if (permissionsToRequest.isNotEmpty()) {
            requestPermissionLauncher.launch(permissionsToRequest.toTypedArray())
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (::speechHelper.isInitialized) {
            speechHelper.destroy()
        }
    }
}
