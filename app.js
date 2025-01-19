
import express from "express";
import { OpenaiController } from "./app/controllers/openai-controller.js";
import { CrisController } from "./app/controllers/cris-controller.js";
import cors from "cors";
import { WhatsappMiddleware } from "./app/middlewares/whatsapp-middleware.js";
import { WhatsappController } from "./app/controllers/whatsapp-controller.js";
const app = express();
app.use(express.json());
app.use(cors());

const crisController = new CrisController();
const openaiController = new OpenaiController();
const whatsappMiddleware = new WhatsappMiddleware();
const whatsappController = new WhatsappController();
app.get("/thread", (req, res) =>{
    openaiController.createThreadWithAssistant().then((thread) =>{
        res.json({threadId: thread.id});
    }).catch((error) =>{
        res.status(500).json({error: error.message});
    });
})
app.post("/message", (req, res) =>{
    const {threadId, message,affiliatedId, token} = req.body;
    openaiController.addMessage(threadId, message).then( message => {
        openaiController.runAssistant(threadId).then((response) =>{
           const runId = response.id;
           openaiController.pollingInterval = setInterval(() =>{
            openaiController.checkingStatus(res, threadId, runId,affiliatedId, token);
           }, 5000)
          
        }).catch((error) =>{
            res.status(500).json({error: error.message});
        });
    }).catch((error) =>{
        res.status(500).json({error: error.message});
    });
});
app.post('/webhook', async (req, res) => {
    const payload = req.body;
    console.log(req.body, 'request novamente')
    console.log('Webhook payload received:', payload.entry[0].changes[0].value);
    // if(payload.entry[0].changes[0].value.statuses){
    //     const status = payload.entry[0].changes[0].value.statuses[0].status;
    //     console.log(status, 'status')
    //     if(status === 'sent'){
    //         res.sendStatus(200);
    //         return 
    //     }
    //     return;
    // }
    const message = whatsappMiddleware._handlePayloadMessage(payload);
    const threadId = await openaiController.createThreadWithAssistant().then((thread) => {return thread.id});
    const response = await whatsappMiddleware.handleWebhookPayload(payload, threadId);
    const userExists = await crisController.checkUserByPhone(response.phoneNumber);
    if(response && !userExists){
        console.log('Webhook payload processed:', response);
        crisController.addUser(response);
        res.sendStatus(200);
    }else if(
        !(whatsappMiddleware._handleDeliveryStatus(payload) === 'sent' || whatsappMiddleware._handleDeliveryStatus(payload) == 'delivered') 
        && userExists){
        console.log('existing user');
        openaiController.addMessage(threadId, message).then( message => {
            console.log(message, 'message')
            openaiController.runAssistant(threadId).then((response) =>{
                console.log(response, 'response')
               const runId = response.id;
               const token = response.token;
               openaiController.pollingInterval = setInterval(async () =>{
                const response =  await openaiController.checkingStatus(res, threadId, runId, undefined,token);
                if(response === 'completed'){
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