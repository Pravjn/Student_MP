import { db } from '../db/relationalStore';

export interface SyncResult {
  success: boolean;
  spreadsheetId: string;
  spreadsheetUrl: string;
  timestamp: string;
  recordsSynced: {
    students: number;
    semesters: number;
    courses: number;
    seminars: number;
    activities: number;
    gaps: number;
  };
  error?: string;
}

/**
 * Creates a new structured Google Spreadsheet in the user's Google Drive
 */
export async function createScholarPulseSpreadsheet(
  accessToken: string,
  title: string = 'ScholarPulse DBMS - Student Progression & Portfolios'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const payload = {
    properties: {
      title,
    },
    sheets: [
      { properties: { title: 'Students_Profile' } },
      { properties: { title: 'Semester_Progression' } },
      { properties: { title: 'Theory_Lab_Marks' } },
      { properties: { title: 'Seminars_Portfolio' } },
      { properties: { title: 'Activities_Portfolio' } },
      { properties: { title: 'Academic_Gap_Years' } },
    ],
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Sheets creation failed (${response.status}): ${errorBody}`);
  }

  const result = await response.json();
  const spreadsheetId = result.spreadsheetId;
  const spreadsheetUrl = result.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Synchronizes the entire 3NF Relational Database to Google Sheets
 */
export async function syncDatabaseToGoogleSheets(
  accessToken: string,
  targetSpreadsheetId?: string
): Promise<SyncResult> {
  let spreadsheetId = targetSpreadsheetId;
  let spreadsheetUrl = '';

  // If no spreadsheet provided, create one
  if (!spreadsheetId) {
    const created = await createScholarPulseSpreadsheet(accessToken);
    spreadsheetId = created.spreadsheetId;
    spreadsheetUrl = created.spreadsheetUrl;
  } else {
    spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }

  const students = db.getStudents();
  const semesters = db.getAllSemesters();
  const courses = db.getAllCourses();
  const seminars = db.getSeminars();
  const activities = db.getActivities();
  const gaps = db.getGaps();

  // 1. Students_Profile
  const studentsValues = [
    [
      'Student ID',
      'Roll Number',
      'Full Name',
      'Email',
      'Phone',
      'Department',
      'Batch Year',
      'Current Semester',
      'Academic Status',
      '10th Board',
      '10th %',
      '10th Pass Year',
      '12th Board',
      '12th %',
      '12th Stream',
      '12th Pass Year',
      'Updated At',
    ],
    ...students.map((s) => [
      s.student_id,
      s.roll_no,
      s.full_name,
      s.email,
      s.phone,
      s.department,
      s.batch_year,
      s.current_semester,
      s.status,
      s.secondary_board,
      s.secondary_percentage,
      s.secondary_passing_year,
      s.higher_sec_board,
      s.higher_sec_percentage,
      s.higher_sec_stream,
      s.higher_sec_passing_year,
      s.updated_at,
    ]),
  ];

  // 2. Semester_Progression
  const semestersValues = [
    [
      'Semester ID',
      'Student ID',
      'Semester Number',
      'Academic Year',
      'SGPA',
      'CGPA',
      'Total Credits',
      'Earned Credits',
      'Has Drop Year',
      'Drop / Gap Reason',
    ],
    ...semesters.map((s) => [
      s.semester_id,
      s.student_id,
      s.semester_number,
      s.academic_year,
      s.sgpa,
      s.cgpa,
      s.total_credits,
      s.earned_credits,
      s.has_drop_year ? 'YES' : 'NO',
      s.drop_reason || 'N/A',
    ]),
  ];

  // 3. Theory_Lab_Marks
  const coursesValues = [
    [
      'Course ID',
      'Semester ID',
      'Student ID',
      'Course Code',
      'Course Name',
      'Course Type',
      'Credits',
      'Internal Marks (40)',
      'External Marks (60)',
      'Total Marks (100)',
      'Grade Letter',
      'Grade Point',
      'Status',
    ],
    ...courses.map((c) => [
      c.course_id,
      c.semester_id,
      c.student_id,
      c.course_code,
      c.course_name,
      c.course_type,
      c.credits,
      c.internal_marks,
      c.external_marks,
      c.total_marks,
      c.grade_letter,
      c.grade_point,
      c.status,
    ]),
  ];

  // 4. Seminars_Portfolio
  const seminarsValues = [
    [
      'Seminar ID',
      'Student ID',
      'Seminar Type (Internal/External)',
      'Title / Topic',
      'Venue / Organizer',
      'Date Conducted',
      'Role',
      'Certificate Ref',
      'Remarks',
    ],
    ...seminars.map((s) => [
      s.seminar_id,
      s.student_id,
      s.seminar_type,
      s.title,
      s.venue_or_organizer,
      s.date_conducted,
      s.role,
      s.certificate_ref || '',
      s.remarks || '',
    ]),
  ];

  // 5. Activities_Portfolio
  const activitiesValues = [
    [
      'Activity ID',
      'Student ID',
      'Classification',
      'Category',
      'Event Name',
      'Achievement / Award',
      'Date',
      'Organizer',
      'Impact Points',
      'Certificate Ref',
    ],
    ...activities.map((a) => [
      a.activity_id,
      a.student_id,
      a.activity_class,
      a.category,
      a.event_name,
      a.achievement_or_award,
      a.event_date,
      a.organizer,
      a.impact_points,
      a.certificate_ref || '',
    ]),
  ];

  // 6. Academic_Gap_Years
  const gapsValues = [
    [
      'Gap ID',
      'Student ID',
      'Gap Classification',
      'Academic Year Affected',
      'Duration (Years)',
      'Reason & Justification',
      'Approved By',
      'Clearance Status',
    ],
    ...gaps.map((g) => [
      g.gap_id,
      g.student_id,
      g.gap_type,
      g.academic_year_affected,
      g.duration_years,
      g.reason,
      g.approved_by,
      g.clearance_status,
    ]),
  ];

  // Clear existing values and write clean data to each sheet
  const batchData = [
    { range: 'Students_Profile!A1:Q100', values: studentsValues },
    { range: 'Semester_Progression!A1:J100', values: semestersValues },
    { range: 'Theory_Lab_Marks!A1:M200', values: coursesValues },
    { range: 'Seminars_Portfolio!A1:I100', values: seminarsValues },
    { range: 'Activities_Portfolio!A1:J100', values: activitiesValues },
    { range: 'Academic_Gap_Years!A1:H100', values: gapsValues },
  ];

  // First ensure sheets exist or clear them
  for (const item of batchData) {
    const sheetName = item.range.split('!')[0];
    try {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:Z500:clear`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
    } catch {
      // Ignored if fresh sheet
    }
  }

  // Batch update values
  const writeRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: batchData,
    }),
  });

  if (!writeRes.ok) {
    const errorText = await writeRes.text();
    throw new Error(`Failed to write batch data to Google Sheet: ${errorText}`);
  }

  const timestamp = new Date().toISOString();
  db.setSheetsConfig({
    spreadsheetId,
    spreadsheetUrl,
    lastSyncedAt: timestamp,
  });

  return {
    success: true,
    spreadsheetId,
    spreadsheetUrl,
    timestamp,
    recordsSynced: {
      students: students.length,
      semesters: semesters.length,
      courses: courses.length,
      seminars: seminars.length,
      activities: activities.length,
      gaps: gaps.length,
    },
  };
}
