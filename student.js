const API_URL = "http://127.0.0.1:8000";

let studentId = "";
let studentProfile = null;
let myMarks = [];
let myAttendance = [];

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    
    // Security check: Kick them out if they aren't logged in as a student
    if (!user || user.role !== 'student') {
        window.location.href = "index.html";
        return;
    }
    
    studentId = user.id.trim();
    
    // Fetch all student data
    fetchAllData();
});

function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(sectionId).classList.add("active");
}

// ==========================================
// DATA FETCHING
// ==========================================

async function fetchAllData() {
    try {
        // Fetch Profile
        const profileRes = await fetch(`${API_URL}/student/profile/${studentId}`);
        if (profileRes.ok) {
            studentProfile = await profileRes.json();
            document.getElementById("dashStudentName").textContent = studentProfile.name.split(" ")[0]; 
            renderProfile();
        }

        // Fetch Marks
        const marksRes = await fetch(`${API_URL}/student/marks/${studentId}`);
        if (marksRes.ok) {
            myMarks = await marksRes.json();
            renderMarksTable();
        }

        // Fetch Attendance
        const attRes = await fetch(`${API_URL}/student/attendance/${studentId}`);
        if (attRes.ok) {
            myAttendance = await attRes.json();
            renderAttendanceTable();
        }

        // Calculate Dashboard Stats once everything is loaded
        renderDashboardStats();

    } catch (e) {
        console.error("Failed to load student data", e);
        Swal.fire("Network Error", "Could not connect to the database.", "error");
    }
}

// ==========================================
// RENDERING UI
// ==========================================

function renderDashboardStats() {
    // 1. Calculate Overall Attendance
    if (myAttendance.length > 0) {
        let totalConducted = 0;
        let totalAttended = 0;
        myAttendance.forEach(a => {
            totalConducted += a.total_classes;
            totalAttended += a.attended_classes;
        });
        
        let overallPct = totalConducted === 0 ? 0 : (totalAttended / totalConducted) * 100;
        const attElement = document.getElementById("statAttendance");
        attElement.textContent = overallPct.toFixed(1) + "%";
        
        // Color code attendance!
        if (overallPct >= 75) attElement.style.color = "#28a745"; // Green
        else if (overallPct >= 65) attElement.style.color = "#f4b400"; // Yellow
        else attElement.style.color = "#dc3545"; // Red
    }

    // 2. Calculate CGPA (Average of all Grade Points)
    if (myMarks.length > 0) {
        let totalGPs = 0;
        myMarks.forEach(m => totalGPs += (m.cgpa || 0));
        let cgpa = totalGPs / myMarks.length;
        document.getElementById("statCGPA").textContent = cgpa.toFixed(2);
    } else {
        document.getElementById("statCGPA").textContent = "N/A";
    }

    // 3. Total Subjects
    document.getElementById("statSubjects").textContent = Math.max(myMarks.length, myAttendance.length);
}

