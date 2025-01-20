
import express from "express";
import { OpenaiController } from "./app/controllers/openai-controller.js";
import { CrisController } from "./app/controllers/cris-controller.js";
import cors from "cors";
import { WhatsappMiddleware } from "./app/middlewares/whatsapp-middleware.js";
const app = express();
app.use(express.json());
app.use(cors());

const crisController = new CrisController();
const openaiController = new OpenaiController();
const whatsappMiddleware = new WhatsappMiddleware();
app.post('/webhook', async (req, res) => {
    const payload = req.body;
    const payload_treated = whatsappMiddleware._handlePayload(payload);
    const response = await whatsappMiddleware.handleWebhookPayload(payload);
    const userExists = await crisController.checkUserByPhone(response.phoneNumber);
    if(response && !userExists){
        console.log('Webhook payload processed:', response);
        crisController.addUser(response);
        res.sendStatus(200);
    }else if(
        !(whatsappMiddleware._handleDeliveryStatus(payload) === 'sent' || whatsappMiddleware._handleDeliveryStatus(payload) == 'delivered') 
        && userExists){
        console.log('existing user');
        const threadId = await openaiController.createThreadWithAssistant().then((thread) => {return thread.id});
        openaiController.addMessage(threadId, payload_treated).then( message => {
            console.log(message, 'message')
            openaiController.runAssistant(threadId).then((assistant_response) =>{
                console.log(assistant_response, 'response')
               const runId = assistant_response.id;
               const token = assistant_response.token;
               openaiController.pollingInterval = setInterval(async () =>{
                const status_response =  await openaiController.checkingStatus(res, threadId, runId, response.phoneNumber,token);
                if(status_response === 'completed'){
                    clearInterval(openaiController.pollingInterval);
                }
               }, 5000)
              
            }).catch((error) =>{
                res.status(500).json({error: error.message});
            });
        }).catch((error) =>{
            res.status(500).json({error: error.message});
        });
        res.sendStatus(200)

    }else{
        console.log('Webhook payload ignored:', response);
        res.status(200);
    }
  });
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>{
    console.log(`Server running on port ${PORT}`);
});