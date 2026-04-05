
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  query,
  where,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db } from './config';
import { toast } from '@/components/ui/use-toast';

// Helper function to handle Firebase errors
const handleFirebaseError = (error: any, operation: string) => {
  console.error(`Firebase ${operation} error:`, error);
  
  // Check if it's a permission error
  if (error.code === 'permission-denied') {
    throw new Error(`${operation} failed: Missing or insufficient permissions.`);
  }
  
  throw error;
};

// Student database functions
export const createStudent = async (studentData: any) => {
  try {
    const studentRef = doc(collection(db, 'students'));
    await setDoc(studentRef, {
      ...studentData,
      createdAt: new Date()
    });
    return studentRef.id;
  } catch (error) {
    handleFirebaseError(error, 'create student');
    return null;
  }
};

export const getStudents = async () => {
  try {
    const studentsRef = collection(db, 'students');
    const snapshot = await getDocs(studentsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    handleFirebaseError(error, 'get students');
    return [];
  }
};

export const getStudentById = async (id: string) => {
  try {
    const studentRef = doc(db, 'students', id);
    const snapshot = await getDoc(studentRef);
    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data()
      };
    }
    return null;
  } catch (error) {
    handleFirebaseError(error, 'get student by ID');
    return null;
  }
};

export const updateStudent = async (id: string, data: any) => {
  try {
    const studentRef = doc(db, 'students', id);
    await updateDoc(studentRef, data);
  } catch (error) {
    handleFirebaseError(error, 'update student');
  }
};

export const deleteStudent = async (id: string) => {
  try {
    const studentRef = doc(db, 'students', id);
    await deleteDoc(studentRef);
  } catch (error) {
    handleFirebaseError(error, 'delete student');
  }
};

// Driver database functions
export const createDriver = async (driverData: any) => {
  try {
    const driverRef = doc(collection(db, 'drivers'));
    await setDoc(driverRef, {
      ...driverData,
      createdAt: new Date()
    });
    return driverRef.id;
  } catch (error) {
    handleFirebaseError(error, 'create driver');
    return null;
  }
};

export const getDrivers = async () => {
  try {
    const driversRef = collection(db, 'drivers');
    const snapshot = await getDocs(driversRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    handleFirebaseError(error, 'get drivers');
    return [];
  }
};

export const getDriverById = async (id: string) => {
  try {
    const driverRef = doc(db, 'drivers', id);
    const snapshot = await getDoc(driverRef);
    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data()
      };
    }
    return null;
  } catch (error) {
    handleFirebaseError(error, 'get driver by ID');
    return null;
  }
};

export const updateDriver = async (id: string, data: any) => {
  try {
    const driverRef = doc(db, 'drivers', id);
    await updateDoc(driverRef, data);
  } catch (error) {
    handleFirebaseError(error, 'update driver');
  }
};

export const deleteDriver = async (id: string) => {
  try {
    const driverRef = doc(db, 'drivers', id);
    await deleteDoc(driverRef);
  } catch (error) {
    handleFirebaseError(error, 'delete driver');
  }
};

// Guardian credentials functions
export const createGuardianCredentials = async (credentialsData: any) => {
  try {
    const credentialsRef = doc(collection(db, 'guardianCredentials'));
    await setDoc(credentialsRef, {
      ...credentialsData,
      createdAt: new Date()
    });
    return credentialsRef.id;
  } catch (error) {
    handleFirebaseError(error, 'create guardian credentials');
    return null;
  }
};

export const getGuardianCredentialsByStudentId = async (studentId: string) => {
  try {
    const credentialsRef = collection(db, 'guardianCredentials');
    const q = query(credentialsRef, where('studentId', '==', studentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    handleFirebaseError(error, 'get guardian credentials');
    return [];
  }
};
