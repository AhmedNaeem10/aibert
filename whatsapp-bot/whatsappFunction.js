const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const https = require('https');
const fs = require("fs");
const {ref, get, update, child} = require("firebase/database");
const {ai_generated_img, ai_generated_msg, midjourney} = require("../controllers/openai/openai");

const args = ['--no-sandbox', '--disable-setuid-sandbox']
const puppeteer = {args}
const client = new Client(options = {puppeteer, authStrategy: new LocalAuth()});

const db = require("../database/FirebaseConfig");

let qrcode = "";

client.on('qr', (qr) => {
    qrcode = qr;
    console.log('QR RECEIVED:', qr);
});

async function download_image(url, filepath) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            } else {
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));

            }
        });
    });
}



client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async (msg)=>{
    get(child(ref(db), `Users/`))
    .then(async (snapshot)=>{
        try{
            const data = snapshot.val();
            const keys = Object.keys(data);
            for(let key of keys){
                if(data[key].phone + "@c.us" == msg.from){
                    if(data[key].subscription_type == 2){
                        if(data[key].week_expiry){
                            const today = new Date();
                            const date = data[key].week_expiry;
                            let parts = date.split("/");
                            const parsed_date = parts[2] + "-" + parts[1] + "-" + parts[0];
                            const formatted = new Date(parsed_date);
                            if(formatted > today){
                                let check = true;
                                setTimeout(()=>{
                                    if(check){
                                        msg.reply("It's taking longer than usual, pleae be patient!");
                                    }
                                }, 5000)
                                if(msg.body.toLocaleLowerCase().startsWith("image")){
                                    const image_uri = await ai_generated_img(msg.body.split("Image ")[1]);
                                    await download_image(image_uri, "./temp.png");
                                    const media = MessageMedia.fromFilePath('./temp.png');
                                    msg.reply(media);
                                    update(ref(db, "Users/" + key), {credit: data[key].credit - 200})
                                    fs.unlink('./temp.png', ()=>{
                                        console.log("Image deleted from server!")
                                    });
                                    check = false;
                                    return;
                                }else{
                                    const rep = await ai_generated_msg(msg.body);
                                    msg.reply(rep);
                                    update(ref(db, "Users/" + key), {credit: data[key].credit - 400})
                                    check = false;
                                    return;
                                }
                            }
                        }
                        if(data[key].credit <= 0){
                            msg.reply("Please recharge your account!");
                            return;
                        }
                        const today = new Date();
                        let parts = value.expiry.split("/");
                        const parsed_date = parts[2] + "-" + parts[1] + "-" + parts[0];
                        const formatted = new Date(parsed_date);
                        if(formatted < today){
                            msg.reply("Please recharge your account!");
                            return;
                        }
                        let check = true;
                        setTimeout(()=>{
                            if(check){
                                msg.reply("It's taking longer than usual, pleae be patient!");
                            }
                        }, 5000)
                        if(msg.body.toLocaleLowerCase().startsWith("image")){
                            const image_uri = await ai_generated_img(msg.body.split("Image ")[1]);
                            await download_image(image_uri, "./temp.png");
                            const media = MessageMedia.fromFilePath('./temp.png');
                            check = false;
                            msg.reply(media);
                            update(ref(db, "Users/" + key), {credit: data[key].credit - 200})
                            fs.unlink('./temp.png', ()=>{
                                console.log("Image deleted from server!")
                            })
                        }else{
                            const rep = await ai_generated_msg(msg.body);
                            check = false;
                            msg.reply(rep);
                            update(ref(db, "Users/" + key), {credit: data[key].credit - 400})
                        }
                        break;
                    }else{
                        msg.reply("Please buy a suitable subscription!");
                        return;
                    }
                }
            }
        }catch(err){
            msg.reply("Sorry, something bad happened!");
        }
    });
});

client.initialize();

module.exports = client;