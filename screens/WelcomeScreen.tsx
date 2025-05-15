import * as React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Top blue section */}
      <View style={styles.topSection} />
      
      {/* Curved section */}
      <View style={styles.curvedSection} />
      
      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>SMART FARM</Text>
        
        <View style={styles.aquariumContainer}>
          <Image 
            source={require('../assets/aquarium.png')} 
            style={styles.aquarium}
            resizeMode="contain"
          />
        </View>
        
        <TouchableOpacity 
          style={styles.button}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Main')}
        >
          <Text style={styles.buttonText}>หน้าหลัก</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  topSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    backgroundColor: '#3498db',
    zIndex: 1,
  },
  curvedSection: {
    position: 'absolute',
    top: height * 0.38, // Position it just below the top section
    left: 0,
    right: 0,
    height: height * 0.05,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    zIndex: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
    marginTop: -height * 0.2, // Pull up the title into the blue section
  },
  aquariumContainer: {
    width: width * 0.75,
    height: width * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20, // Keep rounded edges if needed
  },

  aquarium: {
    width: '130%',
    height: '130%',
  },
  button: {
    position: 'absolute',  // Make button position absolute
    bottom: height * 0.10, // Push button towards bottom dynamically
    backgroundColor: '#4682B4',
    paddingVertical: 12,
    paddingHorizontal: 45,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WelcomeScreen;