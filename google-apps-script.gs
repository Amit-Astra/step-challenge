/**
 * Family Step Challenge — Google Sheet sync backend
 * -------------------------------------------------
 * Paste this whole file into Extensions → Apps Script in your Google Sheet,
 * then deploy as a Web App (see README-publish.md, Step 1).
 *
 * It maintains one tab called "Weeks" with columns:
 *   week | player | playing | completed | updated
 * playing / completed are TRUE/FALSE; completed left blank = not marked yet.
 * You can edit rows in the Sheet by hand — phones pick changes up within ~25s.
 */

var SHEET_NAME = 'Weeks';

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['week', 'player', 'playing', 'completed', 'updated']);
    sh.getRange('1:1').setFontWeight('bold');
  }
  return sh;
}

function parseBool_(v) {
  return v === true || String(v).toUpperCase() === 'TRUE';
}

/** GET ?action=get → { rows: [ {week, player, playing, completed} ] } */
function doGet(e) {
  var sh = getSheet_();
  var values = sh.getDataRange().getValues();
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var week = values[i][0], player = values[i][1];
    if (week === '' || player === '') continue;
    var completed = values[i][3];
    rows.push({
      week: Number(week),
      player: String(player),
      playing: parseBool_(values[i][2]),
      completed: (completed === '' || completed === null) ? null : parseBool_(completed)
    });
  }
  return ContentService
    .createTextOutput(JSON.stringify({ rows: rows }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST body (JSON):
 *   single update: { week, player, playing, completed }
 *   bulk seed:     { entries: [ {week, player, playing, completed}, ... ] }
 * Upserts by (week, player). completed null → blank cell.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var body = JSON.parse(e.postData.contents);
    var entries = body.entries ? body.entries : [body];
    var sh = getSheet_();
    var values = sh.getDataRange().getValues();

    // index existing rows by "week|player" → sheet row number
    var index = {};
    for (var i = 1; i < values.length; i++) {
      index[Number(values[i][0]) + '|' + String(values[i][1])] = i + 1;
    }

    var now = new Date();
    entries.forEach(function (p) {
      var week = Number(p.week);
      var player = String(p.player);
      if (!week || !player) return;
      var playing = !!p.playing;
      var completed = (p.completed === null || p.completed === undefined) ? '' : !!p.completed;
      var rowNum = index[week + '|' + player];
      if (rowNum) {
        sh.getRange(rowNum, 3, 1, 3).setValues([[playing, completed, now]]);
      } else {
        sh.appendRow([week, player, playing, completed, now]);
        index[week + '|' + player] = sh.getLastRow();
      }
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, count: entries.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
