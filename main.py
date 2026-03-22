from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pydantic import BaseModel
from typing import List
from fastapi.responses import RedirectResponse
from fastapi import APIRouter
import os

app = FastAPI()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



class LoginRequest(BaseModel):
    id: str
    password: str
    role: str

class Student(BaseModel):
    register_no: str
    name: str
    department: str
    year: int
    semester: int
    date_of_birth: str 
    mother_name: str
    father_name: str
    parent_mobile: str
    is_hostler: bool
    college_transport: bool
    password: str 

class Faculty(BaseModel):
    staff_id: str
    name: str
    dept: str
    subject: str
    pass_word: str
    qualification: str
    email: str
    phone: str
    dob: str
    address: str
    joinDate: str

class StudentUpdate(BaseModel):
    name: str
    department: str 
    year: int
    semester: int
    date_of_birth: str 
    mother_name: str
    father_name: str
    parent_mobile: str
    is_hostler: bool
    college_transport: bool
    password: str 

class FacultyUpdate(BaseModel):
    name: str
    department: str  
    subject: str
    qualification: str
    email: str
    phone: str
    date_of_birth: str 
    address: str
    joining_date: str  
    password: str

class MarkEntry(BaseModel):
    register_no: str
    subject: str
    cat1: int = 0
    cat2: int = 0
    model: int = 0
    internal_mark: int = 0
    practical_mark: int = 0
    end_semester: int = 0

class AttendanceEntry(BaseModel):
    register_no: str
    subject: str
    total_classes: int
    attended_classes: int

class StudentSelfUpdate(BaseModel):
    parent_mobile: str
    password: str

class FacultySelfUpdate(BaseModel):
    email: str
    phone: str
    address: str
    password: str

api = APIRouter(prefix="/api")


@api.get("/")
async def root():
    
    return RedirectResponse(url="https://student-management-two-woad.vercel.app/index.html")

@api.post("/login")
def login(user: LoginRequest):
    print("\n--- NEW LOGIN ATTEMPT ---")
    
    clean_id = user.id.strip()
    clean_password = user.password.strip()
    safe_role = user.role.lower().strip()

    print(f"Role: '{safe_role}'")
    print(f"ID Typed: '{clean_id}'")
    print(f"Password Typed: '{clean_password}'")

    if safe_role == "admin":
        column, table = "admin_id", "admins" 
    elif safe_role == "faculty":
        column, table = "staff_id", "teachers" 
    else:
        column, table = "register_no", "students" 

    print(f"Searching Table: '{table}' | Column: '{column}'")

    try:
        response = supabase.table(table).select("*").eq(column, clean_id).execute()
        
        if not response.data or len(response.data) == 0:
            print(f"❌ ERROR: ID '{clean_id}' not found in the '{column}' column of the '{table}' table!")
            raise HTTPException(status_code=401, detail="User not found")

        db_user = response.data[0]
        
        db_password = str(db_user.get("password")).strip()
        print(f"DB Password found: '{db_password}'")
        
        if db_password != clean_password:
            print(f"❌ ERROR: Password mismatch!")
            raise HTTPException(status_code=401, detail="Invalid password")

        print("✅ Password matched! Logging in...")

        user_subject = db_user.get("subject") if safe_role == "faculty" else None
        user_department = db_user.get("department") if safe_role == "faculty" else None

        return {
            "message": "Login successful", 
            "role": safe_role, 
            "id": clean_id,
            "subject": user_subject,
            "department": user_department 
        }

    except HTTPException as e:
        raise e 
    except Exception as e:
        print(f"❌ CRASH ERROR: {e}")
        raise HTTPException(status_code=500, detail="Database Error")

