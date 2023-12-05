/// <reference types="@capacitor/splash-screen" />

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.techbolide.sgr',
    appName: 'Techbolide SGR',
    webDir: 'www',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            splashFullScreen: true,
            splashImmersive: true,
            androidScaleType: 'CENTER_CROP',
            backgroundColor: '#F3F3F3',
        },
    },
};

export default config;
