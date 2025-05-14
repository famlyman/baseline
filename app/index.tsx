import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import courtImage from '../assets/images/court.jpg';

const WelcomeScreen = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image source={courtImage} style={styles.illustration} resizeMode="contain" />
      <Text style={styles.title}>Welcome to TennisHub!</Text>
      <Text style={styles.subtitle}>Connect with your local tennis community.</Text>
      <TouchableOpacity style={styles.getStartedButton} onPress={() => {
        router.push('/RoleIntroduction');
      }}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => {
        router.push('./(public)/PublicView'); // Navigate to the public view
      }}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E7D32', // Tennis Green
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  illustration: {
    width: 300, // Adjust as needed
    height: 200, // Adjust as needed
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter', // You might need to install this font
    fontWeight: 'bold',
    color: '#FFFFFF', // White
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  getStartedButton: {
    backgroundColor: '#FBC02D', // Yellow
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginBottom: 15,
  },
  buttonText: {
    color: '#000000', // Black
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default WelcomeScreen;