@api.post("/admin/addstud")
def add_student(student: Student):
    try:
        data = student.model_dump() 
        response = supabase.table("students").insert(data).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        print(f"SQL Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api.post("/admin/addfaculty")
def add_faculty(faculty: Faculty):
    try:
        data = faculty.model_dump()
        data['password'] = data.pop('pass_word')
        response = supabase.table("teachers").insert(data).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



@api.get("/admin/stats")
def get_stats():
    try:
        students = supabase.table("students").select("id", count="exact").execute()
        faculty = supabase.table("teachers").select("id", count="exact").execute()
        return {
            "student_count": students.count,
            "faculty_count": faculty.count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api.get("/admin/students")
def get_all_students():
    try:
        response = supabase.table("students").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api.get("/admin/faculty")
def get_all_faculty():
    try:
        response = supabase.table("teachers").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api.get("/admin/profile/{admin_id}")
def get_admin_profile(admin_id: str):
    try:
        response = supabase.table("admins").select("*").eq("admin_id", admin_id).execute()
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Admin not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@api.put("/admin/students/{reg_no}")
def update_student(reg_no: str, student: StudentUpdate):
    try:
        response = supabase.table("students").update(student.model_dump()).eq("register_no", reg_no).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api.put("/admin/faculty/{staff_id}")
def update_faculty(staff_id: str, faculty: FacultyUpdate):
    try:
        response = supabase.table("teachers").update(faculty.model_dump()).eq("staff_id", staff_id).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api.delete("/admin/users/{role}/{user_id}")
def delete_user(role: str, user_id: str):
    try:
        if role == "students":
            supabase.table("students").delete().eq("register_no", user_id).execute()
        elif role == "faculty":
            supabase.table("teachers").delete().eq("staff_id", user_id).execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))




def calculate_grade_and_gp(internal: int, practical: int, end_sem: int):
    total = internal + practical + end_sem
    
    if total >= 90: return total, "O", 10.0
    elif total >= 80: return total, "A+", 9.0
    elif total >= 70: return total, "A", 8.0
    elif total >= 60: return total, "B+", 7.0
    elif total >= 50: return total, "B", 6.0
    else: return total, "U", 0.0 

def calculate_attendance_pct(attended: int, total: int):
    if total == 0: return 0.0
    return round((attended / total) * 100, 2)


@api.get("/faculty/students/{department}")
def get_department_students(department: str):
    try:
        response = supabase.table("students").select("*").eq("department", department).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api.get("/faculty/marks/{subject}")
def get_subject_marks(subject: str):
    try:
        response = supabase.table("marks").select("*").eq("subject", subject).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api.get("/faculty/attendance/{subject}")
def get_subject_attendance(subject: str):
    try:
        response = supabase.table("attendance").select("*").eq("subject", subject).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api.post("/faculty/marks/bulk")
def upsert_bulk_marks(entries: List[MarkEntry]):
    try:
        data_to_upsert = []
        for entry in entries:
            total, grade, grade_point = calculate_grade_and_gp(
                entry.internal_mark, entry.practical_mark, entry.end_semester
            )
            
            row = entry.model_dump()
            row["total"] = total
            row["grade"] = grade
            row["cgpa"] = grade_point
            data_to_upsert.append(row)

        response = supabase.table("marks").upsert(
            data_to_upsert, on_conflict="register_no, subject"
        ).execute()

        return {"status": "success", "message": f"Saved marks for {len(entries)} students."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@api.post("/faculty/attendance/bulk")
def upsert_bulk_attendance(entries: List[AttendanceEntry]):
    try:
        data_to_upsert = []
        for entry in entries:
            pct = calculate_attendance_pct(entry.attended_classes, entry.total_classes)
            row = entry.model_dump()
            row["attendance_percentage"] = pct
            data_to_upsert.append(row)

        response = supabase.table("attendance").upsert(
            data_to_upsert, on_conflict="register_no, subject"
        ).execute()

        return {"status": "success", "message": f"Saved attendance for {len(entries)} students."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    




@api.get("/student/profile/{reg_no}")
def get_student_profile(reg_no: str):
    try:
        response = supabase.table("students").select("*").eq("register_no", reg_no).execute()
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Student not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api.get("/student/marks/{reg_no}")
def get_student_marks(reg_no: str):
    """Fetches all marks for a specific student across all subjects"""
    try:
        response = supabase.table("marks").select("*").eq("register_no", reg_no).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api.get("/student/attendance/{reg_no}")
def get_student_attendance(reg_no: str):
    try:
        response = supabase.table("attendance").select("*").eq("register_no", reg_no).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@api.put("/student/profile/{reg_no}")
def update_student_self(reg_no: str, data: StudentSelfUpdate):
    
    try:
        response = supabase.table("students").update(data.model_dump()).eq("register_no", reg_no).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api.put("/faculty/profile/{staff_id}")
def update_faculty_self(staff_id: str, data: FacultySelfUpdate):
    
    try:
        response = supabase.table("teachers").update(data.model_dump()).eq("staff_id", staff_id).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
app.include_router(api)