import admin from 'firebase-admin';
import serviceAccount from '../../keys.json' assert { type: 'json' };

export class DbModule{
    constructor(){
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
          });
    }
    getDb(){
        return admin.firestore();
    }
}
