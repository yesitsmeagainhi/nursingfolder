import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { registerUser } from "../services/authService";

export default function SignupScreen({ navigation }) {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = async () => {
    if (mobile.length < 10) {
      Alert.alert("Error", "Enter a valid 10-digit mobile number");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    try {
      await registerUser(mobile, password);
      Alert.alert("✅ Success", "Account created! Please login.");
      navigation.goBack(); // back to LoginScreen
    } catch (err) {
      Alert.alert("❌ Signup Failed", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🩺 Nursing App</Text>
      <Text style={styles.subtitle}>Create New Account</Text>

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

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#f9f9f9" },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 10, color: "#2c3e50" },
  subtitle: { fontSize: 16, textAlign: "center", marginBottom: 30, color: "#7f8c8d" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 15, backgroundColor: "#fff" },
  button: { backgroundColor: "#27ae60", padding: 15, borderRadius: 8, marginBottom: 15 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "600", fontSize: 16 },
  link: { color: "#2980b9", textAlign: "center" },
});
