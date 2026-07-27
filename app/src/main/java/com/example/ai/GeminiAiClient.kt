package com.example.ai

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject

import com.example.BuildConfig

class GeminiAiClient(
    private var geminiApiKey: String = BuildConfig.GEMINI_API_KEY.ifBlank { "" },
    private var openAiApiKey: String = ""
) {
    private val client = OkHttpClient()
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    fun updateKeys(newGemini: String, newOpenAi: String) {
        if (newGemini.isNotBlank()) geminiApiKey = newGemini
        if (newOpenAi.isNotBlank()) openAiApiKey = newOpenAi
    }

    suspend fun askAkrep(prompt: String, contextInfo: String = ""): AiResponse = withContext(Dispatchers.IO) {
        try {
            // Check if prompt is a direct command or requires Gemini intelligence
            val lower = prompt.lowercase().trim()
            val intentJson = parseCommandLocally(lower)
            if (intentJson != null) {
                return@withContext AiResponse(
                    replyText = "Emredersin kral, hemen yerine getiriyorum.",
                    actionJson = intentJson
                )
            }

            // Otherwise, query Gemini API (v1beta generateContent)
            val url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=$geminiApiKey"
            
            val systemInstruction = "Sen Nebi Özkan tarafından geliştirilen 'AKREP JARVIS' adında üst düzey, sadık, zeki ve yerel bir Android asistanısın. Kürtçe ve Türkçe komutları çok iyi anlarsın. 'kral', 'dostum', 'Nebi' hitaplarına aşinasın. Eğer kullanıcı fener, kamera, wi-fi, bluetooth, müzik, arama gibi bir cihaz eylemi isterse, yanıtının içine mutlaka şu formatta JSON ekle: {\"action\":\"EYLEM_ADI\"}. Aksi takdirde samimi ve cyberpunk bir üslupla yanıt ver."

            val jsonBody = JSONObject().apply {
                put("contents", JSONArray().apply {
                    put(JSONObject().apply {
                        put("parts", JSONArray().apply {
                            put(JSONObject().apply {
                                put("text", "$systemInstruction\n\nEk Bilgi / Cihaz Durumu: $contextInfo\n\nKullanıcı: $prompt")
                            })
                        })
                    })
                })
            }

            val request = Request.Builder()
                .url(url)
                .addHeader("Content-Type", "application/json")
                .post(jsonBody.toString().toRequestBody(jsonMediaType))
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    val errBody = response.body?.string() ?: "Bilinmeyen hata"
                    Log.e("GeminiAiClient", "API Error: $errBody")
                    return@withContext AiResponse("Bağlantı hatası oluştu kral, ama lokal olarak dinlemedeyim.", null)
                }

                val resString = response.body?.string() ?: return@withContext AiResponse("Yanıt alınamadı.", null)
                val root = JSONObject(resString)
                val candidates = root.optJSONArray("candidates")
                if (candidates != null && candidates.length() > 0) {
                    val content = candidates.getJSONObject(0).optJSONObject("content")
                    val parts = content?.optJSONArray("parts")
                    if (parts != null && parts.length() > 0) {
                        val text = parts.getJSONObject(0).optString("text", "Emredersin kral.")
                        
                        // Extract JSON action if present in text
                        var action: JSONObject? = null
                        val jsonStartIndex = text.indexOf('{')
                        val jsonEndIndex = text.lastIndexOf('}')
                        if (jsonStartIndex != -1 && jsonEndIndex != -1 && jsonEndIndex > jsonStartIndex) {
                            try {
                                val potentialJson = text.substring(jsonStartIndex, jsonEndIndex + 1)
                                action = JSONObject(potentialJson)
                            } catch (e: Exception) {
                                // ignore
                            }
                        }

                        return@withContext AiResponse(text, action)
                    }
                }
                AiResponse("Seni dinliyorum kral.", null)
            }
        } catch (e: Exception) {
            Log.e("GeminiAiClient", "Exception: ${e.message}", e)
            // Fallback to local heuristic command parser
            val fallbackAction = parseCommandLocally(prompt.lowercase())
            AiResponse("Çevrimdışı moddayım kral, komutunu uyguluyorum.", fallbackAction)
        }
    }

    suspend fun fetchGeminiVoiceAudio(textToSpeak: String, voiceName: String = "Puck"): ByteArray? = withContext(Dispatchers.IO) {
        if (textToSpeak.isBlank()) return@withContext null
        try {
            val url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=$geminiApiKey"
            
            val jsonBody = JSONObject().apply {
                put("contents", JSONArray().apply {
                    put(JSONObject().apply {
                        put("parts", JSONArray().apply {
                            put(JSONObject().apply {
                                put("text", textToSpeak)
                            })
                        })
                    })
                })
                put("generationConfig", JSONObject().apply {
                    put("responseModalities", JSONArray().apply { put("AUDIO") })
                    put("speechConfig", JSONObject().apply {
                        put("voiceConfig", JSONObject().apply {
                            put("prebuiltVoiceConfig", JSONObject().apply {
                                put("voiceName", voiceName)
                            })
                        })
                    })
                })
            }

            val request = Request.Builder()
                .url(url)
                .addHeader("Content-Type", "application/json")
                .post(jsonBody.toString().toRequestBody(jsonMediaType))
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    Log.e("GeminiAiClient", "Gemini Voice API error: ${response.body?.string()}")
                    return@withContext null
                }

                val resString = response.body?.string() ?: return@withContext null
                val root = JSONObject(resString)
                val candidates = root.optJSONArray("candidates")
                if (candidates != null && candidates.length() > 0) {
                    val content = candidates.getJSONObject(0).optJSONObject("content")
                    val parts = content?.optJSONArray("parts")
                    if (parts != null && parts.length() > 0) {
                        for (i in 0 until parts.length()) {
                            val part = parts.getJSONObject(i)
                            val inlineData = part.optJSONObject("inlineData")
                            if (inlineData != null) {
                                val mimeType = inlineData.optString("mimeType", "")
                                val base64Data = inlineData.optString("data", "")
                                if (base64Data.isNotBlank()) {
                                    val rawBytes = android.util.Base64.decode(base64Data, android.util.Base64.NO_WRAP)
                                    return@withContext if (mimeType.contains("pcm", ignoreCase = true)) {
                                        pcmToWav(rawBytes)
                                    } else {
                                        rawBytes
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("GeminiAiClient", "Failed to generate Gemini voice: ${e.message}")
        }
        return@withContext null
    }

    private fun pcmToWav(pcmBytes: ByteArray, sampleRate: Int = 24000, channels: Int = 1, bitsPerSample: Int = 16): ByteArray {
        val byteRate = sampleRate * channels * bitsPerSample / 8
        val blockAlign = channels * bitsPerSample / 8
        val dataSize = pcmBytes.size
        val chunkSize = 36 + dataSize

        val header = java.nio.ByteBuffer.allocate(44).apply {
            order(java.nio.ByteOrder.LITTLE_ENDIAN)
            put("RIFF".toByteArray())
            putInt(chunkSize)
            put("WAVE".toByteArray())
            put("fmt ".toByteArray())
            putInt(16)
            putShort(1.toShort())
            putShort(channels.toShort())
            putInt(sampleRate)
            putInt(byteRate)
            putShort(blockAlign.toShort())
            putShort(bitsPerSample.toShort())
            put("data".toByteArray())
            putInt(dataSize)
        }.array()

        return header + pcmBytes
    }

    private fun parseCommandLocally(text: String): JSONObject? {
        return when {
            text.contains("feneri aç") || text.contains("flaşı yak") || text.contains("fener aç") ->
                JSONObject().put("action", "TOGGLE_FLASHLIGHT").put("state", true)
            text.contains("feneri kapat") || text.contains("flaşı kapat") ->
                JSONObject().put("action", "TOGGLE_FLASHLIGHT").put("state", false)
            text.contains("kamerayı aç") || text.contains("kamera aç") ->
                JSONObject().put("action", "OPEN_CAMERA")
            text.contains("wi-fi aç") || text.contains("wifi aç") || text.contains("kablosuz aç") ->
                JSONObject().put("action", "TOGGLE_WIFI").put("state", true)
            text.contains("bluetooth aç") ->
                JSONObject().put("action", "TOGGLE_BLUETOOTH").put("state", true)
            text.contains("şarjım kaç") || text.contains("pil durumu") || text.contains("batarya") ->
                JSONObject().put("action", "CHECK_BATTERY")
            text.contains("sistem durumu") || text.contains("ram ne kadar") || text.contains("depolama") ->
                JSONObject().put("action", "CHECK_SYSTEM")
            text.contains("hud raporu") || text.contains("çekirdek durumu") ->
                JSONObject().put("action", "CHECK_HUD")
            text.contains("not al") || text.contains("kaydet") -> {
                val note = text.replace("not al", "").replace("kaydet", "").trim()
                JSONObject().put("action", "SAVE_NOTE").put("text", note.ifBlank { "Önemli hatırlatma" })
            }
            text.contains("notlarımı oku") || text.contains("notları göster") || text.contains("notlarım") ->
                JSONObject().put("action", "LIST_NOTES")
            text.contains("notları temizle") || text.contains("notları sil") ->
                JSONObject().put("action", "CLEAR_NOTES")
            text.contains("sonraki şarkı") || text.contains("şarkı atla") ->
                JSONObject().put("action", "MEDIA_NEXT")
            text.contains("önceki şarkı") ->
                JSONObject().put("action", "MEDIA_PREV")
            text.contains("müziği durdur") || text.contains("duraklat") || text.contains("müzik çal") ->
                JSONObject().put("action", "MEDIA_TOGGLE")
            else -> null
        }
    }
}

data class AiResponse(
    val replyText: String,
    val actionJson: JSONObject?
)
