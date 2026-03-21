const API_URL = "http://127.0.0.1:8000";

let facultyId = "";
let facultySubject = "";
let facultyDepartment = "";
let allStudents = [];
let existingMarks = [];
let existingAttendance = [];
let fullFacultyProfile = null;


document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || user.role !== 'faculty') {
        window.location.href = "index.html";
        return;
    }

    facultyId = user.id;
    facultySubject = (user.subject || "Unassigned Subject").trim();
    facultyDepartment = (user.department || "Unassigned Department").trim();

    document.getElementById("dashSubject").textContent = facultySubject;
    document.getElementById("dashDept").textContent = facultyDepartment + " Department";

    fetchStudents().then(() => fetchExistingData());
    fetchFacultyProfile();
});

function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(sectionId).classList.add("active");

    if (sectionId === 'marks_entry') renderMarksTable();
    if (sectionId === 'attendance_entry') renderAttendanceTable();
    if (sectionId === 'profile') renderProfile();
}


async function fetchStudents() {
    try {
        const safeDeptName = encodeURIComponent(facultyDepartment);
        const res = await fetch(`${API_URL}/faculty/students/${safeDeptName}`);
        if (res.ok) {
            allStudents = await res.json();
        }
    } catch (e) { console.error("Failed to load students", e); }
}

async function fetchExistingData() {
    try {
        const safeSubject = encodeURIComponent(facultySubject);

        const marksRes = await fetch(`${API_URL}/faculty/marks/${safeSubject}`);
        if (marksRes.ok) existingMarks = await marksRes.json();

        const attRes = await fetch(`${API_URL}/faculty/attendance/${safeSubject}`);
        if (attRes.ok) existingAttendance = await attRes.json();

        const activeSec = document.querySelector('.section.active');
        if (activeSec && activeSec.id === 'marks_entry') renderMarksTable();
        if (activeSec && activeSec.id === 'attendance_entry') renderAttendanceTable();

        renderDashboardStats();

    } catch (e) { console.error("Failed to load existing records", e); }
}

async function fetchFacultyProfile() {
    try {
        const res = await fetch(`${API_URL}/admin/faculty`);
        if (res.ok) {
            const allFaculties = await res.json();
            fullFacultyProfile = allFaculties.find(f => f.staff_id === facultyId);
        }
    } catch (e) { console.error("Failed to load profile", e); }
}

function renderDashboardStats() {
    document.getElementById("statTotalStudents").textContent = allStudents.length;

    if (existingAttendance.length > 0) {
        const sumAtt = existingAttendance.reduce((sum, att) => sum + (att.attendance_percentage || 0), 0);
        document.getElementById("statAvgAttendance").textContent = (sumAtt / existingAttendance.length).toFixed(1) + "%";
    } else {
        document.getElementById("statAvgAttendance").textContent = "N/A";
    }

    if (existingMarks.length > 0) {
        let highestTotal = -1;
        let bestStudentName = "N/A";
        let sumMarks = 0;
        let poorCount = 0;

        existingMarks.forEach(m => {
            const total = m.total || 0;
            sumMarks += total;

            if (total > highestTotal) {
                highestTotal = total;
                const studentInfo = allStudents.find(s => s.register_no.trim() === m.register_no.trim());
                bestStudentName = studentInfo ? studentInfo.name : m.register_no;
            }

            if (m.grade === "U" || total < 50) {
                poorCount++;
            }
        });

        document.getElementById("statAvgMarks").textContent = (sumMarks / existingMarks.length).toFixed(1) + " / 250";
        document.getElementById("statBestPerformer").textContent = bestStudentName;
        document.getElementById("statPoorPerformers").textContent = poorCount;
    } else {
        document.getElementById("statAvgMarks").textContent = "N/A";
        document.getElementById("statBestPerformer").textContent = "N/A";
        document.getElementById("statPoorPerformers").textContent = "0";
    }
}


