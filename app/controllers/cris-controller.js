import { DbModule } from '../config/firebase-config.js';

const dbModule = new DbModule();
export class CrisController{
    constructor(){
        this.db = dbModule.getDb();
    }
    async checkUserByPhone(phone){
        const user = await this.db.collection('users').where('phoneNumber', '==', phone).get();
        return user.empty ? false : true;
    }
    async addUser(user){
        await this.db.collection('users').add(user);
    }
}