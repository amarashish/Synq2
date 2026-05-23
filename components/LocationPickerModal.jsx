import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";
import { useState, useRef, useEffect } from "react";
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

// Placeholder map for native platforms
function PlaceholderMap({ onMapClick }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#e0e0e0",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#666", fontSize: 16 }}>Map view unavailable</Text>
      <Text style={{ color: "#999", fontSize: 12, marginTop: 8 }}>
        Use web platform for map functionality
      </Text>
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
  const [mapCenter, setMapCenter] = useState([19.076, 72.8777]);
  const [mapZoom, setMapZoom] = useState(12);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const { latitude, longitude } = loc.coords;
          setSelectedLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setMapZoom(15);
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

  const handleMapMessage = async (message) => {
    try {
      const { lat, lng } = message;
      const coordinate = { latitude: lat, longitude: lng };
      setSelectedLocation([lat, lng]);
      setMapCenter([lat, lng]);
      const [address] = await Location.reverseGeocodeAsync(coordinate);
      setSelectedAddress(buildAddressString(address));
    } catch (err) {
      console.log("[LocationPicker] Map interaction error:", err);
    }
  };

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
      setSelectedLocation([latitude, longitude]);
      setSelectedAddress(buildAddressString(address));
      setMapCenter([latitude, longitude]);
      setMapZoom(15);
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
        if (searchResultsWithAddress.length > 0) {
          const first = searchResultsWithAddress[0];
          setSelectedLocation([first.latitude, first.longitude]);
          setSelectedAddress(first.addressText);
          setMapCenter([first.latitude, first.longitude]);
          setMapZoom(15);
        }
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.log("[LocationPicker] Error searching location:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect({
        lat: selectedLocation[0],
        lng: selectedLocation[1],
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
        {Platform.OS === "web" ? (
          <MapComponentWeb
            center={mapCenter}
            zoom={mapZoom}
            onMapClick={handleMapMessage}
            selectedLocation={selectedLocation}
            selectedLocationColor={theme.brand}
          />
        ) : (
          <PlaceholderMap onMapClick={handleMapMessage} />
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
                  onPress={() => {
                    setSelectedLocation([result.latitude, result.longitude]);
                    setSelectedAddress(result.addressText);
                    setSearchResults([]);
                    setSearchQuery("");
                    setMapCenter([result.latitude, result.longitude]);
                    setMapZoom(15);
                  }}
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
                {selectedLocation[0].toFixed(6)},{" "}
                {selectedLocation[1].toFixed(6)}
              </Text>
            </View>
          </>
        ) : (
          <Text
            className="text-xs mb-3 text-center"
            style={{ fontFamily: "Inter-Medium", color: theme.textMuted }}
          >
            Tap on the map or search to select a location
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

// Web-only map component using Leaflet
function MapComponentWeb({
  center,
  zoom,
  onMapClick,
  selectedLocation,
  selectedLocationColor = "#FF6B6B",
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mapContainer.current || map.current) return;

      const L = window.L;
      if (!L) {
        setTimeout(() => {
          // Retry if Leaflet not loaded yet
        }, 100);
        return;
      }

      map.current = L.map(mapContainer.current).setView(center, zoom);

      L.tileLayer(
        "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
          maxZoom: 20,
        }
      ).addTo(map.current);

      const handleMapClick = (e) => {
        const { lat, lng } = e.latlng;

        if (marker.current) {
          marker.current.setLatLng([lat, lng]);
        } else {
          marker.current = L.marker([lat, lng], { draggable: true })
            .addTo(map.current)
            .bindPopup("Location");

          marker.current.on("dragend", () => {
            const pos = marker.current.getLatLng();
            onMapClick({ type: "markerDragged", lat: pos.lat, lng: pos.lng });
          });
        }

        onMapClick({ type: "mapClicked", lat, lng });
      };

      map.current.on("click", handleMapClick);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!map.current) return;
    map.current.setView(center, zoom);
  }, [center, zoom]);

  useEffect(() => {
    if (!map.current) return;
    const L = window.L;

    if (selectedLocation) {
      if (marker.current) {
        marker.current.setLatLng(selectedLocation);
      } else {
        marker.current = L.marker(selectedLocation, { draggable: true })
          .addTo(map.current)
          .bindPopup("Location");

        marker.current.on("dragend", () => {
          const pos = marker.current.getLatLng();
          onMapClick({ type: "markerDragged", lat: pos.lat, lng: pos.lng });
        });
      }
    }
  }, [selectedLocation]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
}
