import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import {join, dirname} from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const serviceAccountPath = join(__dirname, '../config/bostr-lia-chat-firebase-adminsdk-fbsvc-79481e6ecd.json')
const serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf8'))


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();
