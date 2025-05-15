// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import Svg, { Circle, G } from 'react-native-svg';

// const CircularProgress = ({
//   progress = 0,
//   size = 150,
//   strokeWidth = 15,
//   color = '#4682B4',
//   label = ''
// }) => {
//   const radius = (size - strokeWidth) / 2;
//   const circumference = radius * 2 * Math.PI;
//   const progressValue = (progress / 100) * circumference;
  
//   return (
//     <View style={styles.container}>
//       <Svg width={size} height={size}>
//         <G rotation="-90" origin={`${size/2}, ${size/2}`}>
//           <Circle
//             cx={size/2}
//             cy={size/2}
//             r={radius}
//             strokeWidth={strokeWidth}
//             stroke="#f0f0f0"
//             fill="transparent"
//           />
//           <Circle
//             cx={size/2}
//             cy={size/2}
//             r={radius}
//             strokeWidth={strokeWidth}
//             stroke={color}
//             fill="transparent"
//             strokeDasharray={circumference}
//             strokeDashoffset={circumference - progressValue}
//             strokeLinecap="round"
//           />
//         </G>
//       </Svg>
//       <View style={[styles.labelContainer, { width: size, height: size }]}>
//         <Text style={[styles.label, { color: color }]}>{label}</Text>
//         <Text style={styles.progressText}>{progress}%</Text>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     position: 'relative',
//   },
//   labelContainer: {
//     position: 'absolute',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   label: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 5,
//   },
//   progressText: {
//     fontSize: 16,
//     color: '#666',
//     fontWeight: '500',
//   }
// });

// export default CircularProgress;


import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface CircularProgressProps {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  label: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size,
  strokeWidth,
  color,
  label
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressValue = (progress / 100) * circumference;
  
  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size/2}, ${size/2}`}>
          <Circle
            cx={size/2}
            cy={size/2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke="#f0f0f0"
            fill="transparent"
          />
          <Circle
            cx={size/2}
            cy={size/2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke={color}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progressValue}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={[styles.labelContainer, { width: size, height: size }]}>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4682B4',
  },
});

export default CircularProgress;











