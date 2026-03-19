/**
 * Direct test script for the 17 bug fixes.
 * Uses the built dist/ code to test against live Bexio API.
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load token from .mcp.json (same source as the MCP server)
const mcpConfig = JSON.parse(readFileSync(resolve('d:/Apps/wyss-bio-platform/5/.mcp.json'), 'utf-8'));
const token = mcpConfig.mcpServers.bexio.env.BEXIO_API_TOKEN;

const { BexioClient } = await import('./dist/bexio-client.js');

const client = new BexioClient({
  apiToken: token,
  baseUrl: 'https://api.bexio.com/2.0',
});

const results = [];
function log(test, status, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  results.push({ test, status, detail });
  console.log(`${icon} ${test}: ${status} ${detail}`);
}

try {
  // Test 1: edit_quote — whitelist approach
  console.log('\n--- Test 1: edit_quote ---');
  try {
    const { handlers } = await import('./dist/tools/quotes/handlers.js');
    const result = await handlers.edit_quote(client, { quote_id: 2, quote_data: { title: 'Testofferte Muster AG — Retest' } });
    log('edit_quote', result?.title ? 'PASS' : 'FAIL', `title=${result?.title}`);
  } catch (e) { log('edit_quote', 'FAIL', JSON.stringify(e.details || e.message)?.slice(0, 300)); }

  // Test 2: copy_quote — no body
  console.log('\n--- Test 2: copy_quote ---');
  try {
    const result = await client.copyQuote(2);
    log('copy_quote', result?.id ? 'PASS' : 'FAIL', `new_id=${result?.id}`);
  } catch (e) { log('copy_quote', 'FAIL', e.message?.slice(0, 120)); }

  // Test 3: copy_invoice — no body
  console.log('\n--- Test 3: copy_invoice ---');
  try {
    const result = await client.copyInvoice(2);
    log('copy_invoice', result?.id ? 'PASS' : 'FAIL', `new_id=${result?.id}`);
  } catch (e) { log('copy_invoice', 'FAIL', e.message?.slice(0, 120)); }

  // Test 4: create_note — without is_public
  console.log('\n--- Test 4: create_note ---');
  try {
    const { handlers: noteHandlers } = await import('./dist/tools/notes/handlers.js');
    const result = await noteHandlers.create_note(client, {
      user_id: 2, event_start: '2026-03-19 10:00:00', subject: 'Retest-Notiz'
    });
    log('create_note', result?.id ? 'PASS' : 'FAIL', `id=${result?.id}`);
  } catch (e) { log('create_note', 'FAIL', JSON.stringify(e.details || e.message)?.slice(0, 300)); }

  // Test 5: list_currencies — v3.0 endpoint
  console.log('\n--- Test 5: list_currencies ---');
  try {
    const result = await client.listCurrencies();
    log('list_currencies', Array.isArray(result) ? 'PASS' : 'FAIL', `count=${result?.length}`);
  } catch (e) { log('list_currencies', 'FAIL', e.message?.slice(0, 120)); }

  // Test 6: get_currency
  console.log('\n--- Test 6: get_currency ---');
  try {
    const result = await client.getCurrency(1);
    log('get_currency', result?.id ? 'PASS' : 'FAIL', `name=${result?.name}`);
  } catch (e) { log('get_currency', 'FAIL', e.message?.slice(0, 120)); }

  // Test 7: list_permissions — should throw clear error
  console.log('\n--- Test 7: list_permissions ---');
  try {
    const { handlers: companyHandlers } = await import('./dist/tools/company/handlers.js');
    await companyHandlers.list_permissions(client, {});
    log('list_permissions', 'FAIL', 'Should have thrown');
  } catch (e) {
    log('list_permissions', e.message?.includes('does not provide') ? 'PASS' : 'FAIL', e.message?.slice(0, 100));
  }

  // Test 8: list_expenses — should throw clear error
  console.log('\n--- Test 8: list_expenses ---');
  try {
    const { handlers: purchaseHandlers } = await import('./dist/tools/purchase/handlers.js');
    await purchaseHandlers.list_expenses(client, {});
    log('list_expenses', 'FAIL', 'Should have thrown');
  } catch (e) {
    log('list_expenses', e.message?.includes('does not provide') ? 'PASS' : 'FAIL', e.message?.slice(0, 100));
  }

  // Test 9: create_subtotal_position — without body
  console.log('\n--- Test 9: create_subtotal_position ---');
  try {
    const result = await client.createPosition('kb_offer', 2, 'kb_position_subtotal', { text: 'Zwischensumme' });
    log('create_subtotal_position', result?.id ? 'PASS' : 'FAIL', `id=${result?.id}`);
  } catch (e) { log('create_subtotal_position', 'FAIL', e.message?.slice(0, 120)); }

  // Test 10: create_pagebreak_position — without body
  console.log('\n--- Test 10: create_pagebreak_position ---');
  try {
    const result = await client.createPosition('kb_offer', 2, 'kb_position_pagebreak', { pagebreak: true });
    log('create_pagebreak_position', result?.id ? 'PASS' : 'FAIL', `id=${result?.id}`);
  } catch (e) { log('create_pagebreak_position', 'FAIL', e.message?.slice(0, 120)); }

  // Test 11: search_bills — GET instead of POST
  console.log('\n--- Test 11: search_bills ---');
  try {
    // Just list bills with a limit — the GET endpoint acts as search with query params
    const result = await client.searchBills([], { limit: 5 });
    const items = Array.isArray(result) ? result : result?.data;
    log('search_bills', items !== undefined ? 'PASS' : 'FAIL', `count=${items?.length}, type=${typeof result}`);
  } catch (e) { log('search_bills', 'FAIL', e.message?.slice(0, 120)); }

  // Test 12: update_contact_relation — fetch + merge
  console.log('\n--- Test 12: update_contact_relation ---');
  try {
    // First list to get an ID
    const relations = await client.listContactRelations();
    if (relations?.length > 0) {
      const { handlers: miscHandlers } = await import('./dist/tools/misc/handlers.js');
      const relId = relations[0].id;
      const result = await miscHandlers.update_contact_relation(client, {
        relation_id: relId, relation_data: { description: 'Retest' }
      });
      log('update_contact_relation', 'PASS', `updated relation ${relId}`);
    } else {
      log('update_contact_relation', 'SKIP', 'No relations found');
    }
  } catch (e) { log('update_contact_relation', 'FAIL', e.message?.slice(0, 120)); }

  // Test 13: create_project — with contact_id required
  console.log('\n--- Test 13: create_project ---');
  try {
    const { handlers: projHandlers } = await import('./dist/tools/projects/handlers.js');
    const result = await projHandlers.create_project(client, {
      user_id: 2, name: 'Retest-Projekt', contact_id: 5, pr_state_id: 1, pr_project_type_id: 1
    });
    log('create_project', result?.id ? 'PASS' : 'FAIL', `id=${result?.id}`);
  } catch (e) { log('create_project', 'FAIL', JSON.stringify(e.details || e.message)?.slice(0, 300)); }

  // Test 14: create_fictional_user — with email required
  console.log('\n--- Test 14: create_fictional_user ---');
  try {
    // First check existing users for valid salutation_type values
    const users = await client.listFictionalUsers();
    const sType = users?.[0]?.salutation_type || 'male';
    console.log('  Known salutation_type:', sType);
    const uniqueEmail = `retest-${Date.now()}@example.com`;
    const result = await client.createFictionalUser({
      salutation_type: sType, firstname: 'Retest', lastname: 'User', email: uniqueEmail
    });
    log('create_fictional_user', result?.id ? 'PASS' : 'FAIL', `id=${result?.id}`);
  } catch (e) { log('create_fictional_user', 'FAIL', JSON.stringify(e.details || e.message)?.slice(0, 300)); }

  // Test 15: create_additional_address — with street_name/house_number
  console.log('\n--- Test 15: create_additional_address ---');
  try {
    const result = await client.createAdditionalAddress(5, {
      name: 'Retest-Adresse', street_name: 'Teststrasse', house_number: '42',
      postcode: '3000', city: 'Bern', country_id: 1
    });
    log('create_additional_address', result?.id ? 'PASS' : 'FAIL', `id=${result?.id}`);
  } catch (e) { log('create_additional_address', 'FAIL', e.message?.slice(0, 120)); }

} catch (e) {
  console.error('Fatal error:', e);
}

// Summary
console.log('\n\n=== SUMMARY ===');
const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
const skipped = results.filter(r => r.status === 'SKIP').length;
console.log(`${passed} passed, ${failed} failed, ${skipped} skipped out of ${results.length} tests`);
if (failed > 0) {
  console.log('\nFailed tests:');
  results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  ❌ ${r.test}: ${r.detail}`));
}
