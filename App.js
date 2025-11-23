import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  Dimensions,
  Animated,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Location from "expo-location";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";

const { width: SCREEN_W } = Dimensions.get("window");
const BASE_WIDTH = 390;
const SCALE = Math.min(SCREEN_W / BASE_WIDTH, 1);
const s = (v) => Math.round(v * SCALE);

const API_KEY = "57b41f8915c9f74e218e8ade3974e4fe";

const weatherIconMap = {
  "01d": "weather-sunny",
  "01n": "weather-night",
  "02d": "weather-partly-cloudy",
  "02n": "weather-night-partly-cloudy",
  "03d": "weather-cloudy",
  "03n": "weather-cloudy",
  "04d": "weather-cloudy",
  "04n": "weather-cloudy",
  "09d": "weather-pouring",
  "09n": "weather-pouring",
  "10d": "weather-rainy",
  "10n": "weather-rainy",
  "11d": "weather-lightning",
  "11n": "weather-lightning",
  "13d": "weather-snowy",
  "13n": "weather-snowy",
  "50d": "weather-fog",
  "50n": "weather-fog",
};

export default function App() {
  const [cidade, setCidade] = useState("");
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dropAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({});
        buscarClimaPorCoords(loc.coords.latitude, loc.coords.longitude);
      } catch (e) {
        console.log("Erro ao obter localização:", e);
      }
    })();
  }, []);

  useEffect(() => {
    if (dados) {
      fadeAnim.setValue(0);
      dropAnim.setValue(10);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(dropAnim, {
          toValue: 0,
          duration: 550,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [dados]);

  const buscarClima = async () => {
    if (!cidade.trim()) {
      Alert.alert("Atenção", "Digite o nome de uma cidade.");
      return;
    }

    Keyboard.dismiss();
    setErro(null);
    setCarregando(true);
    setDados(null);

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        cidade.trim()
      )}&appid=${API_KEY}&units=metric&lang=pt_br`;

      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Cidade não encontrada");

      setDados(await resp.json());
    } catch (error) {
      setErro(error.message || "Erro ao buscar clima.");
    } finally {
      setCarregando(false);
    }
  };

  const buscarClimaPorCoords = async (lat, lon) => {
    try {
      setCarregando(true);
      setErro(null);

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=pt_br`;

      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Erro ao obter localização.");

      setDados(await resp.json());
    } catch (e) {
      setErro(e.message || "Erro inesperado.");
    } finally {
      setCarregando(false);
    }
  };

  const pedirLocalizacaoManual = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão negada", "Ative o GPS nas configurações.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      buscarClimaPorCoords(loc.coords.latitude, loc.coords.longitude);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível obter a localização.");
    }
  };

  return (
    <LinearGradient colors={["#6E54F7", "#A06BFF"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: s(28) }]}>Previsão do Tempo</Text>

        <TouchableOpacity onPress={pedirLocalizacaoManual} style={styles.iconBtn}>
          <Feather name="navigation" size={s(22)} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          placeholder="Procure uma cidade..."
          placeholderTextColor="rgba(255,255,255,0.75)"
          value={cidade}
          onChangeText={setCidade}
          style={[styles.input, { fontSize: s(16), paddingVertical: s(12) }]}
        />

        <TouchableOpacity onPress={buscarClima} style={styles.searchBtn}>
          <Text style={[styles.searchBtnText, { fontSize: s(16) }]}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {carregando && <ActivityIndicator size="large" color="#fff" style={{ marginTop: s(16) }} />}

      {erro && <Text style={[styles.error, { fontSize: s(15) }]}>{erro}</Text>}

      {dados && (
        <Animated.View
          style={[styles.cardWrapper, { opacity: fadeAnim, transform: [{ translateY: dropAnim }] }]}
        >
          <BlurView intensity={60} tint="light" style={styles.card}>
            <MaterialCommunityIcons
              name={weatherIconMap[dados.weather?.[0]?.icon] || "weather-cloudy"}
              size={s(110)}
              color="white"
              style={{ marginBottom: s(10) }}
            />

            <Text style={[styles.city, { fontSize: s(24) }]}>{dados.name}</Text>

            <Text style={[styles.temp, { fontSize: s(52) }]}>
              {Math.round(dados.main.temp)}°C
            </Text>

            <Text style={[styles.desc, { fontSize: s(18) }]}>
              {dados.weather[0].description}
            </Text>

            <View style={[styles.row, { marginTop: s(12) }]}>
              <View style={styles.infoBox}>
                <MaterialCommunityIcons name="water-percent" size={s(22)} color="white" />
                <Text style={[styles.infoValue, { fontSize: s(14) }]}>
                  {dados.main.humidity}%
                </Text>
              </View>

              <View style={styles.infoBox}>
                <MaterialCommunityIcons name="weather-windy" size={s(22)} color="white" />
                <Text style={[styles.infoValue, { fontSize: s(14) }]}>
                  {dados.wind.speed} m/s
                </Text>
              </View>

              <View style={styles.infoBox}>
                <MaterialCommunityIcons name="thermometer" size={s(22)} color="white" />
                <Text style={[styles.infoValue, { fontSize: s(14) }]}>
                  {Math.round(dados.main.feels_like)}°C
                </Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    color: "#fff",
    fontWeight: "700",
  },
  iconBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 10,
    borderRadius: 12,
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    color: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  searchBtn: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: "center",
  },
  searchBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  error: {
    color: "#FFD2D2",
    textAlign: "center",
    marginTop: 10,
  },
  cardWrapper: {
    marginTop: 18,
    width: "100%",
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 22,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
  },
  city: {
    color: "#fff",
    fontWeight: "700",
  },
  temp: {
    color: "#fff",
    fontWeight: "800",
  },
  desc: {
    color: "#fff",
    opacity: 0.9,
    textTransform: "capitalize",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  infoBox: {
    flex: 1,
    alignItems: "center",
  },
  infoValue: {
    color: "#fff",
    fontWeight: "700",
    marginTop: 4,
  },
});
