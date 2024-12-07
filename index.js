const express = require('express');
const app = express();
const willhaben = require('willhaben');
const assert = require('assert')
const puppeteer = require('puppeteer');


// Konfiguration für das Frontend
app.use(express.static('public'));
// Body Parser Middleware
app.use(express.json());

app.set('view engine', 'ejs');

app.get('/', (req, res) => {

    res.render('index.ejs');
});

app.get('/search', async (req, res) => {
    const make = req.query.make;
    const model = req.query.model;
	const minPrice = req.query.minPrice.replace(/,/g, '');
    const maxPrice = req.query.maxPrice.replace(/,/g, '');
    const MILEAGE_TO = req.query.MILEAGE_TO;
    const YEAR_MODEL_FROM = req.query.YEAR_MODEL_FROM;
    const fueltype = req.query.fueltype;
    const rows = req.query.rows;

    
  
    let url = 'https://www.willhaben.at/iad/gebrauchtwagen/auto/gebrauchtwagenboerse';
    url += `?q=${make}+${model}`;

    if (minPrice !='null') {
      url += `&PRICE_FROM=${minPrice}`;
    }
    if (maxPrice !='null') {
      url += `&PRICE_TO=${maxPrice}`;
    }
    if(MILEAGE_TO !='null' ){
      url += `&MILEAGE_TO=${MILEAGE_TO}`;
    }
    if(YEAR_MODEL_FROM!='null'){
      url += `&YEAR_MODEL_FROM=${YEAR_MODEL_FROM}`;
    }
    // if(rows!= 'null'){
    //   url += `&rows=${rows}`;
    // }

    url += "&rows=1000";
  
    console.log(url);

    willhaben.getListings(url)
      .then(async listings => {
        
        if(model){
          console.log("Doing filtering by " + model);
          listings =  await filterByValue(listings, model);
        }
        if(make){
          console.log("Doing filtering by " + make);
          listings =  await filterByValue(listings, make);
        }
        if(fueltype){
          console.log("Doing filtering by " + fueltype);
          listings =  await filterByValue(listings, fueltype);
        }

        res.json(listings);
      })
      .catch(err => {
        console.error(err);
        res.status(500).send('Internal Server Error');
      });
  });
  

  function filterByValue(array, value) {
    return array.filter((data) =>  JSON.stringify(data).toLowerCase().indexOf(value.toLowerCase()) !== -1);
  }

app.get('/init', (req, res) => {

    let url = 'https://www.willhaben.at/iad/gebrauchtwagen/auto/gebrauchtwagenboerse?MILEAGE_TO=6000&YEAR_MODEL_FROM=2020&rows=1000&FUEL_TYPE=Benzin';
   
    willhaben.getListings(url)
      .then(listings => {
        res.json(listings);
      })
      .catch(err => {
        console.error(err);
        res.status(500).send('Internal Server Error');
      });
  });
  
  app.post('/deleteCar', async (req, res) => {
    const link = req.body.link;
  
    (async () => {
      let browser; // Deklaration der browser-Variablen
  
      try {
        browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        await page.goto(link);
  
        const emailAddress = "max.mustermann@gmail.com"; // Hier wird die E-Mail-Adresse gesetzt

        // Warten, bis die Zustimmungs-Schaltfläche für Cookies geladen ist
        try {
          await page.waitForSelector('#didomi-notice-agree-button', { timeout: 2000 });
          await page.click('#didomi-notice-agree-button');
        } catch (error) {
            console.error('Zustimmungs-Schaltfläche für Cookies wurde nicht gefunden oder konnte nicht innerhalb von 2 Sekunden geladen werden.');
        }

        // Warten, bis die Seite geladen ist
        await page.waitForSelector('a[data-testid="ad-detail-report-ad"]');
  
        // Link zum Anzeigen melden finden und darauf klicken
        await page.click('a[data-testid="ad-detail-report-ad"]');
  
        // Warten, bis die Seite zum Anzeigen melden geladen ist
        await page.waitForSelector('select[id="reason"]');
  
        // Anstößiges/Beleidigendes auswählen
        await page.select('select[id="reason"]', 'OFFENSIVE_CONTENT');
      
        // E-Mail-Adresse eingeben
        await page.type('input[id="emailAddress"]', emailAddress);
        
        // Betrugstext eingeben
        await page.type('textarea[id="message"]', 'Betrug');
  

        // Checkbox klicken
        await page.click('.Checkbox__CheckboxInputWrapper-sc-7kkiwa-8');
  
        // Formular absenden
        await page.click('button[data-testid="sendReport-button"]');
  
        // Warten auf Bestätigung oder Fehlermeldung
        await page.waitForSelector('.ReactModal__Content', { timeout: 2000 });
        console.log('Aktion erfolgreich abgeschlossen.');
  
        // Schließen des Modals durch Klicken auf die Schaltfläche "Schließen"
        await page.click('button[data-testid="report-confirmation-close-button"]');
  
        // Erfolgreichen Status zurückgeben
        res.status(200).send({ message: 'Fahrzeug wurde gemeldet' });
  
      } catch (error) {
        console.error('Fehler beim Abschließen der Aktion:', error);
        // Fehlerstatus zurückgeben
        res.status(500).send({ message: 'Fehler beim Löschen des Autos' });
      } finally {
        if (browser) {
          // Warten, damit Sie den Browser sehen können, bevor er geschlossen wird
          await new Promise(resolve => setTimeout(resolve, 5000));
          await browser.close();
        }
      }
    })();
  });


app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running on port 3000');
});

