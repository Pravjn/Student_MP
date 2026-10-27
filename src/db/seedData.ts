import {
  Student,
  AcademicSemester,
  SemesterCourse,
  StudentSeminar,
  StudentActivity,
  AcademicGapRecord,
  SyncLogEntry,
  SeminarRole,
  ActivityCategory,
  AwardLevel
} from '../types/schema';
import { calculateGrade } from './calculations';

// Department list
const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Artificial Intelligence & Data Science',
  'Electronics & Communication',
  'Mechanical Engineering'
];

// Department short codes for roll numbers
const DEPT_CODES: Record<string, string> = {
  'Computer Science & Engineering': 'CSE',
  'Information Technology': 'IT',
  'Artificial Intelligence & Data Science': 'AIDS',
  'Electronics & Communication': 'ECE',
  'Mechanical Engineering': 'MECH'
};

// First names and last names for generating 105 realistic student profiles
const FIRST_NAMES = [
  'Aarav', 'Priya', 'Rohan', 'Sneha', 'Aditya', 'Ananya', 'Vikram', 'Neha',
  'Rahul', 'Ishaan', 'Tanvi', 'Devansh', 'Pooja', 'Siddharth', 'Shreya', 'Ayush',
  'Kavya', 'Ritwik', 'Meera', 'Tarun', 'Riya', 'Kunal', 'Divya', 'Varun',
  'Simran', 'Nikhil', 'Sanya', 'Harshit', 'Swati', 'Yash', 'Shruti', 'Arjun',
  'Bhavna', 'Gaurav', 'Manish'
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Mukherjee', 'Reddy', 'Verma', 'Iyer', 'Malhotra', 'Gupta',
  'Nair', 'Joshi', 'Kulkarni', 'Mehta', 'Hegde', 'Rao', 'Deshmukh', 'Mishra',
  'Bhat', 'Sen', 'Nambiar', 'Kapoor', 'Banerjee', 'Choudhury', 'Pillai', 'Natarajan',
  'Kaur', 'Agarwal', 'Bhatia', 'Trivedi', 'Saxena', 'Singhania', 'Gokhale', 'Chatterjee',
  'Bose', 'Pandey', 'Chauhan'
];

// Boards & streams
const SECONDARY_BOARDS = ['CBSE', 'ICSE', 'Maharashtra State Board', 'Karnataka State Board', 'West Bengal State Board'];
const HIGHER_SEC_BOARDS = ['CBSE', 'ISC', 'Maharashtra State Board', 'Telangana Board of Intermediate', 'Karnataka PU Board'];

// Standard subject definitions per semester
const SUBJECT_TEMPLATES: Record<number, { theory: string[]; lab: string[] }> = {
  1: {
    theory: ['Engineering Mathematics I', 'Engineering Physics', 'Basic Electrical Engineering', 'Programming for Problem Solving'],
    lab: ['Physics Laboratory', 'Computing Workshop Lab']
  },
  2: {
    theory: ['Engineering Mathematics II', 'Engineering Chemistry', 'Basic Electronics Engineering', 'Data Structures & Algorithms'],
    lab: ['Chemistry Laboratory', 'Data Structures Lab']
  },
  3: {
    theory: ['Discrete Mathematics', 'Digital Logic & Computer Organization', 'Object Oriented Programming with Java', 'Design & Analysis of Algorithms'],
    lab: ['Digital Electronics Lab', 'Algorithms Implementation Lab']
  },
  4: {
    theory: ['Formal Languages & Automata Theory', 'Database Management Systems', 'Operating Systems Principles', 'Computer Networks'],
    lab: ['Database Systems Lab', 'Operating Systems & Linux Lab']
  },
  5: {
    theory: ['Software Engineering & Agile Methodologies', 'Advanced Database Technologies', 'Cloud Computing & Distributed Systems', 'Web Systems & Frameworks'],
    lab: ['Full-Stack Development Lab', 'Cloud & DevOps Lab']
  },
  6: {
    theory: ['Artificial Intelligence & Expert Systems', 'Information & Network Security', 'Big Data Engineering', 'Compiler Design'],
    lab: ['AI & Machine Learning Lab', 'Network Security & Penetration Testing Lab']
  },
  7: {
    theory: ['Machine Learning & Deep Neural Networks', 'Mobile Computing & Android Architecture', 'Internet of Things (IoT) Systems', 'Distributed Ledger Technologies'],
    lab: ['Deep Learning Studio Lab', 'IoT & Embedded Systems Lab']
  },
  8: {
    theory: ['Autonomous Robotics & Computer Vision', 'Natural Language Processing', 'Cyber Forensics & Incident Response', 'Major Capstone Project Defense'],
    lab: ['Autonomous Systems Simulation Lab', 'Project Implementation Lab']
  }
};

