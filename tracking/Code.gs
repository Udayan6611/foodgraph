const SPREADSHEET_ID = '1rToeNKRt_xZAlhY3oa6HouTEGQxr-GwlQWKzNTj2H98';
const SHEET_NAME = 'Events';

const BASE_HEADERS = [
  'timestamp',
  'event',
  'session_id',
  'referrer_id',
  'source',
  'campaign',
  'landing_path',
  'area',
  'cuisines',
  'vibes',
  'budget',
  'ref',
  'result_names',
  'result_scores',
  'restaurant_name',
  'action',
  'feedback'
];

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    ensureHeaders_(sheet);

    const params = e && e.parameter ? e.parameter : {};
    const headers = getHeaders_(sheet);

    const row = headers.map(function(header) {
      if (header === 'timestamp') {
        return new Date();
      }
      return params[header] !== undefined ? params[header] : '';
    });

    sheet.appendRow(row);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function ensureHeaders_(sheet) {
  const lastColumn = sheet.getLastColumn();

  if (lastColumn === 0) {
    sheet.getRange(1, 1, 1, BASE_HEADERS.length).setValues([BASE_HEADERS]);
    return;
  }

  const existing = getHeaders_(sheet);
  const missing = BASE_HEADERS.filter(function(header) {
    return existing.indexOf(header) === -1;
  });

  if (missing.length) {
    sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
  }
}

function getHeaders_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn === 0) return [];
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
    .map(function(value) { return String(value).trim(); });
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
