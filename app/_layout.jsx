import { Stack } from "expo-router";
import { Provider, useSelector } from "react-redux";
import { store } from "../store/store";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { Colors } from "../constants/Colors";
import { View, Text, StatusBar } from "react-native";

SplashScreen.preventAutoHideAsync();

function MainAppContent() {
  const { setColorScheme } = useColorScheme();
  const themeMode = useSelector((state) => state.theme.mode);
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../assets/fonts/Inter-Regular.ttf"),
    "Inter-Medium": require("../assets/fonts/Inter-Medium.ttf"),
    "Inter-SemiBold": require("../assets/fonts/Inter-SemiBold.ttf"),
    "Inter-Bold": require("../assets/fonts/Inter-Bold.ttf"),
    "Inter-ExtraBold": require("../assets/fonts/Inter-ExtraBold.ttf"),
    "Inter-Black": require("../assets/fonts/Inter-Black.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    CaveatBrush_400Regular: require("../assets/fonts/CaveatBrush_400Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    setColorScheme(themeMode);
  }, [themeMode]);

  if (!fontsLoaded) {
    return (
      <>
        <StatusBar barStyle={themeMode === "dark" ? "light-content" : "dark-content"} />
        <View style={{ flex: 1, backgroundColor: Colors[themeMode]?.bg || "#0F1923", justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: Colors[themeMode]?.text || "#EDE8DD", fontSize: 20 }}>SYNQ</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle={themeMode === "dark" ? "light-content" : "dark-content"} />
      <Stack
      key={themeMode}
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: {
          backgroundColor: Colors[themeMode].bg,
        },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="signUp" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="intrestsOnboarding" />
      <Stack.Screen name="tribe-chat" />
      <Stack.Screen name="private-chat" />
      <Stack.Screen name="tribe-details" />
    </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <MainAppContent />
      </GestureHandlerRootView>
    </Provider>
  );
}
