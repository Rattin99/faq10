#!/usr/bin/env node




import inquirer from 'inquirer';
import puppeteer from 'puppeteer';
import { google } from 'googleapis';






function getHigh(string) {
    
    if(!string) return;

    const convertBanglaToEnglishNumber=(str)=>{

        if(!str) return;

            const numbers = {
                "\u09E6" : 0,
                "\u09E7" : 1,
                "\u09E8" : 2,
                "\u09E9" : 3,
                "\u09EA" : 4,
                "\u09EB" : 5,
                "\u09EC" : 6,
                "\u09ED" : 7,
                "\u09EE" : 8,
                "\u09EF" : 9
            }
    
           
            for (var x in numbers) {
                str = str.replace(new RegExp(x, 'g'), numbers[x]);
            }
            return str;
        
    }

    const [f,l] = convertBanglaToEnglishNumber(string).split('-');

    return l;
}



async function bal(sd,ed,item_name,headless){
    const auth = new google.auth.GoogleAuth({
        keyFile: "faq10-351912-d0efb4b7efa2.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets"
    })
    
    // create client instance for auth
    const client = await auth.getClient();
    
    //instance of google sheets api
    const googleSheets = google.sheets({version:"v4", auth: client});
    
    const spreadsheetId = '1F_lujYURhtsCVnhXVGRNSteST5BYdFXfut0Ag1DWVL0';
    //get metadata about spreadsheet
    const metadata = await googleSheets.spreadsheets.get({
        auth,
        spreadsheetId,
    })

    const startDate = sd;
    const endDate = ed;


    const t = item_name.split(',')
    const target =  t[0];
    const dest = t[1];

  
    

    const start_date = new Date(startDate);
    const end_date = new Date(endDate);

    const nextDate = new Date(start_date)
    nextDate.setDate(start_date.getDate()+1)

    while(nextDate <= end_date){
        const Year = nextDate.getFullYear();
        const Month = nextDate.getMonth();
        const day = nextDate.getDate();

        const date = Year + "-" + (Month+1) + "-" + day;


        const data = await start(date,target,dest,headless);
        

        data.map((value,index)=>{
        value.unshift(date);
        

       if(value.length < 3){
        value[1] = dest;
        value[2] = 'missing data'
       }else{
        value[2] = getHigh(value[2]);
       }


       console.log(value);
       try{
        const response = ( googleSheets.spreadsheets.values.append({
            auth,
            spreadsheetId,
            range:"Sheet1",
            valueInputOption: "USER_ENTERED",
            resource: {
                values:[value]
            }
        })).data;

        

    } catch(err){
        console.log(err);
    }


        })

       

        

        
        nextDate.setDate(nextDate.getDate()+1)
    }

   
   
}



async function start(date,target,dest,headless){


    const h = headless === 'true' ? true : false;

    const browser = await puppeteer.launch({
        headless: h,
        defaultViewport:null
    })
    const page = await browser.newPage()
    await page.goto("http://dam.gov.bd/market_daily_price_report",{
        waitUntil: ['load','domcontentloaded','networkidle2'],
        // Remove the timeout
        timeout: 0
    })

    await page.click("#frm_filter > div > div:nth-child(1) > div.btn-group.bootstrap-select.show-tick > button");
    await page.click("#frm_filter > div > div:nth-child(1) > div.btn-group.bootstrap-select.show-tick.open > div > div > div > button.actions-btn.bs-select-all.btn.btn-default");

    await page.waitForNetworkIdle()

    await page.click("#frm_filter > div > div:nth-child(3) > div.btn-group.bootstrap-select.show-tick > button")
    await page.click("#frm_filter > div > div:nth-child(3) > div.btn-group.bootstrap-select.show-tick.open > div > div > div > button.actions-btn.bs-select-all.btn.btn-default")

    await page.waitForNetworkIdle()


    await page.click("#frm_filter > div > div:nth-child(5) > div.btn-group.bootstrap-select.show-tick > button")
    await page.click("#frm_filter > div > div:nth-child(5) > div.btn-group.bootstrap-select.show-tick.open > div > div > div > button.actions-btn.bs-select-all.btn.btn-default")


    await page.waitForNetworkIdle()


    await page.click("#frm_filter > div > div:nth-child(7) > div.btn-group.bootstrap-select.show-tick > button")
    await page.click("#frm_filter > div > div:nth-child(7) > div.btn-group.bootstrap-select.show-tick.open > div > div > div > button.actions-btn.bs-select-all.btn.btn-default")

    await page.waitForNetworkIdle()
    


    await page.click("#frm_filter > div > div:nth-child(9) > div:nth-child(2) > div > button")
    await page.click("#frm_filter > div > div:nth-child(9) > div:nth-child(2) > div > div > div > div > button.actions-btn.bs-select-all.btn.btn-default")

    
    await page.$eval('#date',( e )=> e.removeAttribute("readonly"))
    await page.focus("#date");
    await page.keyboard.type(date)
    await page.keyboard.press('Enter');
    await Promise.all([page.click('#frm_filter > input.btn.btn-danger'),page.waitForNavigation({waitUntil: 'networkidle2'})])


  const tableData = await page.evaluate((target,dest)=>{
      let data = [];
      let table = document.querySelector('table')

  

      for(let i = 2; i< table.rows.length;i++){
          const objCells = table.rows.item(i).cells;

          let values = [];
          for(let j = 0; j<objCells.length;j++){
              const text = objCells.item(j).innerHTML;
              values.push(text)
          }

          if(values.length > 5) values.splice(0,1);

          

          if(values.length > 0){
            const name = values[0];
            if(name.includes(target)) {
                values[0] = dest;
                data.push([values[0],values[2]]);
            }
           
            
            }
      }

      if(table.rows.length < 3) data.push([''])

     

      return data;
  },target,dest)
    await browser.close();

    return tableData;
}





async function cli(){
    inquirer.prompt([
        {
            name:'greeting',
            message: 'ki obostha shanto?',
            type: 'input',

        },
        {
            name: 'headless',
            message: 'headles??(true/false)'
        },
        {
            name: 'start_date',
            message:'start date? (format: YYYY-MM-DD)',
            type: 'input',
        },
        {
            name: 'end_date',
            message: 'end date? (format: YYYY-MM-DD)',
            type: 'input'
        },
        {
            name: 'item',
            message: 'select produce:',
            type:'list',
            choices: [
                ' বোরো চাল - মোটা,rice',
                'পেঁয়াজ - দেশী,onion',
                'সয়াবিন তেল,oil',
                'টমেটো,tomato',
                'আটা (লুজ),flour',
                'মুসুর - দেশী,lentil',
                ' আলু - দেশী,potato',
                'মুরগীঃ  ব্রয়লার,chicken'
            ]
        }
    ]).then(function(answer){
        bal(answer.start_date,answer.end_date,answer.item,answer.headless)
    })
}


await cli()


// bal('2022-5-18','2022-5-25', 'emni')






