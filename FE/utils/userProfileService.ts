// file: app/utils/userProfileService.ts
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';


export const hasUserCompletedProfile = async (userId: string): Promise<boolean> => {
  try {
    const userProfileRef = doc(db, 'userProfiles', userId);
    const userProfileSnap = await getDoc(userProfileRef);
    
    return userProfileSnap.exists();
  } catch (error) {
    console.error('Error checking user profile:', error);
    return false;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const userProfileRef = doc(db, 'userProfiles', userId);
    const userProfileSnap = await getDoc(userProfileRef);
    
    if (userProfileSnap.exists()) {
      return userProfileSnap.data();
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};