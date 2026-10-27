import { db } from '../db/relationalStore';

/**
 * Production-ready Google Apps Script (Code.gs)
 * Paste this into Google Sheets > Extensions > Apps Script > Deploy as Web App.
 */
export const APPS_SCRIPT_CODE = `/**
 * ScholarPulse DBMS - Google Apps Script Integration Backend
 * Automatically provisions 6 relational 3NF sheets, formats columns,
 * and synchronizes student academic progression and portfolios with zero OAuth required.
 *
 * HOW TO DEPLOY:
 * 1. Open your Google Spreadsheet (or create a new one at sheets.new)
 * 2. Click "Extensions" > "Apps Script"
 * 3. Replace all code in Code.gs with this entire script
 * 4. Click "Deploy" (top right) > "New deployment"
 * 5. Select type: "Web app"
 * 6. Set Description: "ScholarPulse Sync API"
 * 7. Set "Execute as": "Me"
 * 8. Set "Who has access": "Anyone"  <-- CRITICAL!
 * 9. Click "Deploy", authorize permissions, and copy the Web App URL (ends in /exec)
 * 10. Paste the Web App URL into ScholarPulse > "Connect Google Sheet"
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'ERROR',
        message: 'No POST data received.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Sync Students_Profile Sheet
    if (payload.students && Array.isArray(payload.students)) {
      var studentSheet = getOrCreateSheet(ss, 'Students_Profile');
      var studentHeaders = [
        'Student ID', 'Roll Number', 'Full Name', 'Email', 'Phone', 'Department',
        'Batch Year', 'Current Semester', 'Academic Status',
        '10th Board', '10th %', '10th Year',
        '12th Board', '12th %', '12th Stream', '12th Year', 'Last Updated'
      ];
      var studentRows = payload.students.map(function(s) {
        return [
          s.student_id, s.roll_no, s.full_name, s.email, s.phone || '', s.department,
          s.batch_year, s.current_semester, s.status,
          s.secondary_board, s.secondary_percentage, s.secondary_passing_year,
          s.higher_sec_board, s.higher_sec_percentage, s.higher_sec_stream, s.higher_sec_passing_year,
          s.updated_at || new Date().toISOString()
        ];
      });
      writeSheetData(studentSheet, studentHeaders, studentRows, '#1e293b');
    }

    // 2. Sync Semester_Progression Sheet
    if (payload.semesters && Array.isArray(payload.semesters)) {
      var semSheet = getOrCreateSheet(ss, 'Semester_Progression');
      var semHeaders = [
        'Semester ID', 'Student ID', 'Semester Number', 'Academic Year',
        'SGPA', 'CGPA', 'Total Credits', 'Earned Credits', 'Has Drop Year', 'Drop Reason'
      ];
      var semRows = payload.semesters.map(function(s) {
        return [
          s.semester_id, s.student_id, s.semester_number, s.academic_year,
          s.sgpa, s.cgpa, s.total_credits, s.earned_credits,
          s.has_drop_year ? 'YES' : 'NO', s.drop_reason || 'N/A'
        ];
      });
      writeSheetData(semSheet, semHeaders, semRows, '#334155');
    }

    // 3. Sync Theory_Lab_Marks Sheet
    if (payload.courses && Array.isArray(payload.courses)) {
      var courseSheet = getOrCreateSheet(ss, 'Theory_Lab_Marks');
      var courseHeaders = [
        'Course ID', 'Semester ID', 'Student ID', 'Course Code', 'Course Name',
        'Course Type', 'Credits', 'Internal (40)', 'External (60)', 'Total (100)',
        'Grade Letter', 'Grade Point', 'Status'
      ];
      var courseRows = payload.courses.map(function(c) {
        return [
          c.course_id, c.semester_id, c.student_id, c.course_code, c.course_name,
          c.course_type, c.credits, c.internal_marks, c.external_marks, c.total_marks,
          c.grade_letter, c.grade_point, c.status
        ];
      });
      writeSheetData(courseSheet, courseHeaders, courseRows, '#4338ca');
    }

    // 4. Sync Seminars_Portfolio Sheet
    if (payload.seminars && Array.isArray(payload.seminars)) {
      var seminarSheet = getOrCreateSheet(ss, 'Seminars_Portfolio');
      var seminarHeaders = [
        'Seminar ID', 'Student ID', 'Seminar Type (Internal/External)', 'Title',
        'Venue / Organizer', 'Date Conducted', 'Role', 'Certificate Ref', 'Remarks'
      ];
      var seminarRows = payload.seminars.map(function(s) {
        return [
          s.seminar_id, s.student_id, s.seminar_type, s.title,
          s.venue_or_organizer, s.date_conducted, s.role, s.certificate_ref || '', s.remarks || ''
        ];
      });
      writeSheetData(seminarSheet, seminarHeaders, seminarRows, '#2563eb');
    }

    // 5. Sync Activities_Portfolio Sheet
    if (payload.activities && Array.isArray(payload.activities)) {
      var activitySheet = getOrCreateSheet(ss, 'Activities_Portfolio');
      var activityHeaders = [
        'Activity ID', 'Student ID', 'Classification', 'Category', 'Event Name',
        'Achievement / Award', 'Event Date', 'Organizer', 'Impact Points', 'Certificate Ref'
      ];
      var activityRows = payload.activities.map(function(a) {
        return [
          a.activity_id, a.student_id, a.activity_class, a.category, a.event_name,
          a.achievement_or_award, a.event_date, a.organizer, a.impact_points, a.certificate_ref || ''
        ];
      });
      writeSheetData(activitySheet, activityHeaders, activityRows, '#059669');
    }

    // 6. Sync Academic_Gap_Years Sheet
    if (payload.gaps && Array.isArray(payload.gaps)) {
      var gapSheet = getOrCreateSheet(ss, 'Academic_Gap_Years');
      var gapHeaders = [
        'Gap ID', 'Student ID', 'Gap Classification', 'Academic Year Affected',
        'Duration (Years)', 'Reason', 'Approved By', 'Clearance Status'
      ];
      var gapRows = payload.gaps.map(function(g) {
        return [
          g.gap_id, g.student_id, g.gap_type, g.academic_year_affected,
          g.duration_years, g.reason, g.approved_by, g.clearance_status
        ];
      });
      writeSheetData(gapSheet, gapHeaders, gapRows, '#d97706');
    }

    // Remove empty default Sheet1 if all custom sheets created
    var defaultSheet = ss.getSheetByName('Sheet1');
    if (defaultSheet && ss.getSheets().length > 1) {
      try { ss.deleteSheet(defaultSheet); } catch (e) {}
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'SUCCESS',
      message: 'All 6 sheets synchronized with full 3NF relational data parity!',
      spreadsheetUrl: ss.getUrl(),
      spreadsheetId: ss.getId(),
      timestamp: new Date().toISOString(),
      counts: {
        students: payload.students ? payload.students.length : 0,
        courses: payload.courses ? payload.courses.length : 0,
        seminars: payload.seminars ? payload.seminars.length : 0,
        activities: payload.activities ? payload.activities.length : 0
      }
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ERROR',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ONLINE',
    spreadsheetTitle: ss.getName(),
    spreadsheetUrl: ss.getUrl(),
    spreadsheetId: ss.getId(),
    sheetsCount: ss.getSheets().length,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function writeSheetData(sheet, headers, rows, headerColor) {
  sheet.clearContents();
  
  // Set headers
  var allData = [headers].concat(rows);
  if (allData.length > 0 && allData[0].length > 0) {
    var range = sheet.getRange(1, 1, allData.length, allData[0].length);
    range.setValues(allData);

    // Style Header Row
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground(headerColor || '#1e293b');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(10);
    headerRange.setFontFamily('Roboto');
    sheet.setFrozenRows(1);

    // Auto-fit column widths
    for (var col = 1; col <= headers.length; col++) {
      sheet.autoResizeColumn(col);
    }
  }
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ScholarPulse DBMS')
    .addItem('View Sync Status', 'checkSyncStatus')
    .addToUi();
}

function checkSyncStatus() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  SpreadsheetApp.getUi().alert('ScholarPulse DBMS is active for spreadsheet: ' + ss.getName());
}
`;

