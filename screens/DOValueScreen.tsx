import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import CircularProgress from '../components/CircularProgress';
import { db } from '../src/firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';

const DOValueScreen: React.FC = () => {
  const [doValue, setDOValue] = useState<number | null>(null);
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
      // ใช้ query กับ `where` เพื่อดึงเอกสารที่มี sensor_id = "2"
      const q = query(collection(db, 'datalog'), where('sensor_id', '==', '2'));
      
      // ดึงข้อมูลจาก Firestore
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.warn("⚠️ ไม่มีข้อมูลใน Firestore สำหรับ sensor_id = '2'.");
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
        
        const do_value = typeof latestData.value === 'number' ? latestData.value : null;
        setDOValue(do_value);
        setLastUpdated(latestTimestamp);

        let abnormalityPercent = 0;
        let notificationMessage = null;

        if (do_value !== null) {
          if (do_value < 4) {
            abnormalityPercent = ((4 - do_value) / 4) * 100;
            notificationMessage = `⚠️ ค่า DO ต่ำเกินไปที่ ${do_value.toFixed(2)} mg/L เวลา ${formatTimestamp(latestTimestamp.getTime())}`;
          } else if (do_value > 10) {
            abnormalityPercent = ((do_value - 10) / 10) * 100;
            notificationMessage = `⚠️ ค่า DO สูงเกินไปที่ ${do_value.toFixed(2)} mg/L เวลา ${formatTimestamp(latestTimestamp.getTime())}`;
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

  // ฟังก์ชันเพื่อเลือกสีตามค่า DO
  const getDOColor = () => {
    if (doValue === null) return '#808080';  // สีเทาสำหรับไม่มีข้อมูล
    if (doValue < 4) return '#F44336';       // สีแดงสำหรับ DO ต่ำ
    if (doValue > 10) return '#9C27B0';      // สีม่วงสำหรับ DO สูง
    return '#4CAF50';                        // สีเขียวสำหรับปกติ
  };

  // ฟังก์ชันเพื่อเลือกสถานะของ DO
  const getDOStatus = () => {
    if (doValue === null) return 'ไม่มีข้อมูล';
    if (doValue < 4) return 'ต่ำเกินไป (Low)';
    if (doValue > 10) return 'สูงเกินไป (High)';
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
          <Text style={styles.headerTitle}>Water DO Monitor</Text>
          <Text style={styles.headerSubtitle}>Real-time dissolved oxygen analysis</Text>
        </LinearGradient>

        {/* ส่วนแสดงผลข้อมูล DO และความผิดปกติ */}
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
              <Text style={styles.cardLabel}>ความผิดปกติ DO</Text>
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
              color={getDOColor()}
              label="DO"
            />
            <View style={[styles.phBadge, { backgroundColor: getDOColor() }]}>
              <Text style={styles.phBadgeText}>{getDOStatus()}</Text>
            </View>
          </View>

          <View style={[styles.valueCard, styles.shadowProp]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="test-tube" size={24} color="#1976D2" />
              <Text style={styles.valueLabel}>ค่า DO ปัจจุบัน</Text>
            </View>
            <View style={[styles.valueContainer, { backgroundColor: getDOColor() }]}>
              <Text style={styles.valueText}>
                {doValue !== null ? `${doValue.toFixed(2)} mg/L` : 'รอข้อมูล'}
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
            <Text style={styles.notificationHeaderText}>แจ้งเตือนค่า DO</Text>
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
          <Text style={styles.headerTitle}>Water DO Monitor</Text>
          <Text style={styles.headerSubtitle}>Real-time dissolved oxygen analysis</Text>
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
                <Text style={styles.cardLabel}>ความผิดปกติ DO</Text>
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
                color={getDOColor()}
                label="DO"
              />
              <View style={[styles.phBadge, { backgroundColor: getDOColor() }]}>
                <Text style={styles.phBadgeText}>{getDOStatus()}</Text>
              </View>
            </View>

            <View style={[styles.valueCard, styles.shadowProp]}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="test-tube" size={24} color="#1976D2" />
                <Text style={styles.valueLabel}>ค่า DO ปัจจุบัน</Text>
              </View>
              <View style={[styles.valueContainer, { backgroundColor: getDOColor() }]}>
                <Text style={styles.valueText}>
                  {doValue !== null ? `${doValue.toFixed(2)} mg/L` : 'รอข้อมูล'}
                </Text>
              </View>
              <Text style={styles.updateTime}>
                {lastUpdated !== null ? `อัพเดทล่าสุด: ${formatTimestamp(lastUpdated.getTime())}` : 'รอข้อมูล'}
              </Text>
            </View>

            <View style={[styles.notificationContainer, styles.shadowProp]}>
              <View style={styles.notificationHeader}>
                <MaterialCommunityIcons name="bell-ring" size={24} color="#FF9800" />
                <Text style={styles.notificationHeaderText}>แจ้งเตือนค่า DO</Text>
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

export default DOValueScreen;