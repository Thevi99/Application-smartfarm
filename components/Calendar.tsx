import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 5, 1)); // June 2024
  const [selectedDate, setSelectedDate] = useState(26); // 26th is selected as shown in the image
  
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };
  
  const renderDays = () => {
    const days = [];
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.dayCell} />
      );
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.dayCell,
            i === selectedDate && styles.selectedDay
          ]}
          onPress={() => setSelectedDate(i)}
        >
          <Text 
            style={[
              styles.dayText,
              i === selectedDate && styles.selectedDayText
            ]}
          >
            {i}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return days;
  };
  
  const formatMonthYear = () => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.monthTitle}>{formatMonthYear()} <Text style={styles.arrowIcon}>›</Text></Text>
        
        <View style={styles.navigation}>
          <TouchableOpacity onPress={goToPreviousMonth}>
            <Ionicons name="chevron-back" size={24} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity onPress={goToNextMonth}>
            <Ionicons name="chevron-forward" size={24} color="#555" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.weekdaysRow}>
        {daysOfWeek.map(day => (
          <Text key={day} style={styles.weekday}>{day}</Text>
        ))}
      </View>
      
      <View style={styles.daysGrid}>
        {renderDays()}
      </View>
      
      <View style={styles.timeDisplay}>
        <Text style={styles.timeLabel}>Ends</Text>
        <Text style={styles.timeValue}>8:00 AM</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  arrowIcon: {
    color: '#6fb1e5',
  },
  navigation: {
    flexDirection: 'row',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekday: {
    fontSize: 14,
    color: '#888',
    width: 40,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  dayText: {
    fontSize: 16,
  },
  selectedDay: {
    backgroundColor: '#6fb1e5',
    borderRadius: 20,
  },
  selectedDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  timeLabel: {
    color: '#888',
  },
  timeValue: {
    fontWeight: '500',
  },
});

export default Calendar;