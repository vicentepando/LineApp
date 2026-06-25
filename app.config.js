module.exports = {
  expo: {
    name: 'LineApp',
    slug: 'LineApp',
    version: '1.0.0',
    orientation: 'portrait',
    platforms: ['ios', 'android', 'web'],
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'lineapp',
    ios: {
      bundleIdentifier: 'com.vicentepando.lineapp',
      supportsTablet: true,
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId: '612cb60d-0614-48f1-b89a-560cb2e4dcff',
      },
    },
    plugins: [
      'expo-router',
      '@react-native-community/datetimepicker',
      'expo-status-bar',
      [
        'expo-image-picker',
        {
          photosPermission: 'LineApp necesita acceder a tus fotos para adjuntarlas a reportes de spots.',
          cameraPermission: 'LineApp necesita acceder a tu cámara para adjuntar fotos a reportes de spots.',
          microphonePermission: false,
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission: 'LineApp necesita tu ubicación para cargar spots en el mapa.',
        },
      ],
      [
        'react-native-maps',
        {
          iosGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
          androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      ],
    ],
  },
};