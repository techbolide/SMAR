/// <reference types="@capacitor/splash-screen" />

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.techbolide.drs',
    appName: 'Techbolide DRS',
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
