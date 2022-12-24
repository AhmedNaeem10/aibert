const express = require("express");
const {login, signup, reply, credit, invite, debit, buy_subscription} = require("./controllers/user/user");
let {client} = require("./whatsapp-bot/whatsappFunction");


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

app.post("/subscription", buy_subscription)



