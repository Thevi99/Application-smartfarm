import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import Calendar from '../components/Calendar';

const MainScreen = () => {
  const navigation = useNavigation();
  
  const openWebDashboard = () => {
    // แทนที่ URL นี้ด้วย URL ของเว็บแอพ dashboard ของคุณ
    Linking.openURL('https://wiki.dfrobot.com/Gravity__Analog_Dissolved_Oxygen_Sensor_SKU_SEN0237');
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#888" />
        <View style={{ flex: 1 }} />
        <TouchableOpacity>
          <Ionicons name="add" size={24} color="#888" />
        </TouchableOpacity>
      </View>
      
      <Calendar />
      
      <View style={styles.dashboardContainer}>
        <TouchableOpacity 
          style={styles.dashboardButton}
          onPress={openWebDashboard}
        >
          <MaterialIcons name="dashboard" size={24} color="white" />
          <Text style={styles.dashboardText}>View Web Dashboard</Text>
          <MaterialIcons name="open-in-new" size={20} color="white" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.footerButton} 
          onPress={() => navigation.navigate('PHValue')}
        >
          <View style={styles.footerIcon}>
            <FontAwesome5 name="tint" size={24} color="black" />
          </View>
          <Text style={styles.footerText}>PH Value</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.footerButton}
          onPress={openWebDashboard}
        >
          <View style={styles.footerIcon}>
            <MaterialIcons name="dashboard" size={24} color="black" />
          </View>
          <Text style={styles.footerText}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.footerButton} 
          onPress={() => navigation.navigate('DOValue')}
        >
          <View style={styles.footerIcon}>
            <FontAwesome5 name="fish" size={24} color="black" />
          </View>
          <Text style={styles.footerText}>DO Value</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f0f0f7',
    borderRadius: 20,
    margin: 15,
  },
  dashboardContainer: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  dashboardButton: {
    backgroundColor: '#4285F4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dashboardText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#6fb1e5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  footerButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  footerText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default MainScreen;


// import React, { useState } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
// import Calendar from '../components/Calendar';

// const MainScreen = () => {
//   const navigation = useNavigation();
  
//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.searchBar}>
//         <Ionicons name="search" size={20} color="#888" />
//         <View style={{ flex: 1 }} />
//         <TouchableOpacity>
//           <Ionicons name="add" size={24} color="#888" />
//         </TouchableOpacity>
//       </View>
      
//       <Calendar />
      
//       <View style={styles.footer}>
//         <TouchableOpacity 
//           style={styles.footerButton}
//           onPress={() => navigation.navigate('PHValue')}
//         >
//           <View style={styles.footerIcon}>
//             <FontAwesome5 name="tint" size={24} color="black" />
//           </View>
//           <Text style={styles.footerText}>PH Value</Text>
//         </TouchableOpacity>
        
//         <TouchableOpacity 
//           style={styles.footerButton}
//           onPress={() => navigation.navigate('DOValue')}
//         >
//           <View style={styles.footerIcon}>
//             <FontAwesome5 name="fish" size={24} color="black" />
//           </View>
//           <Text style={styles.footerText}>Do Value</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   searchBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 15,
//     paddingVertical: 10,
//     backgroundColor: '#f0f0f7',
//     borderRadius: 20,
//     margin: 15,
//   },
//   footer: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     paddingVertical: 15,
//     backgroundColor: '#6fb1e5',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//   },
//   footerButton: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   footerIcon: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: 'white',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 5,
//   },
//   footerText: {
//     color: 'white',
//     fontWeight: '500',
//   },
// });

// export default MainScreen;



// import React, { useState } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image, ScrollView } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import { Ionicons, FontAwesome5, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';

// const MainScreen = () => {
//   const navigation = useNavigation();
//   const [selectedDate, setSelectedDate] = useState(26);
//   const [currentMonth, setCurrentMonth] = useState('June 2024');
//   const [upcomingTasks, setUpcomingTasks] = useState([
//     { id: 1, title: 'Water Change', time: '10:00 AM', type: 'maintenance' },
//     { id: 2, title: 'Feed Fish', time: '12:00 PM', type: 'daily' },
//     { id: 3, title: 'Check Filters', time: '4:00 PM', type: 'maintenance' },
//   ]);
//   const [waterStats, setWaterStats] = useState({
//     ph: 7.2,
//     ammonia: 0.0,
//     nitrite: 0.0,
//     nitrate: 5.0,
//     temperature: 25.5,
//   });
  
//   const renderCalendarDay = (day) => {
//     const isSelected = day === selectedDate;
//     const hasEvent = [5, 12, 19, 26].includes(day);
    
//     return (
//       <TouchableOpacity 
//         key={day} 
//         style={[
//           styles.calendarDay,
//           isSelected && styles.selectedDay,
//           hasEvent && !isSelected && styles.eventDay,
//         ]}
//         onPress={() => setSelectedDate(day)}
//       >
//         <Text style={[
//           styles.calendarDayText,
//           isSelected && styles.selectedDayText,
//         ]}>
//           {day}
//         </Text>
//         {hasEvent && !isSelected && <View style={styles.eventDot} />}
//       </TouchableOpacity>
//     );
//   };
  
//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <View style={styles.headerLeft}>
//           <Text style={styles.headerTitle}>My Aquarium</Text>
//           <Text style={styles.headerSubtitle}>50 Gallon Reef Tank</Text>
//         </View>
//         <TouchableOpacity style={styles.profileButton}>
//           <Image 
//             source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} 
//             style={styles.profileImage} 
//           />
//         </TouchableOpacity>
//       </View>
      
//       {/* Search Bar */}
//       <View style={styles.searchBar}>
//         <Ionicons name="search" size={20} color="#888" />
//         <Text style={styles.searchText}>Search tasks and reminders</Text>
//         <TouchableOpacity style={styles.addButton}>
//           <Ionicons name="add" size={22} color="#fff" />
//         </TouchableOpacity>
//       </View>
      
//       {/* Calendar Section */}
//       <View style={styles.calendarSection}>
//         <View style={styles.calendarHeader}>
//           <Text style={styles.calendarTitle}>{currentMonth}</Text>
//           <View style={styles.calendarControls}>
//             <TouchableOpacity>
//               <Ionicons name="chevron-back" size={24} color="#555" />
//             </TouchableOpacity>
//             <TouchableOpacity>
//               <Ionicons name="chevron-forward" size={24} color="#555" />
//             </TouchableOpacity>
//           </View>
//         </View>
        
//         <View style={styles.calendarDaysOfWeek}>
//           {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
//             <Text key={day} style={styles.dayOfWeek}>{day}</Text>
//           ))}
//         </View>
        
//         <View style={styles.calendarGrid}>
//           {/* Empty slots for days before month start */}
//           {[...Array(6)].map((_, i) => (
//             <View key={`empty-${i}`} style={styles.emptyDay} />
//           ))}
          
//           {/* Calendar days */}
//           {[...Array(30)].map((_, i) => renderCalendarDay(i + 1))}
//         </View>
//       </View>
      
//       <ScrollView style={styles.contentContainer}>
//         {/* Today's Tasks */}
//         <View style={styles.sectionContainer}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Today's Tasks</Text>
//             <TouchableOpacity>
//               <Text style={styles.seeAllText}>See All</Text>
//             </TouchableOpacity>
//           </View>
          
//           {upcomingTasks.map((task) => (
//             <View key={task.id} style={styles.taskItem}>
//               <View style={[styles.taskIcon, 
//                 task.type === 'maintenance' ? styles.maintenanceIcon : styles.dailyIcon]}>
//                 {task.type === 'maintenance' ? 
//                   <FontAwesome5 name="tools" size={16} color="#fff" /> : 
//                   <MaterialCommunityIcons name="fish-food" size={16} color="#fff" />
//                 }
//               </View>
//               <View style={styles.taskDetails}>
//                 <Text style={styles.taskTitle}>{task.title}</Text>
//                 <Text style={styles.taskTime}>{task.time}</Text>
//               </View>
//               <TouchableOpacity style={styles.taskComplete}>
//                 <Ionicons name="checkmark-circle-outline" size={24} color="#6fb1e5" />
//               </TouchableOpacity>
//             </View>
//           ))}
//         </View>
        
//         {/* Water Parameters */}
//         <View style={styles.sectionContainer}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Water Parameters</Text>
//             <TouchableOpacity>
//               <Text style={styles.seeAllText}>History</Text>
//             </TouchableOpacity>
//           </View>
          
//           <View style={styles.statsContainer}>
//             <View style={styles.statItem}>
//               <View style={[styles.statIcon, styles.phIcon]}>
//                 <FontAwesome5 name="tint" size={16} color="#fff" />
//               </View>
//               <Text style={styles.statValue}>{waterStats.ph}</Text>
//               <Text style={styles.statLabel}>pH</Text>
//             </View>
            
//             <View style={styles.statItem}>
//               <View style={[styles.statIcon, styles.ammoniaIcon]}>
//                 <MaterialCommunityIcons name="test-tube" size={16} color="#fff" />
//               </View>
//               <Text style={styles.statValue}>{waterStats.ammonia}</Text>
//               <Text style={styles.statLabel}>Ammonia</Text>
//             </View>
            
//             <View style={styles.statItem}>
//               <View style={[styles.statIcon, styles.nitriteIcon]}>
//                 <MaterialCommunityIcons name="molecule" size={16} color="#fff" />
//               </View>
//               <Text style={styles.statValue}>{waterStats.nitrite}</Text>
//               <Text style={styles.statLabel}>Nitrite</Text>
//             </View>
            
//             <View style={styles.statItem}>
//               <View style={[styles.statIcon, styles.nitrateIcon]}>
//                 <MaterialCommunityIcons name="flask" size={16} color="#fff" />
//               </View>
//               <Text style={styles.statValue}>{waterStats.nitrate}</Text>
//               <Text style={styles.statLabel}>Nitrate</Text>
//             </View>
//           </View>
//         </View>
        
//         {/* Last Water Change */}
//         <View style={styles.waterChangeContainer}>
//           <View style={styles.waterChangeLeft}>
//             <Text style={styles.waterChangeTitle}>Last Water Change</Text>
//             <Text style={styles.waterChangeDate}>5 days ago - 20%</Text>
//           </View>
//           <TouchableOpacity style={styles.waterChangeButton}>
//             <Text style={styles.waterChangeButtonText}>Log Change</Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
      
//       {/* Footer Navigation */}
//       <View style={styles.footer}>
//         <TouchableOpacity style={styles.footerButton}>
//           <View style={[styles.footerIcon, styles.activeFooterIcon]}>
//             <Ionicons name="home" size={24} color="#6fb1e5" />
//           </View>
//           <Text style={[styles.footerText, styles.activeFooterText]}>Home</Text>
//         </TouchableOpacity>
        
//         <TouchableOpacity 
//           style={styles.footerButton}
//           onPress={() => navigation.navigate('PHValue')}
//         >
//           <View style={styles.footerIcon}>
//             <FontAwesome5 name="tint" size={22} color="#555" />
//           </View>
//           <Text style={styles.footerText}>PH Value</Text>
//         </TouchableOpacity>
        
//         <TouchableOpacity 
//           style={styles.footerButton}
//           onPress={() => navigation.navigate('DOValue')}
//         >
//           <View style={styles.footerIcon}>
//             <FontAwesome5 name="fish" size={22} color="#555" />
//           </View>
//           <Text style={styles.footerText}>DO Value</Text>
//         </TouchableOpacity>
        
//         <TouchableOpacity style={styles.footerButton}>
//           <View style={styles.footerIcon}>
//             <Ionicons name="settings-outline" size={22} color="#555" />
//           </View>
//           <Text style={styles.footerText}>Settings</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     backgroundColor: '#fff',
//   },
//   headerLeft: {
//     flex: 1,
//   },
//   headerTitle: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     color: '#888',
//     marginTop: 2,
//   },
//   profileButton: {
//     height: 40,
//     width: 40,
//     borderRadius: 20,
//     overflow: 'hidden',
//   },
//   profileImage: {
//     height: '100%',
//     width: '100%',
//   },
//   searchBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 15,
//     paddingVertical: 12,
//     backgroundColor: '#f0f0f7',
//     borderRadius: 12,
//     margin: 15,
//     marginTop: 5,
//     shadowColor: '#ddd',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   searchText: {
//     flex: 1,
//     marginLeft: 10,
//     color: '#888',
//     fontSize: 15,
//   },
//   addButton: {
//     backgroundColor: '#6fb1e5',
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   calendarSection: {
//     backgroundColor: '#fff',
//     borderRadius: 15,
//     margin: 15,
//     marginTop: 5,
//     padding: 15,
//     shadowColor: '#ddd',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   calendarHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   calendarTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#333',
//   },
//   calendarControls: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   calendarDaysOfWeek: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 10,
//   },
//   dayOfWeek: {
//     flex: 1,
//     textAlign: 'center',
//     fontSize: 13,
//     fontWeight: '500',
//     color: '#888',
//   },
//   calendarGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   calendarDay: {
//     width: '14.28%',
//     height: 40,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 5,
//   },
//   emptyDay: {
//     width: '14.28%',
//     height: 40,
//   },
//   calendarDayText: {
//     fontSize: 15,
//     color: '#333',
//   },
//   selectedDay: {
//     backgroundColor: '#6fb1e5',
//     borderRadius: 20,
//     width: 36,
//     height: 36,
//   },
//   selectedDayText: {
//     color: '#fff',
//     fontWeight: '600',
//   },
//   eventDay: {
//     position: 'relative',
//   },
//   eventDot: {
//     width: 5,
//     height: 5,
//     borderRadius: 2.5,
//     backgroundColor: '#6fb1e5',
//     position: 'absolute',
//     bottom: 3,
//   },
//   contentContainer: {
//     flex: 1,
//   },
//   sectionContainer: {
//     backgroundColor: '#fff',
//     borderRadius: 15,
//     margin: 15,
//     marginTop: 5,
//     marginBottom: 10,
//     padding: 15,
//     shadowColor: '#ddd',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#333',
//   },
//   seeAllText: {
//     fontSize: 14,
//     color: '#6fb1e5',
//     fontWeight: '500',
//   },
//   taskItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   taskIcon: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 15,
//   },
//   maintenanceIcon: {
//     backgroundColor: '#ff9500',
//   },
//   dailyIcon: {
//     backgroundColor: '#34c759',
//   },
//   taskDetails: {
//     flex: 1,
//   },
//   taskTitle: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: '#333',
//     marginBottom: 2,
//   },
//   taskTime: {
//     fontSize: 13,
//     color: '#888',
//   },
//   taskComplete: {
//     padding: 5,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     flexWrap: 'wrap',
//   },
//   statItem: {
//     width: '23%',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   statIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 5,
//   },
//   phIcon: {
//     backgroundColor: '#6fb1e5',
//   },
//   ammoniaIcon: {
//     backgroundColor: '#ff9500',
//   },
//   nitriteIcon: {
//     backgroundColor: '#ff3b30',
//   },
//   nitrateIcon: {
//     backgroundColor: '#34c759',
//   },
//   statValue: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 2,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#888',
//   },
//   waterChangeContainer: {
//     backgroundColor: '#fff',
//     borderRadius: 15,
//     margin: 15,
//     marginTop: 5,
//     padding: 15,
//     shadowColor: '#ddd',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 2,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   waterChangeLeft: {
//     flex: 1,
//   },
//   waterChangeTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 2,
//   },
//   waterChangeDate: {
//     fontSize: 13,
//     color: '#888',
//   },
//   waterChangeButton: {
//     backgroundColor: '#6fb1e5',
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     borderRadius: 20,
//   },
//   waterChangeButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 14,
//   },
//   footer: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     paddingVertical: 12,
//     backgroundColor: '#fff',
//     borderTopWidth: 1,
//     borderTopColor: '#f0f0f0',
//   },
//   footerButton: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   footerIcon: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: 'white',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 2,
//     shadowColor: '#ddd',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 1,
//   },
//   activeFooterIcon: {
//     backgroundColor: '#f0f9ff',
//   },
//   footerText: {
//     color: '#888',
//     fontWeight: '500',
//     fontSize: 12,
//   },
//   activeFooterText: {
//     color: '#6fb1e5',
//   },
// });

// export default MainScreen;