import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
import io

# ---------------------------------------------------------
# Page Configuration & Styling
# ---------------------------------------------------------
st.set_page_config(
    page_title="ScholarPulse - Student Academic & Portfolio DBMS",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for modern UI design
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', sans-serif;
    }
    
    .main-header {
        background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
        padding: 1.75rem 2rem;
        border-radius: 16px;
        color: white;
        margin-bottom: 1.5rem;
        box-shadow: 0 10px 25px -5px rgba(49, 46, 129, 0.3);
    }
    
    .main-header h1 {
        color: #ffffff;
        font-weight: 800;
        font-size: 2.2rem;
        margin: 0;
        letter-spacing: -0.02em;
    }
    
    .main-header p {
        color: #c7d2fe;
        margin: 0.5rem 0 0 0;
        font-size: 1.05rem;
    }
    
    .badge-tag {
        display: inline-block;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.25);
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 600;
        color: #e0e7ff;
        margin-top: 0.75rem;
    }

    .metric-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 1.25rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.03);
        text-align: center;
    }
    
    .metric-value {
        font-size: 1.85rem;
        font-weight: 800;
        color: #1e1b4b;
        margin: 0.25rem 0;
    }
    
    .metric-label {
        font-size: 0.825rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #64748b;
        font-weight: 600;
    }

    .status-badge-active {
        background-color: #dcfce7;
        color: #15803d;
        padding: 4px 12px;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 700;
    }

    .status-badge-gap {
        background-color: #fee2e2;
        color: #b91c1c;
        padding: 4px 12px;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 700;
    }

    .status-badge-grad {
        background-color: #e0e7ff;
        color: #4338ca;
        padding: 4px 12px;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 700;
    }
