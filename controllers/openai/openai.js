const { Configuration, OpenAIApi } = require("openai");
const axios = require("axios");
const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);

// let page;

// async function start(){
//     const puppeteer = require("puppeteer");
//     const browser = await puppeteer.launch({
//         headless: true,
//         defaultViewport: null,
//         args: ['--no-sandbox', '--disable-setuid-sandbox']
//     });
//     page = await browser.newPage();
//     const url = "https://discord.com/channels/662267976984297473/1008571037862080542"
//     page.goto(url);
//     page.waitForSelector('input[name="email"]');
//     page.type('input[name="email"]', "ahmednaeem.career@gmail.com", {delay: 100})
//     page.type('input[name="password"]', "9026040An!", {delay: 100});
//     page.click('button[type="submit"]');
// }

// start();

exports.ai_generated_msg = async (msg) =>{
    const completion = await openai.createCompletion({
      model: "text-davinci-002",
      prompt: msg,
      temperature: 0.6,
      max_tokens: 200
    });
    return [completion.data.choices[0].text.trim(), completion.data.usage.total_tokens];
}

exports.ai_generated_img = async (msg) => {
    const response = await openai.createImage({
      prompt: msg,
      n: 1,
      size: "1024x1024"
    });
    // 200 token is fixed for now
    return [response.data.data[0].url, 200];
}

exports.midjourney = async (msg) => {
    const url = "https://3c2b-65-109-163-192.ngrok.io/"
    let response = await axios.post(url, {msg: msg})
    if(response.data.code == 200){
        return [response.data.data, 200]
    }
}

