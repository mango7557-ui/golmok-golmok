import {chromium,expect} from '@playwright/test';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.APP_URL||pathToFileURL(path.resolve('docs/index.html')).href;
try{
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await expect(page.locator('.store-card')).toHaveCount(15);
 await expect(page.locator('.leaflet-container')).toBeVisible();
 await page.getByRole('button',{name:'가입·내 계정',exact:true}).click();
 await expect(page.locator('.account-shell')).toBeVisible();
 await expect(page.locator('input[type="password"]')).toHaveCount(0);
 await page.getByLabel('닉네임',{exact:true}).fill('성수산책자');
 await page.getByRole('checkbox').nth(0).check();await page.getByRole('checkbox').nth(1).check();
 await page.getByRole('button',{name:'체험 프로필 만들기'}).click();
 await expect(page.locator('.member-complete')).toContainText('성수산책자');
 await page.getByRole('button',{name:'관리자 페이지',exact:true}).click();
 await expect(page.locator('.admin-kpis')).toContainText('15');
 for(const label of ['매장 관리','주문 관리','회원·가입','혜택 현황','API 연결'])await page.locator('.admin-sidebar nav').getByRole('button',{name:label,exact:true}).click();
 await expect(page.locator('.integration-card')).toHaveCount(10);
 await expect(page.locator('.integration-card').filter({hasText:'결제 대행사'})).toContainText('연결 대기');
 await page.screenshot({path:'admin-preview.png',fullPage:true});
 await page.locator('.brand').click();
 await page.locator('.map-provider-tabs').getByRole('button',{name:'데모 지도',exact:true}).click();
 await expect(page.locator('.demo-map')).toBeVisible();
 await page.screenshot({path:'redesign-desktop.png',fullPage:true});
 await page.locator('.store-card-main').first().click();await page.locator('.add-item').first().click();await page.locator('.detail-footer .primary').click();
 const dialog=page.getByRole('dialog');await dialog.locator('select').filter({has:page.locator('option[value="c1"]')}).selectOption('c1');await dialog.getByLabel('사용 포인트',{exact:false}).fill('800');
 await expect(dialog.locator('.total-line strong')).toContainText('11,200');await expect(dialog.locator('.earning-line')).toContainText('336');
 await dialog.getByRole('button',{name:'데모 결제하고 주문'}).click();
 await page.locator('.mode-switch').click();await page.getByRole('button',{name:'주문 수락',exact:true}).click();await page.getByRole('button',{name:'준비 시작',exact:true}).click();await page.getByRole('button',{name:'준비 완료',exact:true}).click();await page.locator('.mode-switch').click();await page.getByRole('button',{name:'수령 완료',exact:true}).click();await expect(page.locator('.order-status')).toHaveText('이용 완료');
 await page.getByRole('button',{name:'주문 문의',exact:true}).click();await page.getByPlaceholder('메시지를 입력하세요').fill('No peanuts.');await page.getByRole('button',{name:'보내기',exact:true}).click();await expect(page.locator('.message-bubble')).toContainText('땅콩 제외 요청');await page.keyboard.press('Escape');
 for(const width of [360,390,768,1440]){
  await page.setViewportSize({width,height:900});
  for(const key of ['지도','온라인몰','탐험·미션','주문·채팅','혜택·마이']){
   const nav=width<=700?page.locator('.bottom-nav'):page.locator('.desktop-nav');await nav.getByRole('button',{name:key,exact:true}).click();
   if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`Overflow ${width} ${key}`);
  }
  await page.getByRole('button',{name:'가입·내 계정',exact:true}).click();if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Account overflow '+width);
  await page.getByRole('button',{name:'관리자 페이지',exact:true}).click();if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Admin overflow '+width);
  await page.locator('.brand').click();
 }
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'redesign-mobile.png',fullPage:true});
 const search=page.locator('.search-box input');const r=await search.boundingBox();if(!r)throw Error('Missing mobile search');const covered=await page.evaluate(({x,y})=>!document.elementFromPoint(x,y)?.closest('.search-box'),{x:r.x+r.width/2,y:r.y+r.height/2});if(covered)throw Error('Mobile search covered by map');
 await page.getByRole('button',{name:'가입·내 계정',exact:true}).click();await page.screenshot({path:'membership-preview.png',fullPage:true});
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS redesign: membership persistence, 6 admin sections, 10 honest integration statuses, real/demo maps, coupon/points checkout, merchant lifecycle, translation, all customer screens at 360/390/768/1440px.');
}finally{await browser.close();}
