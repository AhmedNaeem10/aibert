const express = require("express");
const {LocalStorage} = require("node-localstorage");
const {login, signup, reply, credit, invite, debit, buy_subscription, get_message_history} = require("./controllers/user/user");
const {client} = require("./whatsapp-bot/whatsappFunction");

const app = express();

const PORT = 4000;

app.use(express.json());

app.listen(PORT, ()=>{
    console.log(`Server is listening at ${PORT}...`);
});

app.get("/", (req, res)=>{
    res.send("Server is alive!");
});

app.post("/login", login);

app.post("/signup", signup);

app.post("/message", reply);

app.post("/credit", credit);

app.post("/debit", debit);

app.post("/invite", invite)

app.post("/subscription", buy_subscription);

app.get("/message_history/:uid", get_message_history);

app.get("/qrcode", (req, res)=>{
    var localStorage = new LocalStorage('./scratch'); 
    const qrcode = localStorage.getItem("qrcode");
    res.json({code: 200, data: qrcode});
})



