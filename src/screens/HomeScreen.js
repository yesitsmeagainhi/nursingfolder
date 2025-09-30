import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { logoutUser } from "../services/authService";

export default function HomeScreen({ navigation }) {
  const handleLogout = async () => {
    try {
      await logoutUser();
      Alert.alert("👋 Logged out", "See you again!");
      navigation.replace("Login"); // go back to Login
    } catch (err) {
      Alert.alert("❌ Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏠 Welcome to Nursing App</Text>
      <Text style={styles.subtitle}>You are logged in 🎉</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f9f9f9" },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 10, color: "#2c3e50" },
  subtitle: { fontSize: 18, color: "#34495e", marginBottom: 20 },
  logoutButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