function renderMarksTable() {
    const tbody = document.querySelector("#marksTable tbody");
    tbody.innerHTML = "";
    
    if (myMarks.length === 0) {
        tbody.innerHTML = "<tr><td colspan='10'>No marks have been published yet.</td></tr>";
        return;
    }

    myMarks.forEach(m => {
        // Assign beautiful colors to the grades
        let gradeColor = "#007bff"; 
        if (m.grade === "O") gradeColor = "#28a745";
        else if (m.grade === "U") gradeColor = "#dc3545";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="text-align: left; font-weight: bold; color: #003366;">${m.subject}</td>
            <td>${m.cat1 || '-'}</td>
            <td>${m.cat2 || '-'}</td>
            <td>${m.model || '-'}</td>
            <td>${m.internal_mark || '-'}</td>
            <td>${m.practical_mark || '-'}</td>
            <td>${m.end_semester || '-'}</td>
            <td style="font-weight: bold;">${m.total || '-'}</td>
            <td><span class="grade-badge" style="background-color: ${gradeColor};">${m.grade || '-'}</span></td>
            <td style="font-weight: bold;">${m.cgpa || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderAttendanceTable() {
    const tbody = document.querySelector("#attendanceTable tbody");
    tbody.innerHTML = "";
    
    if (myAttendance.length === 0) {
        tbody.innerHTML = "<tr><td colspan='5'>No attendance records found.</td></tr>";
        return;
    }

    myAttendance.forEach(a => {
        let pct = a.attendance_percentage || 0;
        
        
        let statusHtml = "";
        if (pct >= 75) statusHtml = `<span style="color: #28a745; font-weight: bold;">Safe</span>`;
        else if (pct >= 65) statusHtml = `<span style="color: #f4b400; font-weight: bold;">Warning</span>`;
        else statusHtml = `<span style="color: #dc3545; font-weight: bold;">Shortage</span>`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="text-align: left; font-weight: bold; color: #003366;">${a.subject}</td>
            <td>${a.total_classes}</td>
            <td>${a.attended_classes}</td>
            <td style="font-weight: bold;">${pct}%</td>
            <td>${statusHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderProfile() {
    const container = document.getElementById("profileContainer");
    if (!studentProfile) return;

    const firstLetter = studentProfile.name.charAt(0).toUpperCase();

    container.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px;">
            <div style="width: 90px; height: 90px; background: #003366; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 35px; margin: 0 auto; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                ${firstLetter}
            </div>
            <h3 style="margin: 15px 0 5px 0; font-size: 1.5rem; color: #222;">${studentProfile.name}</h3>
            <span style="background: #eef2f5; color: #555; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: bold;">B.Tech ${studentProfile.department} (Year ${studentProfile.year})</span>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;">
        
        <div style="line-height: 2.2; font-size: 1rem; color: #444;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #eee;"><strong>Register No:</strong> <span style="font-weight: bold; color: #003366;">${studentProfile.register_no}</span></div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #eee;"><strong>Date of Birth:</strong> <span>${studentProfile.date_of_birth || 'N/A'}</span></div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #eee;"><strong>Parent's Name:</strong> <span>${studentProfile.father_name || studentProfile.mother_name || 'N/A'}</span></div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #eee;"><strong>Parent's Contact:</strong> <span>${studentProfile.parent_mobile || 'N/A'}</span></div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #eee;"><strong>Hostler:</strong> <span>${studentProfile.is_hostler ? '✅ Yes' : '❌ No'}</span></div>
            <div style="display: flex; justify-content: space-between;"><strong>Transport:</strong> <span>${studentProfile.college_transport ? '✅ Yes' : '❌ No'}</span></div>
        </div>

        <div style="text-align: center; margin-top: 25px;">
            <button class="save-btn" onclick="editMyProfile()" style="background: #007bff; margin: 0 auto;">✏️ Edit Info & Password</button>
        </div>
    `;
}

async function editMyProfile() {
    const { value: formValues } = await Swal.fire({
        title: 'Update Details',
        html: `
            <label style="display:block; text-align:left; font-size:0.9rem; margin-top:10px;">Parent's Mobile:</label>
            <input id="swal-mobile" type="number" class="swal2-input" value="${studentProfile.parent_mobile || ''}" style="margin-top:0; width: 80%;">
            
            <label style="display:block; text-align:left; font-size:0.9rem; margin-top:10px;">Account Password:</label>
            <input id="swal-password" type="text" class="swal2-input" value="${studentProfile.password || ''}" style="margin-top:0; width: 80%;">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: '💾 Save Changes',
        preConfirm: () => {
            return {
                parent_mobile: document.getElementById('swal-mobile').value,
                password: document.getElementById('swal-password').value
            }
        }
    });

    if (formValues) {
        try {
            const res = await fetch(`${API_URL}/student/profile/${studentId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formValues)
            });
            if (res.ok) {
                Swal.fire("Updated!", "Your details have been saved.", "success");
                fetchAllData(); 
            } else {
                Swal.fire("Error", "Failed to update profile", "error");
            }
        } catch(e) { Swal.fire("Error", "Server connection failed.", "error"); }
    }
}
async function logout() {
    const result = await Swal.fire({
        title: "Ready to leave?",
        text: "You will be logged out of your portal.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#808080",
        confirmButtonText: "Yes, log me out"
    });

    if (result.isConfirmed) {
        localStorage.removeItem("user");
        window.location.href = "index.html";
    }
}