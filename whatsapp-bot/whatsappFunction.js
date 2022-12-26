const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const {LocalStorage} = require("node-localstorage");
const https = require('https');
const fs = require("fs");
const {ref, get, update, child} = require("firebase/database");
const {ai_generated_img, ai_generated_msg, midjourney} = require("../controllers/openai/openai");

const args = ['--no-sandbox', '--disable-setuid-sandbox']
const puppeteer = {args}
const client = new Client(options = {puppeteer, authStrategy: new LocalAuth()});

const db = require("../database/FirebaseConfig");

var localStorage = new LocalStorage('./scratch'); 

// Here different country codes and corresponding messages can be added:

const country_codes = {
    "34": "Pls register in the app!",
    "92": "Please register in the app!",
    "43": "Pls register in the application!",
}

client.on('qr', (qr) => {
    console.log('QR RECEIVED:', qr);
    localStorage.setItem("qrcode", qr);
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
    localStorage.setItem("qrcode", "QR Code is still setting up...");
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
                                    const [image_uri, cost] = await ai_generated_img(msg.body.split("Image ")[1]);
                                    await download_image(image_uri, "./temp.png");
                                    const media = MessageMedia.fromFilePath('./temp.png');
                                    msg.reply(media);
                                    const message = {
                                        message: msg.body,
                                        reply: image_uri,
                                        type: "image",
                                        date_time: new Date().toUTCString()
                                    };
                                    if(!data[key].message_history){
                                        data[key].message_history = [];
                                    }
                                    data[key].message_history.unshift(message)
                                    update(ref(db, "Users/" + key), {credit: data[key].credit - cost, message_history: data[key].message_history})
                                    fs.unlink('./temp.png', ()=>{
                                        console.log("Image deleted from server!")
                                    });
                                    check = false;
                                    return;
                                }else{
                                    const [rep, cost] = await ai_generated_msg(msg.body);
                                    msg.reply(rep);
                                    const message = {
                                        message: msg.body,
                                        reply: rep,
                                        type: "text",
                                        date_time: new Date().toUTCString()
                                    };
                                    if(!data[key].message_history){
                                        data[key].message_history = [];
                                    }
                                    data[key].message_history.unshift(message)
                                    update(ref(db, "Users/" + key), {credit: data[key].credit - cost, message_history: data[key].message_history})
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
                        let parts = data[key].expiry.split("/");
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
                            const [image_uri, cost] = await ai_generated_img(msg.body.split("Image ")[1]);
                            await download_image(image_uri, "./temp.png");
                            const media = MessageMedia.fromFilePath('./temp.png');
                            check = false;
                            msg.reply(media);
                            const message = {
                                message: msg.body,
                                reply: image_uri,
                                type: "image",
                                date_time: new Date().toUTCString()
                            };
                            if(!data[key].message_history){
                                data[key].message_history = [];
                            }
                            data[key].message_history.unshift(message)
                            update(ref(db, "Users/" + key), {credit: data[key].credit - cost, message_history: data[key].message_history})
                            fs.unlink('./temp.png', ()=>{
                                console.log("Image deleted from server!")
                            })
                            return;
                        }else{
                            const [rep, cost] = await ai_generated_msg(msg.body);
                            check = false;
                            msg.reply(rep);
                            const message = {
                                message: msg.body,
                                reply: rep,
                                type: "text",
                                date_time: new Date().toUTCString()
                            };
                            if(!data[key].message_history){
                                data[key].message_history = [];
                            }
                            data[key].message_history.unshift(message)
                            update(ref(db, "Users/" + key), {credit: data[key].credit - cost, message_history: data[key].message_history})
                            return;
                        }
                    }else{
                        msg.reply("Please buy a suitable subscription!");
                        return;
                    }
                }
            }
            const codes = Object.keys(country_codes);
            for(let code of codes){
                if(msg.from.startsWith(code)){
                    msg.reply(country_codes[code]);
                    return;
                }
            }
            msg.reply("Default msg here");
        }catch(err){
            console.log(err);
            msg.reply("Sorry, something bad happened!");
            return;
        }
    });
});

client.initialize();

module.exports = client;
