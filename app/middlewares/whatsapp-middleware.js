export class WhatsappMiddleware {

    // Validate the incoming WhatsApp message
    isValidWhatsAppMessage(body) {
        return (
            body.object &&
            body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0].value &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]
        );
    }
    handleWebhookPayload(body){

        return{
            phoneNumber: body.entry[0].changes[0].value.messages[0].from,
            message: body.entry[0].changes[0].value.messages[0].text.body
        }
       console.log(body.entry[0].changes[0].value.messages[0], 'body')
       console.log(body.entry[0].changes[0].value.messages[0].from, 'from')
         console.log(body.entry[0].changes[0].value.messages[0].to, 'to')
    }
    _handlePayloadMessage(body){
        if(this.isValidWhatsAppMessage(body)){
            return this.checkMessageType(body.entry[0].changes[0].value.messages[0]);
        }
        return undefined;
    }

    _handleDeliveryStatus(body){
        return body.entry[0].changes[0].statuses;
    }
    checkMessageType(message){
        let messageBody;
        if (message.type === 'image') {
            messageBody = message.image.id;
            // Handle image message (implement getMediaWhatsApp)
          } else if (message.type === 'document') {
            messageBody = message.document.id;
            // Handle document message (implement getMediaWhatsApp)
          } else if (message.type === 'audio') {
            messageBody = message.audio.id;
            // Handle audio message (implement getMediaWhatsApp)
          } else if (message.type === 'video') {
            messageBody = message.video.id;
            // Handle video message (implement getMediaWhatsApp)
          } else {
            messageBody = message.text.body;
          }
          return messageBody;
    }
    processTextForWhatsApp(text) {
        text = text.replace(/\【.*?\】/g, '').trim();

        // Replace double asterisks with single asterisks
        text = text.replace(/\*\*(.*?)\*\*/g, '*$1*');
      
        return text;
    }
    getTextMessageInput(recipient, text) {
        return {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipient,
          type: 'text',
          text: { preview_url: false, body: text },
        };
      }
      
}