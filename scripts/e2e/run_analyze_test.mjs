#!/usr/bin/env node
// Playwright E2E helper — fills the idea form, clicks Analyze, and waits
// for the backend to persist a new plan. Requires `playwright` and Node 18+.

import { chromium } from 'playwright';

const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3000';
const API = process.env.API_URL || 'http://127.0.0.1:8000';

async function latestPlanIsRecent() {
  try {
    const res = await fetch(`${API}/api/plans`);
    if (!res.ok) return false;
    const plans = await res.json();
    if (!plans || plans.length === 0) return false;
    const created = new Date(plans[0].created_at).getTime();
    return Date.now() - created < 90_000; // 90s
  } catch (e) {
    return false;
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(`${FRONTEND}/generate`, { waitUntil: 'domcontentloaded' });

    // Fill the idea textarea
    const idea = 'E2E test: tiny marketplace for local plants and seeds.';
    await page.fill('textarea, [role="textbox"]', idea);

    // Click the analyze button by stable id
    await page.click('#analyze-btn');

    // Wait up to 60s for the backend to record a new plan
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      if (await latestPlanIsRecent()) {
        console.log('✅ New plan detected in backend. E2E success.');
        await browser.close();
        process.exit(0);
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    console.error('❌ Timed out waiting for new plan.');
    await browser.close();
    process.exit(2);
  } catch (err) {
    console.error('Error during E2E run:', err);
    await browser.close();
    process.exit(3);
  }
}

run();
