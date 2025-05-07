// src/lib/urlTracker.ts
import { getFirestore, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../firebaseConfig.js';

// Initialize Firebase (use a separate app instance if needed)
const app = initializeApp(firebaseConfig, 'url-tracker-app');
const db = getFirestore(app);
const COLLECTION_NAME = 'scraped_urls';

interface ScrapedUrlRecord {
  url: string;
  timestamp: Timestamp;
  success: boolean;
  contentLength?: number;
}

/**
 * Check if a URL has already been scraped successfully
 */
export async function hasUrlBeenScraped(url: string): Promise<boolean> {
  try {
    // Normalize the URL (remove hash, etc.)
    const normalizedUrl = url.split('#')[0];
    
    // Query Firestore for this URL
    const urlsRef = collection(db, COLLECTION_NAME);
    const q = query(urlsRef, where('url', '==', normalizedUrl), where('success', '==', true));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error(`Error checking if URL has been scraped: ${error}`);
    // If there's an error, return false to allow scraping (being cautious)
    return false;
  }
}

/**
 * Record a URL as scraped in Firestore
 */
export async function recordScrapedUrl(
  url: string, 
  success: boolean, 
  contentLength?: number
): Promise<void> {
  try {
    // Normalize the URL
    const normalizedUrl = url.split('#')[0];
    
    const urlsRef = collection(db, COLLECTION_NAME);
    const record: ScrapedUrlRecord = {
      url: normalizedUrl,
      timestamp: Timestamp.now(),
      success,
      contentLength
    };
    
    await addDoc(urlsRef, record);
    console.log(`Recorded scraped URL in database: ${normalizedUrl}`);
  } catch (error) {
    console.error(`Error recording scraped URL: ${error}`);
    // Just log the error, don't throw it further
  }
}

/**
 * Get all successfully scraped URLs
 */
export async function getAllScrapedUrls(): Promise<string[]> {
  try {
    const urlsRef = collection(db, COLLECTION_NAME);
    const q = query(urlsRef, where('success', '==', true));
    const querySnapshot = await getDocs(q);
    
    const urls: string[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data() as ScrapedUrlRecord;
      urls.push(data.url);
    });
    
    return urls;
  } catch (error) {
    console.error(`Error getting all scraped URLs: ${error}`);
    return [];
  }
}