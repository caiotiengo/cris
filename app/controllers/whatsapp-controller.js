import axios from "axios";
import { env } from "process";

export class WhatsappController {
    constructor() {
    }
    
    async sendMessageToWhatsApp(request_body) {
        try {
            const headers = {
                'Content-type': 'application/json',
                Authorization: `Bearer ${env.WP_TOKEN}`,
            };

            const url = `https://graph.facebook.com/${env.FB_API_VERSION}/${env.PHONE_ID}/messages`;

            const response = await axios.post(url, request_body, { headers });
            console.log(response.data, 'response');
            return response.data;
        } catch (error) {
            console.log(error, 'error');
            return error.message;
        }
    }
}
