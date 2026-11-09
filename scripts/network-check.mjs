import {chromium,expect} from '@playwright/test';
import {pathToFileURL} from 'node:url';import path from 'node:path';
const b=await chromium.launch();
try{
 const page=await b.newPage({viewport:{width:1440,height:1000}});
 await page.goto(process.env.APP_URL||pathToFileURL(path.resolve('docs/index.html')).href,{waitUntil:'domcontentloaded',timeout:30000});
 await expect.poll(()=>page.locator('.leaflet-tile-loaded').count(),{timeout:20000}).toBeGreaterThan(0);
 console.log('PASS NETWORK: OpenStreetMap real tiles loaded');
 await page.locator('.desktop-nav').getByRole('button',{name:'온라인몰',exact:true}).click();
 await page.locator('.mall-product .primary').first().click();await page.locator('.mall-cart-bar .primary').click();
 await page.getByRole('button',{name:'도로명 주소 검색 Daum'}).click();
 await expect.poll(()=>page.locator('.address-search-panel iframe').count(),{timeout:20000}).toBeGreaterThan(0);
 console.log('PASS NETWORK: Daum postcode live search iframe initialized');
}finally{await b.close();}
