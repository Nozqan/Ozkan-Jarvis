package com.akrepjarvis.app;

import android.content.Context;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Locale;

@CapacitorPlugin(name = "AkrepTts")
public class AkrepTextToSpeechPlugin extends Plugin implements TextToSpeech.OnInitListener {
    private TextToSpeech tts;

    @Override
    public void load() {
        tts = new TextToSpeech(getContext(), this);
    }

    @Override
    public void handleOnDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
    }

    @Override
    public void onInit(int status) {}

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        float rate = call.getFloat("rate", 1.0f);
        float pitch = call.getFloat("pitch", 1.0f);
        if (tts == null) {
            call.reject("Android metin seslendirme motoru hazır değil.");
            return;
        }
        tts.setLanguage(Locale.forLanguageTag("tr-TR"));
        tts.setSpeechRate(rate);
        tts.setPitch(pitch);
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override
            public void onStart(String utteranceId) {}
            @Override
            public void onDone(String utteranceId) {
                JSObject result = new JSObject();
                result.put("done", true);
                call.resolve(result);
            }
            @Override
            public void onError(String utteranceId) {
                call.reject("Android metin seslendirme motoru konuşmayı tamamlayamadı.");
            }
        });
        int result = tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "akrep-tts");
        if (result == TextToSpeech.ERROR) {
            call.reject("Android metin seslendirme motoru metni çalıştıramadı.");
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (tts != null) tts.stop();
        call.resolve();
    }
}
