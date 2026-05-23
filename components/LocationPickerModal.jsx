import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Colors } from "../constants/Colors";

function buildAddressString(address) {
  if (!address) return "";
  const parts = [];
  if (address.name) parts.push(address.name);
  if (address.street) {
    const street = address.streetNumber
      ? `${address.streetNumber} ${address.street}`
      : address.street;
    parts.push(street);
  }
  if (address.district) parts.push(address.district);
  if (address.city) parts.push(address.city);
  if (address.region) parts.push(address.region);
  if (address.postalCode) parts.push(address.postalCode);
  if (address.country) parts.push(address.country);
  return parts.join(", ");
}

function StaticMapPreview({ latitude, longitude, theme }) {
  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=400x300&markers=color:red%7C${latitude},${longitude}&key=AIzaSyDummyKey`;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#f0f0f0",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      <View
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: [{ translateX: -12 }, { translateY: -24 }],
        }}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: theme.brand,
            borderWidth: 3,
            borderColor: "white",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="location" size={16} color="white" />
        </View>
      </View>

      <View
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: 8,
          borderRadius: theme.elementRadius,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            color: "#666",
            fontFamily: "Inter-SemiBold",
          }}
        >
          Coordinates
        </Text>
        <Text
          style={{
            fontSize: 10,
            color: "#999",
            fontFamily: "Inter-Medium",
            marginTop: 2,
          }}
        >
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </Text>
      </View>

      <View
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: 8,
          borderRadius: theme.elementRadius,
        }}
      >
        <Text
          style={{
            fontSize: 9,
            color: "#999",
            fontFamily: "Inter-Medium",
          }}
        >
          Map Preview
        </Text>
      </View>
    </View>
  );
}

export default function LocationPickerModal({
  onClose,
  onLocationSelect,
  isDark,
}) {
  const theme = Colors[isDark ? "dark" : "light"];

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const { latitude, longitude } = loc.coords;
          setSelectedLocation({ latitude, longitude });
          const [address] = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });
          setSelectedAddress(buildAddressString(address));
        }
      } catch (e) {
        console.log("[LocationPicker] Init error:", e);
      }
    })();
  }, []);

  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to use your current location.",
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      setSelectedLocation({ latitude, longitude });
      setSelectedAddress(buildAddressString(address));
    } catch (error) {
      console.log("[LocationPicker] Error getting location:", error);
      Alert.alert("Error", "Could not get your current location.");
    }
  };

  const handleSearchLocation = async () => {
    if (searchQuery.trim().length < 2) return;
    setIsSearching(true);
    try {
      const results = await Location.geocodeAsync(searchQuery);
      if (results && results.length > 0) {
        const searchResultsWithAddress = await Promise.all(
          results.slice(0, 5).map(async (result) => {
            const [address] = await Location.reverseGeocodeAsync(result);
            return {
              ...result,
              addressText: buildAddressString(address),
            };
          }),
        );
        setSearchResults(searchResultsWithAddress);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.log("[LocationPicker] Error searching location:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    setSelectedLocation({
      latitude: result.latitude,
      longitude: result.longitude,
    });
    setSelectedAddress(result.addressText);
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect({
        lat: selectedLocation.latitude,
        lng: selectedLocation.longitude,
        name: selectedAddress || "Selected Location",
      });
    }
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedLocation(null);
    setSelectedAddress("");
    onClose();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View
        className="flex-row items-center justify-between px-4 pt-4 pb-2"
        style={{
          backgroundColor: theme.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.borderLight,
        }}
      >
        <TouchableOpacity onPress={handleClose} className="p-2">
          <Ionicons name="close" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text
          className="text-lg uppercase tracking-tighter font-heading"
          style={{ color: theme.brand }}
        >
          Pick Location
        </Text>
        <View style={{ width: 34 }} />
      </View>

      <View
        className="flex-row items-center px-4 py-3"
        style={{
          backgroundColor: theme.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.borderLight,
        }}
      >
        <View
          className="flex-1 flex-row items-center mr-2"
          style={{
            borderRadius: theme.elementRadius,
            backgroundColor: theme.bg,
            borderWidth: 1,
            borderColor: theme.borderLight,
          }}
        >
          <Ionicons
            name="search"
            size={16}
            color={theme.textMuted}
            style={{ marginLeft: 12 }}
          />
          <TextInput
            placeholder="Search for a place..."
            placeholderTextColor={theme.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchLocation}
            returnKeyType="search"
            className="flex-1 p-3 pl-2 text-sm"
            style={{ fontFamily: "Inter-Medium", color: theme.text }}
          />
        </View>
        <TouchableOpacity
          onPress={handleSearchLocation}
          disabled={isSearching || searchQuery.trim().length < 2}
          className="px-4 py-3 items-center"
          style={{
            borderRadius: theme.elementRadius,
            backgroundColor:
              isSearching || searchQuery.trim().length < 2
                ? theme.border
                : theme.brand,
          }}
        >
          <Text className="text-xs uppercase tracking-wider text-white font-heading">
            {isSearching ? "..." : "Go"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {selectedLocation ? (
          <StaticMapPreview
            latitude={selectedLocation.latitude}
            longitude={selectedLocation.longitude}
            theme={theme}
          />
        ) : (
          <View
            style={{
              flex: 1,
              backgroundColor: "#f0f0f0",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="map" size={48} color="#ccc" />
            <Text
              style={{
                marginTop: 12,
                color: "#999",
                fontFamily: "Inter-Medium",
                fontSize: 14,
              }}
            >
              Search or use current location
            </Text>
          </View>
        )}

        {searchResults.length > 0 && (
          <View
            className="absolute left-4 right-4"
            style={{
              top: 8,
              maxHeight: 160,
              borderRadius: theme.elementRadius,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.borderLight,
              ...Platform.select({
                ios: {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                },
                android: { elevation: 6 },
              }),
            }}
          >
            <ScrollView>
              {searchResults.map((result, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSelectSearchResult(result)}
                  className="p-3"
                  style={{
                    borderBottomWidth:
                      index < searchResults.length - 1 ? 1 : 0,
                    borderBottomColor: theme.borderLight,
                  }}
                >
                  <Text
                    className="text-sm"
                    style={{
                      fontFamily: "Inter-SemiBold",
                      color: theme.text,
                    }}
                    numberOfLines={2}
                  >
                    {result.addressText}
                  </Text>
                  <Text
                    className="text-[10px] mt-0.5"
                    style={{
                      fontFamily: "Inter-Medium",
                      color: theme.textMuted,
                    }}
                  >
                    {result.latitude.toFixed(6)},{" "}
                    {result.longitude.toFixed(6)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <View
        className="px-4 py-4"
        style={{
          backgroundColor: theme.surface,
          borderTopWidth: 1,
          borderTopColor: theme.borderLight,
        }}
      >
        {selectedLocation ? (
          <>
            <View className="flex-row items-start mb-2">
              <Ionicons
                name="location"
                size={16}
                color={theme.semantic}
                style={{ marginTop: 2, marginRight: 8 }}
              />
              <Text
                className="text-sm flex-1"
                style={{ fontFamily: "Inter-Medium", color: theme.text }}
                numberOfLines={2}
              >
                {selectedAddress}
              </Text>
            </View>
            <View
              className="flex-row items-center self-start mb-3 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: theme.bg }}
            >
              <Ionicons
                name="locate-outline"
                size={12}
                color={theme.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text
                className="text-[10px]"
                style={{
                  fontFamily: "Inter-SemiBold",
                  color: theme.textMuted,
                  letterSpacing: 0.5,
                }}
              >
                {selectedLocation.latitude.toFixed(6)},{" "}
                {selectedLocation.longitude.toFixed(6)}
              </Text>
            </View>
          </>
        ) : (
          <Text
            className="text-xs mb-3 text-center"
            style={{ fontFamily: "Inter-Medium", color: theme.textMuted }}
          >
            Search or use current location
          </Text>
        )}

        <View className="flex-row">
          <TouchableOpacity
            onPress={handleUseCurrentLocation}
            className="flex-row flex-1 py-3 items-center justify-center mr-2"
            style={{
              borderRadius: theme.elementRadius,
              borderWidth: 1.5,
              borderColor: theme.accentGold,
              backgroundColor: theme.accentGoldLight,
            }}
          >
            <Ionicons name="locate" size={16} color={theme.accentGold} />
            <Text
              className="text-[11px] uppercase tracking-wider ml-1.5 font-heading"
              style={{ color: theme.accentGold }}
            >
              Current
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleConfirmLocation}
            disabled={!selectedLocation}
            className="flex-row flex-1 py-3 items-center justify-center ml-2"
            style={{
              borderRadius: theme.elementRadius,
              backgroundColor: selectedLocation ? theme.brand : theme.border,
            }}
          >
            <Ionicons name="checkmark" size={16} color="white" />
            <Text className="text-[11px] uppercase tracking-wider ml-1.5 font-heading text-white">
              Confirm
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