function renderMarksTable() {
    const tbody = document.querySelector("#marksTable tbody");
    tbody.innerHTML = "";

    if (allStudents.length === 0) {
        tbody.innerHTML = "<tr><td colspan='8'>No students found in your department.</td></tr>";
        return;
    }

    allStudents.forEach(student => {
        const mark = existingMarks.find(m => m.register_no.trim() === student.register_no.trim()) || {};

        const tr = document.createElement("tr");
        tr.dataset.reg = student.register_no.trim();

        tr.innerHTML = `
            <td><strong>${student.register_no}</strong></td>
            <td style="text-align: left;">${student.name}</td>
            <td><input type="number" class="cat1" value="${mark.cat1 || 0}" min="0" max="50"></td>
            <td><input type="number" class="cat2" value="${mark.cat2 || 0}" min="0" max="50"></td>
            <td><input type="number" class="model" value="${mark.model || 0}" min="0" max="100"></td>
            <td><input type="number" class="internal" value="${mark.internal_mark || 0}" min="0" max="50"></td>
            <td><input type="number" class="practical" value="${mark.practical_mark || 0}" min="0" max="100"></td>
            <td><input type="number" class="endsem" value="${mark.end_semester || 0}" min="0" max="100"></td>
        `;
        tbody.appendChild(tr);
    });
}

