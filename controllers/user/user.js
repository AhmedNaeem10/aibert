const {ref, set, onValue, update, get, child} = require("firebase/database");
const {createUserWithEmailAndPassword, sendEmailVerification, getAuth, signInWithEmailAndPassword, fetchSignInMethodsForEmail} = require('firebase/auth');
const {ai_generated_img, ai_generated_msg, midjourney} = require("../openai/openai");
const db = require("../../database/FirebaseConfig");

exports.signup = async (req, res) => {
    try{
        let user = req.body;
        get(child(ref(db), `Users/`))
        .then((snapshot)=>{
            let data = snapshot.val();
            const users = Object.values(data);
            for(let user of users){
                if(user.email == req.body.email){
                    res.json({code: 400, data: "Email already exists!"});
                    return;
                }
                if(user.phone == req.body.phone){
                    res.json({code: 400, data: "Phone number already exists!"});
                    return;
                }
            }
            const auth = getAuth()
            createUserWithEmailAndPassword(auth, user.email , user.password, user.phone)
            .then(async (cred) => {
                await sendEmailVerification(cred.user)
                user["level"] = "one",
                user["credit"] = 0;
                user["expiry"] = new Date().toLocaleDateString();
                user["password"] = null;
                await set(ref(db, 'Users/' + cred.user.uid), user)

                // get the invitor's uid if any
                get(child(ref(db), `Users/`))
                .then((snapshot) => {
                    let data = snapshot.val();
                    const uids = Object.keys(data);
                
                    for(let uid of uids){
                        if(data[uid].invited){
                            if(data[uid].invited.includes(user.email)){
                                // adding a week's credit
                                const today = new Date();
                                today.setDate(today.getDate() + 7);
                                const date = today.toLocaleDateString();
                                update(ref(db, "Users/" + uid), {week_expiry: date});
                                break;
                            }
                        }
                    }
                })
                .catch((err)=>{
                    res.json({code: 400, data: "An error occurred!"});
                })
            res.json({code: 200, msg: "User has been registered"})
            })
            .catch((error)=>{
                res.json({code: 400, data: "Email already exists!"})
            });
        });
    }catch(error){
        res.json({code: 400, data: "There was an error in the request!"});
    }
}

exports.login = (req, res) => {
    try{
        const auth = getAuth();
        signInWithEmailAndPassword(auth, req.body.email, req.body.password)
        .then(async (cred)=>{
            const query = ref(db, "Users/" + cred.user.uid);
            onValue(query, (snapshot) => {
                let data = snapshot.val();
                data["emailVerified"] = cred.user.emailVerified;
                data["uid"] = cred.user.uid;
                res.json({code: 200, data: data})
            });
        })
        .catch((error)=>{
            res.json({code: 400, data: "Email not found!"})
        })
    }catch(error){
        res.json({code: 400, data: "There was an error in the request!"});
    }
}


