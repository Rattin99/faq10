const puppeteer = require("puppeteer")
const { google } = require("googleapis")




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



async function bal(){
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

    const startDate = '2022-2-1';
    const endDate = '2022-3-1'

    let data_f = [];
    

    const start_date = new Date(startDate);
    const end_date = new Date(endDate);

    const nextDate = new Date(start_date)
    nextDate.setDate(start_date.getDate()+1)
    let  lastMonth = 3;

    while(nextDate <= end_date){
        const Year = nextDate.getFullYear();
        const Month = nextDate.getMonth();
        const day = nextDate.getDate();

        const date = Year + "-" + (Month+1) + "-" + day;


        const data = await start(date);

        data.map((value,index)=>{
        value.unshift(date);
        

        if(value.length>1){
            value[2] = getHigh(value[2]);
        }
      

        data_f.push(value)
        })
        
    
        if(Month == lastMonth+1){
            lastMonth++;

            try{
                const response = (await googleSheets.spreadsheets.values.append({
                    auth,
                    spreadsheetId,
                    range:"Sheet1",
                    valueInputOption: "USER_ENTERED",
                    resource: {
                        values:data_f
                    }
                })).data;
        
                
        
            } catch(err){
                console.log(err);
            }

            data_f = [];
        }

    

        nextDate.setDate(nextDate.getDate()+1)

    }

    if(data_f.length > 0){
        try{
            const response = (await googleSheets.spreadsheets.values.append({
                auth,
                spreadsheetId,
                range:"Sheet1",
                valueInputOption: "USER_ENTERED",
                resource: {
                    values:data_f
                }
            })).data;
    
            
    
        } catch(err){
            console.log(err);
        }

        data_f = []
    }
   
}



async function start(date){
    const browser = await puppeteer.launch({
        headless: true,
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


  const tableData = await page.evaluate(()=>{
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
            if(name.includes('বোরো চাল - মোটা')) {
                values[0] = 'rice';
                data.push([values[0],values[2]]);
            }
           
            
            }
      }

      if(table.rows.length < 3) data.push([''])

     

      return data;
  })
    await browser.close();

    return tableData;
}


bal()


   


function getDate(startDate,endDate,f){
    const start_date = new Date(startDate);
    const end_date = new Date(endDate);

    const nextDate = new Date(start_date)
    nextDate.setDate(start_date.getDate()+1)

    while(nextDate <= end_date){
        const Year = nextDate.getFullYear();
        const Month = nextDate.getMonth();
        const day = nextDate.getDate();

        const date = Year + "-" + (Month+1) + "-" + day;

        f(date)

        nextDate.setDate(nextDate.getDate()+1)

    }
}