const SEMINAR_TOPICS = [
  'Federated Learning for Privacy-Preserving Collaborative Healthcare AI',
  'Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge (zk-SNARKs)',
  'High-Throughput Distributed Transaction Processing with Apache Kafka',
  'Quantum Key Distribution and Post-Quantum Cryptographic Standards',
  'Edge Computing Architectures for Real-Time Autonomous Vehicles',
  'Microservice Service Mesh Observability Using eBPF and OpenTelemetry',
  'Large Language Model Fine-Tuning and Low-Rank Adaptation (LoRA)',
  'Resilient Distributed Consensus in Byzantine Fault Tolerant Networks',
  'Clean Code Architectures and Reactive Programming in Enterprise Microservices',
  'Photonic Computing and Neuromorphic Hardware Accelerators'
];

interface TechActivityItem {
  name: string;
  award: AwardLevel;
  points: number;
  category: ActivityCategory;
}

const TECHNICAL_ACTIVITIES: TechActivityItem[] = [
  { name: 'Smart India Hackathon Grand Finale', award: '1st Place', points: 500, category: 'Hackathon' },
  { name: 'ACM-ICPC Asia Regional Contest', award: 'Runner Up', points: 400, category: 'Coding Competition' },
  { name: 'IEEE International Student Paper Conference', award: '1st Place', points: 450, category: 'Paper Presentation' },
  { name: 'Google Solution Challenge Regional Stage', award: 'Runner Up', points: 350, category: 'Technical Workshop' },
  { name: 'National Robotics Olympiad - Autonomous Drone Race', award: 'Runner Up', points: 400, category: 'Technical Workshop' },
  { name: 'Open Source Software Sprint & GSoC Contribution', award: 'Participation', points: 300, category: 'Coding Competition' },
  { name: 'Cybersecurity Capture the Flag (CTF) National', award: 'Runner Up', points: 350, category: 'Hackathon' }
];

interface ExtraActivityItem {
  name: string;
  award: AwardLevel;
  points: number;
  category: ActivityCategory;
}

const EXTRA_ACTIVITIES: ExtraActivityItem[] = [
  { name: 'Inter-College Annual Cricket Championship', award: '1st Place', points: 300, category: 'Sports & Athletics' },
  { name: 'National Service Scheme (NSS) Rural Cleanliness & Literacy Camp', award: 'Lead Organizer', points: 250, category: 'NSS & Social Outreach' },
  { name: 'Annual University Cultural Fest (Vibrance)', award: 'Lead Organizer', points: 200, category: 'Cultural & Arts' },
  { name: 'Inter-University Parliamentary Debate Invitational', award: '1st Place', points: 300, category: 'Cultural & Arts' },
  { name: 'Rotaract Club Youth Leadership Summit', award: 'Participation', points: 250, category: 'NSS & Social Outreach' },
  { name: 'Red Cross State Blood Donation Drive', award: 'Lead Organizer', points: 200, category: 'NSS & Social Outreach' }
];

interface GapReasonItem {
  type: 'Medical Leave' | 'Mid-Course Drop Year' | 'Pre-College Gap' | 'Semester Repeat';
  desc: string;
  approvedBy: string;
}

const GAP_REASONS: GapReasonItem[] = [
  {
    type: 'Medical Leave',
    desc: 'Major orthopaedic corrective surgery requiring 8-month intensive physiotherapy and medical recovery.',
    approvedBy: 'Dean of Student Welfare & University Chief Medical Officer'
  },
  {
    type: 'Pre-College Gap',
    desc: 'Academic gap undertaken to prepare for national-level competitive technical scholarship examinations.',
    approvedBy: 'Head of Academic Affairs & Registrar'
  },
  {
    type: 'Mid-Course Drop Year',
    desc: 'One-year off-campus research fellow internship at Defence Research & Development Organization (DRDO).',
    approvedBy: 'Department Research Advisory Committee'
  },
  {
    type: 'Semester Repeat',
    desc: 'Extended leave of absence due to critical family medical hardship and emergency relocation.',
    approvedBy: 'Proctorial Board & Dean of Student Affairs'
  }
];

