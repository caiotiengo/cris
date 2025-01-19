import dotenv from 'dotenv';
import OpenAI from 'openai';
import { WhatsappController } from './whatsapp-controller.js';
import { WhatsappMiddleware } from '../middlewares/whatsapp-middleware.js';
dotenv.config();

const { OPENAI_API_KEY, ASSISTANT_ID } = process.env;

const openai = new OpenAI({
    apiKey:OPENAI_API_KEY
});
const whatsappMiddleware = new WhatsappMiddleware();
const whatsappController = new WhatsappController();
const assistantId = ASSISTANT_ID;
let pollingInterval;
export class OpenaiController {
    
    async createThreadWithAssistant(){
        const thread = await openai.beta.threads.create();
        return thread;
    }
    
    async addMessage(threadId, message){
        const response = await openai.beta.threads.messages.create(
            threadId,
            {role: "user", content: message}
        )
        return response;
    }
    
    async runAssistant(threadId){
        const response = await openai.beta.threads.runs.create(
            threadId,
            {
                assistant_id: assistantId
            }
        );
        return response;
    }
    
    async checkingStatus(res, threadId, runId,phoneNumber, token) {
        try {
            const runObject = await openai.beta.threads.runs.retrieve(threadId, runId);
            const status = runObject.status;
            console.log(status, 'status');
            if (status === "completed") {
                clearInterval(pollingInterval);
                const messagesList = await openai.beta.threads.messages.list(threadId);
                let messages = [];
                messagesList.body.data.forEach(message => {
                    if(message.role === "assistant"){
                        messages.push(message.content);
                    }
                });
                const messageAssistant = messages[0][0]?.text.value;
                const message = whatsappMiddleware.processTextForWhatsApp(messageAssistant);
                const req_body = whatsappMiddleware.getTextMessageInput(phoneNumber, message);
                whatsappController.sendMessageToWhatsApp(req_body);
                return 'completed';
            } else if (status === "requires_action") {
                clearInterval(pollingInterval);
                return 'requires_action';
            } else {
                console.log("Status not found");
                return 'not_found';
            }
        } catch (error) {
            console.error("Error in checkingStatus:", error);
            clearInterval(pollingInterval);
            return 'error';
        }
    }
    
}


