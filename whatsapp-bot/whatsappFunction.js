const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const { LocalStorage } = require("node-localstorage");
const sizeOf = require('image-size');
const https = require('https');
const fs = require("fs");
const sharp = require('sharp');
const { ref, get, update, child } = require("firebase/database");
const { ai_generated_img, ai_generated_msg, midjourney } = require("../controllers/openai/openai");

const args = ['--no-sandbox', '--disable-setuid-sandbox']
const puppeteer = { args }
const client = new Client(options = { puppeteer, authStrategy: new LocalAuth() });

const db = require("../database/FirebaseConfig");

var localStorage = new LocalStorage('./scratch');

// Here different country codes and corresponding messages can be added:

const msgbenvenutodefault = "Please register in the app! https://aibert.cloud";
const country_codes = {
    "39": "Registrati all'applicazione! https://aibert.cloud",
    "34": "Por favor regístrese en la aplicación! https://aibert.cloud",
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

function generate_uid() {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 10; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return String(Date.now()) + result;
}


client.on('ready', () => {
    console.log('Client is ready!');
    localStorage.setItem("qrcode", "QR Code is still setting up...");
});

async function crop_and_send(filename, msg) {
    let obj = sizeOf(`./${filename}.png`);
    sharp(`./${filename}.png`).extract({ width: obj.width / 2, height: obj.height / 2, left: 0, top: 0 }).toFile(`./${filename}_cropped_1.png`)
        .then(function (new_file_info) {
            let media = MessageMedia.fromFilePath(`./${filename}_cropped_1.png`);
            msg.reply(media);
            fs.unlink(`./${filename}_cropped_1.png`, () => {
                console.log("Image deleted from server!")
            });
        })
        .catch(function (err) {
            console.log(err);
            console.log("An error occured");
        });
    sharp(`./${filename}.png`).extract({ width: obj.width / 2, height: obj.height / 2, left: obj.width / 2, top: 0 }).toFile(`./${filename}_cropped_2.png`)
        .then(function (new_file_info) {
            let media = MessageMedia.fromFilePath(`./${filename}_cropped_2.png`);
            msg.reply(media);
            fs.unlink(`./${filename}_cropped_2.png`, () => {
                console.log("Image deleted from server!")
            });
        })
        .catch(function (err) {
            console.log(err);
            console.log("An error occured");
        });
    sharp(`./${filename}.png`).extract({ width: obj.width / 2, height: obj.height / 2, left: 0, top: obj.height / 2 }).toFile(`./${filename}_cropped_3.png`)
        .then(function (new_file_info) {
            let media = MessageMedia.fromFilePath(`./${filename}_cropped_3.png`);
            msg.reply(media);
            fs.unlink(`./${filename}_cropped_3.png`, () => {
                console.log("Image deleted from server!")
            });
        })
        .catch(function (err) {
            console.log(err);
            console.log("An error occured");
        });
    sharp(`./${filename}.png`).extract({ width: obj.width / 2, height: obj.height / 2, left: obj.width / 2, top: obj.height / 2 }).toFile(`./${filename}_cropped_4.png`)
        .then(function (new_file_info) {
            let media = MessageMedia.fromFilePath(`./${filename}_cropped_4.png`);
            msg.reply(media);
            fs.unlink(`./${filename}_cropped_4.png`, () => {
                console.log("Image deleted from server!")
            });
        })
        .catch(function (err) {
            console.log(err);
            console.log("An error occured");
        });
    fs.unlink(`./${filename}.png`, () => {
        console.log("Image deleted from server!")
    });
}

client.on('message', async (msg) => {
    msg.body = msg.body.toLowerCase();
    get(child(ref(db), `Users/`))
        .then(async (snapshot) => {
            try {
                const data = snapshot.val();
                const keys = Object.keys(data);
                for (let key of keys) {
                    if (data[key].phone + "@c.us" == msg.from) {
                        let filename = generate_uid();
                        if (data[key].subscription_type == 2) {
                            if (data[key].week_expiry) {
                                const today = new Date();
                                const date = data[key].week_expiry;
                                let parts = date.split("/");
                                const parsed_date = parts[2] + "-" + parts[1] + "-" + parts[0];
                                const formatted = new Date(parsed_date);
                                if (formatted > today) {
                                    let check = true;
                                    setTimeout(() => {
                                        if (check) {
                                            msg.reply("It's taking longer than usual, pleae be patient!");
                                        }
                                    }, 5000)
                                    if (msg.body.startsWith("image")) {
                                        const [image_uri, cost] = await midjourney(msg.body.split("image ")[1]);
                                        await download_image(image_uri, `./${filename}.png`);
                                        await crop_and_send(filename, msg);
                                        check = false;
                                        const message = {
                                            message: msg.body,
                                            reply: image_uri,
                                            type: "image",
                                            date_time: new Date().toUTCString()
                                        };
                                        if (!data[key].message_history) {
                                            data[key].message_history = [];
                                        }
                                        data[key].message_history.unshift(message)
                                        update(ref(db, "Users/" + key), { credit: data[key].credit - cost, message_history: data[key].message_history })
                                        check = false;
                                        return;
                                    } else {
                                        const [rep, cost] = await ai_generated_msg(msg.body);
                                        msg.reply(rep);
                                        const message = {
                                            message: msg.body,
                                            reply: rep,
                                            type: "text",
                                            date_time: new Date().toUTCString()
                                        };
                                        if (!data[key].message_history) {
                                            data[key].message_history = [];
                                        }
                                        data[key].message_history.unshift(message)
                                        update(ref(db, "Users/" + key), { credit: data[key].credit - cost, message_history: data[key].message_history })
                                        check = false;
                                        return;
                                    }
                                }
                            }
                            if (data[key].credit <= 0) {
                                msg.reply("Please recharge your account!");
                                return;
                            }
                            const today = new Date();
                            let parts = data[key].expiry.split("/");
                            const parsed_date = parts[2] + "-" + parts[1] + "-" + parts[0];
                            const formatted = new Date(parsed_date);
                            if (formatted < today) {
                                msg.reply("Please recharge your account!");
                                return;
                            }
                            let check = true;
                            setTimeout(() => {
                                if (check) {
                                    msg.reply("It's taking longer than usual, pleae be patient!");
                                }
                            }, 5000)
                            if (msg.body.startsWith("image")) {
                                const [image_uri, cost] = await midjourney(msg.body.split("image ")[1]);
                                await download_image(image_uri, `./${filename}.png`);
                                await crop_and_send(filename, msg);
                                check = false;
                                const message = {
                                    message: msg.body,
                                    reply: image_uri,
                                    type: "image",
                                    date_time: new Date().toUTCString()
                                };
                                if (!data[key].message_history) {
                                    data[key].message_history = [];
                                }
                                data[key].message_history.unshift(message)
                                update(ref(db, "Users/" + key), { credit: data[key].credit - cost, message_history: data[key].message_history })
                                
                                return;
                            } else {
                                const [rep, cost] = await ai_generated_msg(msg.body);
                                check = false;
                                msg.reply(rep);
                                const message = {
                                    message: msg.body,
                                    reply: rep,
                                    type: "text",
                                    date_time: new Date().toUTCString()
                                };
                                if (!data[key].message_history) {
                                    data[key].message_history = [];
                                }
                                data[key].message_history.unshift(message)
                                update(ref(db, "Users/" + key), { credit: data[key].credit - cost, message_history: data[key].message_history })
                                return;
                            }
                        } else {
                            msg.reply("Please buy a suitable subscription!");
                            return;
                        }
                    }
                }
                const codes = Object.keys(country_codes);
                for (let code of codes) {
                    if (msg.from.startsWith(code)) {
                        msg.reply(country_codes[code]);
                        return;
                    }
                }
                msg.reply(msgbenvenutodefault);
            } catch (err) {
                console.log(err);
                msg.reply("Sorry, something bad happened!");
                return;
            }
        });
});

client.initialize();

module.exports = client;
