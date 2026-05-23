import { useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors, getFrostColors } from "../constants/Colors";

const { width: windowWidth } = Dimensions.get("window");
const itemWidth = windowWidth * 0.85;
const CARD_HEIGHT = 300;

const tribeImages = {
  music: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
  fitness: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=600&q=80",
  art: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80",
  gaming: "https://images.unsplash.com/photo-1552820728-8b83bb6b1644?w=600&q=80",
  tech: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
  food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
  travel: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80",
  social: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80",
  business: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
  wellness: "https://images.unsplash.com/photo-1545389336-cf090694435e?w=600&q=80",
};

const defaultImage = "https://images.unsplash.com/photo-1518173946687-a36f968f7b8e?w=600&q=80";

function SparkCardContent({ spark, isIgnited, onUnlockSpark, onEnterChat, theme }) {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "space-between" }}>
      <View>
        <View className="flex-row justify-between items-center mb-6">
          <View
            className="px-4 py-2 rounded-full border flex-row items-center"
            style={{
              backgroundColor: `${theme.bg}CC`,
              borderColor: theme.brand,
              borderWidth: 1.5,
            }}
          >
            <Text
              className="font-black text-[11px] uppercase tracking-widest"
              style={{ color: theme.brand }}
            >
              {spark.tribe} Spark
            </Text>
            <Ionicons name="sparkles" size={14} color={theme.brand} style={{ marginLeft: 6 }} />
          </View>
          <Ionicons
            name={isIgnited ? "checkmark-circle" : "lock-closed"}
            size={20}
            color={isIgnited ? theme.semantic : theme.brand}
          />
        </View>
        <Text
          className="text-3xl  leading-8 mb-8 font-caveatbrush"
          style={{ color: theme.text }}
        >
          {spark.question}
        </Text>
      </View>
      <View>
        <TouchableOpacity
          onPress={() => (isIgnited ? onEnterChat(spark) : onUnlockSpark(spark))}
          className="py-4 rounded-full items-center flex-row justify-center"
          style={{ backgroundColor: isIgnited ? theme.semantic : theme.brand }}
        >
          <Ionicons
            name={isIgnited ? "chatbubble-ellipses" : "key"}
            size={16}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text
            className="font-black uppercase text-[12px] tracking-[2px]"
            style={{ color: "#FFFFFF" }}
          >
            {isIgnited ? "Enter Chat" : `Unlock ${spark.tribe}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SparkCarousel({
  availableSparks,
  answeredTribeSparks,
  onScroll,
  onUnlockSpark,
  onEnterChat,
  isDark,
}) {
  const theme = Colors[isDark ? "dark" : "light"];

  const getTribeImage = (tribeName) => {
    const category = (tribeName || "").toLowerCase();
    const matchedKey = Object.keys(tribeImages).find((k) => category.includes(k));
    return matchedKey ? tribeImages[matchedKey] : defaultImage;
  };

  // 1. BULLETPROOF PADDING
  const carouselData = useMemo(() => {
    if (!availableSparks || availableSparks.length === 0) return [];
    
    const originalLength = availableSparks.length;
    let paddedData = [...availableSparks];
    
    // Target a minimum of 12 items. This ensures the loop is large enough 
    // that the front card and the back card never share the same layout space.
    while (paddedData.length < 12) {
      paddedData = [...paddedData, ...availableSparks];
    }

    // Spread into NEW objects to break Reanimated identity conflicts
    return paddedData.map((item, index) => ({
      ...item, 
      _originalIndex: index % originalLength,
      _uniqueKey: `spark-${item.tribe || 'fallback'}-${index}` 
    }));
  }, [availableSparks]);

  const handleSnapToItem = useCallback((index) => {
    if (!carouselData || carouselData.length === 0) return;
    
    const currentItem = carouselData[index];
    const originalIndex = currentItem ? currentItem._originalIndex : 0;
    
    if (onScroll) {
      onScroll({ nativeEvent: { contentOffset: { x: originalIndex * windowWidth } } });
    }
  }, [onScroll, carouselData]);

  if (!availableSparks || availableSparks.length === 0) {
    return (
      <View
        className="mx-6 mb-10 min-h-[240px] p-8 items-center justify-center overflow-hidden"
        style={{
          borderRadius: 40,
          backgroundColor: theme.surface,
          borderColor: theme.brand,
          borderWidth: 1.5,
        }}
      >
        <View
          className="w-16 h-16 rounded-full items-center justify-center mb-6 border"
          style={{
            backgroundColor: theme.brandLight,
            borderColor: theme.brand,
            borderWidth: 1.5,
          }}
        >
          <Ionicons name="lock-closed" size={24} color={theme.brand} />
        </View>
        <Text
          className="text-lg font-black italic tracking-tighter mb-2"
          style={{ color: theme.text }}
        >
          SPARKS LOCKED
        </Text>
        <Text
          className="text-center text-xs font-medium leading-5 px-4"
          style={{ color: theme.textMuted }}
        >
          Join a tribe from the Tribes tab to unlock your daily questions.
        </Text>
      </View>
    );
  }

  return (
    <View className="mb-6">
      <Carousel
        // 🔥 CRITICAL FIX: This forces Reanimated to wipe its layout math and 
        // start fresh whenever you join a new tribe. No more shifting/shrinking!
        key={`carousel-${availableSparks.length}`} 
        
        data={carouselData}
        keyExtractor={(item) => item._uniqueKey}
        loop={true} 
        snapEnabled={true}
        style={{ width: windowWidth, height: CARD_HEIGHT + 20 }}
        itemWidth={itemWidth}
        mode="horizontal-stack"
        modeConfig={{
          snapDirection: "left",
          stackInterval: 20,
          scaleInterval: 0.06,
          opacityInterval: 0.1,
          translateYInterval: 0,
          disableIntervalCalculate: false,
          rotateZDeg: 0,
          showLength: 4, 
        }}
        scrollAnimationDuration={1000}
        onSnapToItem={handleSnapToItem}
        windowSize={11}
        renderItem={({ item: spark }) => {
          const isIgnited = answeredTribeSparks.includes(spark.tribe);
          const imageUrl = getTribeImage(spark.tribe);
          return (
            <View style={{ flex: 1, marginLeft: 24 }}>
              <View
                className="overflow-hidden"
                style={{
                  flex: 1,
                  borderRadius: theme.cardRadius,
                  borderColor: theme.brand,
                  borderWidth: 1.5,
                }}
              >
                <ImageBackground
                  source={{ uri: imageUrl }}
                  style={{ flex: 1 }}
                  resizeMode="cover"
                >
                  <LinearGradient
                    colors={getFrostColors(isDark)}
                    locations={[0, 0.45, 1]}
                    style={{ flex: 1 }}
                  >
                    <SparkCardContent
                      spark={spark}
                      isIgnited={isIgnited}
                      onUnlockSpark={onUnlockSpark}
                      onEnterChat={onEnterChat}
                      theme={theme}
                    />
                  </LinearGradient>
                </ImageBackground>
              </View>
            </View>
          );
        }}
      />
      
    </View>
  );
}
