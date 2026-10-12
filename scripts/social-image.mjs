import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from './build.mjs';
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL || undefined});
try {
  const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
  const mark = (await readFile(resolve(root, 'src/app-icon.png'))).toString('base64');
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#ffffff;color:#2e2e2e;font-family:Arial,sans-serif}.card{width:1200px;height:630px;padding:52px 70px;position:relative;overflow:hidden}.brand{font-size:28px;letter-spacing:-1px;display:flex;align-items:center;gap:10px;font-weight:600}.brand img{width:46px;height:46px}.eyebrow{font:12px monospace;color:#4f4f4f;letter-spacing:2px;margin-top:67px}h1{font-size:84px;line-height:1.04;letter-spacing:-4px;font-weight:500;margin:20px 0 25px}h1 em{font-family:Georgia,serif;font-weight:400}.description{font-size:20px;line-height:1.6;color:#4f4f4f}.foot{position:absolute;left:70px;bottom:45px;font:11px monospace;letter-spacing:1px;color:#555555}.stamp{position:absolute;right:90px;top:220px;font-size:148px;color:#383838;transform:rotate(12deg)}.arc{width:380px;height:380px;border-radius:50%;border:1px solid #e5e5e5;position:absolute;right:-160px;bottom:-70px}.label{position:absolute;right:70px;top:58px;color:#4f4f4f;border:1px solid #e3e3e3;border-radius:30px;padding:9px 16px;font-size:11px}</style></head><body><div class="card"><div class="brand"><img src="data:image/png;base64,${mark}" alt="">nextstep.</div><div class="label">Open source · Local first</div><div class="eyebrow">YOUR AGENT’S CRM. YOUR DATA. YOUR CONTROL.</div><h1>A CRM for<br><em>your agent.</em></h1><div class="description">Your agents run the workflow.<br>You see the whole picture.</div><span class="stamp">✳</span><div class="arc"></div><div class="foot">PEOPLE / PROJECTS / RESEARCH / WHATEVER COMES NEXT</div></div></body></html>`);
  await page.screenshot({path:resolve(root,'src/social-preview.png')});
  console.log('Created src/social-preview.png (1200 × 630).');
} finally {await browser.close();}