async function saveAllMarks() {
    const rows = document.querySelectorAll("#marksTable tbody tr");
    const payload = [];

    rows.forEach(row => {
        if (!row.dataset.reg) return;
        payload.push({
            register_no: row.dataset.reg,
            subject: facultySubject,
            cat1: parseInt(row.querySelector(".cat1").value) || 0,
            cat2: parseInt(row.querySelector(".cat2").value) || 0,
            model: parseInt(row.querySelector(".model").value) || 0,
            internal_mark: parseInt(row.querySelector(".internal").value) || 0,
            practical_mark: parseInt(row.querySelector(".practical").value) || 0,
            end_semester: parseInt(row.querySelector(".endsem").value) || 0
        });
    });

    try {
        Swal.fire({ title: 'Saving Marks...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        const res = await fetch(`${API_URL}/faculty/marks/bulk`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            Swal.fire("Success!", "All marks saved and grades calculated.", "success");
            await fetchExistingData();
        } else {
            const err = await res.json();
            Swal.fire("Error", err.detail || "Failed to save marks.", "error");
        }
    } catch (e) { Swal.fire("Error", "Server connection failed.", "error"); }
}

function renderAttendanceTable() {
    const tbody = document.querySelector("#attendanceTable tbody");
    tbody.innerHTML = "";

    if (allStudents.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4'>No students found in your department.</td></tr>";
        return;
    }

    allStudents.forEach(student => {
        const att = existingAttendance.find(a => a.register_no.trim() === student.register_no.trim()) || {};

        const tr = document.createElement("tr");
        tr.dataset.reg = student.register_no.trim();

        tr.innerHTML = `
            <td><strong>${student.register_no}</strong></td>
            <td style="text-align: left;">${student.name}</td>
            <td><input type="number" class="total-class" value="${att.total_classes || 0}" min="0"></td>
            <td><input type="number" class="attended-class" value="${att.attended_classes || 0}" min="0"></td>
        `;
        tbody.appendChild(tr);
    });
}

async function saveAllAttendance() {
    const rows = document.querySelectorAll("#attendanceTable tbody tr");
    const payload = [];

    rows.forEach(row => {
        if (!row.dataset.reg) return;
        payload.push({
            register_no: row.dataset.reg,
            subject: facultySubject,
            total_classes: parseInt(row.querySelector(".total-class").value) || 0,
            attended_classes: parseInt(row.querySelector(".attended-class").value) || 0
        });
    });

    try {
        Swal.fire({ title: 'Saving Attendance...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        const res = await fetch(`${API_URL}/faculty/attendance/bulk`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            Swal.fire("Success!", "All attendance records saved.", "success");
            await fetchExistingData();
        } else {
            const err = await res.json();
            Swal.fire("Error", err.detail || "Failed to save attendance.", "error");
        }
    } catch (e) { Swal.fire("Error", "Server connection failed.", "error"); }
}


function renderProfile() {
    const container = document.getElementById("profileContainer");

    if (!fullFacultyProfile) {
        container.innerHTML = "<p style='color:red;'>Failed to load full profile details.</p>";
        return;
    }

    const firstLetter = fullFacultyProfile.name ? fullFacultyProfile.name.charAt(0).toUpperCase() : "F";

    container.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px;">
            <div style="width: 90px; height: 90px; background: #667eea; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 35px; margin: 0 auto; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                ${firstLetter}
            </div>
            <h3 style="margin: 15px 0 5px 0; font-size: 1.5rem; color: #222;">${fullFacultyProfile.name}</h3>
            <span style="background: #eef2f5; color: #555; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: bold;">Faculty Member</span>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;">
        
        <div style="line-height: 2; font-size: 1rem; color: #444;">
            <div style="display: flex; justify-content: space-between;"><strong>Staff ID:</strong> <span>${fullFacultyProfile.staff_id}</span></div>
            <div style="display: flex; justify-content: space-between;"><strong>Department:</strong> <span>${fullFacultyProfile.department}</span></div>
            <div style="display: flex; justify-content: space-between;"><strong>Subject:</strong> <span style="color: #007bff; font-weight: bold;">${fullFacultyProfile.subject}</span></div>
            <div style="display: flex; justify-content: space-between;"><strong>Email:</strong> <span>${fullFacultyProfile.email || 'N/A'}</span></div>
            <div style="display: flex; justify-content: space-between;"><strong>Phone:</strong> <span>${fullFacultyProfile.phone || 'N/A'}</span></div>
        </div>

        <div style="text-align: center; margin-top: 25px;">
            <button class="save-btn" onclick="editMyProfile()" style="background: #007bff; margin: 0 auto;">✏️ Edit Info</button>
        </div>
    `;
}

async function editMyProfile() {
    const { value: formValues } = await Swal.fire({
        title: 'Update Personal Info',
        html: `
            <label style="display:block; text-align:left; font-size:0.9rem; margin-top:10px;">Email:</label>
            <input id="swal-email" class="swal2-input" value="${fullFacultyProfile.email || ''}" style="margin-top:0; width: 80%;">
            
            <label style="display:block; text-align:left; font-size:0.9rem; margin-top:10px;">Phone:</label>
            <input id="swal-phone" type="number" class="swal2-input" value="${fullFacultyProfile.phone || ''}" style="margin-top:0; width: 80%;">
            
            <label style="display:block; text-align:left; font-size:0.9rem; margin-top:10px;">Address:</label>
            <input id="swal-address" class="swal2-input" value="${fullFacultyProfile.address || ''}" style="margin-top:0; width: 80%;">
            
            <label style="display:block; text-align:left; font-size:0.9rem; margin-top:10px;">Password:</label>
            <input id="swal-password" type="text" class="swal2-input" value="${fullFacultyProfile.password || ''}" style="margin-top:0; width: 80%;">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: '💾 Save Changes',
        preConfirm: () => {
            return {
                email: document.getElementById('swal-email').value,
                phone: document.getElementById('swal-phone').value,
                address: document.getElementById('swal-address').value,
                password: document.getElementById('swal-password').value
            }
        }
    });

    if (formValues) {
        try {
            const res = await fetch(`${API_URL}/faculty/profile/${facultyId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formValues)
            });
            if (res.ok) {
                Swal.fire("Updated!", "Your profile has been updated.", "success");
                fetchFacultyProfile().then(() => renderProfile()); // Refresh UI
            } else {
                Swal.fire("Error", "Failed to update profile", "error");
            }
        } catch (e) { Swal.fire("Error", "Server connection failed.", "error"); }
    }
}

async function logout() {
    const result = await Swal.fire({
        title: "Ready to leave?",
        text: "You will be logged out of the faculty portal.",
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