// Helper deterministic pseudo-random number generator for reproducible seed data
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Generate the 105 students and all normalized relational records
function generateInitialDataset() {
  const students: Student[] = [];
  const semesters: AcademicSemester[] = [];
  const courses: SemesterCourse[] = [];
  const seminars: StudentSeminar[] = [];
  const activities: StudentActivity[] = [];
  const gaps: AcademicGapRecord[] = [];

  const TOTAL_STUDENTS = 105;

  for (let i = 0; i < TOTAL_STUDENTS; i++) {
    const studentIndex = i + 1;
    const studentId = `stu-${String(studentIndex).padStart(3, '0')}`;
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 3 + Math.floor(i / FIRST_NAMES.length)) % LAST_NAMES.length];
    const fullName = `${firstName} ${lastName}`;

    // STRICT USER REQUIREMENT:
    // Mail like 123@viva-technology.org. We format every student email as e.g. 101@viva-technology.org, 102@viva-technology.org, etc.
    const emailNumber = 100 + studentIndex;
    const email = `${emailNumber}@viva-technology.org`;

    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    const deptCode = DEPT_CODES[dept];

    // Distribute batches: 2020 (Sem 8), 2021 (Sem 6), 2022 (Sem 4), 2023 (Sem 2)
    const batchOffset = i % 4;
    const batchYear = 2020 + batchOffset;
    let currentSemester = (4 - batchOffset) * 2; // 8, 6, 4, 2
    if (currentSemester > 8) currentSemester = 8;
    if (currentSemester < 1) currentSemester = 1;

    // Drop years for ~8 students across the cohort
    const hasGap = (i === 1 || i === 12 || i === 25 || i === 41 || i === 58 || i === 73 || i === 89 || i === 101);
    const status = hasGap ? 'Academic Gap / Drop' : (batchYear === 2020 && currentSemester === 8 && i % 5 === 0 ? 'Graduated' : 'Active');

    const rollNo = `${batchYear}${deptCode}${String((i % 30) + 1).padStart(3, '0')}`;
    const phone = `+91 98${String(100 + (i * 7) % 899)} ${String(10000 + (i * 13) % 89999)}`;

    // Secondary & Higher Secondary marks
    const secPercentage = +(82.0 + pseudoRandom(i * 11) * 16.5).toFixed(1);
    const secBoard = SECONDARY_BOARDS[i % SECONDARY_BOARDS.length];
    const secPassingYear = batchYear - 2;

    const higherSecPercentage = +(80.0 + pseudoRandom(i * 17) * 17.5).toFixed(1);
    const higherSecBoard = HIGHER_SEC_BOARDS[i % HIGHER_SEC_BOARDS.length];
    const higherSecPassingYear = batchYear;

    const student: Student = {
      student_id: studentId,
      roll_no: rollNo,
      full_name: fullName,
      email: email,
      phone: phone,
      department: dept,
      batch_year: batchYear,
      current_semester: currentSemester,
      status: status,
      secondary_board: secBoard,
      secondary_percentage: secPercentage,
      secondary_passing_year: secPassingYear,
      higher_sec_board: higherSecBoard,
      higher_sec_percentage: higherSecPercentage,
      higher_sec_stream: (i % 3 === 0) ? 'Science (PCMB)' : 'Science (PCM)',
      higher_sec_passing_year: higherSecPassingYear,
      created_at: `${batchYear}-08-16T10:00:00.000Z`,
      updated_at: '2024-05-20T12:00:00.000Z'
    };
    students.push(student);

    // If gap student, register gap record
    if (hasGap) {
      const gapChoice = GAP_REASONS[i % GAP_REASONS.length];
      const gapYearAffected = `${batchYear + 1}-${batchYear + 2}`;
      gaps.push({
        gap_id: `gap-${studentIndex}`,
        student_id: studentId,
        gap_type: gapChoice.type,
        academic_year_affected: gapYearAffected,
        duration_years: 1,
        reason: gapChoice.desc,
        approved_by: gapChoice.approvedBy,
        clearance_status: i % 2 === 0 ? 'Approved' : 'Under Review'
      });
    }

    // Generate Semesters (1 to currentSemester)
    let cumulativeQualityPoints = 0;
    let cumulativeCredits = 0;

    for (let sNum = 1; sNum <= currentSemester; sNum++) {
      const semId = `sem-${studentId}-${sNum}`;
      const calendarYear = batchYear + Math.floor((sNum - 1) / 2);
      const isSemGapYear = hasGap && sNum === 3;
      const academicYear = `${calendarYear}-${calendarYear + 1}`;

      // Generate courses for this semester
      const subjectTemplate = SUBJECT_TEMPLATES[sNum] || SUBJECT_TEMPLATES[4];
      const semCourses: SemesterCourse[] = [];
      let semQualityPoints = 0;
      let semCredits = 0;

      // 4 Theory Courses
      subjectTemplate.theory.forEach((subName, tIdx) => {
        const cCode = `${deptCode}${sNum}0${tIdx + 1}`;
        const credits = (tIdx === 0 || tIdx === 1) ? 4 : 3;

        // Realistic marks: internal (25-38 out of 40), external (36-57 out of 60)
        const randSeed = i * 100 + sNum * 10 + tIdx;
        const internal = Math.floor(25 + pseudoRandom(randSeed) * 14); // 25..38
        const external = Math.floor(36 + pseudoRandom(randSeed + 1) * 22); // 36..57
        const total = internal + external;
        const { gradeLetter, gradePoint } = calculateGrade(total);

        const courseRecord: SemesterCourse = {
          course_id: `crs-${studentId}-s${sNum}-t${tIdx + 1}`,
          semester_id: semId,
          student_id: studentId,
          course_code: cCode,
          course_name: subName,
          course_type: 'Theory',
          credits: credits,
          internal_marks: internal,
          external_marks: external,
          total_marks: total,
          grade_letter: gradeLetter,
          grade_point: gradePoint,
          status: 'Passed'
        };
        semCourses.push(courseRecord);
        courses.push(courseRecord);

        semQualityPoints += gradePoint * credits;
        semCredits += credits;
      });

      // 2 Lab Courses
      subjectTemplate.lab.forEach((labName, lIdx) => {
        const cCode = `${deptCode}${sNum}9${lIdx + 1}`;
        const credits = 2;
        const randSeed = i * 100 + sNum * 10 + 20 + lIdx;
        const internal = Math.floor(32 + pseudoRandom(randSeed) * 7); // 32..38 (out of 40)
        const external = Math.floor(45 + pseudoRandom(randSeed + 2) * 13); // 45..57 (out of 60)
        const total = internal + external;
        const { gradeLetter, gradePoint } = calculateGrade(total);

        const labRecord: SemesterCourse = {
          course_id: `crs-${studentId}-s${sNum}-l${lIdx + 1}`,
          semester_id: semId,
          student_id: studentId,
          course_code: cCode,
          course_name: labName,
          course_type: 'Lab',
          credits: credits,
          internal_marks: internal,
          external_marks: external,
          total_marks: total,
          grade_letter: gradeLetter,
          grade_point: gradePoint,
          status: 'Passed'
        };
        semCourses.push(labRecord);
        courses.push(labRecord);

        semQualityPoints += gradePoint * credits;
        semCredits += credits;
      });

      const sgpa = +(semQualityPoints / semCredits).toFixed(2);
      cumulativeQualityPoints += semQualityPoints;
      cumulativeCredits += semCredits;
      const cgpa = +(cumulativeQualityPoints / cumulativeCredits).toFixed(2);

      const semesterRecord: AcademicSemester = {
        semester_id: semId,
        student_id: studentId,
        semester_number: sNum,
        academic_year: academicYear,
        sgpa: sgpa,
        cgpa: cgpa,
        total_credits: semCredits,
        earned_credits: semCredits,
        has_drop_year: isSemGapYear,
        drop_reason: isSemGapYear ? gaps.find(g => g.student_id === studentId)?.reason : undefined
      };
      semesters.push(semesterRecord);
    }

    // Student Seminars (1 to 2 per student)
    const semTopic1 = SEMINAR_TOPICS[(i * 2) % SEMINAR_TOPICS.length];
    const semType1 = (i % 2 === 0) ? 'INTERNAL' : 'EXTERNAL';
    const semRole1: SeminarRole = (i % 3 === 0) ? 'Keynote Student Speaker' : (i % 3 === 1 ? 'Presenter' : 'Attendee');
    seminars.push({
      seminar_id: `sem-entry-${studentIndex}-1`,
      student_id: studentId,
      title: semTopic1,
      seminar_type: semType1,
      date_conducted: `2023-${String(1 + (i % 9)).padStart(2, '0')}-15`,
      venue_or_organizer: semType1 === 'INTERNAL' ? `${dept} Department Seminar Series` : 'IEEE Computer Society & ACM Chapter',
      role: semRole1,
      certificate_ref: `SEM-${deptCode}-${studentIndex}-01`
    });

    if (i % 3 === 0) {
      const semTopic2 = SEMINAR_TOPICS[(i * 2 + 1) % SEMINAR_TOPICS.length];
      seminars.push({
        seminar_id: `sem-entry-${studentIndex}-2`,
        student_id: studentId,
        title: semTopic2,
        seminar_type: 'EXTERNAL',
        date_conducted: `2024-02-18`,
        venue_or_organizer: 'National Institute of Technology Conference',
        role: 'Presenter',
        impact_points: 300,
        certificate_ref: `SEM-${deptCode}-${studentIndex}-02`
      } as any);
    }

    // Student Activities (1 Co-Curricular and 1 Extra-Curricular per student)
    const techAct = TECHNICAL_ACTIVITIES[i % TECHNICAL_ACTIVITIES.length];
    activities.push({
      activity_id: `act-${studentIndex}-t`,
      student_id: studentId,
      activity_class: 'TECHNICAL_CO_CURRICULAR',
      category: techAct.category,
      event_name: techAct.name,
      achievement_or_award: techAct.award,
      event_date: `2023-${String(1 + (i % 11)).padStart(2, '0')}-22`,
      organizer: 'All India Council for Technical Education (AICTE)',
      impact_points: techAct.points,
      certificate_ref: `CERT-TECH-${deptCode}-${studentIndex}`
    });

    const extraAct = EXTRA_ACTIVITIES[(i * 2) % EXTRA_ACTIVITIES.length];
    activities.push({
      activity_id: `act-${studentIndex}-e`,
      student_id: studentId,
      activity_class: 'EXTRA_CURRICULAR',
      category: extraAct.category,
      event_name: extraAct.name,
      achievement_or_award: extraAct.award,
      event_date: `2024-01-14`,
      organizer: 'Inter-University Sports Board & NSS Chapter',
      impact_points: extraAct.points,
      certificate_ref: `CERT-EXTRA-${deptCode}-${studentIndex}`
    });
  }

  const syncLogs: SyncLogEntry[] = [
    {
      log_id: 'log-seed-100-viva',
      timestamp: new Date().toISOString(),
      action: 'FULL_SYNC',
      entity: 'DATABASE',
      target: 'LOCAL_DB',
      status: 'SUCCESS',
      details: `Normalized 3NF DBMS loaded with ${TOTAL_STUDENTS} students across 5 departments. All student emails strictly provisioned under @viva-technology.org.`
    }
  ];

  return {
    students,
    semesters,
    courses,
    seminars,
    activities,
    gaps,
    syncLogs
  };
}

const generatedData = generateInitialDataset();

export const INITIAL_STUDENTS: Student[] = generatedData.students;
export const INITIAL_SEMESTERS: AcademicSemester[] = generatedData.semesters;
export const INITIAL_COURSES: SemesterCourse[] = generatedData.courses;
export const INITIAL_SEMINARS: StudentSeminar[] = generatedData.seminars;
export const INITIAL_ACTIVITIES: StudentActivity[] = generatedData.activities;
export const INITIAL_GAPS: AcademicGapRecord[] = generatedData.gaps;
export const INITIAL_SYNC_LOGS: SyncLogEntry[] = generatedData.syncLogs;
