package com.example.araclar

import android.content.Context
import android.content.Intent
import android.media.MediaPlayer
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.util.Log
import java.io.File
import java.util.Locale

class SpeechHelper(
    private val context: Context,
    private val onSpeechResult: (String) -> Unit,
    private val onListeningStateChanged: (Boolean) -> Unit,
    private val onSpeakingStateChanged: (Boolean) -> Unit = {}
) : TextToSpeech.OnInitListener {

    private var speechRecognizer: SpeechRecognizer? = null
    private var textToSpeech: TextToSpeech? = null
    private var mediaPlayer: MediaPlayer? = null
    private var isListening = false
    private var selectedVoiceIndex = 0

    init {
        textToSpeech = TextToSpeech(context, this)
        textToSpeech?.setOnUtteranceProgressListener(object : android.speech.tts.UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {
                onSpeakingStateChanged(true)
            }
            override fun onDone(utteranceId: String?) {
                onSpeakingStateChanged(false)
            }
            override fun onError(utteranceId: String?) {
                onSpeakingStateChanged(false)
            }
        })
        initRecognizer()
    }

    private fun initRecognizer() {
        if (SpeechRecognizer.isRecognitionAvailable(context)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
                setRecognitionListener(object : RecognitionListener {
                    override fun onReadyForSpeech(params: Bundle?) {
                        isListening = true
                        onListeningStateChanged(true)
                    }
                    override fun onBeginningOfSpeech() {}
                    override fun onRmsChanged(rmsdB: Float) {}
                    override fun onBufferReceived(buffer: ByteArray?) {}
                    override fun onEndOfSpeech() {
                        isListening = false
                        onListeningStateChanged(false)
                    }
                    override fun onError(error: Int) {
                        isListening = false
                        onListeningStateChanged(false)
                        Log.w("SpeechHelper", "Speech recognition error: $error")
                    }
                    override fun onResults(results: Bundle?) {
                        isListening = false
                        onListeningStateChanged(false)
                        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        if (!matches.isNullOrEmpty()) {
                            onSpeechResult(matches[0])
                        }
                    }
                    override fun onPartialResults(partialResults: Bundle?) {}
                    override fun onEvent(eventType: Int, params: Bundle?) {}
                })
            }
        }
    }

    fun startListening() {
        if (isListening) return
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "tr-TR")
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        }
        try {
            speechRecognizer?.startListening(intent)
        } catch (e: Exception) {
            Log.e("SpeechHelper", "Start listening error: ${e.message}")
            isListening = false
            onListeningStateChanged(false)
        }
    }

    fun stopListening() {
        try {
            speechRecognizer?.stopListening()
        } catch (e: Exception) {
            // ignore
        }
        isListening = false
        onListeningStateChanged(false)
    }

    fun speak(text: String) {
        stopAudio()
        textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "AKREP_TTS")
    }

    fun playAudioBytes(audioBytes: ByteArray, onComplete: (() -> Unit)? = null) {
        try {
            stopAudio()
            textToSpeech?.stop()
            val tempFile = File.createTempFile("gemini_voice", ".wav", context.cacheDir)
            tempFile.writeBytes(audioBytes)

            onSpeakingStateChanged(true)
            mediaPlayer = MediaPlayer().apply {
                setDataSource(tempFile.absolutePath)
                setOnCompletionListener {
                    onSpeakingStateChanged(false)
                    onComplete?.invoke()
                    tempFile.delete()
                }
                setOnErrorListener { _, _, _ ->
                    onSpeakingStateChanged(false)
                    tempFile.delete()
                    false
                }
                prepare()
                start()
            }
        } catch (e: Exception) {
            onSpeakingStateChanged(false)
            Log.e("SpeechHelper", "Error playing Gemini audio bytes: ${e.message}")
        }
    }

    fun stopAudio() {
        try {
            if (mediaPlayer?.isPlaying == true) {
                mediaPlayer?.stop()
            }
            mediaPlayer?.release()
            mediaPlayer = null
        } catch (e: Exception) {
            // ignore
        } finally {
            onSpeakingStateChanged(false)
        }
    }

    fun setVoiceStyle(index: Int) {
        selectedVoiceIndex = index
        textToSpeech?.let { tts ->
            when (index) {
                0 -> { // Puck (Canlı Erkek)
                    tts.setPitch(0.95f)
                    tts.setSpeechRate(1.05f)
                }
                1 -> { // Kore (Canlı Kadın)
                    tts.setPitch(1.18f)
                    tts.setSpeechRate(1.0f)
                }
                2 -> { // Fenrir (Derin Erkek)
                    tts.setPitch(0.72f)
                    tts.setSpeechRate(0.92f)
                }
                3 -> { // Aoede (Yumuşak Kadın)
                    tts.setPitch(1.05f)
                    tts.setSpeechRate(0.98f)
                }
                else -> {
                    tts.setPitch(1.0f)
                    tts.setSpeechRate(1.0f)
                }
            }

            val trVoices = tts.voices?.filter { it.locale.language == "tr" } ?: emptyList()
            if (trVoices.isNotEmpty()) {
                val voiceToSet = trVoices.getOrNull(index % trVoices.size)
                if (voiceToSet != null) {
                    tts.voice = voiceToSet
                }
            }
        }
    }

    fun previewVoiceSample(index: Int) {
        setVoiceStyle(index)
        val sampleMessage = when (index) {
            0 -> "Ben Gemini Puck. AKREP asistanınız olarak emrinizdeyim kral."
            1 -> "Ben Gemini Kore. Yüksek çözünürlüklü kadın sesimle size yardımcı oluyorum."
            2 -> "Ben Gemini Fenrir. Siber güvenlik ve derin sistem analisti modum aktif."
            3 -> "Ben Gemini Aoede. Zarif ve yumuşak ses tonumla buradayım."
            else -> "Cihazınızın yerel Türkçe ses motoru test ediliyor."
        }
        speak(sampleMessage)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val result = textToSpeech?.setLanguage(Locale("tr", "TR"))
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                Log.e("SpeechHelper", "Turkish TTS not supported")
            }
        }
    }

    fun destroy() {
        stopAudio()
        speechRecognizer?.destroy()
        textToSpeech?.stop()
        textToSpeech?.shutdown()
    }
}