exports.reply = async (req, res) => {
    get(child(ref(db), `Users/${req.body.uid}`))
    .then(async (snapshot)=>{
        let data = snapshot.val();

        // check week_expiry
        if(data.week_expiry){
            const today = new Date();
            const date = data.week_expiry;
            let parts = date.split("/");
            const parsed_date = parts[2] + "-" + parts[0] + "-" + parts[1];
            const formatted = new Date(parsed_date);
            if(formatted > today){
                if(req.body.type == "text"){
                    const text = await ai_generated_msg(req.body.message);
                    if(!data.message_history){
                        data.message_history = []
                    }
                    const msg = {
                        message: req.body.message,
                        reply: text,
                        type: req.body.type,
                        date_time: new Date().toUTCString()
                    };
                    data.message_history.push(msg)
                    update(ref(db, "Users/" + req.body.uid), {message_history: data.message_history, credit: data.credit - 400});
                    res.json({code: 200, data: text});
                    return;
                }else if(req.body.type == "image"){
                    if(req.body.algorithm){
                        if(req.body.algorithm == "openai"){
                            const img = await ai_generated_img(req.body.message);
                            if(!data.message_history){
                                data.message_history = []
                            }
                            const msg = {
                                message: req.body.message,
                                reply: img,
                                type: req.body.type,
                                date_time: new Date().toUTCString()
                            };
                            data.message_history.push(msg)
                            update(ref(db, "Users/" + req.body.uid), {message_history: data.message_history, credit: data.credit - 200});
                            res.json({code: 200, data: img});
                            return;
                        }else if(req.body.algorithm == "midjourney"){
                            const img = await midjourney(req.body.message);
                            if(!data.message_history){
                                data.message_history = []
                            }
                            const msg = {
                                message: req.body.message,
                                reply: img,
                                type: req.body.type,
                                date_time: new Date().toUTCString()
                            };
                            data.message_history.push(msg)
                            update(ref(db, "Users/" + req.body.uid), {message_history: data.message_history, credit: data.credit - 200});
                            res.json({code: 200, data: img});
                            return;
                        }else{
                            res.json({code: 200, data: "Unknown type of request passed!"});
                            return;
                        }
                    }else{
                        const img = await midjourney(req.body.message);
                        if(!data.message_history){
                            data.message_history = []
                        }
                        const msg = {
                            message: req.body.message,
                            reply: img,
                            type: req.body.type,
                            date_time: new Date().toUTCString()
                        };
                        data.message_history.push(msg)
                        update(ref(db, "Users/" + req.body.uid), {message_history: data.message_history, credit: data.credit - 200});
                        res.json({code: 200, data: img});
                        return;
                    }
                }else{
                    res.json({code: 200, data: "Unknown type of request passed!"});
                    return;
                }
            }
        }

        // check credit
        if(data.credit <= 0){
            res.json({code: 400, data: "Please recharge your account!"});
            return;
        }
        const today = new Date();
        const date = data.expiry;
        let parts = date.split("/");
        const parsed_date = parts[2] + "-" + parts[1] + "-" + parts[0];
        const formatted = new Date(parsed_date);

        // check expiry
        if(formatted < today){
            res.json({code: 400, data: "Please recharge your account!"});
            return;
        }

        // if everything is good, send the reply
        if(req.body.type == "text"){
            const text = await ai_generated_msg(req.body.message);
            if(!data.message_history){
                data.message_history = []
            }
            const msg = {
                message: req.body.message,
                reply: text,
                type: req.body.type,
                date_time: new Date().toUTCString()
            };
            data.message_history.push(msg)
            update(ref(db, "Users/" + req.body.uid), {message_history: data.message_history, credit: data.credit - 400});
            res.json({code: 200, data: text});
        }else if(req.body.type == "image"){
            if(req.body.algorithm){
                if(req.body.algorithm == "openai"){
                    const img = await ai_generated_img(req.body.message);
                    if(!data.message_history){
                        data.message_history = []
                    }
                    const msg = {
                        message: req.body.message,
                        reply: img,
                        type: req.body.type,
                        date_time: new Date().toUTCString()
                    };
                    data.message_history.push(msg)
                    update(ref(db, "Users/" + req.body.uid), {message_history: data.message_history, credit: data.credit - 200});
                    res.json({code: 200, data: img});
                    return;
                }else if(req.body.algorithm == "midjourney"){
                    const img = await midjourney(req.body.message);
                    if(!data.message_history){
                        data.message_history = []
                    }
                    const msg = {
                        message: req.body.message,
                        reply: img,
                        type: req.body.type,
                        date_time: new Date().toUTCString()
                    };
                    data.message_history.push(msg)
                    update(ref(db, "Users/" + req.body.uid), {message_history: data.message_history, credit: data.credit - 200});
                    res.json({code: 200, data: img});
                    return;
                }else{
                    res.json({code: 200, data: "Unknown type of request passed!"});
                    return;
                }
            }else{
                const img = await midjourney(req.body.message);
                if(!data.message_history){
                    data.message_history = []
                }
                const msg = {
                    message: req.body.message,
                    reply: img,
                    type: req.body.type,
                    date_time: new Date().toUTCString()
                };
                data.message_history.push(msg)
                update(ref(db, "Users/" + req.body.uid), {message_history: data.message_history, credit: data.credit - 200});
                res.json({code: 200, data: img});
                return;
            }
        }else{
            res.json({code: 200, data: "Unknown type of request passed!"});
            return;
        }
    }).catch((err)=>{
        res.json({code: 400, data: "An error occurred!"})
    })
}
  
  
exports.credit = (req, res) => {
    try{
        get(child(ref(db), `Users/${req.body.uid}`))
        .then((snapshot) => {
            const data = snapshot.val();
            update(ref(db, "Users/" + req.body.uid), {credit: data.credit + req.body.credit});
            res.json({code: 200, data: "Credit added successfully!"})
        }).catch((err) => {
            res.json({code: 400, data: err.message})
        });
    }catch(err){
        res.json({code: 400, data: err.message})
    }
}

exports.debit = (req, res) => {
    try{
        get(child(ref(db), `Users/${req.body.uid}`))
        .then((snapshot) => {
            const data = snapshot.val();
            if(data.credit - req.body.debit < 0){
                res.json({code: 400, data: "Insufficient credit!"});
                return;
            }
            update(ref(db, "Users/" + req.body.uid), {credit: data.credit - req.body.debit});
            res.json({code: 200, data: "Debit successfully!"})
        }).catch((err) => {
            res.json({code: 400, data: err.message})
        });
    }catch(err){
        res.json({code: 400, data: err.message})
    }
}

exports.invite = async (req, res) => {
    get(child(ref(db), `Users/`))
    .then((snapshot) => {
        let data = snapshot.val();
        const users = Object.values(data);
        
        for(let user of users){
            if(user.email == req.body.friend){
                res.json({code: 400, data: "User is already registered in the app!"})
                return;
            }
            if(user.invited){
                if(user.invited.includes(req.body.friend)){
                    res.json({code: 400, data: "User is already invited by another user!"})
                    return;
                }
            }
        }

        get(child(ref(db), `Users/${req.body.uid}`))
        .then((snapshot)=>{
            let data = snapshot.val();
            if(!data.invited){
                data.invited = []
            }
            data.invited.push(req.body.friend)
            update(ref(db, `Users/${req.body.uid}`), {invited: data.invited});
            res.json({code: 200, data: "User successfully invited!"})
        })
        .catch((err)=>{
            res.json({code: 400, data: err.message});
        })
    }).catch((err)=>{
        res.json({code: 400, data: err.message});
    })
}

exports.buy_subscription = (req, res) => {
    if(req.body.subscription == 1){
        const today = new Date();
        today.setDate(today.getDate() + 7);
        const date = today.toLocaleDateString();
        update(ref(db, "Users/" + req.body.uid), {expiry: date, credit: 10000, subscription_type: 1})
        .then(()=>{
            res.json({code: 200, data: "Subscription successfully added!"})
        })
        .catch((err)=>{
            res.json({code: 400, data: err.message});
            return;
        });
    }else if(req.body.subscription == 2){
        const today = new Date();
        today.setDate(today.getDate() + 7);
        const date = today.toLocaleDateString();
        update(ref(db, "Users/" + req.body.uid), {expiry: date, credit: 20000, subscription_type: 2})
        .then(()=>{
            res.json({code: 200, data: "Subscription successfully added!"})
        })
        .catch((err)=>{
            res.json({code: 400, data: err.message});
            return;
        });
    }else{
        res.json({code: 400, data: "Unknown subscription type!"});
        return;
    }
}