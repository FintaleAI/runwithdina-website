// ============================================================
// ADD THIS doGet FUNCTION TO YOUR EXISTING GOOGLE APPS SCRIPT
// (The one at script.google.com for Monsoon Miles registrations)
//
// After adding, click Deploy > New deployment > Web app
// Set "Who has access" to "Anyone"
// Copy the new deployment URL and update DASHBOARD_API_URL in dashboard.html
// ============================================================

function doGet(e) {
  var pin = e.parameter.pin;

  // PIN check — change this to your preferred PIN
  if (pin !== 'MM2026') {
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'Unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Registrations') || ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var registrations = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    registrations.push(row);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ registrations: registrations }))
    .setMimeType(ContentService.MimeType.JSON);
}
