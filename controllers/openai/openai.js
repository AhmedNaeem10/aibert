const { Configuration, OpenAIApi } = require("openai");

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
    const puppeteer = require("puppeteer");
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    const url = "https://discord.com/channels/662267976984297473/1008571037862080542"
    await page.goto(url);
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', "ahmednaeem.career@gmail.com", {delay: 100})
    await page.type('input[name="password"]', "9026040An!", {delay: 100});
    await page.click('button[type="submit"]');
    await page.waitForSelector('div[role="textbox"]')
    await page.click('div[role="textbox"]')
    await page.keyboard.type("/imagine");
    await page.waitForTimeout(2000);
    await page.keyboard.press("Enter");
    let query = msg
    await page.keyboard.type(query);
    query = "ahmednaeem_" + query.replaceAll(" ", "_")
    await page.keyboard.press("Enter");
    await page.waitForTimeout(45000);
    let link = await page.evaluate((query)=>{
        let as = document.querySelectorAll('a')
        for(let a of as){
            if(a['href'].includes(query)){
                return a["href"];
            }
        }
        return null;
    }, query)
    if(!link){
        await page.waitForTimeout(20000);
        link = await page.evaluate((query)=>{
            let as = document.querySelectorAll('a')
            for(let a of as){
                if(a['href'].includes(query)){
                    return a["href"];
                }
            }
            return null;
        }, query)
    }
    await browser.close();
    return [link, 200];
}