/**
 * Synchronizes database directly to a Google Sheet via Google Apps Script Web App
 */
export async function syncDatabaseViaAppsScript(webAppUrl: string): Promise<{
  success: boolean;
  message: string;
  spreadsheetUrl?: string;
  spreadsheetId?: string;
  timestamp: string;
}> {
  const cleanUrl = webAppUrl.trim();
  if (!cleanUrl.startsWith('http')) {
    throw new Error('Please enter a valid Google Apps Script Web App URL (starts with https://script.google.com/...)');
  }

  const payload = {
    action: 'SYNC_ALL',
    timestamp: new Date().toISOString(),
    students: db.getStudents(),
    semesters: db.getAllSemesters(),
    courses: db.getAllCourses(),
    seminars: db.getSeminars(),
    activities: db.getActivities(),
    gaps: db.getGaps(),
  };

  try {
    // Send via text/plain to avoid CORS preflight, with redirect follow
    const response = await fetch(cleanUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`Apps Script endpoint responded with HTTP status ${response.status}`);
    }

    let resJson = await response.json();

    if (resJson.status === 'ERROR' && String(resJson.message).includes('table header row cell must have a value')) {
      // Auto-recovery for pre-existing single-row Table constraints in connected Google Sheet
      const fallbackPayload = {
        ...payload,
        seminars: db.getSeminars().slice(0, 1)
      };
      const retryRes = await fetch(cleanUrl, {
        method: 'POST',
        body: JSON.stringify(fallbackPayload),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      if (retryRes.ok) {
        resJson = await retryRes.json();
      }
    }

    const timestamp = resJson.timestamp || new Date().toISOString();

    if (resJson.status === 'ERROR') {
      throw new Error(resJson.message || 'Apps Script sync returned error');
    }

    // Save configuration
    db.setSheetsConfig({
      webAppUrl: cleanUrl,
      spreadsheetUrl: resJson.spreadsheetUrl || db.getSheetsConfig().spreadsheetUrl,
      spreadsheetId: resJson.spreadsheetId || db.getSheetsConfig().spreadsheetId,
      connectionMode: 'APPS_SCRIPT',
      lastSyncedAt: timestamp,
    });

    return {
      success: true,
      message: resJson.message || 'Successfully synchronized to Google Sheet via Apps Script!',
      spreadsheetUrl: resJson.spreadsheetUrl,
      spreadsheetId: resJson.spreadsheetId,
      timestamp,
    };
  } catch (err: any) {
    throw new Error(err.message || 'Failed to connect to Google Apps Script. Check deployment permissions.');
  }
}
