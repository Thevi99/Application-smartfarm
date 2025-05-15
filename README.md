🛠️ Technology Stack

Mobile Application: React Native

Cross-platform mobile framework
Native UI components
Expo for simplified development workflow
Redux for state management


Backend: Node.js, Express
Database: MongoDB
IoT Hardware: ESP8266/ESP32, Arduino
Sensors: DHT22 (Temperature/Humidity), Soil Moisture Sensors, Light Sensors
Communication: MQTT Protocol, WebSockets

###Hardware Setup
   - Upload the Arduino code from the `/arduino` directory to your ESP module
   - Connect sensors according to the wiring diagram provided in the `/docs` folder
   - Configure the WiFi and MQTT settings in the Arduino code

## 📊 System Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ IoT Devices │────▶│ MQTT Broker │────▶│ Backend API │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Database   │
                                        └─────────────┘
                                               ▲
                                               │
                                        ┌─────────────┐
                                        │Mobile/Web UI│
                                        └─────────────┘
```

## 🔄 Workflow

1. IoT sensors collect environmental data from the farm
2. Data is transmitted to the MQTT broker
3. Backend processes and stores data in the database
4. Mobile application fetches and displays data to users
5. Users can analyze data and control connected devices

## 📞 Contact

- **Developer**: Thevi99
- **GitHub**: [https://github.com/Thevi99](https://github.com/Thevi99)
- **Project Link**: [https://github.com/Thevi99/Application-smartfarm](https://github.com/Thevi99/Application-smartfarm)


