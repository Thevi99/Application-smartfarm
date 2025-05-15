// declare module './firebaseConfig' {
//     import { Database } from '@react-native-firebase/database';
//     export const database: Database;
//   }
  

declare module './firebaseConfig' {
  import { Firestore } from 'firebase/firestore';  // เปลี่ยนจาก @react-native-firebase/database ไปใช้ Firestore
  export const db: Firestore;  // ประกาศ db ที่เชื่อมต่อกับ Firestore
}
