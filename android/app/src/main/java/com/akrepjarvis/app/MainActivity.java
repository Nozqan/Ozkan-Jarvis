package com.akrepjarvis.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(AkrepSystemPlugin.class);
        registerPlugin(AkrepTextToSpeechPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onBackPressed() {
        AkrepSystemPlugin plugin = (AkrepSystemPlugin) getBridge().getPlugin("AkrepSystem").getInstance();
        if (plugin != null) {
            plugin.notifyBackPressed();
            return;
        }
        super.onBackPressed();
    }
}