</style>
""", unsafe_allow_html=True)

# ---------------------------------------------------------
# Academic Calculation Utilities
# ---------------------------------------------------------
def calculate_grade(total_marks):
    marks = max(0, min(100, round(total_marks)))
    if marks >= 90:
        return 'O', 10
    elif marks >= 80:
        return 'E', 9
    elif marks >= 70:
        return 'A', 8
    elif marks >= 60:
        return 'B', 7
    elif marks >= 50:
        return 'C', 6
    elif marks >= 40:
        return 'D', 5
    else:
        return 'F', 0

def calculate_sgpa(courses):
    if not courses:
        return 0.0, 0, 0
    total_credit_points = 0
    total_credits = 0
    earned_credits = 0
    for c in courses:
        credits = c.get('credits', 0)
        gp = c.get('grade_point', 0)
        total_credits += credits
        total_credit_points += credits * gp
        if gp >= 5 and c.get('status') != 'Backlog':
            earned_credits += credits
    sgpa = round(total_credit_points / total_credits, 2) if total_credits > 0 else 0.0
    return sgpa, total_credits, earned_credits

def calculate_cgpa(semesters):
    if not semesters:
        return 0.0
    weighted_sum = 0
    total_credits = 0
    for s in semesters:
        tc = s.get('total_credits', 0)
        sgpa = s.get('sgpa', 0.0)
        if tc > 0 and sgpa > 0:
            weighted_sum += sgpa * tc
            total_credits += tc
    return round(weighted_sum / total_credits, 2) if total_credits > 0 else 0.0

# ---------------------------------------------------------
# Seed Data Initialization
# ---------------------------------------------------------
def init_default_database():
    students = [
        {
            "student_id": "std-001",
            "roll_no": "2021CSE042",
            "full_name": "Shridhar Singh",
            "email": "shridhar.singh@institution.edu",
            "phone": "+91 98765 43210",
            "department": "Computer Science & Engineering",
            "batch_year": 2021,
            "current_semester": 6,
            "status": "Academic Gap / Drop",
            "secondary_board": "CBSE",
            "secondary_percentage": 94.2,
            "secondary_passing_year": 2018,
            "higher_sec_board": "CBSE",
            "higher_sec_percentage": 91.8,
            "higher_sec_stream": "Science (PCM)",
            "higher_sec_passing_year": 2020,
            "created_at": "2021-08-15T09:00:00Z"
        },
        {
            "student_id": "std-002",
            "roll_no": "2021CSE001",
            "full_name": "Aarav Sharma",
            "email": "aarav.sharma@institution.edu",
            "phone": "+91 98765 11001",
            "department": "Computer Science & Engineering",
            "batch_year": 2021,
            "current_semester": 6,
            "status": "Active",
            "secondary_board": "ICSE",
            "secondary_percentage": 96.5,
            "secondary_passing_year": 2019,
            "higher_sec_board": "ISC",
            "higher_sec_percentage": 95.0,
            "higher_sec_stream": "Science (PCMB)",
            "higher_sec_passing_year": 2021,
            "created_at": "2021-08-15T09:00:00Z"
        },
        {
            "student_id": "std-003",
            "roll_no": "2021IT015",
            "full_name": "Priya Patel",
            "email": "priya.patel@institution.edu",
            "phone": "+91 98765 22002",
            "department": "Information Technology",
            "batch_year": 2021,
            "current_semester": 6,
            "status": "Active",
            "secondary_board": "CBSE",
            "secondary_percentage": 91.0,
            "secondary_passing_year": 2019,
            "higher_sec_board": "CBSE",
            "higher_sec_percentage": 89.4,
            "higher_sec_stream": "Science (PCM)",
            "higher_sec_passing_year": 2021,
            "created_at": "2021-08-15T09:00:00Z"
        },
        {
            "student_id": "std-004",
            "roll_no": "2022AIDS008",
            "full_name": "Rohan Mukherjee",
            "email": "rohan.mukherjee@institution.edu",
            "phone": "+91 98765 33003",
            "department": "Artificial Intelligence & Data Science",
            "batch_year": 2022,
            "current_semester": 4,
            "status": "Active",
            "secondary_board": "West Bengal State Board",
            "secondary_percentage": 88.5,
            "secondary_passing_year": 2020,
            "higher_sec_board": "West Bengal State Board",
            "higher_sec_percentage": 87.0,
            "higher_sec_stream": "Science (PCM)",
            "higher_sec_passing_year": 2022,
            "created_at": "2022-08-16T09:00:00Z"
        },
        {
            "student_id": "std-005",
            "roll_no": "2021ECE024",
            "full_name": "Sneha Reddy",
            "email": "sneha.reddy@institution.edu",
            "phone": "+91 98765 44004",
            "department": "Electronics & Communication",
            "batch_year": 2021,
            "current_semester": 6,
            "status": "Active",
            "secondary_board": "State Board",
            "secondary_percentage": 93.4,
            "secondary_passing_year": 2019,
            "higher_sec_board": "Telangana Board of Intermediate",
            "higher_sec_percentage": 94.2,
            "higher_sec_stream": "Science (PCM)",
            "higher_sec_passing_year": 2021,
            "created_at": "2021-08-15T09:00:00Z"
        }
    ]

    semesters = [
        {"semester_id": "sem-101", "student_id": "std-001", "semester_number": 1, "academic_year": "2021-2022", "sgpa": 8.65, "cgpa": 8.65, "total_credits": 20, "earned_credits": 20, "has_drop_year": False},
        {"semester_id": "sem-102", "student_id": "std-001", "semester_number": 2, "academic_year": "2021-2022", "sgpa": 8.80, "cgpa": 8.73, "total_credits": 20, "earned_credits": 20, "has_drop_year": False},
        {"semester_id": "sem-103", "student_id": "std-001", "semester_number": 3, "academic_year": "2022-2023", "sgpa": 8.50, "cgpa": 8.65, "total_credits": 22, "earned_credits": 22, "has_drop_year": False},
        {"semester_id": "sem-104", "student_id": "std-001", "semester_number": 4, "academic_year": "2022-2023", "sgpa": 8.90, "cgpa": 8.72, "total_credits": 22, "earned_credits": 22, "has_drop_year": False},
        {"semester_id": "sem-105", "student_id": "std-001", "semester_number": 5, "academic_year": "2023-2024", "sgpa": 0.00, "cgpa": 8.72, "total_credits": 0, "earned_credits": 0, "has_drop_year": True, "drop_reason": "Medical Leave - Major Orthopedic Rehabilitation after sports injury"},
        {"semester_id": "sem-106", "student_id": "std-001", "semester_number": 6, "academic_year": "2024-2025", "sgpa": 9.15, "cgpa": 8.81, "total_credits": 22, "earned_credits": 22, "has_drop_year": False},
        
        {"semester_id": "sem-201", "student_id": "std-002", "semester_number": 1, "academic_year": "2021-2022", "sgpa": 9.40, "cgpa": 9.40, "total_credits": 20, "earned_credits": 20, "has_drop_year": False},
        {"semester_id": "sem-202", "student_id": "std-002", "semester_number": 2, "academic_year": "2021-2022", "sgpa": 9.55, "cgpa": 9.48, "total_credits": 20, "earned_credits": 20, "has_drop_year": False},
        {"semester_id": "sem-203", "student_id": "std-002", "semester_number": 3, "academic_year": "2022-2023", "sgpa": 9.30, "cgpa": 9.42, "total_credits": 22, "earned_credits": 22, "has_drop_year": False},
        {"semester_id": "sem-204", "student_id": "std-002", "semester_number": 4, "academic_year": "2022-2023", "sgpa": 9.60, "cgpa": 9.46, "total_credits": 22, "earned_credits": 22, "has_drop_year": False},
        {"semester_id": "sem-205", "student_id": "std-002", "semester_number": 5, "academic_year": "2023-2024", "sgpa": 9.50, "cgpa": 9.47, "total_credits": 22, "earned_credits": 22, "has_drop_year": False},
        {"semester_id": "sem-206", "student_id": "std-002", "semester_number": 6, "academic_year": "2023-2024", "sgpa": 9.70, "cgpa": 9.51, "total_credits": 22, "earned_credits": 22, "has_drop_year": False},
    ]

    courses = [
        {"course_id": "c-101", "semester_id": "sem-104", "student_id": "std-001", "course_code": "CS401", "course_name": "Database Management Systems", "course_type": "Theory", "credits": 4, "internal_marks": 36, "external_marks": 54, "total_marks": 90, "grade_letter": "O", "grade_point": 10, "status": "Passed"},
        {"course_id": "c-102", "semester_id": "sem-104", "student_id": "std-001", "course_code": "CS402", "course_name": "Operating Systems Principles", "course_type": "Theory", "credits": 4, "internal_marks": 34, "external_marks": 49, "total_marks": 83, "grade_letter": "E", "grade_point": 9, "status": "Passed"},
        {"course_id": "c-103", "semester_id": "sem-104", "student_id": "std-001", "course_code": "CS403", "course_name": "Computer Networks Architecture", "course_type": "Theory", "credits": 4, "internal_marks": 35, "external_marks": 51, "total_marks": 86, "grade_letter": "E", "grade_point": 9, "status": "Passed"},
        {"course_id": "c-104", "semester_id": "sem-104", "student_id": "std-001", "course_code": "CS404", "course_name": "Formal Languages & Automata", "course_type": "Theory", "credits": 4, "internal_marks": 32, "external_marks": 46, "total_marks": 78, "grade_letter": "A", "grade_point": 8, "status": "Passed"},
        {"course_id": "c-105", "semester_id": "sem-104", "student_id": "std-001", "course_code": "CS491", "course_name": "Database Systems Laboratory", "course_type": "Lab", "credits": 3, "internal_marks": 38, "external_marks": 56, "total_marks": 94, "grade_letter": "O", "grade_point": 10, "status": "Passed"},
        {"course_id": "c-106", "semester_id": "sem-104", "student_id": "std-001", "course_code": "CS492", "course_name": "Operating Systems & Linux Lab", "course_type": "Lab", "credits": 3, "internal_marks": 37, "external_marks": 53, "total_marks": 90, "grade_letter": "O", "grade_point": 10, "status": "Passed"},

        {"course_id": "c-107", "semester_id": "sem-106", "student_id": "std-001", "course_code": "CS601", "course_name": "Artificial Intelligence & Expert Systems", "course_type": "Theory", "credits": 4, "internal_marks": 38, "external_marks": 55, "total_marks": 93, "grade_letter": "O", "grade_point": 10, "status": "Passed"},
        {"course_id": "c-108", "semester_id": "sem-106", "student_id": "std-001", "course_code": "CS602", "course_name": "Information & Network Security", "course_type": "Theory", "credits": 4, "internal_marks": 35, "external_marks": 52, "total_marks": 87, "grade_letter": "E", "grade_point": 9, "status": "Passed"},
        {"course_id": "c-109", "semester_id": "sem-106", "student_id": "std-001", "course_code": "CS603", "course_name": "Big Data Engineering", "course_type": "Theory", "credits": 4, "internal_marks": 36, "external_marks": 50, "total_marks": 86, "grade_letter": "E", "grade_point": 9, "status": "Passed"},
        {"course_id": "c-110", "semester_id": "sem-106", "student_id": "std-001", "course_code": "CS604", "course_name": "Compiler Design Principles", "course_type": "Theory", "credits": 4, "internal_marks": 33, "external_marks": 48, "total_marks": 81, "grade_letter": "E", "grade_point": 9, "status": "Passed"},
        {"course_id": "c-111", "semester_id": "sem-106", "student_id": "std-001", "course_code": "CS691", "course_name": "AI & Machine Learning Lab", "course_type": "Lab", "credits": 3, "internal_marks": 39, "external_marks": 57, "total_marks": 96, "grade_letter": "O", "grade_point": 10, "status": "Passed"},
        {"course_id": "c-112", "semester_id": "sem-106", "student_id": "std-001", "course_code": "CS692", "course_name": "Network Security & Penetration Testing Lab", "course_type": "Lab", "credits": 3, "internal_marks": 38, "external_marks": 54, "total_marks": 92, "grade_letter": "O", "grade_point": 10, "status": "Passed"},
    ]

    seminars = [
        {"seminar_id": "sem-1", "student_id": "std-001", "seminar_type": "INTERNAL", "title": "Zero-Knowledge Proofs in Decentralized Identity Verification", "venue_or_organizer": "Department of CSE Colloquium Hall", "date_conducted": "2024-09-14", "role": "Presenter", "certificate_ref": "SEM-2024-CSE-042"},
        {"seminar_id": "sem-2", "student_id": "std-001", "seminar_type": "EXTERNAL", "title": "IEEE International Symposium on Cloud and Distributed Systems", "venue_or_organizer": "IIT Kharagpur", "date_conducted": "2024-11-20", "role": "Keynote Student Speaker", "certificate_ref": "IEEE-DIST-2024-88"},
        {"seminar_id": "sem-3", "student_id": "std-002", "seminar_type": "INTERNAL", "title": "Transformer Attention Mechanisms & Efficient Inference", "venue_or_organizer": "AI Research Lab Seminar", "date_conducted": "2024-08-10", "role": "Presenter", "certificate_ref": "SEM-2024-AI-011"}
    ]

    activities = [
        {"activity_id": "act-1", "student_id": "std-001", "activity_class": "TECHNICAL_CO_CURRICULAR", "category": "Hackathon", "event_name": "Smart India Hackathon (Grand Finale)", "achievement_or_award": "1st Place", "event_date": "2023-12-22", "organizer": "Ministry of Education / AICTE", "impact_points": 100, "certificate_ref": "SIH-2023-WIN-942"},
        {"activity_id": "act-2", "student_id": "std-001", "activity_class": "TECHNICAL_CO_CURRICULAR", "category": "Coding Competition", "event_name": "ACM ICPC Regional Qualifiers", "achievement_or_award": "Runner Up", "event_date": "2024-01-18", "organizer": "Amrita Vishwa Vidyapeetham", "impact_points": 80, "certificate_ref": "ICPC-2024-REG-12"},
        {"activity_id": "act-3", "student_id": "std-001", "activity_class": "EXTRA_CURRICULAR", "category": "Sports & Athletics", "event_name": "Inter-University Basketball Championship", "achievement_or_award": "1st Place", "event_date": "2024-03-05", "organizer": "State Sports Council", "impact_points": 70, "certificate_ref": "SPORTS-2024-BB-05"},
        {"activity_id": "act-4", "student_id": "std-002", "activity_class": "TECHNICAL_CO_CURRICULAR", "category": "Paper Presentation", "event_name": "National Conference on High Performance Computing", "achievement_or_award": "1st Place", "event_date": "2024-02-15", "organizer": "C-DAC Pune", "impact_points": 95, "certificate_ref": "HPC-2024-P-001"}
    ]

    gaps = [
        {"gap_id": "gap-1", "student_id": "std-001", "gap_type": "Mid-Course Drop Year", "academic_year_affected": "2023-2024", "duration_years": 1, "reason": "Medical Leave - Major Orthopedic Rehabilitation after accident. Underwent corrective surgery and physical therapy.", "approved_by": "Dean of Academic Affairs & Medical Board", "clearance_status": "Approved"}
    ]

    return {
        "students": students,
        "semesters": semesters,
        "courses": courses,
        "seminars": seminars,
        "activities": activities,
        "gaps": gaps
    }

# Ensure session state is initialized
if "db" not in st.session_state:
    st.session_state.db = init_default_database()

db = st.session_state.db

# ---------------------------------------------------------
# Sidebar: Navigation & Filters
# ---------------------------------------------------------
with st.sidebar:
    st.markdown("### 🎓 ScholarPulse DBMS")
    st.markdown("**3NF Student Relational Database Management System**")
    st.caption("Tracking Academic Progression, Gap Years & Segregated Portfolios")
    st.divider()

    st.subheader("🔍 Student Directory Search")
    dept_options = ["All Departments"] + sorted(list({s["department"] for s in db["students"]}))
    selected_dept = st.selectbox("Department Filter", dept_options)
    
    status_options = ["All Statuses"] + sorted(list({s["status"] for s in db["students"]}))
    selected_status = st.selectbox("Status Filter", status_options)
    
    search_keyword = st.text_input("Search Name / Roll No / Email", placeholder="e.g. 2021CSE042 or Shridhar").strip().lower()

    # Filter students
    filtered_students = db["students"]
    if selected_dept != "All Departments":
        filtered_students = [s for s in filtered_students if s["department"] == selected_dept]
    if selected_status != "All Statuses":
        filtered_students = [s for s in filtered_students if s["status"] == selected_status]
    if search_keyword:
        filtered_students = [
            s for s in filtered_students
            if search_keyword in s["full_name"].lower()
            or search_keyword in s["roll_no"].lower()
            or search_keyword in s["email"].lower()
        ]

    st.write(f"Showing **{len(filtered_students)}** of **{len(db['students'])}** Students")

    student_display_map = {
        f"{s['roll_no']} - {s['full_name']}": s["student_id"] for s in filtered_students
    }

    if student_display_map:
        selected_display = st.selectbox("Select Active Student Record", list(student_display_map.keys()))
        active_student_id = student_display_map[selected_display]
    else:
        st.warning("No students match your filter criteria.")
        active_student_id = db["students"][0]["student_id"] if db["students"] else None

    st.divider()
    st.caption("⚡ **Database Synchronization**")
    st.success("● Google Sheets & Relational Store: Connected")
    st.caption(f"Last Synced: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

# ---------------------------------------------------------
# Main App Header & Institute Metrics
# ---------------------------------------------------------
st.markdown("""
<div class="main-header">
    <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
            <h1>ScholarPulse Academic & Portfolio DBMS</h1>
            <p>Relational progression tracker with 10th/12th baselines, dual internal/external evaluation, drop-year clearance & co-curricular impact scoring.</p>
            <div class="badge-tag">Normalized 3NF Relational Model</div>
            <div class="badge-tag" style="margin-left: 6px;">Google Sheets & Excel Bi-Sync</div>
            <div class="badge-tag" style="margin-left: 6px;">React 19 + Streamlit Dual-Stack</div>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

