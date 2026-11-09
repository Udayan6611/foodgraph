const SPREADSHEET_ID = '1rToeNKRt_xZAlhY3oa6HouTEGQxr-GwlQWKzNTj2H98';
const SHEET_NAME = 'Events';
const SIGNUPS_SHEET_NAME = 'Signups';
const LEGAL_VERSION = '2026-11-09';
const HEADERS = [
  'timestamp','event','session_id','referrer_id','source','campaign','landing_path',
  'area','cuisines','vibes','budget','ref','result_names','result_scores',
  'restaurant_name','action','feedback'
];
const SIGNUP_HEADERS = [
  'timestamp','name','email','area','consent','session_id','referrer_id',
  'source','campaign','landing_path','legal_acknowledged','legal_version',
  'legal_acknowledged_at'
];

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
    ensureHeaders(sheet);
    const params = e && e.parameter ? e.parameter : {};
    const currentHeaders = getHeaders(sheet);
    const row = currentHeaders.map(function(header) {
      if (header === 'timestamp') return new Date();
      return params[header] !== undefined ? params[header] : '';
    });
    sheet.appendRow(row);
    return jsonResponse({ok:true});
  } catch (error) {
    return jsonResponse({ok:false,error:String(error)});
  }
}

function doPost(e) {
  const params = e && e.parameter ? e.parameter : {};
  const nonce = String(params.nonce || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0,100);
  try {
    if (params.form_type !== 'signup') throw new Error('Invalid form submission.');
    if (params.website) throw new Error('Invalid form submission.');
    if (params.legal_acknowledged !== 'yes') throw new Error('Please agree to the Terms of Use and acknowledge the Privacy Policy.');
    const name = String(params.name || '').trim().replace(/\s+/g,' ').slice(0,100);
    const email = String(params.email || '').trim().toLowerCase().slice(0,254);
    const area = String(params.area || '').trim().slice(0,80);
    const consent = params.consent === 'yes' ? 'yes' : 'no';
    if (!name) throw new Error('Please enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please enter a valid email address.');

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      let sheet = ss.getSheetByName(SIGNUPS_SHEET_NAME);
      if (!sheet) sheet = ss.insertSheet(SIGNUPS_SHEET_NAME);
      ensureSignupHeaders(sheet);
      const headers = getHeaders(sheet);
      const emailColumn = headers.indexOf('email') + 1;
      if (emailColumn < 1) throw new Error('Signup sheet is missing its email column.');
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const existing = sheet.getRange(2,emailColumn,lastRow-1,1).getDisplayValues().flat();
        const duplicateIndex = existing.findIndex(function(value){return String(value).trim().toLowerCase() === email;});
        if (duplicateIndex !== -1) {
          const rowNumber = duplicateIndex + 2;
          const legalColumn = headers.indexOf('legal_acknowledged') + 1;
          const versionColumn = headers.indexOf('legal_version') + 1;
          const acceptedAtColumn = headers.indexOf('legal_acknowledged_at') + 1;
          sheet.getRange(rowNumber,legalColumn,1,3).setValues([['yes',LEGAL_VERSION,new Date()]]);
          return signupResponse({ok:true,duplicate:true,message:'This email is already on the list.'},nonce);
        }
      }
      const values = {
        timestamp:new Date(),name:name,email:email,area:area,consent:consent,
        session_id:String(params.session_id || '').slice(0,120),
        referrer_id:String(params.referrer_id || '').slice(0,120),
        source:String(params.source || 'direct').slice(0,80),
        campaign:String(params.campaign || 'general').slice(0,100),
        landing_path:String(params.landing_path || '').slice(0,300),
        legal_acknowledged:'yes',
        legal_version:LEGAL_VERSION,
        legal_acknowledged_at:new Date()
      };
      sheet.appendRow(headers.map(function(header){return values[header] !== undefined ? values[header] : '';}));
    } finally {
      lock.releaseLock();
    }
    return signupResponse({ok:true,message:'Signup saved.'},nonce);
  } catch (error) {
    return signupResponse({ok:false,message:String(error.message || error)},nonce);
  }
}

function ensureHeaders(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn === 0) {
    sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
    return;
  }
  const existingHeaders = getHeaders(sheet);
  const missingHeaders = HEADERS.filter(function(header){return existingHeaders.indexOf(header) === -1;});
  if (missingHeaders.length) {
    sheet.getRange(1,existingHeaders.length+1,1,missingHeaders.length).setValues([missingHeaders]);
  }
}

function ensureSignupHeaders(sheet) {
  if (sheet.getLastColumn() === 0) {
    sheet.getRange(1,1,1,SIGNUP_HEADERS.length).setValues([SIGNUP_HEADERS]);
    return;
  }
  const existing = getHeaders(sheet);
  const missing = SIGNUP_HEADERS.filter(function(header){return existing.indexOf(header) === -1;});
  if (missing.length) {
    sheet.getRange(1,existing.length+1,1,missing.length).setValues([missing]);
  }
}

function getHeaders(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn === 0) return [];
  return sheet.getRange(1,1,1,lastColumn).getValues()[0].map(function(value){return String(value).trim();});
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function signupResponse(data,nonce) {
  const payload = JSON.stringify({
    type:'foodgraph-signup-result',
    nonce:nonce,
    ok:!!data.ok,
    message:String(data.message || '')
  });
  const safePayload = payload.replace(/</g,'\\u003c');
  return HtmlService.createHtmlOutput('<!doctype html><html><body><script>window.top.postMessage('+safePayload+', "*");</script></body></html>')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}