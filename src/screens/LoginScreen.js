import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { loginUser, registerUser } from "../services/authService";

export default function LoginScreen({ navigation }) {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
  try {
    await loginUser(mobile, password);
    // ✅ Navigate to Home after login
    navigation.replace("Home");  
  } catch (err) {
    Alert.alert("❌ Error", err.message);
  }
};



  const handleSignup = async () => {
    try {
      await registerUser(mobile, password);
      Alert.alert("🎉 Account created", "You can log in now!");
    } catch (err) {
      Alert.alert("❌ Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🩺 Nursing App</Text>
      <TextInput
        style={styles.input}
        placeholder="Mobile Number"
        keyboardType="phone-pad"
        value={mobile}
        onChangeText={setMobile}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
  <Text style={styles.link}>New user? Create Account</Text>
</TouchableOpacity>


    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#f9f9f9" },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 30 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 15, backgroundColor: "#fff" },
  button: { backgroundColor: "#2980b9", padding: 15, borderRadius: 8, marginBottom: 15 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "600", fontSize: 16 },
  link: { color: "#2980b9", textAlign: "center" },
});