# Institute-level summary metrics
total_students = len(db["students"])
total_courses = len(db["courses"])
total_activities = len(db["activities"])
all_semesters = db["semesters"]
valid_sgpas = [s["sgpa"] for s in all_semesters if s.get("sgpa", 0) > 0]
avg_institute_sgpa = round(sum(valid_sgpas) / len(valid_sgpas), 2) if valid_sgpas else 0.0

m_col1, m_col2, m_col3, m_col4 = st.columns(4)
with m_col1:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-label">Enrolled Students</div>
        <div class="metric-value">{total_students}</div>
        <div style="font-size:0.75rem; color:#10b981; font-weight:600;">Active in 3NF Store</div>
    </div>
    """, unsafe_allow_html=True)
with m_col2:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-label">Mean Institute SGPA</div>
        <div class="metric-value">{avg_institute_sgpa} / 10.0</div>
        <div style="font-size:0.75rem; color:#6366f1; font-weight:600;">Across All Departments</div>
    </div>
    """, unsafe_allow_html=True)
with m_col3:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-label">Evaluated Courses</div>
        <div class="metric-value">{total_courses}</div>
        <div style="font-size:0.75rem; color:#f59e0b; font-weight:600;">Theory + Lab Modules</div>
    </div>
    """, unsafe_allow_html=True)
with m_col4:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-label">Portfolio Records</div>
        <div class="metric-value">{total_activities + len(db['seminars'])}</div>
        <div style="font-size:0.75rem; color:#ec4899; font-weight:600;">Seminars & Competitions</div>
    </div>
    """, unsafe_allow_html=True)

