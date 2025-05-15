import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import CircularProgress from '../components/CircularProgress';
import { db } from '../src/firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';

const PHValueScreen: React.FC = () => {
  const [pHValue, setPHValue] = useState<number | null>(null);
  const [abnormality, setAbnormality] = useState<number>(0);
  const [notifications, setNotifications] = useState<{ id: string; message: string }[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ฟังก์ชันเพื่อแปลง timestamp จากทุกรูปแบบให้เป็น Date object
  const parseTimestamp = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    
    try {
      // กรณีเป็น string ในรูปแบบ ISO
      if (typeof timestamp === 'string') {
        return new Date(timestamp);
      }
      // กรณีเป็น object ที่มี seconds และ nanoseconds (Firestore Timestamp)
      else if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
        return new Date(timestamp.seconds * 1000);
      }
      // กรณีเป็นตัวเลข (Unix timestamp)
      else if (typeof timestamp === 'number') {
        return new Date(timestamp);
      }
      
      return null;
    } catch (error) {
      console.error("🔥 เกิดข้อผิดพลาดขณะแปลง timestamp:", error);
      return null;
    }
  };

  // ฟังก์ชันเพื่อดึงข้อมูลจาก Firestore
  const fetchData = async () => {
    setIsRefreshing(true);

    try {
      // ใช้ query กับ `where` เพื่อดึงเอกสารที่มี sensor_id = "1"
      const q = query(collection(db, 'datalog'), where('sensor_id', '==', '1'));
      
      // ดึงข้อมูลจาก Firestore
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.warn("⚠️ ไม่มีข้อมูลใน Firestore สำหรับ sensor_id = '1'.");
        setIsRefreshing(false);
        return;
      }

      // สร้างอาร์เรย์เพื่อเก็บข้อมูลทั้งหมด
      let allData: { data: any, timestamp: Date }[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data(); // ดึงข้อมูลจากเอกสาร
        console.log("📡 ข้อมูลจาก Firestore:", data);
        
        // แปลง timestamp ให้เป็น Date object
        const timestampDate = parseTimestamp(data.timestamp);
        
        if (timestampDate) {
          allData.push({ data, timestamp: timestampDate });
        }
      });

      // เรียงข้อมูลตาม timestamp จากใหม่ไปเก่า
      allData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // ใช้ข้อมูลที่มี timestamp ล่าสุด
      if (allData.length > 0) {
        const latestData = allData[0].data;
        const latestTimestamp = allData[0].timestamp;
        
        const pH = typeof latestData.value === 'number' ? latestData.value : null;
        setPHValue(pH);
        setLastUpdated(latestTimestamp);

        let abnormalityPercent = 0;
        let notificationMessage = null;

        if (pH !== null) {
          if (pH < 6.5) {
            abnormalityPercent = ((6.5 - pH) / 6.5) * 100;
            notificationMessage = `⚠️ ค่า pH ต่ำเกินไปที่ ${pH.toFixed(2)} เวลา ${formatTimestamp(latestTimestamp.getTime())}`;
          } else if (pH > 8.5) {
            abnormalityPercent = ((pH - 8.5) / (14 - 8.5)) * 100;
            notificationMessage = `⚠️ ค่า pH สูงเกินไปที่ ${pH.toFixed(2)} เวลา ${formatTimestamp(latestTimestamp.getTime())}`;
          }
          abnormalityPercent = Math.min(Math.max(abnormalityPercent, 0), 100);
        }

        setAbnormality(Math.round(abnormalityPercent));

        if (notificationMessage) {
          setNotifications((prev) => [
            { id: Date.now().toString(), message: notificationMessage },
            ...prev,
          ]);
        }
      }
    } catch (error) {
      console.error("🔥 เกิดข้อผิดพลาดขณะดึงข้อมูลจาก Firestore:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ฟังก์ชันแปลง timestamp ให้เป็นรูปแบบที่อ่านง่าย
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} น. วันที่ ${day}/${month}/${year}`;
  };

  // ฟังก์ชันเพื่อเลือกสีตามค่า pH
  const getPHColor = () => {
    if (pHValue === null) return '#808080';  // สีเทาสำหรับไม่มีข้อมูล
    if (pHValue < 6.5) return '#F44336';     // สีแดงสำหรับกรด
    if (pHValue > 8.5) return '#9C27B0';     // สีม่วงสำหรับด่าง
    return '#4CAF50';                        // สีเขียวสำหรับปกติ
  };

  // ฟังก์ชันเพื่อเลือกสถานะของ pH
  const getPHStatus = () => {
    if (pHValue === null) return 'ไม่มีข้อมูล';
    if (pHValue < 6.5) return 'กรด (Acidic)';
    if (pHValue > 8.5) return 'ด่าง (Alkaline)';
    return 'ปกติ (Normal)';
  };

  // ฟังก์ชันสำหรับรีเฟรชข้อมูล
  const handleRefresh = () => {
    fetchData();
  };

  // ฟังก์ชันสำหรับการแสดงการแจ้งเตือนที่จะไม่ใช้ FlatList ใน ScrollView
  const renderNotifications = () => {
    if (notifications.length === 0) {
      return (
        <View style={styles.emptyNotificationContainer}>
          <MaterialCommunityIcons name="bell-sleep" size={40} color="#BDBDBD" />
          <Text style={styles.noNotificationText}>ไม่มีการแจ้งเตือนในขณะนี้</Text>
        </View>
      );
    }

    // แสดงการแจ้งเตือนโดยตรงแทนที่จะใช้ FlatList
    return (
      <View style={styles.notificationItemsContainer}>
        {notifications.map((item) => (
          <View key={item.id} style={styles.notificationBox}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#FF6F00" />
            <Text style={styles.notificationText}>{item.message}</Text>
          </View>
        ))}
      </View>
    );
  };

  useEffect(() => {
    fetchData(); // ดึงข้อมูลครั้งแรก
    const interval = setInterval(fetchData, 5000); // รีเฟรชทุก 5 นาที
    return () => clearInterval(interval); // ลบ interval เมื่อ component ถูกทำลาย
  }, []);

  // แยกการแสดงผลออกเป็นสองแบบตามการมีและไม่มี notifications
  if (notifications.length > 4) {
    // กรณีมีการแจ้งเตือนจำนวนมาก ให้ใช้ FlatList เป็นหลัก
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
        
        <LinearGradient
          colors={['#1976D2', '#64B5F6']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Water pH Monitor</Text>
          <Text style={styles.headerSubtitle}>Real-time water quality analysis</Text>
        </LinearGradient>

        {/* ส่วนแสดงผลข้อมูล pH และความผิดปกติ */}
        <View style={styles.topContentContainer}>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <MaterialCommunityIcons 
              name={isRefreshing ? "refresh" : "refresh"} 
              size={24} 
              color="#1976D2" 
              style={isRefreshing ? styles.rotating : {}}
            />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>

          <View style={[styles.card, styles.shadowProp]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="chart-bell-curve" size={24} color="#1976D2" />
              <Text style={styles.cardLabel}>ความผิดปกติ pH</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${abnormality}%`, backgroundColor: abnormality > 50 ? '#FF5252' : '#64B5F6' }]} />
              </View>
              <Text style={styles.progressText}>{abnormality}%</Text>
            </View>
          </View>

          <View style={styles.circularContainer}>
            <CircularProgress
              progress={abnormality}
              size={180}
              strokeWidth={15}
              color={getPHColor()}
              label="pH"
            />
            <View style={[styles.phBadge, { backgroundColor: getPHColor() }]}>
              <Text style={styles.phBadgeText}>{getPHStatus()}</Text>
            </View>
          </View>

          <View style={[styles.valueCard, styles.shadowProp]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="test-tube" size={24} color="#1976D2" />
              <Text style={styles.valueLabel}>ค่า pH ปัจจุบัน</Text>
            </View>
            <View style={[styles.valueContainer, { backgroundColor: getPHColor() }]}>
              <Text style={styles.valueText}>
                {pHValue !== null ? pHValue.toFixed(2) : 'รอข้อมูล'}
              </Text>
            </View>
            <Text style={styles.updateTime}>
              {lastUpdated !== null ? `อัพเดทล่าสุด: ${formatTimestamp(lastUpdated.getTime())}` : 'รอข้อมูล'}
            </Text>
          </View>
        </View>

        {/* ส่วนการแจ้งเตือน - ใช้ FlatList เป็นหลัก */}
        <View style={[styles.notificationHeaderContainer, styles.shadowProp]}>
          <View style={styles.notificationHeader}>
            <MaterialCommunityIcons name="bell-ring" size={24} color="#FF9800" />
            <Text style={styles.notificationHeaderText}>แจ้งเตือนค่า pH</Text>
          </View>
        </View>

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          style={[styles.notificationList, styles.shadowProp]}
          contentContainerStyle={styles.notificationListContent}
          renderItem={({ item }) => (
            <View style={styles.notificationBox}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#FF6F00" />
              <Text style={styles.notificationText}>{item.message}</Text>
            </View>
          )}
        />
      </SafeAreaView>
    );
  } else {
    // กรณีมีการแจ้งเตือนน้อย หรือไม่มี ให้ใช้ ScrollView
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
        
        <LinearGradient
          colors={['#1976D2', '#64B5F6']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Water pH Monitor</Text>
          <Text style={styles.headerSubtitle}>Real-time water quality analysis</Text>
        </LinearGradient>

        <ScrollView 
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <MaterialCommunityIcons 
                name={isRefreshing ? "refresh" : "refresh"} 
                size={24} 
                color="#1976D2" 
                style={isRefreshing ? styles.rotating : {}}
              />
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>

            <View style={[styles.card, styles.shadowProp]}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="chart-bell-curve" size={24} color="#1976D2" />
                <Text style={styles.cardLabel}>ความผิดปกติ pH</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${abnormality}%`, backgroundColor: abnormality > 50 ? '#FF5252' : '#64B5F6' }]} />
                </View>
                <Text style={styles.progressText}>{abnormality}%</Text>
              </View>
            </View>

            <View style={styles.circularContainer}>
              <CircularProgress
                progress={abnormality}
                size={180}
                strokeWidth={15}
                color={getPHColor()}
                label="pH"
              />
              <View style={[styles.phBadge, { backgroundColor: getPHColor() }]}>
                <Text style={styles.phBadgeText}>{getPHStatus()}</Text>
              </View>
            </View>

            <View style={[styles.valueCard, styles.shadowProp]}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="test-tube" size={24} color="#1976D2" />
                <Text style={styles.valueLabel}>ค่า pH ปัจจุบัน</Text>
              </View>
              <View style={[styles.valueContainer, { backgroundColor: getPHColor() }]}>
                <Text style={styles.valueText}>
                  {pHValue !== null ? pHValue.toFixed(2) : 'รอข้อมูล'}
                </Text>
              </View>
              <Text style={styles.updateTime}>
                {lastUpdated !== null ? `อัพเดทล่าสุด: ${formatTimestamp(lastUpdated.getTime())}` : 'รอข้อมูล'}
              </Text>
            </View>

            <View style={[styles.notificationContainer, styles.shadowProp]}>
              <View style={styles.notificationHeader}>
                <MaterialCommunityIcons name="bell-ring" size={24} color="#FF9800" />
                <Text style={styles.notificationHeaderText}>แจ้งเตือนค่า pH</Text>
              </View>
              
              {renderNotifications()}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
};


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F5F5' 
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: { 
    paddingVertical: 20, 
    alignItems: 'center',
    paddingBottom: 25,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: 'white' 
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5
  },
  content: { 
    flex: 1, 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 20 
  },
  topContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  refreshText: {
    marginLeft: 5,
    color: '#1976D2',
    fontWeight: '500',
  },
  rotating: {
    transform: [{ rotate: '45deg' }],
  },
  shadowProp: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  card: { 
    backgroundColor: 'white', 
    width: '100%', 
    borderRadius: 15, 
    padding: 15, 
    marginBottom: 20 
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardLabel: { 
    fontSize: 16, 
    marginLeft: 10,
    fontWeight: '600',
    color: '#424242'
  },
  progressBarContainer: {
    alignItems: 'center',
  },
  progressBar: { 
    height: 20, 
    width: '100%',
    backgroundColor: '#ECEFF1', 
    borderRadius: 10, 
    overflow: 'hidden', 
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: '#64B5F6', 
    borderRadius: 10 
  },
  progressText: { 
    marginTop: 8,
    fontSize: 14,
    color: '#757575',
    fontWeight: '500'
  },
  circularContainer: { 
    marginVertical: 20, 
    alignItems: 'center',
    position: 'relative',
  },
  phBadge: {
    position: 'absolute',
    bottom: 0,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
  },
  phBadgeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  valueCard: { 
    backgroundColor: 'white', 
    width: '100%', 
    borderRadius: 15, 
    padding: 15, 
  },
  valueLabel: { 
    fontSize: 16, 
    marginLeft: 10,
    fontWeight: '600',
    color: '#424242'
  },
  valueContainer: { 
    backgroundColor: '#64B5F6', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center',
    marginVertical: 10,
  },
  valueText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 28 
  },
  updateTime: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 5,
  },
  notificationContainer: { 
    width: '100%', 
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    minHeight: 150,
    marginBottom: 20,
  },
  notificationHeaderContainer: {
    width: '100%',
    paddingHorizontal: 20,
    backgroundColor: 'white',
    marginTop: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingVertical: 15,
  },
  notificationHeader: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginBottom: 10,
  },
  notificationHeaderText: {
    fontSize: 16, 
    fontWeight: '600', 
    marginLeft: 10,
    color: '#424242',
  },
  emptyNotificationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  noNotificationText: { 
    textAlign: 'center', 
    fontSize: 14, 
    color: '#9E9E9E',
    marginTop: 10,
  },
  notificationList: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 20,
  },
  notificationListContent: {
    paddingVertical: 10,
  },
  notificationItemsContainer: {
    width: '100%',
  },
  notificationBox: { 
    backgroundColor: '#FFF8E1', 
    borderRadius: 8, 
    padding: 12, 
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  notificationText: { 
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
});

export default PHValueScreen;

//////// main version 0.0.1
// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, SafeAreaView, FlatList, StatusBar, TouchableOpacity } from 'react-native';
// import CircularProgress from '../components/CircularProgress';
// import { db } from '../src/firebaseConfig';  // นำเข้า db ที่เชื่อมต่อกับ Firestore
// import { LinearGradient } from 'expo-linear-gradient';
// import { MaterialCommunityIcons } from '@expo/vector-icons';
// import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'; // เพิ่ม orderBy และ limit

// const PHValueScreen: React.FC = () => {
//   const [pHValue, setPHValue] = useState<number | null>(null);
//   const [abnormality, setAbnormality] = useState<number>(0);
//   const [notifications, setNotifications] = useState<{ id: string; message: string }[]>([]);
//   const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
//   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

//   // ฟังก์ชันเพื่อแปลง timestamp จากทุกรูปแบบให้เป็น Date object
//   const parseTimestamp = (timestamp: any): Date | null => {
//     if (!timestamp) return null;
    
//     try {
//       // กรณีเป็น string ในรูปแบบ ISO
//       if (typeof timestamp === 'string') {
//         return new Date(timestamp);
//       }
//       // กรณีเป็น object ที่มี seconds และ nanoseconds (Firestore Timestamp)
//       else if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
//         return new Date(timestamp.seconds * 1000);
//       }
//       // กรณีเป็นตัวเลข (Unix timestamp)
//       else if (typeof timestamp === 'number') {
//         return new Date(timestamp);
//       }
      
//       return null;
//     } catch (error) {
//       console.error("🔥 เกิดข้อผิดพลาดขณะแปลง timestamp:", error);
//       return null;
//     }
//   };

//   // ฟังก์ชันเพื่อดึงข้อมูลจาก Firestore
//   const fetchData = async () => {
//     setIsRefreshing(true);

//     try {
//       // ใช้ query กับ `where` เพื่อดึงเอกสารที่มี sensor_id = "1"
//       const q = query(collection(db, 'datalog'), where('sensor_id', '==', '1'));
      
//       // ดึงข้อมูลจาก Firestore
//       const querySnapshot = await getDocs(q);

//       if (querySnapshot.empty) {
//         console.warn("⚠️ ไม่มีข้อมูลใน Firestore สำหรับ sensor_id = '1'.");
//         setIsRefreshing(false);
//         return;
//       }

//       // สร้างอาร์เรย์เพื่อเก็บข้อมูลทั้งหมด
//       let allData: { data: any, timestamp: Date }[] = [];

//       querySnapshot.forEach((doc) => {
//         const data = doc.data(); // ดึงข้อมูลจากเอกสาร
//         console.log("📡 ข้อมูลจาก Firestore:", data);
        
//         // แปลง timestamp ให้เป็น Date object
//         const timestampDate = parseTimestamp(data.timestamp);
        
//         if (timestampDate) {
//           allData.push({ data, timestamp: timestampDate });
//         }
//       });

//       // เรียงข้อมูลตาม timestamp จากใหม่ไปเก่า
//       allData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

//       // ใช้ข้อมูลที่มี timestamp ล่าสุด
//       if (allData.length > 0) {
//         const latestData = allData[0].data;
//         const latestTimestamp = allData[0].timestamp;
        
//         const pH = typeof latestData.value === 'number' ? latestData.value : null;
//         setPHValue(pH);
//         setLastUpdated(latestTimestamp);

//         let abnormalityPercent = 0;
//         let notificationMessage = null;

//         if (pH !== null) {
//           if (pH < 6.5) {
//             abnormalityPercent = ((6.5 - pH) / 6.5) * 100;
//             notificationMessage = `⚠️ ค่า pH ต่ำเกินไปที่ ${pH.toFixed(2)} เวลา ${formatTimestamp(latestTimestamp.getTime())}`;
//           } else if (pH > 8.5) {
//             abnormalityPercent = ((pH - 8.5) / (14 - 8.5)) * 100;
//             notificationMessage = `⚠️ ค่า pH สูงเกินไปที่ ${pH.toFixed(2)} เวลา ${formatTimestamp(latestTimestamp.getTime())}`;
//           }
//           abnormalityPercent = Math.min(Math.max(abnormalityPercent, 0), 100);
//         }

//         setAbnormality(Math.round(abnormalityPercent));

//         if (notificationMessage) {
//           setNotifications((prev) => [
//             { id: Date.now().toString(), message: notificationMessage },
//             ...prev,
//           ]);
//         }
//       }
//     } catch (error) {
//       console.error("🔥 เกิดข้อผิดพลาดขณะดึงข้อมูลจาก Firestore:", error);
//     } finally {
//       setIsRefreshing(false);
//     }
//   };

//   // ฟังก์ชันแปลง timestamp ให้เป็นรูปแบบที่อ่านง่าย
//   const formatTimestamp = (timestamp: number) => {
//     const date = new Date(timestamp);
//     const hours = date.getHours().toString().padStart(2, '0');
//     const minutes = date.getMinutes().toString().padStart(2, '0');
//     const day = date.getDate().toString().padStart(2, '0');
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const year = date.getFullYear();
//     return `${hours}:${minutes} น. วันที่ ${day}/${month}/${year}`;
//   };

//   // ฟังก์ชันเพื่อเลือกสีตามค่า pH
//   const getPHColor = () => {
//     if (pHValue === null) return '#808080';  // สีเทาสำหรับไม่มีข้อมูล
//     if (pHValue < 6.5) return '#F44336';     // สีแดงสำหรับกรด
//     if (pHValue > 8.5) return '#9C27B0';     // สีม่วงสำหรับด่าง
//     return '#4CAF50';                        // สีเขียวสำหรับปกติ
//   };

//   // ฟังก์ชันเพื่อเลือกสถานะของ pH
//   const getPHStatus = () => {
//     if (pHValue === null) return 'ไม่มีข้อมูล';
//     if (pHValue < 6.5) return 'กรด (Acidic)';
//     if (pHValue > 8.5) return 'ด่าง (Alkaline)';
//     return 'ปกติ (Normal)';
//   };

//   // ฟังก์ชันสำหรับรีเฟรชข้อมูล
//   const handleRefresh = () => {
//     fetchData();
//   };

//   useEffect(() => {
//     fetchData(); // ดึงข้อมูลครั้งแรก
//     const interval = setInterval(fetchData, 300000); // รีเฟรชทุก 5 นาที
//     return () => clearInterval(interval); // ลบ interval เมื่อ component ถูกทำลาย
//   }, []);

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      
//       <LinearGradient
//         colors={['#1976D2', '#64B5F6']}
//         style={styles.header}
//       >
//         <Text style={styles.headerTitle}>Water pH Monitor</Text>
//         <Text style={styles.headerSubtitle}>Real-time water quality analysis</Text>
//       </LinearGradient>

//       <View style={styles.content}>
//         <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
//           <MaterialCommunityIcons 
//             name={isRefreshing ? "refresh" : "refresh"} 
//             size={24} 
//             color="#1976D2" 
//             style={isRefreshing ? styles.rotating : {}}
//           />
//           <Text style={styles.refreshText}>Refresh</Text>
//         </TouchableOpacity>

//         <View style={[styles.card, styles.shadowProp]}>
//           <View style={styles.cardHeader}>
//             <MaterialCommunityIcons name="chart-bell-curve" size={24} color="#1976D2" />
//             <Text style={styles.cardLabel}>ความผิดปกติ pH</Text>
//           </View>
//           <View style={styles.progressBarContainer}>
//             <View style={styles.progressBar}>
//               <View style={[styles.progressFill, { width: `${abnormality}%`, backgroundColor: abnormality > 50 ? '#FF5252' : '#64B5F6' }]} />
//             </View>
//             <Text style={styles.progressText}>{abnormality}%</Text>
//           </View>
//         </View>

//         <View style={styles.circularContainer}>
//           <CircularProgress
//             progress={abnormality}
//             size={180}
//             strokeWidth={15}
//             color={getPHColor()}
//             label="pH"
//           />
//           <View style={[styles.phBadge, { backgroundColor: getPHColor() }]}>
//             <Text style={styles.phBadgeText}>{getPHStatus()}</Text>
//           </View>
//         </View>

//         <View style={[styles.valueCard, styles.shadowProp]}>
//           <View style={styles.cardHeader}>
//             <MaterialCommunityIcons name="test-tube" size={24} color="#1976D2" />
//             <Text style={styles.valueLabel}>ค่า pH ปัจจุบัน</Text>
//           </View>
//           <View style={[styles.valueContainer, { backgroundColor: getPHColor() }]}>
//             <Text style={styles.valueText}>
//               {pHValue !== null ? pHValue.toFixed(2) : 'รอข้อมูล'}
//             </Text>
//           </View>
//           <Text style={styles.updateTime}>
//             {lastUpdated !== null ? `อัพเดทล่าสุด: ${formatTimestamp(lastUpdated.getTime())}` : 'รอข้อมูล'}
//           </Text>
//         </View>

//         <View style={[styles.notificationContainer, styles.shadowProp]}>
//           <View style={styles.notificationHeader}>
//             <MaterialCommunityIcons name="bell-ring" size={24} color="#FF9800" />
//             <Text style={styles.notificationHeaderText}>แจ้งเตือนค่า pH</Text>
//           </View>
          
//           {notifications.length === 0 ? (
//             <View style={styles.emptyNotificationContainer}>
//               <MaterialCommunityIcons name="bell-sleep" size={40} color="#BDBDBD" />
//               <Text style={styles.noNotificationText}>ไม่มีการแจ้งเตือนในขณะนี้</Text>
//             </View>
//           ) : (
//             <FlatList
//               data={notifications}
//               keyExtractor={(item) => item.id}
//               style={styles.notificationList}
//               renderItem={({ item }) => (
//                 <View style={styles.notificationBox}>
//                   <MaterialCommunityIcons name="alert-circle" size={20} color="#FF6F00" />
//                   <Text style={styles.notificationText}>{item.message}</Text>
//                 </View>
//               )}
//             />
//           )}
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };


// const styles = StyleSheet.create({
//   container: { 
//     flex: 1, 
//     backgroundColor: '#F5F5F5' 
//   },
//   header: { 
//     paddingVertical: 20, 
//     alignItems: 'center',
//     paddingBottom: 25,
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//   },
//   headerTitle: { 
//     fontSize: 24, 
//     fontWeight: 'bold', 
//     color: 'white' 
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     color: 'rgba(255,255,255,0.8)',
//     marginTop: 5
//   },
//   content: { 
//     flex: 1, 
//     alignItems: 'center', 
//     paddingHorizontal: 20, 
//     paddingTop: 20 
//   },
//   refreshButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     alignSelf: 'flex-end',
//     marginBottom: 10,
//     padding: 8,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255,255,255,0.8)',
//   },
//   refreshText: {
//     marginLeft: 5,
//     color: '#1976D2',
//     fontWeight: '500',
//   },
//   rotating: {
//     transform: [{ rotate: '45deg' }],
//   },
//   shadowProp: {
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 5,
//   },
//   card: { 
//     backgroundColor: 'white', 
//     width: '100%', 
//     borderRadius: 15, 
//     padding: 15, 
//     marginBottom: 20 
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   cardLabel: { 
//     fontSize: 16, 
//     marginLeft: 10,
//     fontWeight: '600',
//     color: '#424242'
//   },
//   progressBarContainer: {
//     alignItems: 'center',
//   },
//   progressBar: { 
//     height: 20, 
//     width: '100%',
//     backgroundColor: '#ECEFF1', 
//     borderRadius: 10, 
//     overflow: 'hidden', 
//   },
//   progressFill: { 
//     height: '100%', 
//     backgroundColor: '#64B5F6', 
//     borderRadius: 10 
//   },
//   progressText: { 
//     marginTop: 8,
//     fontSize: 14,
//     color: '#757575',
//     fontWeight: '500'
//   },
//   circularContainer: { 
//     marginVertical: 20, 
//     alignItems: 'center',
//     position: 'relative',
//   },
//   phBadge: {
//     position: 'absolute',
//     bottom: 0,
//     paddingHorizontal: 15,
//     paddingVertical: 5,
//     borderRadius: 20,
//     backgroundColor: '#4CAF50',
//   },
//   phBadgeText: {
//     color: 'white',
//     fontWeight: 'bold',
//   },
//   valueCard: { 
//     backgroundColor: 'white', 
//     width: '100%', 
//     borderRadius: 15, 
//     padding: 15, 
//   },
//   valueLabel: { 
//     fontSize: 16, 
//     marginLeft: 10,
//     fontWeight: '600',
//     color: '#424242'
//   },
//   valueContainer: { 
//     backgroundColor: '#64B5F6', 
//     padding: 15, 
//     borderRadius: 10, 
//     alignItems: 'center',
//     marginVertical: 10,
//   },
//   valueText: { 
//     color: 'white', 
//     fontWeight: 'bold', 
//     fontSize: 28 
//   },
//   updateTime: {
//     textAlign: 'center',
//     fontSize: 12,
//     color: '#9E9E9E',
//     marginTop: 5,
//   },
//   notificationContainer: { 
//     width: '100%', 
//     marginTop: 20,
//     backgroundColor: 'white',
//     borderRadius: 15,
//     padding: 15,
//     maxHeight: 200,
//   },
//   notificationHeader: { 
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingBottom: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEEEEE',
//     marginBottom: 10,
//   },
//   notificationHeaderText: {
//     fontSize: 16, 
//     fontWeight: '600', 
//     marginLeft: 10,
//     color: '#424242',
//   },
//   emptyNotificationContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 20,
//   },
//   noNotificationText: { 
//     textAlign: 'center', 
//     fontSize: 14, 
//     color: '#9E9E9E',
//     marginTop: 10,
//   },
//   notificationList: {
//     width: '100%',
//   },
//   notificationBox: { 
//     backgroundColor: '#FFF8E1', 
//     borderRadius: 8, 
//     padding: 12, 
//     marginVertical: 5,
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderLeftWidth: 3,
//     borderLeftColor: '#FF9800',
//   },
//   notificationText: { 
//     fontSize: 14,
//     color: '#333',
//     marginLeft: 10,
//     flex: 1,
//   },
// });

// export default PHValueScreen;


// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, SafeAreaView, FlatList, StatusBar, TouchableOpacity } from 'react-native';
// import CircularProgress from '../components/CircularProgress';
// import { db } from '../src/firebaseConfig';  // นำเข้า db ที่เชื่อมต่อกับ Firestore
// import { LinearGradient } from 'expo-linear-gradient';
// import { MaterialCommunityIcons } from '@expo/vector-icons';
// import { collection, query, where, getDocs } from 'firebase/firestore'; // ฟังก์ชันจาก Firestore

// const PHValueScreen: React.FC = () => {
//   const [pHValue, setPHValue] = useState<number | null>(null);
//   const [abnormality, setAbnormality] = useState<number>(0);
//   const [notifications, setNotifications] = useState<{ id: string; message: string }[]>([]);
//   const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

//   // ฟังก์ชันเพื่อดึงข้อมูลจาก Firestore
//   const fetchData = async () => {
//     setIsRefreshing(true);

//     try {
//       // ใช้ query กับ `where` เพื่อดึงเอกสารที่มี sensor_id = "1"
//       const q = query(collection(db, 'datalog'), where('sensor_id', '==', '1'));  // ค้นหาเอกสารในคอลเล็กชัน 'datalog'
      
//       // ดึงข้อมูลจาก Firestore
//       const querySnapshot = await getDocs(q);

//       if (querySnapshot.empty) {
//         console.warn("⚠️ ไม่มีข้อมูลใน Firestore สำหรับ sensor_id = '1'.");
//         setIsRefreshing(false);
//         return;
//       }

//       querySnapshot.forEach((doc) => {
//         const data = doc.data(); // ดึงข้อมูลจากเอกสาร
//         console.log("📡 ข้อมูลจาก Firestore:", data);

//         const pH = typeof data.value === 'number' ? data.value : null;
//         setPHValue(pH);

//         let abnormalityPercent = 0;
//         let notificationMessage = null;

//         if (pH !== null) {
//           if (pH < 6.5) {
//             abnormalityPercent = ((6.5 - pH) / 6.5) * 100;
//             notificationMessage = `⚠️ ค่า pH ต่ำเกินไปที่ ${pH.toFixed(2)} เวลา ${formatTimestamp(Date.now())}`;
//           } else if (pH > 8.5) {
//             abnormalityPercent = ((pH - 8.5) / (14 - 8.5)) * 100;
//             notificationMessage = `⚠️ ค่า pH สูงเกินไปที่ ${pH.toFixed(2)} เวลา ${formatTimestamp(Date.now())}`;
//           }
//           abnormalityPercent = Math.min(Math.max(abnormalityPercent, 0), 100);
//         }

//         setAbnormality(Math.round(abnormalityPercent));

//         if (notificationMessage) {
//           setNotifications((prev) => [
//             { id: Date.now().toString(), message: notificationMessage },
//             ...prev,
//           ]);
//         }
//       });
//     } catch (error) {
//       console.error("🔥 เกิดข้อผิดพลาดขณะดึงข้อมูลจาก Firestore:", error);
//     } finally {
//       setIsRefreshing(false);
//     }
//   };

//   // ฟังก์ชันแปลง timestamp ให้เป็นรูปแบบที่อ่านง่าย
//   const formatTimestamp = (timestamp: number) => {
//     const date = new Date(timestamp);
//     const hours = date.getHours().toString().padStart(2, '0');
//     const minutes = date.getMinutes().toString().padStart(2, '0');
//     const day = date.getDate().toString().padStart(2, '0');
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const year = date.getFullYear();
//     return `${hours}:${minutes} น. วันที่ ${day}/${month}/${year}`;
//   };

//   // ฟังก์ชันเพื่อเลือกสีตามค่า pH
//   const getPHColor = () => {
//     if (pHValue === null) return '#808080';  // สีเทาสำหรับไม่มีข้อมูล
//     if (pHValue < 6.5) return '#F44336';     // สีแดงสำหรับกรด
//     if (pHValue > 8.5) return '#9C27B0';     // สีม่วงสำหรับด่าง
//     return '#4CAF50';                        // สีเขียวสำหรับปกติ
//   };

//   // ฟังก์ชันเพื่อเลือกสถานะของ pH
//   const getPHStatus = () => {
//     if (pHValue === null) return 'ไม่มีข้อมูล';
//     if (pHValue < 6.5) return 'กรด (Acidic)';
//     if (pHValue > 8.5) return 'ด่าง (Alkaline)';
//     return 'ปกติ (Normal)';
//   };

//   // ฟังก์ชันสำหรับรีเฟรชข้อมูล
//   const handleRefresh = () => {
//     fetchData();
//   };

//   useEffect(() => {
//     fetchData(); // ดึงข้อมูลครั้งแรก
//     const interval = setInterval(fetchData, 300000); // รีเฟรชทุก 5 นาที
//     return () => clearInterval(interval); // ลบ interval เมื่อ component ถูกทำลาย
//   }, []);

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      
//       <LinearGradient
//         colors={['#1976D2', '#64B5F6']}
//         style={styles.header}
//       >
//         <Text style={styles.headerTitle}>Water pH Monitor</Text>
//         <Text style={styles.headerSubtitle}>Real-time water quality analysis</Text>
//       </LinearGradient>

//       <View style={styles.content}>
//         <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
//           <MaterialCommunityIcons 
//             name={isRefreshing ? "refresh" : "refresh"} 
//             size={24} 
//             color="#1976D2" 
//             style={isRefreshing ? styles.rotating : {}}
//           />
//           <Text style={styles.refreshText}>Refresh</Text>
//         </TouchableOpacity>

//         <View style={[styles.card, styles.shadowProp]}>
//           <View style={styles.cardHeader}>
//             <MaterialCommunityIcons name="chart-bell-curve" size={24} color="#1976D2" />
//             <Text style={styles.cardLabel}>ความผิดปกติ pH</Text>
//           </View>
//           <View style={styles.progressBarContainer}>
//             <View style={styles.progressBar}>
//               <View style={[styles.progressFill, { width: `${abnormality}%`, backgroundColor: abnormality > 50 ? '#FF5252' : '#64B5F6' }]} />
//             </View>
//             <Text style={styles.progressText}>{abnormality}%</Text>
//           </View>
//         </View>

//         <View style={styles.circularContainer}>
//           <CircularProgress
//             progress={abnormality}
//             size={180}
//             strokeWidth={15}
//             color={getPHColor()}
//             label="pH"
//           />
//           <View style={[styles.phBadge, { backgroundColor: getPHColor() }]}>
//             <Text style={styles.phBadgeText}>{getPHStatus()}</Text>
//           </View>
//         </View>

//         <View style={[styles.valueCard, styles.shadowProp]}>
//           <View style={styles.cardHeader}>
//             <MaterialCommunityIcons name="test-tube" size={24} color="#1976D2" />
//             <Text style={styles.valueLabel}>ค่า pH ปัจจุบัน</Text>
//           </View>
//           <View style={[styles.valueContainer, { backgroundColor: getPHColor() }]}>
//             <Text style={styles.valueText}>
//               {pHValue !== null ? pHValue.toFixed(2) : 'รอข้อมูล'}
//             </Text>
//           </View>
//           <Text style={styles.updateTime}>
//             {pHValue !== null ? `อัพเดทล่าสุด: ${formatTimestamp(Date.now())}` : ''}
//           </Text>
//         </View>

//         <View style={[styles.notificationContainer, styles.shadowProp]}>
//           <View style={styles.notificationHeader}>
//             <MaterialCommunityIcons name="bell-ring" size={24} color="#FF9800" />
//             <Text style={styles.notificationHeaderText}>แจ้งเตือนค่า pH</Text>
//           </View>
          
//           {notifications.length === 0 ? (
//             <View style={styles.emptyNotificationContainer}>
//               <MaterialCommunityIcons name="bell-sleep" size={40} color="#BDBDBD" />
//               <Text style={styles.noNotificationText}>ไม่มีการแจ้งเตือนในขณะนี้</Text>
//             </View>
//           ) : (
//             <FlatList
//               data={notifications}
//               keyExtractor={(item) => item.id}
//               style={styles.notificationList}
//               renderItem={({ item }) => (
//                 <View style={styles.notificationBox}>
//                   <MaterialCommunityIcons name="alert-circle" size={20} color="#FF6F00" />
//                   <Text style={styles.notificationText}>{item.message}</Text>
//                 </View>
//               )}
//             />
//           )}
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };


// const styles = StyleSheet.create({
//   container: { 
//     flex: 1, 
//     backgroundColor: '#F5F5F5' 
//   },
//   header: { 
//     paddingVertical: 20, 
//     alignItems: 'center',
//     paddingBottom: 25,
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//   },
//   headerTitle: { 
//     fontSize: 24, 
//     fontWeight: 'bold', 
//     color: 'white' 
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     color: 'rgba(255,255,255,0.8)',
//     marginTop: 5
//   },
//   content: { 
//     flex: 1, 
//     alignItems: 'center', 
//     paddingHorizontal: 20, 
//     paddingTop: 20 
//   },
//   refreshButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     alignSelf: 'flex-end',
//     marginBottom: 10,
//     padding: 8,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255,255,255,0.8)',
//   },
//   refreshText: {
//     marginLeft: 5,
//     color: '#1976D2',
//     fontWeight: '500',
//   },
//   rotating: {
//     transform: [{ rotate: '45deg' }],
//   },
//   shadowProp: {
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 5,
//   },
//   card: { 
//     backgroundColor: 'white', 
//     width: '100%', 
//     borderRadius: 15, 
//     padding: 15, 
//     marginBottom: 20 
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   cardLabel: { 
//     fontSize: 16, 
//     marginLeft: 10,
//     fontWeight: '600',
//     color: '#424242'
//   },
//   progressBarContainer: {
//     alignItems: 'center',
//   },
//   progressBar: { 
//     height: 20, 
//     width: '100%',
//     backgroundColor: '#ECEFF1', 
//     borderRadius: 10, 
//     overflow: 'hidden', 
//   },
//   progressFill: { 
//     height: '100%', 
//     backgroundColor: '#64B5F6', 
//     borderRadius: 10 
//   },
//   progressText: { 
//     marginTop: 8,
//     fontSize: 14,
//     color: '#757575',
//     fontWeight: '500'
//   },
//   circularContainer: { 
//     marginVertical: 20, 
//     alignItems: 'center',
//     position: 'relative',
//   },
//   phBadge: {
//     position: 'absolute',
//     bottom: 0,
//     paddingHorizontal: 15,
//     paddingVertical: 5,
//     borderRadius: 20,
//     backgroundColor: '#4CAF50',
//   },
//   phBadgeText: {
//     color: 'white',
//     fontWeight: 'bold',
//   },
//   valueCard: { 
//     backgroundColor: 'white', 
//     width: '100%', 
//     borderRadius: 15, 
//     padding: 15, 
//   },
//   valueLabel: { 
//     fontSize: 16, 
//     marginLeft: 10,
//     fontWeight: '600',
//     color: '#424242'
//   },
//   valueContainer: { 
//     backgroundColor: '#64B5F6', 
//     padding: 15, 
//     borderRadius: 10, 
//     alignItems: 'center',
//     marginVertical: 10,
//   },
//   valueText: { 
//     color: 'white', 
//     fontWeight: 'bold', 
//     fontSize: 28 
//   },
//   updateTime: {
//     textAlign: 'center',
//     fontSize: 12,
//     color: '#9E9E9E',
//     marginTop: 5,
//   },
//   notificationContainer: { 
//     width: '100%', 
//     marginTop: 20,
//     backgroundColor: 'white',
//     borderRadius: 15,
//     padding: 15,
//     maxHeight: 200,
//   },
//   notificationHeader: { 
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingBottom: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEEEEE',
//     marginBottom: 10,
//   },
//   notificationHeaderText: {
//     fontSize: 16, 
//     fontWeight: '600', 
//     marginLeft: 10,
//     color: '#424242',
//   },
//   emptyNotificationContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 20,
//   },
//   noNotificationText: { 
//     textAlign: 'center', 
//     fontSize: 14, 
//     color: '#9E9E9E',
//     marginTop: 10,
//   },
//   notificationList: {
//     width: '100%',
//   },
//   notificationBox: { 
//     backgroundColor: '#FFF8E1', 
//     borderRadius: 8, 
//     padding: 12, 
//     marginVertical: 5,
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderLeftWidth: 3,
//     borderLeftColor: '#FF9800',
//   },
//   notificationText: { 
//     fontSize: 14,
//     color: '#333',
//     marginLeft: 10,
//     flex: 1,
//   },
// });

// export default PHValueScreen;



// import React, { useState, useEffect } from 'react';
// import { 
//   View, 
//   Text, 
//   TouchableOpacity, 
//   StyleSheet, 
//   SafeAreaView, 
//   Image, 
//   ScrollView,
//   FlatList,
//   StatusBar,
//   Alert,
//   Platform
// } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import { Ionicons, FontAwesome5, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
// import CircularProgress from '../components/CircularProgress';
// import { LinearGradient } from 'expo-linear-gradient';

// // Mock database for demonstration (replace with your actual Firebase logic)
// const mockDatabase = {
//   getPHValue: () => {
//     // Return a random value between 5.5 and 9.5 to simulate different pH conditions
//     return Math.random() * 4 + 5.5;
//   }
// };

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
//   const [notifications, setNotifications] = useState([]);
  
//   // Function to check pH value and create notification if needed
//   const checkPHValue = () => {
//     const newPH = mockDatabase.getPHValue();
    
//     // Update water stats
//     setWaterStats(prev => ({...prev, ph: parseFloat(newPH.toFixed(2))}));
    
//     // Check if pH is outside normal range (6.5-8.5)
//     if (newPH < 6.5 || newPH > 8.5) {
//       const message = newPH < 6.5 
//         ? `⚠️ Low pH Alert: ${newPH.toFixed(2)} - Add pH buffer to increase`
//         : `⚠️ High pH Alert: ${newPH.toFixed(2)} - Add pH reducer to decrease`;
        
//       // Add notification
//       const newNotification = {
//         id: Date.now().toString(),
//         message: message,
//         timestamp: new Date().toLocaleTimeString(),
//         type: 'ph'
//       };
      
//       setNotifications(prev => [newNotification, ...prev]);
      
//       // Show in-app alert
//       Alert.alert(
//         "pH Alert",
//         message,
//         [{ text: "OK", onPress: () => console.log("OK Pressed") }]
//       );
//     }
//   };
  
//   // Simulate fetching data on component mount
//   useEffect(() => {
//     // Initial check
//     checkPHValue();
    
//     // Set interval to check pH value every 30 seconds (just for demo)
//     const interval = setInterval(checkPHValue, 30000);
    
//     return () => clearInterval(interval);
//   }, []);
  
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
  
//   // Function to get pH status
//   const getPHStatus = () => {
//     const ph = waterStats.ph;
//     if (ph < 6.5) return { text: 'Acidic', color: '#F44336' };
//     if (ph > 8.5) return { text: 'Alkaline', color: '#9C27B0' };
//     return { text: 'Normal', color: '#4CAF50' };
//   };
  
//   // pH status for display
//   const phStatus = getPHStatus();
  
//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#6fb1e5" />
      
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
      
//       {/* Notifications Panel - New */}
//       {notifications.length > 0 && (
//         <View style={styles.notificationPanel}>
//           <FlatList
//             data={notifications.slice(0, 3)}
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             keyExtractor={(item) => item.id}
//             renderItem={({ item }) => (
//               <TouchableOpacity style={styles.notificationCard}>
//                 <View style={styles.notificationIconContainer}>
//                   <MaterialCommunityIcons name="alert-circle" size={20} color="#fff" />
//                 </View>
//                 <Text style={styles.notificationMessage}>{item.message}</Text>
//                 <Text style={styles.notificationTime}>{item.timestamp}</Text>
//               </TouchableOpacity>
//             )}
//           />
//         </View>
//       )}
      
//       {/* Search Bar */}
//       <View style={styles.searchBar}>
//         <Ionicons name="search" size={20} color="#888" />
//         <Text style={styles.searchText}>Search tasks and reminders</Text>
//         <TouchableOpacity style={styles.addButton}>
//           <Ionicons name="add" size={22} color="#fff" />
//         </TouchableOpacity>
//       </View>
      
//       {/* Main Scrollable Content */}
//       <ScrollView 
//         style={styles.scrollContainer}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//       >
//         {/* Calendar Section */}
//         <View style={styles.calendarSection}>
//           <View style={styles.calendarHeader}>
//             <Text style={styles.calendarTitle}>{currentMonth}</Text>
//             <View style={styles.calendarControls}>
//               <TouchableOpacity>
//                 <Ionicons name="chevron-back" size={24} color="#555" />
//               </TouchableOpacity>
//               <TouchableOpacity>
//                 <Ionicons name="chevron-forward" size={24} color="#555" />
//               </TouchableOpacity>
//             </View>
//           </View>
          
//           <View style={styles.calendarDaysOfWeek}>
//             {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
//               <Text key={day} style={styles.dayOfWeek}>{day}</Text>
//             ))}
//           </View>
          
//           <View style={styles.calendarGrid}>
//             {/* Empty slots for days before month start */}
//             {[...Array(6)].map((_, i) => (
//               <View key={`empty-${i}`} style={styles.emptyDay} />
//             ))}
            
//             {/* Calendar days */}
//             {[...Array(30)].map((_, i) => renderCalendarDay(i + 1))}
//           </View>
//         </View>
        
//         {/* Water Quality Dashboard */}
//         <View style={styles.sectionContainer}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Water Quality</Text>
//             <TouchableOpacity style={styles.refreshButton}>
//               <MaterialCommunityIcons name="refresh" size={18} color="#6fb1e5" />
//               <Text style={styles.refreshText}>Refresh</Text>
//             </TouchableOpacity>
//           </View>
          
//           <View style={styles.waterQualityContainer}>
//             {/* pH Circle */}
//             <View style={styles.waterQualityItem}>
//               <View style={[styles.qualityCircle, { borderColor: phStatus.color }]}>
//                 <Text style={styles.qualityValue}>{waterStats.ph}</Text>
//                 <Text style={styles.qualityLabel}>pH</Text>
//                 <View style={[styles.qualityStatus, { backgroundColor: phStatus.color }]}>
//                   <Text style={styles.qualityStatusText}>{phStatus.text}</Text>
//                 </View>
//               </View>
//             </View>
            
//             {/* Other water parameters */}
//             <View style={styles.waterParamsContainer}>
//               <View style={styles.paramItem}>
//                 <View style={styles.paramIconContainer}>
//                   <MaterialCommunityIcons name="test-tube" size={18} color="#FFA726" />
//                 </View>
//                 <View style={styles.paramDetails}>
//                   <Text style={styles.paramLabel}>Ammonia</Text>
//                   <Text style={styles.paramValue}>{waterStats.ammonia.toFixed(1)} ppm</Text>
//                 </View>
//               </View>
              
//               <View style={styles.paramItem}>
//                 <View style={styles.paramIconContainer}>
//                   <MaterialCommunityIcons name="molecule" size={18} color="#EF5350" />
//                 </View>
//                 <View style={styles.paramDetails}>
//                   <Text style={styles.paramLabel}>Nitrite</Text>
//                   <Text style={styles.paramValue}>{waterStats.nitrite.toFixed(1)} ppm</Text>
//                 </View>
//               </View>
              
//               <View style={styles.paramItem}>
//                 <View style={styles.paramIconContainer}>
//                   <MaterialCommunityIcons name="flask" size={18} color="#66BB6A" />
//                 </View>
//                 <View style={styles.paramDetails}>
//                   <Text style={styles.paramLabel}>Nitrate</Text>
//                   <Text style={styles.paramValue}>{waterStats.nitrate.toFixed(1)} ppm</Text>
//                 </View>
//               </View>
              
//               <View style={styles.paramItem}>
//                 <View style={styles.paramIconContainer}>
//                   <MaterialCommunityIcons name="thermometer" size={18} color="#29B6F6" />
//                 </View>
//                 <View style={styles.paramDetails}>
//                   <Text style={styles.paramLabel}>Temp</Text>
//                   <Text style={styles.paramValue}>{waterStats.temperature.toFixed(1)}°C</Text>
//                 </View>
//               </View>
//             </View>
//           </View>
//         </View>
        
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
        
//         {/* Notification History */}
//         <View style={styles.sectionContainer}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Notification History</Text>
//             <TouchableOpacity>
//               <Text style={styles.seeAllText}>Clear All</Text>
//             </TouchableOpacity>
//           </View>
          
//           {notifications.length === 0 ? (
//             <View style={styles.emptyNotificationsContainer}>
//               <MaterialCommunityIcons name="bell-sleep" size={40} color="#BDBDBD" />
//               <Text style={styles.emptyNotificationsText}>No notifications yet</Text>
//             </View>
//           ) : (
//             notifications.map((notification) => (
//               <View key={notification.id} style={styles.notificationHistoryItem}>
//                 <View style={styles.notificationHistoryIcon}>
//                   <MaterialCommunityIcons name="alert-circle" size={18} color="#FF9800" />
//                 </View>
//                 <View style={styles.notificationHistoryContent}>
//                   <Text style={styles.notificationHistoryMessage}>{notification.message}</Text>
//                   <Text style={styles.notificationHistoryTime}>{notification.timestamp}</Text>
//                 </View>
//                 <TouchableOpacity>
//                   <MaterialCommunityIcons name="close" size={18} color="#888" />
//                 </TouchableOpacity>
//               </View>
//             ))
//           )}
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

// // PHValueScreen component with ScrollView implemented
// const PHValueScreen = () => {
//   const navigation = useNavigation();
//   const [pHValue, setPHValue] = useState(7.2);
//   const [abnormality, setAbnormality] = useState(0);
//   const [notifications, setNotifications] = useState([]);
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   const fetchData = () => {
//     // Simulating database fetch with a random pH value
//     setIsRefreshing(true);
    
//     // Simulating network delay
//     setTimeout(() => {
//       // Generate a random pH between 5.5 and 9.0 to demonstrate different states
//       const randomPH = Math.random() * 3.5 + 5.5;
//       setPHValue(randomPH);
      
//       let abnormalityPercent = 0;
//       let notificationMessage = null;

//       if (randomPH < 6.5) {
//         abnormalityPercent = ((6.5 - randomPH) / 6.5) * 100;
//         notificationMessage = `⚠️ pH value too low at ${randomPH.toFixed(2)} - ${formatTimestamp(Date.now())}`;
//       } else if (randomPH > 8.5) {
//         abnormalityPercent = ((randomPH - 8.5) / (14 - 8.5)) * 100;
//         notificationMessage = `⚠️ pH value too high at ${randomPH.toFixed(2)} - ${formatTimestamp(Date.now())}`;
//       }
      
//       abnormalityPercent = Math.min(Math.max(abnormalityPercent, 0), 100);
//       setAbnormality(Math.round(abnormalityPercent));

//       if (notificationMessage) {
//         const newNotif = { 
//           id: Date.now().toString(), 
//           message: notificationMessage 
//         };
        
//         setNotifications(prev => [newNotif, ...prev]);
        
//         // Show alert for abnormal pH
//         Alert.alert(
//           "pH Alert",
//           `Abnormal pH detected: ${randomPH.toFixed(2)}`,
//           [{ text: "OK", onPress: () => console.log("OK Pressed") }]
//         );
//       }
      
//       setIsRefreshing(false);
//     }, 1000);
//   };

//   useEffect(() => {
//     fetchData();
//     const interval = setInterval(fetchData, 300000); // Every 5 minutes
//     return () => clearInterval(interval);
//   }, []);

//   const formatTimestamp = (timestamp) => {
//     const date = new Date(timestamp);
//     const hours = date.getHours().toString().padStart(2, '0');
//     const minutes = date.getMinutes().toString().padStart(2, '0');
//     const day = date.getDate().toString().padStart(2, '0');
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const year = date.getFullYear();
//     return `${hours}:${minutes} - ${day}/${month}/${year}`;
//   };

//   // Function to determine color based on pH value
//   const getPHColor = () => {
//     if (pHValue === null) return '#808080';  // Gray for no data
//     if (pHValue < 6.5) return '#F44336';     // Red for acidic
//     if (pHValue > 8.5) return '#9C27B0';     // Purple for alkaline
//     return '#4CAF50';                        // Green for normal
//   };

//   // Function to get status text
//   const getPHStatus = () => {
//     if (pHValue === null) return 'No Data';
//     if (pHValue < 6.5) return 'Acidic';
//     if (pHValue > 8.5) return 'Alkaline';
//     return 'Normal';
//   };

//   return (
//     <SafeAreaView style={styles.phContainer}>
//       <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      
//       <LinearGradient
//         colors={['#1976D2', '#64B5F6']}
//         style={styles.phHeader}
//       >
//         <View style={styles.phHeaderContent}>
//           <TouchableOpacity 
//             style={styles.backButton}
//             onPress={() => navigation.goBack()}
//           >
//             <Ionicons name="arrow-back" size={24} color="white" />
//           </TouchableOpacity>
//           <View style={styles.phHeaderTextContainer}>
//             <Text style={styles.phHeaderTitle}>Water pH Monitor</Text>
//             <Text style={styles.phHeaderSubtitle}>Real-time water quality analysis</Text>
//           </View>
//         </View>
//       </LinearGradient>

//       <ScrollView 
//         style={styles.phContent} 
//         contentContainerStyle={styles.phContentContainer}
//         showsVerticalScrollIndicator={false}
//       >
//         <TouchableOpacity style={styles.phRefreshButton} onPress={fetchData}>
//           <MaterialCommunityIcons 
//             name="refresh" 
//             size={24} 
//             color="#1976D2" 
//             style={isRefreshing ? styles.rotating : {}}
//           />
//           <Text style={styles.phRefreshText}>Refresh</Text>
//         </TouchableOpacity>

//         <View style={[styles.phCard, styles.shadowProp]}>
//           <View style={styles.phCardHeader}>
//             <MaterialCommunityIcons name="chart-bell-curve" size={24} color="#1976D2" />
//             <Text style={styles.phCardLabel}>pH Abnormality</Text>
//           </View>
//           <View style={styles.phProgressBarContainer}>
//             <View style={styles.phProgressBar}>
//               <View style={[styles.phProgressFill, { 
//                 width: `${abnormality}%`, 
//                 backgroundColor: abnormality > 50 ? '#FF5252' : '#64B5F6' 
//               }]} />
//             </View>
//             <Text style={styles.phProgressText}>{abnormality}%</Text>
//           </View>
//         </View>

//         <View style={styles.phCircularContainer}>
//           <CircularProgress
//             progress={abnormality}
//             size={180}
//             strokeWidth={15}
//             color={getPHColor()}
//             label="pH"
//           />
//           <View style={[styles.phValueBadge, { backgroundColor: getPHColor() }]}>
//             <Text style={styles.phValueBadgeText}>{getPHStatus()}</Text>
//           </View>
//         </View>

//         <View style={[styles.phValueCard, styles.shadowProp]}>
//           <View style={styles.phCardHeader}>
//             <MaterialCommunityIcons name="test-tube" size={24} color="#1976D2" />
//             <Text style={styles.phValueLabel}>Current pH Value</Text>
//           </View>
//           <View style={[styles.phValueContainer, { backgroundColor: getPHColor() }]}>
//             <Text style={styles.phValueText}>
//               {pHValue !== null ? pHValue.toFixed(2) : 'Waiting for data...'}
//             </Text>
//           </View>
//           <Text style={styles.phUpdateTime}>
//             {pHValue !== null ? `Last updated: ${formatTimestamp(Date.now())}` : ''}
//           </Text>
//         </View>

//         <View style={[styles.phNotificationContainer, styles.shadowProp]}>
//           <View style={styles.phNotificationHeader}>
//             <MaterialCommunityIcons name="bell-ring" size={24} color="#FF9800" />
//             <Text style={styles.phNotificationHeaderText}>pH Alerts</Text>
//           </View>
          
//           {notifications.length === 0 ? (
//             <View style={styles.phEmptyNotificationContainer}>
//               <MaterialCommunityIcons name="bell-sleep" size={40} color="#BDBDBD" />
//               <Text style={styles.phNoNotificationText}>No alerts at this time</Text>
//             </View>
//           ) : (
//             <FlatList
//               data={notifications}
//               keyExtractor={(item) => item.id}
//               style={styles.phNotificationList}
//               scrollEnabled={false}
//               nestedScrollEnabled={true}
//               renderItem={({ item }) => (
//                 <View style={styles.phNotificationBox}>
//                   <MaterialCommunityIcons name="alert-circle" size={20} color="#FF6F00" />
//                   <Text style={styles.phNotificationText}>{item.message}</Text>
//                 </View>
//               )}
//             />
//           )}
//         </View>
        
//         {/* pH Recommendation Card */}
//         <View style={[styles.phRecommendationCard, styles.shadowProp]}>
//           <View style={styles.phCardHeader}>
//             <MaterialCommunityIcons name="lightbulb-on" size={24} color="#FF9800" />
//             <Text style={styles.phCardLabel}>Recommendations</Text>
//           </View>
          
//           <View style={styles.phRecommendationContent}>
//             {pHValue < 6.5 && (
//               <Text style={styles.phRecommendationText}>
//                 Your water is too acidic. Consider adding a pH buffer or limestone to gradually increase the pH level.
//               </Text>
//             )}
            
//             {pHValue > 8.5 && (
//               <Text style={styles.phRecommendationText}>
//                 Your water is too alkaline. Consider adding pH reducer or perform a partial water change with lower pH water.
//               </Text>
//             )}
            
//             {pHValue >= 6.5 && pHValue <= 8.5 && (
//               <Text style={styles.phRecommendationText}>
//                 Your pH level is within the optimal range. Continue regular monitoring to maintain water quality.
//               </Text>
//             )}
//           </View>
          
//           <TouchableOpacity style={styles.phLearnMoreButton}>
//             <Text style={styles.phLearnMoreText}>Learn More</Text>
//           </TouchableOpacity>
//         </View>
        
//         {/* Extra space at bottom for comfortable scrolling */}
//         <View style={styles.bottomSpacing} />
//       </ScrollView>
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
//   notificationPanel: {
//     paddingVertical: 10,
//     paddingHorizontal: 15,
//     backgroundColor: '#f3f7fa',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e3e8ec',
//   },
//   notificationCard: {
//     backgroundColor: '#fff',
//     borderRadius: 10,
//     padding: 12,
//     marginRight: 10,
//     minWidth: 240,
//     maxWidth: 300,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   notificationIconContainer: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: '#FF9800',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 10,
//   },
//   notificationMessage: {
//     flex: 1,
//     fontSize: 14,
//     color: '#333',
//   },
//   notificationTime: {
//     fontSize: 12,
//     color: '#999',
//     marginTop: 4,
//   },
//   searchBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 15,
//     paddingVertical: 12,
//     backgroundColor: '#f0f0f7',
//     borderRadius: 12,
//     margin: 15,
//     marginTop: 10,
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
//   scrollContainer: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingBottom: 20,
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
//   refreshButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f0f9ff',
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     borderRadius: 15,
//   },
//   refreshText: {
//     color: '#6fb1e5',
//     fontSize: 12,
//     fontWeight: '500',
//     marginLeft: 5,
//   },
//   seeAllText: {
//     fontSize: 14,
//     color: '#6fb1e5',
//     fontWeight: '500',
//   },
//   waterQualityContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     flexWrap: 'wrap',
//   },
//   waterQualityItem: {
//     width: '40%',
//     alignItems: 'center',
//   },
//   qualityCircle: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     borderWidth: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     position: 'relative',
//   },
//   qualityValue: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   qualityLabel: {
//     fontSize: 16,
//     color: '#555',
//   },
//   qualityStatus: {
//     position: 'absolute',
//     bottom: -10,
//     backgroundColor: '#4CAF50',
//     paddingHorizontal: 10,
//     paddingVertical: 3,
//     borderRadius: 10,
//   },
//   qualityStatusText: {
//     color: 'white',
//     fontWeight: '600',
//     fontSize: 12,
//   },
//   waterParamsContainer: {
//     width: '55%',
//   },
//   paramItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   paramIconContainer: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: '#f5f5f5',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 10,
//   },
//   paramDetails: {
//     flex: 1,
//   },
//   paramLabel: {
//     fontSize: 14,
//     color: '#777',
//   },
//   paramValue: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
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
//   emptyNotificationsContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 30,
//   },
//   emptyNotificationsText: {
//     fontSize: 14,
//     color: '#999',
//     marginTop: 10,
//   },
//   notificationHistoryItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   notificationHistoryIcon: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: '#FFF8E1',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 15,
//   },
//   notificationHistoryContent: {
//     flex: 1,
//   },
//   notificationHistoryMessage: {
//     fontSize: 14,
//     color: '#333',
//     marginBottom: 2,
//   },
//   notificationHistoryTime: {
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
  
//   // PHValueScreen Styles
//   phContainer: { 
//     flex: 1, 
//     backgroundColor: '#F5F5F5' 
//   },
//   phHeader: { 
//     paddingVertical: 20, 
//     paddingBottom: 25,
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//   },
//   phHeaderContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   backButton: {
//     marginRight: 15,
//   },
//   phHeaderTextContainer: {
//     flex: 1,
//   },
//   phHeaderTitle: { 
//     fontSize: 24, 
//     fontWeight: 'bold', 
//     color: 'white' 
//   },
//   phHeaderSubtitle: {
//     fontSize: 14,
//     color: 'rgba(255,255,255,0.8)',
//     marginTop: 5
//   },
//   phContent: { 
//     flex: 1,
//   },
//   phContentContainer: {
//     paddingHorizontal: 20,
//     paddingTop: 20,
//     paddingBottom: 30,
//   },
//   phRefreshButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     alignSelf: 'flex-end',
//     marginBottom: 10,
//     padding: 8,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255,255,255,0.8)',
//   },
//   phRefreshText: {
//     marginLeft: 5,
//     color: '#1976D2',
//     fontWeight: '500',
//   },
//   rotating: {
//     transform: [{ rotate: '45deg' }],
//   },
//   shadowProp: {
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 5,
//   },
//   phCard: { 
//     backgroundColor: 'white', 
//     width: '100%', 
//     borderRadius: 15, 
//     padding: 15, 
//     marginBottom: 20 
//   },
//   phCardHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   phCardLabel: { 
//     fontSize: 16, 
//     marginLeft: 10,
//     fontWeight: '600',
//     color: '#424242'
//   },
//   phProgressBarContainer: {
//     alignItems: 'center',
//   },
//   phProgressBar: { 
//     height: 20, 
//     width: '100%',
//     backgroundColor: '#ECEFF1', 
//     borderRadius: 10, 
//     overflow: 'hidden', 
//   },
//   phProgressFill: { 
//     height: '100%', 
//     backgroundColor: '#64B5F6', 
//     borderRadius: 10 
//   },
//   phProgressText: { 
//     marginTop: 8,
//     fontSize: 14,
//     color: '#757575',
//     fontWeight: '500'
//   },
//   phCircularContainer: { 
//     marginVertical: 20, 
//     alignItems: 'center',
//     position: 'relative',
//   },
//   phValueBadge: {
//     position: 'absolute',
//     bottom: 0,
//     paddingHorizontal: 15,
//     paddingVertical: 5,
//     borderRadius: 20,
//     backgroundColor: '#4CAF50',
//   },
//   phValueBadgeText: {
//     color: 'white',
//     fontWeight: 'bold',
//   },
//   phValueCard: { 
//     backgroundColor: 'white', 
//     width: '100%', 
//     borderRadius: 15, 
//     padding: 15, 
//   },
//   phValueLabel: { 
//     fontSize: 16, 
//     marginLeft: 10,
//     fontWeight: '600',
//     color: '#424242'
//   },
//   phValueContainer: { 
//     backgroundColor: '#64B5F6', 
//     padding: 15, 
//     borderRadius: 10, 
//     alignItems: 'center',
//     marginVertical: 10,
//   },
//   phValueText: { 
//     color: 'white', 
//     fontWeight: 'bold', 
//     fontSize: 28 
//   },
//   phUpdateTime: {
//     textAlign: 'center',
//     fontSize: 12,
//     color: '#9E9E9E',
//     marginTop: 5,
//   },
//   phNotificationContainer: { 
//     width: '100%', 
//     marginTop: 20,
//     backgroundColor: 'white',
//     borderRadius: 15,
//     padding: 15,
//     marginBottom: 20,
//   },
//   phNotificationHeader: { 
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingBottom: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEEEEE',
//     marginBottom: 10,
//   },
//   phNotificationHeaderText: {
//     fontSize: 16, 
//     fontWeight: '600', 
//     marginLeft: 10,
//     color: '#424242',
//   },
//   phEmptyNotificationContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 20,
//   },
//   phNoNotificationText: { 
//     textAlign: 'center', 
//     fontSize: 14, 
//     color: '#9E9E9E',
//     marginTop: 10,
//   },
//   phNotificationList: {
//     width: '100%',
//   },
//   phNotificationBox: { 
//     backgroundColor: '#FFF8E1', 
//     borderRadius: 8, 
//     padding: 12, 
//     marginVertical: 5,
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderLeftWidth: 3,
//     borderLeftColor: '#FF9800',
//   },
//   phNotificationText: { 
//     fontSize: 14,
//     color: '#333',
//     marginLeft: 10,
//     flex: 1,
//   },
//   phRecommendationCard: {
//     backgroundColor: 'white',
//     width: '100%',
//     borderRadius: 15,
//     padding: 15,
//   },
//   phRecommendationContent: {
//     padding: 10,
//     backgroundColor: '#f9f9f9',
//     borderRadius: 8,
//     marginBottom: 15,
//   },
//   phRecommendationText: {
//     fontSize: 14,
//     lineHeight: 20,
//     color: '#424242',
//   },
//   phLearnMoreButton: {
//     alignSelf: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 8,
//     backgroundColor: '#FF9800',
//     borderRadius: 20,
//   },
//   phLearnMoreText: {
//     color: 'white',
//     fontWeight: '600',
//     fontSize: 14,
//   },
//   bottomSpacing: {
//     height: 30,
//   },
// });

// export default MainScreen;
    





// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, SafeAreaView, FlatList, StatusBar, Image, TouchableOpacity } from 'react-native';
// import CircularProgress from '../components/CircularProgress';
// import { database } from '../src/firebaseConfig';
// import { LinearGradient } from 'expo-linear-gradient';
// import { MaterialCommunityIcons } from '@expo/vector-icons';

// const PHValueScreen: React.FC = () => {
//   const [pHValue, setPHValue] = useState<number | null>(null);
//   const [abnormality, setAbnormality] = useState<number>(0);
//   const [notifications, setNotifications] = useState<{ id: string; message: string }[]>([]);
//   const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

//   const fetchData = () => {
//     if (!database) {
//       console.error("🔥 Firebase database is not initialized.");
//       return;
//     }

//     setIsRefreshing(true);
//     const sensorRef = database.ref('/sensor/data');

//     sensorRef.once('value', (snapshot: any) => {
//       setIsRefreshing(false);
//       if (!snapshot.exists()) {
//         console.warn("⚠️ No data found in Firebase.");
//         return;
//       }

//       const data = snapshot.val();
//       console.log("📡 Received data from Firebase:", data);

//       const pH = typeof data.pH === 'number' ? data.pH : null;
//       setPHValue(pH);

//       let abnormalityPercent = 0;
//       let notificationMessage = null;

//       if (pH !== null) {
//         if (pH < 6.5) {
//           abnormalityPercent = ((6.5 - pH) / 6.5) * 100;
//           notificationMessage = `⚠️ ค่า pH ต่ำเกินไปที่ ${pH.toFixed(2)} เวลา ${formatTimestamp(Date.now())}`;
//         } else if (pH > 8.5) {
//           abnormalityPercent = ((pH - 8.5) / (14 - 8.5)) * 100;
//           notificationMessage = `⚠️ ค่า pH สูงเกินไปที่ ${pH.toFixed(2)} เวลา ${formatTimestamp(Date.now())}`;
//         }
//         abnormalityPercent = Math.min(Math.max(abnormalityPercent, 0), 100);
//       }

//       setAbnormality(Math.round(abnormalityPercent));

//       if (notificationMessage) {
//         setNotifications((prev) => [
//           { id: Date.now().toString(), message: notificationMessage },
//           ...prev,
//         ]);
//       }
//     });
//   };

//   useEffect(() => {
//     fetchData(); // ดึงข้อมูลครั้งแรก
//     const interval = setInterval(fetchData, 300000);
//     return () => clearInterval(interval);
//   }, []);

//   const formatTimestamp = (timestamp: number) => {
//     const date = new Date(timestamp);
//     const hours = date.getHours().toString().padStart(2, '0');
//     const minutes = date.getMinutes().toString().padStart(2, '0');
//     const day = date.getDate().toString().padStart(2, '0');
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const year = date.getFullYear();
//     return `${hours}:${minutes} น. วันที่ ${day}/${month}/${year}`;
//   };

//   // Function to determine color based on pH value
//   const getPHColor = () => {
//     if (pHValue === null) return '#808080';  // Gray for no data
//     if (pHValue < 6.5) return '#F44336';     // Red for acidic
//     if (pHValue > 8.5) return '#9C27B0';     // Purple for alkaline
//     return '#4CAF50';                        // Green for normal
//   };

//   // Function to get status text
//   const getPHStatus = () => {
//     if (pHValue === null) return 'ไม่มีข้อมูล';
//     if (pHValue < 6.5) return 'กรด (Acidic)';
//     if (pHValue > 8.5) return 'ด่าง (Alkaline)';
//     return 'ปกติ (Normal)';
//   };

//   // Manual refresh handler
//   const handleRefresh = () => {
//     fetchData();
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      
//       <LinearGradient
//         colors={['#1976D2', '#64B5F6']}
//         style={styles.header}
//       >
//         <Text style={styles.headerTitle}>Water pH Monitor</Text>
//         <Text style={styles.headerSubtitle}>Real-time water quality analysis</Text>
//       </LinearGradient>

//       <View style={styles.content}>
//         <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
//           <MaterialCommunityIcons 
//             name={isRefreshing ? "refresh" : "refresh"} 
//             size={24} 
//             color="#1976D2" 
//             style={isRefreshing ? styles.rotating : {}}
//           />
//           <Text style={styles.refreshText}>Refresh</Text>
//         </TouchableOpacity>

//         <View style={[styles.card, styles.shadowProp]}>
//           <View style={styles.cardHeader}>
//             <MaterialCommunityIcons name="chart-bell-curve" size={24} color="#1976D2" />
//             <Text style={styles.cardLabel}>ความผิดปกติ pH</Text>
//           </View>
//           <View style={styles.progressBarContainer}>
//             <View style={styles.progressBar}>
//               <View style={[styles.progressFill, { width: `${abnormality}%`, backgroundColor: abnormality > 50 ? '#FF5252' : '#64B5F6' }]} />
//             </View>
//             <Text style={styles.progressText}>{abnormality}%</Text>
//           </View>
//         </View>

//         <View style={styles.circularContainer}>
//           <CircularProgress
//             progress={abnormality}
//             size={180}
//             strokeWidth={15}
//             color={getPHColor()}
//             label="pH"
//           />
//           <View style={[styles.phBadge, { backgroundColor: getPHColor() }]}>
//             <Text style={styles.phBadgeText}>{getPHStatus()}</Text>
//           </View>
//         </View>

//         <View style={[styles.valueCard, styles.shadowProp]}>
//           <View style={styles.cardHeader}>
//             <MaterialCommunityIcons name="test-tube" size={24} color="#1976D2" />
//             <Text style={styles.valueLabel}>ค่า pH ปัจจุบัน</Text>
//           </View>
//           <View style={[styles.valueContainer, { backgroundColor: getPHColor() }]}>
//             <Text style={styles.valueText}>
//               {pHValue !== null ? pHValue.toFixed(2) : 'รอข้อมูล'}
//             </Text>
//           </View>
//           <Text style={styles.updateTime}>
//             {pHValue !== null ? `อัพเดทล่าสุด: ${formatTimestamp(Date.now())}` : ''}
//           </Text>
//         </View>

//         <View style={[styles.notificationContainer, styles.shadowProp]}>
//           <View style={styles.notificationHeader}>
//             <MaterialCommunityIcons name="bell-ring" size={24} color="#FF9800" />
//             <Text style={styles.notificationHeaderText}>แจ้งเตือนค่า pH</Text>
//           </View>
          
//           {notifications.length === 0 ? (
//             <View style={styles.emptyNotificationContainer}>
//               <MaterialCommunityIcons name="bell-sleep" size={40} color="#BDBDBD" />
//               <Text style={styles.noNotificationText}>ไม่มีการแจ้งเตือนในขณะนี้</Text>
//             </View>
//           ) : (
//             <FlatList
//               data={notifications}
//               keyExtractor={(item) => item.id}
//               style={styles.notificationList}
//               renderItem={({ item }) => (
//                 <View style={styles.notificationBox}>
//                   <MaterialCommunityIcons name="alert-circle" size={20} color="#FF6F00" />
//                   <Text style={styles.notificationText}>{item.message}</Text>
//                 </View>
//               )}
//             />
//           )}
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { 
//     flex: 1, 
//     backgroundColor: '#F5F5F5' 
//   },
//   header: { 
//     paddingVertical: 20, 
//     alignItems: 'center',
//     paddingBottom: 25,
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//   },
//   headerTitle: { 
//     fontSize: 24, 
//     fontWeight: 'bold', 
//     color: 'white' 
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     color: 'rgba(255,255,255,0.8)',
//     marginTop: 5
//   },
//   content: { 
//     flex: 1, 
//     alignItems: 'center', 
//     paddingHorizontal: 20, 
//     paddingTop: 20 
//   },
//   refreshButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     alignSelf: 'flex-end',
//     marginBottom: 10,
//     padding: 8,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255,255,255,0.8)',
//   },
//   refreshText: {
//     marginLeft: 5,
//     color: '#1976D2',
//     fontWeight: '500',
//   },
//   rotating: {
//     transform: [{ rotate: '45deg' }],
//   },
//   shadowProp: {
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 5,
//   },
//   card: { 
//     backgroundColor: 'white', 
//     width: '100%', 
//     borderRadius: 15, 
//     padding: 15, 
//     marginBottom: 20 
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   cardLabel: { 
//     fontSize: 16, 
//     marginLeft: 10,
//     fontWeight: '600',
//     color: '#424242'
//   },
//   progressBarContainer: {
//     alignItems: 'center',
//   },
//   progressBar: { 
//     height: 20, 
//     width: '100%',
//     backgroundColor: '#ECEFF1', 
//     borderRadius: 10, 
//     overflow: 'hidden', 
//   },
//   progressFill: { 
//     height: '100%', 
//     backgroundColor: '#64B5F6', 
//     borderRadius: 10 
//   },
//   progressText: { 
//     marginTop: 8,
//     fontSize: 14,
//     color: '#757575',
//     fontWeight: '500'
//   },
//   circularContainer: { 
//     marginVertical: 20, 
//     alignItems: 'center',
//     position: 'relative',
//   },
//   phBadge: {
//     position: 'absolute',
//     bottom: 0,
//     paddingHorizontal: 15,
//     paddingVertical: 5,
//     borderRadius: 20,
//     backgroundColor: '#4CAF50',
//   },
//   phBadgeText: {
//     color: 'white',
//     fontWeight: 'bold',
//   },
//   valueCard: { 
//     backgroundColor: 'white', 
//     width: '100%', 
//     borderRadius: 15, 
//     padding: 15, 
//   },
//   valueLabel: { 
//     fontSize: 16, 
//     marginLeft: 10,
//     fontWeight: '600',
//     color: '#424242'
//   },
//   valueContainer: { 
//     backgroundColor: '#64B5F6', 
//     padding: 15, 
//     borderRadius: 10, 
//     alignItems: 'center',
//     marginVertical: 10,
//   },
//   valueText: { 
//     color: 'white', 
//     fontWeight: 'bold', 
//     fontSize: 28 
//   },
//   updateTime: {
//     textAlign: 'center',
//     fontSize: 12,
//     color: '#9E9E9E',
//     marginTop: 5,
//   },
//   notificationContainer: { 
//     width: '100%', 
//     marginTop: 20,
//     backgroundColor: 'white',
//     borderRadius: 15,
//     padding: 15,
//     maxHeight: 200,
//   },
//   notificationHeader: { 
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingBottom: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEEEEE',
//     marginBottom: 10,
//   },
//   notificationHeaderText: {
//     fontSize: 16, 
//     fontWeight: '600', 
//     marginLeft: 10,
//     color: '#424242',
//   },
//   emptyNotificationContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 20,
//   },
//   noNotificationText: { 
//     textAlign: 'center', 
//     fontSize: 14, 
//     color: '#9E9E9E',
//     marginTop: 10,
//   },
//   notificationList: {
//     width: '100%',
//   },
//   notificationBox: { 
//     backgroundColor: '#FFF8E1', 
//     borderRadius: 8, 
//     padding: 12, 
//     marginVertical: 5,
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderLeftWidth: 3,
//     borderLeftColor: '#FF9800',
//   },
//   notificationText: { 
//     fontSize: 14,
//     color: '#333',
//     marginLeft: 10,
//     flex: 1,
//   },
// });

// export default PHValueScreen;