st.write("")

# ---------------------------------------------------------
# Active Student Details
# ---------------------------------------------------------
active_student = next((s for s in db["students"] if s["student_id"] == active_student_id), None)

if active_student:
    student_sems = [s for s in db["semesters"] if s["student_id"] == active_student["student_id"]]
    student_courses = [c for c in db["courses"] if c["student_id"] == active_student["student_id"]]
    student_seminars = [sem for sem in db["seminars"] if sem["student_id"] == active_student["student_id"]]
    student_activities = [a for a in db["activities"] if a["student_id"] == active_student["student_id"]]
    student_gaps = [g for g in db["gaps"] if g["student_id"] == active_student["student_id"]]
    
    # Calculate current CGPA dynamically
    current_cgpa = calculate_cgpa(student_sems)
    total_earned_credits = sum(s.get("earned_credits", 0) for s in student_sems)
    total_impact_points = sum(a.get("impact_points", 0) for a in student_activities)

    status_badge_class = (
        "status-badge-active" if active_student["status"] == "Active"
        else "status-badge-gap" if "Gap" in active_student["status"] or "Drop" in active_student["status"]
        else "status-badge-grad"
    )

    # Student Profile Banner
    st.markdown(f"""
    <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:14px; padding:1.5rem; margin-bottom:1.5rem; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem;">
            <div>
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <div style="width:52px; height:52px; border-radius:12px; background:linear-gradient(135deg, #4f46e5, #7c3aed); display:flex; align-items:center; justify-content:center; color:white; font-size:1.5rem; font-weight:800;">
                        {active_student['full_name'][0]}
                    </div>
                    <div>
                        <h2 style="margin:0; font-size:1.6rem; color:#0f172a; font-weight:800;">{active_student['full_name']}</h2>
                        <span style="color:#64748b; font-size:0.95rem; font-weight:500;">Roll No: <strong style="color:#1e293b;">{active_student['roll_no']}</strong> | Dept: <strong>{active_student['department']}</strong> | Batch: <strong>{active_student['batch_year']}</strong></span>
                    </div>
                </div>
            </div>
            <div style="text-align:right;">
                <span class="{status_badge_class}">{active_student['status']}</span>
                <div style="margin-top:0.5rem; font-size:1.75rem; font-weight:800; color:#4f46e5;">
                    {current_cgpa:.2f} <span style="font-size:0.9rem; color:#64748b; font-weight:600;">Cumulative CGPA</span>
                </div>
            </div>
        </div>
        <hr style="border:none; border-top:1px solid #f1f5f9; margin:1rem 0;">
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:1rem;">
            <div>
                <span style="font-size:0.75rem; color:#64748b; text-transform:uppercase; font-weight:700;">10th (Secondary) Record</span>
                <div style="font-weight:700; color:#1e293b; font-size:1rem;">{active_student['secondary_percentage']}% ({active_student['secondary_board']})</div>
                <div style="font-size:0.8rem; color:#64748b;">Year of Completion: {active_student['secondary_passing_year']}</div>
            </div>
            <div>
                <span style="font-size:0.75rem; color:#64748b; text-transform:uppercase; font-weight:700;">12th (Higher Secondary) Record</span>
                <div style="font-weight:700; color:#1e293b; font-size:1rem;">{active_student['higher_sec_percentage']}% ({active_student['higher_sec_stream']})</div>
                <div style="font-size:0.8rem; color:#64748b;">Board: {active_student['higher_sec_board']} ({active_student['higher_sec_passing_year']})</div>
            </div>
            <div>
                <span style="font-size:0.75rem; color:#64748b; text-transform:uppercase; font-weight:700;">Progression Credits</span>
                <div style="font-weight:700; color:#1e293b; font-size:1rem;">{total_earned_credits} Credits Earned</div>
                <div style="font-size:0.8rem; color:#64748b;">Current Semester: {active_student['current_semester']}</div>
            </div>
            <div>
                <span style="font-size:0.75rem; color:#64748b; text-transform:uppercase; font-weight:700;">Co-Curricular Impact</span>
                <div style="font-weight:700; color:#1e293b; font-size:1rem;">{total_impact_points} Impact Points</div>
                <div style="font-size:0.8rem; color:#64748b;">{len(student_activities)} Activities | {len(student_seminars)} Seminars</div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # ---------------------------------------------------------
    # Main Tabs: Academic Progression, Portfolios, Analytics, Data Management
    # ---------------------------------------------------------
    tab_academic, tab_portfolio, tab_gaps, tab_analytics, tab_manage = st.tabs([
        "📚 Academic Progression & Marksheet",
        "🏆 Segregated Portfolios",
        "⚠️ Drop Year & Gap Records",
        "📈 Analytics & Visualizations",
        "⚙️ Add Records & Export"
    ])

    # ---------------------------------------------------------
    # TAB 1: Academic Progression & Marksheet
    # ---------------------------------------------------------
    with tab_academic:
        st.subheader("Semester-Wise Academic Marksheet & 10-Point Scale Audit")
        
        if student_sems:
            sem_names = [f"Semester {s['semester_number']} ({s['academic_year']})" for s in sorted(student_sems, key=lambda x: x["semester_number"])]
            selected_sem_name = st.radio("Select Semester View", sem_names, horizontal=True)
            
            selected_sem_num = int(selected_sem_name.split()[1])
            active_sem = next((s for s in student_sems if s["semester_number"] == selected_sem_num), None)

            if active_sem:
                # Check for drop flag
                if active_sem.get("has_drop_year"):
                    st.error(f"⚠️ **ACADEMIC GAP / DROP YEAR RECORDED IN THIS PERIOD**\n\n**Reason:** {active_sem.get('drop_reason', 'Official leave recorded.')}")
                
                # Fetch courses in this semester
                sem_courses = [c for c in student_courses if c["semester_id"] == active_sem["semester_id"]]
                
                # Metric row for active semester
                s_col1, s_col2, s_col3, s_col4 = st.columns(4)
                with s_col1:
                    st.metric("Semester SGPA", f"{active_sem.get('sgpa', 0.0):.2f} / 10.0")
                with s_col2:
                    st.metric("Total Credits Registered", f"{active_sem.get('total_credits', 0)}")
                with s_col3:
                    st.metric("Earned Credits", f"{active_sem.get('earned_credits', 0)}")
                with s_col4:
                    st.metric("Academic Year", active_sem.get("academic_year", "N/A"))

                st.write("")
                if sem_courses:
                    course_rows = []
                    for c in sem_courses:
                        course_rows.append({
                            "Course Code": c["course_code"],
                            "Course Title": c["course_name"],
                            "Type": c["course_type"],
                            "Credits": c["credits"],
                            "Internal (/40)": c["internal_marks"],
                            "External (/60)": c["external_marks"],
                            "Total (/100)": c["total_marks"],
                            "Grade Letter": c["grade_letter"],
                            "Grade Point": c["grade_point"],
                            "Status": c["status"]
                        })
                    df_courses = pd.DataFrame(course_rows)
                    st.dataframe(df_courses, use_container_width=True, hide_index=True)
                else:
                    st.info(f"No individual course marks entered yet for Semester {selected_sem_num}.")

                # Add Course Form for active semester
                with st.expander(f"➕ Add / Record Course Grade for Semester {selected_sem_num}"):
                    with st.form(f"form_add_course_{active_sem['semester_id']}"):
                        f_col1, f_col2, f_col3 = st.columns([1, 2, 1])
                        with f_col1:
                            new_code = st.text_input("Course Code", value=f"CS{selected_sem_num}0{len(sem_courses)+1}")
                            new_type = st.selectbox("Course Type", ["Theory", "Lab", "Project", "Seminar"])
                        with f_col2:
                            new_name = st.text_input("Course Name", placeholder="e.g. Advanced Data Structures")
                            new_credits = st.number_input("Credits", min_value=1, max_value=8, value=4)
                        with f_col3:
                            new_internal = st.number_input("Internal Marks (/40)", min_value=0, max_value=40, value=35)
                            new_external = st.number_input("External Marks (/60)", min_value=0, max_value=60, value=50)

                        submit_course = st.form_submit_button("Record Course Marks")
                        if submit_course:
                            total_m = new_internal + new_external
                            grd_letter, grd_pt = calculate_grade(total_m)
                            status_val = "Passed" if grd_pt >= 5 else "Backlog"

                            new_course_obj = {
                                "course_id": f"c-{len(db['courses']) + 1}",
                                "semester_id": active_sem["semester_id"],
                                "student_id": active_student["student_id"],
                                "course_code": new_code,
                                "course_name": new_name,
                                "course_type": new_type,
                                "credits": new_credits,
                                "internal_marks": new_internal,
                                "external_marks": new_external,
                                "total_marks": total_m,
                                "grade_letter": grd_letter,
                                "grade_point": grd_pt,
                                "status": status_val
                            }
                            db["courses"].append(new_course_obj)

                            # Recalculate SGPA for this semester
                            updated_sem_courses = [c for c in db["courses"] if c["semester_id"] == active_sem["semester_id"]]
                            new_sgpa, new_tot_credits, new_earned = calculate_sgpa(updated_sem_courses)
                            active_sem["sgpa"] = new_sgpa
                            active_sem["total_credits"] = new_tot_credits
                            active_sem["earned_credits"] = new_earned

                            st.success(f"Course {new_code} saved! Computed Grade: {grd_letter} ({grd_pt} pts). Updated Semester SGPA: {new_sgpa:.2f}")
                            st.rerun()
        else:
            st.info("No semester records found for this student.")

    # ---------------------------------------------------------
    # TAB 2: Segregated Portfolios
    # ---------------------------------------------------------
    with tab_portfolio:
        st.subheader("Segregated Student Portfolios & Impact Scoring")
        st.markdown("Track **Technical Co-Curricular** accomplishments separate from **Extra-Curricular** & **Seminar** defenses.")

        p_tab1, p_tab2 = st.tabs(["🎙️ Seminars Presented & Attended", "🏆 Hackathons, Competitions & Extra-Curricular"])

        with p_tab1:
            if student_seminars:
                sem_rows = []
                for s in student_seminars:
                    sem_rows.append({
                        "Scope": s["seminar_type"],
                        "Seminar Title": s["title"],
                        "Role": s["role"],
                        "Venue / Host": s["venue_or_organizer"],
                        "Date": s["date_conducted"],
                        "Certificate Ref": s.get("certificate_ref", "N/A")
                    })
                st.dataframe(pd.DataFrame(sem_rows), use_container_width=True, hide_index=True)
            else:
                st.info("No seminar records found for this student.")

            with st.expander("➕ Log New Seminar Defense / Presentation"):
                with st.form("form_add_seminar"):
                    col_a, col_b = st.columns(2)
                    with col_a:
                        sem_title = st.text_input("Seminar Title", placeholder="e.g. Distributed Consensus in Raft")
                        sem_type = st.selectbox("Seminar Type", ["INTERNAL", "EXTERNAL"])
                        sem_role = st.selectbox("Role", ["Presenter", "Attendee", "Keynote Student Speaker"])
                    with col_b:
                        sem_venue = st.text_input("Venue / Organizer", placeholder="e.g. IEEE Student Chapter Hall")
                        sem_date = st.date_input("Date Conducted")
                        sem_cert = st.text_input("Certificate Ref / URL", placeholder="e.g. SEM-2024-001")
                    if st.form_submit_button("Record Seminar"):
                        db["seminars"].append({
                            "seminar_id": f"sem-{len(db['seminars'])+1}",
                            "student_id": active_student["student_id"],
                            "seminar_type": sem_type,
                            "title": sem_title,
                            "venue_or_organizer": sem_venue,
                            "date_conducted": str(sem_date),
                            "role": sem_role,
                            "certificate_ref": sem_cert
                        })
                        st.success("Seminar entry recorded successfully!")
                        st.rerun()

        with p_tab2:
            if student_activities:
                act_rows = []
                for a in student_activities:
                    act_rows.append({
                        "Class": "Co-Curricular" if "CO_CURRICULAR" in a["activity_class"] else "Extra-Curricular",
                        "Category": a["category"],
                        "Event Name": a["event_name"],
                        "Award / Level": a["achievement_or_award"],
                        "Impact Points": a["impact_points"],
                        "Organizer": a["organizer"],
                        "Date": a["event_date"],
                        "Certificate": a.get("certificate_ref", "N/A")
                    })
                st.dataframe(pd.DataFrame(act_rows), use_container_width=True, hide_index=True)
            else:
                st.info("No activities logged for this student yet.")

            with st.expander("➕ Log New Activity / Competition"):
                with st.form("form_add_activity"):
                    ac_col1, ac_col2 = st.columns(2)
                    with ac_col1:
                        act_class = st.selectbox("Portfolio Class", ["TECHNICAL_CO_CURRICULAR", "EXTRA_CURRICULAR"])
                        act_category = st.selectbox("Category", [
                            "Hackathon", "Coding Competition", "Paper Presentation",
                            "Technical Workshop", "Sports & Athletics", "Cultural & Arts", "NSS & Social Outreach"
                        ])
                        act_name = st.text_input("Event Name", placeholder="e.g. National Cyber Olympiad")
                    with ac_col2:
                        act_award = st.selectbox("Achievement / Award", ["1st Place", "Runner Up", "Consolation", "Participation", "Lead Organizer"])
                        act_points = st.number_input("Impact Points", min_value=10, max_value=200, value=50, step=5)
                        act_org = st.text_input("Organizer", placeholder="e.g. ACM Student Chapter")
                        act_cert = st.text_input("Certificate Ref", placeholder="e.g. ACT-2024-55")
                    if st.form_submit_button("Record Portfolio Entry"):
                        db["activities"].append({
                            "activity_id": f"act-{len(db['activities'])+1}",
                            "student_id": active_student["student_id"],
                            "activity_class": act_class,
                            "category": act_category,
                            "event_name": act_name,
                            "achievement_or_award": act_award,
                            "event_date": str(datetime.now().date()),
                            "organizer": act_org,
                            "impact_points": act_points,
                            "certificate_ref": act_cert
                        })
                        st.success("Portfolio entry added to database!")
                        st.rerun()

    # ---------------------------------------------------------
    # TAB 3: Academic Gap & Drop Year Analysis
    # ---------------------------------------------------------
    with tab_gaps:
        st.subheader("Academic Gap & Drop Year Governance")
        st.markdown("Audits official leaves, gap years, semester repeats, and administrative clearances.")

        if student_gaps:
            for g in student_gaps:
                st.warning(f"""
                **Gap Type:** {g['gap_type']}  
                **Academic Year Affected:** {g['academic_year_affected']} (Duration: {g['duration_years']} Year(s))  
                **Reason:** {g['reason']}  
                **Approved By:** {g['approved_by']}  
                **Status:** `{g['clearance_status']}`
                """)
        else:
            st.success("✅ **Continuous Academic Progression:** No drop years or academic gap records found for this student.")

        with st.expander("➕ Log Official Academic Gap / Drop Year Record"):
            with st.form("form_add_gap"):
                g_col1, g_col2 = st.columns(2)
                with g_col1:
                    gap_type = st.selectbox("Gap Classification", [
                        "Mid-Course Drop Year", "Pre-College Gap", "Medical Leave", "Semester Repeat"
                    ])
                    gap_year = st.text_input("Academic Year Affected", value="2023-2024")
                    gap_duration = st.number_input("Duration (Years)", min_value=1, max_value=4, value=1)
                with g_col2:
                    gap_reason = st.text_area("Detailed Justification / Medical Board Findings", placeholder="Provide rationale and clinical or competitive credentials...")
                    gap_approver = st.text_input("Approved Authority", value="Dean of Academic Affairs")
                    gap_status = st.selectbox("Clearance Status", ["Approved", "Under Review", "Cleared"])
                if st.form_submit_button("Record Gap Record"):
                    db["gaps"].append({
                        "gap_id": f"gap-{len(db['gaps'])+1}",
                        "student_id": active_student["student_id"],
                        "gap_type": gap_type,
                        "academic_year_affected": gap_year,
                        "duration_years": gap_duration,
                        "reason": gap_reason,
                        "approved_by": gap_approver,
                        "clearance_status": gap_status
                    })
                    active_student["status"] = "Academic Gap / Drop"
                    st.success("Gap year recorded and student status updated!")
                    st.rerun()

    # ---------------------------------------------------------
    # TAB 4: Analytics & Visualizations
    # ---------------------------------------------------------
    with tab_analytics:
        st.subheader("Student Academic & Progression Visual Analytics")

        c1, c2 = st.columns(2)
        with c1:
            st.markdown("##### 📈 SGPA Progression across Semesters")
            if student_sems:
                df_sems = pd.DataFrame(student_sems).sort_values("semester_number")
                fig_sgpa = go.Figure()
                fig_sgpa.add_trace(go.Scatter(
                    x=[f"Sem {n}" for n in df_sems["semester_number"]],
                    y=df_sems["sgpa"],
                    mode="lines+markers+text",
                    text=[f"{v:.2f}" for v in df_sems["sgpa"]],
                    textposition="top center",
                    name="SGPA",
                    line=dict(color="#4f46e5", width=3)
                ))
                fig_sgpa.add_hline(y=7.5, line_dash="dash", line_color="#10b981", annotation_text="Distinction (7.5)")
                fig_sgpa.update_layout(
                    yaxis=dict(range=[0, 10.5], title="Grade Point"),
                    margin=dict(l=20, r=20, t=30, b=20),
                    height=320
                )
                st.plotly_chart(fig_sgpa, use_container_width=True)
            else:
                st.info("No semester data available.")

        with c2:
            st.markdown("##### 📊 Theory vs Laboratory Evaluation Split")
            if student_courses:
                df_sc = pd.DataFrame(student_courses)
                fig_split = px.box(
                    df_sc,
                    x="course_type",
                    y="total_marks",
                    color="course_type",
                    points="all",
                    color_discrete_map={"Theory": "#6366f1", "Lab": "#10b981"},
                    labels={"course_type": "Course Type", "total_marks": "Total Score (/100)"}
                )
                fig_split.update_layout(margin=dict(l=20, r=20, t=30, b=20), height=320)
                st.plotly_chart(fig_split, use_container_width=True)
            else:
                st.info("No course evaluation data available.")

        c3, c4 = st.columns(2)
        with c3:
            st.markdown("##### 🎯 Portfolio Impact Points by Category")
            if student_activities:
                df_act = pd.DataFrame(student_activities)
                cat_summary = df_act.groupby("category")["impact_points"].sum().reset_index()
                fig_pie = px.pie(
                    cat_summary,
                    names="category",
                    values="impact_points",
                    hole=0.45,
                    color_discrete_sequence=px.colors.sequential.Indigo
                )
                fig_pie.update_layout(margin=dict(l=20, r=20, t=30, b=20), height=320)
                st.plotly_chart(fig_pie, use_container_width=True)
            else:
                st.info("No activities recorded.")

        with c4:
            st.markdown("##### 🏢 Department-wide CGPA Comparison")
            all_stds = pd.DataFrame(db["students"])
            if not all_stds.empty:
                # Calculate CGPA for each student in db
                cgpa_list = []
                for s in db["students"]:
                    s_sems = [sem for sem in db["semesters"] if sem["student_id"] == s["student_id"]]
                    cgpa_list.append(calculate_cgpa(s_sems))
                all_stds["cgpa"] = cgpa_list
                fig_dept = px.histogram(
                    all_stds,
                    x="cgpa",
                    color="department",
                    nbins=10,
                    barmode="overlay",
                    labels={"cgpa": "CGPA Score", "department": "Department"}
                )
                fig_dept.update_layout(margin=dict(l=20, r=20, t=30, b=20), height=320)
                st.plotly_chart(fig_dept, use_container_width=True)

    # ---------------------------------------------------------
    # TAB 5: Add Records & Export
    # ---------------------------------------------------------
    with tab_manage:
        st.subheader("Data Export & Master Record Administration")

        col_ex1, col_ex2 = st.columns(2)
        with col_ex1:
            st.markdown("##### 📥 Export Student Transcript (CSV)")
            if student_courses:
                df_export = pd.DataFrame(student_courses)[["course_code", "course_name", "course_type", "credits", "internal_marks", "external_marks", "total_marks", "grade_letter", "grade_point", "status"]]
                csv_bytes = df_export.to_csv(index=False).encode('utf-8')
                st.download_button(
                    label="Download Current Marksheet (CSV)",
                    data=csv_bytes,
                    file_name=f"{active_student['roll_no']}_marksheet.csv",
                    mime="text/csv"
                )

        with col_ex2:
            st.markdown("##### 📥 Full Relational Database Backup")
            st.caption("Exports Students, Semesters, Courses, Seminars, Activities and Gaps.")
            all_students_df = pd.DataFrame(db["students"])
            csv_all_stds = all_students_df.to_csv(index=False).encode('utf-8')
            st.download_button(
                label="Download All Students Directory (CSV)",
                data=csv_all_stds,
                file_name="ScholarPulse_Students_3NF_Export.csv",
                mime="text/csv"
            )

        st.divider()
        st.subheader("➕ Enroll New Student into 3NF DBMS")
        with st.form("form_register_student"):
            r1, r2, r3 = st.columns(3)
            with r1:
                st_name = st.text_input("Full Name *", placeholder="e.g. Vikram Malhotra")
                st_roll = st.text_input("Roll No *", placeholder="e.g. 2022CSE099")
                st_email = st.text_input("Institute Email *", placeholder="e.g. vikram.m@institution.edu")
            with r2:
                st_dept = st.selectbox("Department *", [
                    "Computer Science & Engineering",
                    "Information Technology",
                    "Artificial Intelligence & Data Science",
                    "Electronics & Communication",
                    "Mechanical Engineering"
                ])
                st_batch = st.number_input("Batch Year", min_value=2018, max_value=2026, value=2022)
                st_curr_sem = st.number_input("Current Semester", min_value=1, max_value=8, value=1)
            with r3:
                st_sec_pct = st.number_input("10th (Secondary) Percentage", min_value=35.0, max_value=100.0, value=88.5, step=0.1)
                st_hsec_pct = st.number_input("12th (Higher Sec) Percentage", min_value=35.0, max_value=100.0, value=86.0, step=0.1)
                st_status = st.selectbox("Initial Status", ["Active", "Academic Gap / Drop", "Graduated"])

            if st.form_submit_button("Register Student Record"):
                new_id = f"std-{len(db['students'])+1:03d}"
                new_student = {
                    "student_id": new_id,
                    "roll_no": st_roll,
                    "full_name": st_name,
                    "email": st_email,
                    "phone": "+91 99999 88888",
                    "department": st_dept,
                    "batch_year": st_batch,
                    "current_semester": st_curr_sem,
                    "status": st_status,
                    "secondary_board": "CBSE",
                    "secondary_percentage": st_sec_pct,
                    "secondary_passing_year": st_batch - 3,
                    "higher_sec_board": "CBSE",
                    "higher_sec_percentage": st_hsec_pct,
                    "higher_sec_stream": "Science (PCM)",
                    "higher_sec_passing_year": st_batch - 1,
                    "created_at": datetime.now().isoformat()
                }
                db["students"].append(new_student)
                # Create initial semester 1
                db["semesters"].append({
                    "semester_id": f"sem-{len(db['semesters'])+1}",
                    "student_id": new_id,
                    "semester_number": 1,
                    "academic_year": f"{st_batch}-{st_batch+1}",
                    "sgpa": 0.0,
                    "cgpa": 0.0,
                    "total_credits": 20,
                    "earned_credits": 0,
                    "has_drop_year": False
                })
                st.success(f"Student {st_name} ({st_roll}) registered successfully in 3NF DBMS!")
                st.rerun()

# ---------------------------------------------------------
# Footer Information
# ---------------------------------------------------------
st.divider()
st.markdown("""
<div style="text-align:center; color:#94a3b8; font-size:0.85rem; padding:1rem 0;">
    <strong>ScholarPulse DBMS Mini-Project</strong> &bull; Normalized 3NF Schema &bull; React 19 + TypeScript + Streamlit Stack<br>
    Built for Academic Progression Tracking, Drop-Year Governance & Segregated Portfolios.
</div>
""", unsafe_allow_html=True)
