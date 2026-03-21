const API_URL = "http://127.0.0.1:8000";
let allStudents = [];
let allFaculty = [];
let currentEditingStudentId = null;
let currentEditingFacultyId = null;


document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== 'admin') {
        window.location.href = "index.html";
    } else {
        if (document.getElementById("adminName")) document.getElementById("adminName").textContent = user.id;
        if (document.getElementById("adminId")) document.getElementById("adminId").textContent = "ID: " + user.id;
    }
});

document.getElementById("hostler").addEventListener("change", function () {
    const transportField = document.getElementById("clgTransport");
    const transportLabel = transportField.previousElementSibling;

    if (this.value === "false") {
        transportField.style.display = "block";
        if (transportLabel && transportLabel.tagName === "LABEL") transportLabel.style.display = "block";
    } else {
        transportField.style.display = "none";
        transportField.value = "false";
        if (transportLabel && transportLabel.tagName === "LABEL") transportLabel.style.display = "none";
    }
});

function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add("active");

    if (sectionId === 'dashboard') loadDashboardStats();
    if (sectionId === 'edit_stud') loadStudents();
    if (sectionId === 'edit_teach') loadFaculty();
    if (sectionId === 'profile') loadProfile();
}

async function loadDashboardStats() {
    try {
        const res = await fetch(`${API_URL}/admin/stats`);
        const data = await res.json();
        const dash = document.getElementById("dashboard");

        // Get the logged-in user's ID to greet them
        const user = JSON.parse(localStorage.getItem("user"));
        const adminName = user ? user.id : "Admin";

        dash.innerHTML = `
            <h2 style="font-size: 2rem; color: #333;">Welcome back, ${adminName}! 👋</h2>
            <p style="color: #666; margin-bottom: 30px; font-size: 1.1rem;">Here is the current overview of your institution.</p>
            
            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 250px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 20px rgba(0,195,255,0.2); text-align: center;">
                    <h3 style="margin: 0; font-size: 1.2rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Total Students</h3>
                    <div style="font-size: 4rem; font-weight: bold; margin-top: 10px;">${data.student_count}</div>
                </div>
                
                <div style="flex: 1; min-width: 250px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 20px rgba(245,87,108,0.2); text-align: center;">
                    <h3 style="margin: 0; font-size: 1.2rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Total Faculty</h3>
                    <div style="font-size: 4rem; font-weight: bold; margin-top: 10px;">${data.faculty_count}</div>
                </div>
            </div>
        `;
    } catch (e) {
        console.error("Stats failed to load");
    }
}
async function addStudent() {
    const studentData = {
        register_no: document.getElementById("reg_no").value,
        name: document.getElementById("studName").value,
        department: document.getElementById("studCourse").value,
        year: parseInt(document.getElementById("studYear").value),
        semester: parseInt(document.getElementById("studSemester").value),
        date_of_birth: document.getElementById("DOB").value,
        mother_name: document.getElementById("studMother").value,
        father_name: document.getElementById("studFather").value,
        parent_mobile: document.getElementById("parentno.").value,
        is_hostler: document.getElementById("hostler").value === "true",
        college_transport: document.getElementById("clgTransport").value === "true",
        password: document.getElementById("spassword").value
    };

    try {
        const response = await fetch(`${API_URL}/admin/addstud`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(studentData)
        });

        if (response.ok) {
            Swal.fire({
                title: "Success!",
                text: "Student Registered Successfully!",
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            });
            document.querySelectorAll("#add_stud input").forEach(input => input.value = ''); // Clear form
            showSection('dashboard');
        } else {
            const err = await response.json();
            Swal.fire("Error", err.detail, "error");
        }
    } catch (err) {
        Swal.fire("Connection Error", "Server connection failed.", "error");
    }
}

async function addFaculty() {
    const facultyData = {
        staff_id: document.getElementById("staff_id").value,
        name: document.getElementById("teachName").value,
        dept: document.getElementById("teachDept").value,
        subject: document.getElementById("teachsub").value,
        pass_word: document.getElementById("fpassword").value,
        qualification: document.getElementById("qualification").value,
        email: document.getElementById("teachEmail").value,
        phone: document.getElementById("teachNumb").value,
        dob: document.getElementById("teachDOB").value,
        address: document.getElementById("teachAddress").value,
        joinDate: document.getElementById("teachjoindate").value
    };

    try {
        const response = await fetch(`${API_URL}/admin/addfaculty`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(facultyData)
        });
        if (response.ok) {
            Swal.fire({
                title: "Success!",
                text: "Faculty Added Successfully!",
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            });
            document.querySelectorAll("#add_teach input").forEach(input => input.value = ''); // Clear form
        } else {
            const err = await response.json();
            Swal.fire("Error", err.detail || "Failed to add faculty", "error");
        }
    } catch (err) {
        Swal.fire("Connection Error", "Server connection failed.", "error");
    }
}

async function loadStudents() {
    const container = document.getElementById("studentsListContainer");

    if (allStudents.length > 0) {
        renderStudents(allStudents);
    } else if (container) {
        container.innerHTML = "<p>⏳ Fetching students from database...</p>";
    }

    try {
        const res = await fetch(`${API_URL}/admin/students`);
        allStudents = await res.json();
        renderStudents(allStudents);
    } catch (e) {
        console.error("Failed to load students", e);
        if (container && allStudents.length === 0) container.innerHTML = "<p style='color:red;'>❌ Failed to load data.</p>";
    }
}

async function loadFaculty() {
    const container = document.getElementById("facultyListContainer");

    if (allFaculty.length > 0) {
        renderFaculty(allFaculty);
    } else if (container) {
        container.innerHTML = "<p>⏳ Fetching faculty from database...</p>";
    }

    try {
        const res = await fetch(`${API_URL}/admin/faculty`);
        allFaculty = await res.json();
        renderFaculty(allFaculty);
    } catch (e) {
        console.error("Failed to load faculty", e);
        if (container && allFaculty.length === 0) container.innerHTML = "<p style='color:red;'>❌ Failed to load data.</p>";
    }
}

function renderStudents(studentsToRender) {
    const container = document.getElementById("studentsListContainer");
    if (!container) return;
    container.innerHTML = "";

    if (studentsToRender.length === 0) {
        container.innerHTML = "<p>No students found.</p>";
        return;
    }

    const grouped = studentsToRender.reduce((acc, student) => {
        const dept = student.department || "Unassigned";
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(student);
        return acc;
    }, {});

    for (const [dept, studs] of Object.entries(grouped)) {
        let html = `
            <div style="background: #eef2f5; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
                <h3 style="margin-top: 0; color: #333;">Department: ${dept}</h3>
                <ul style="list-style-type: none; padding-left: 0;">`;

        studs.forEach(s => {
            html += `
                <li style="background: white; padding: 10px; margin-bottom: 5px; border: 1px solid #ddd; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                    <span><strong>${s.name}</strong> (${s.register_no})</span>
                    <button onclick="openEditStudForm('${s.register_no}')" style="padding: 6px 12px; cursor: pointer; border: none; background: #007bff; color: white; border-radius: 4px;">✏️ Edit</button>
                </li>`;
        });

        html += `</ul></div>`;
        container.innerHTML += html;
    }
}

function renderFaculty(facultyToRender) {
    const container = document.getElementById("facultyListContainer");
    if (!container) return;
    container.innerHTML = "";

    if (facultyToRender.length === 0) {
        container.innerHTML = "<p>No faculty found.</p>";
        return;
    }

    let html = `<ul style="list-style-type: none; padding-left: 0;">`;
    facultyToRender.forEach(f => {
        html += `
            <li style="background: white; padding: 10px; margin-bottom: 5px; border: 1px solid #ddd; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                <span><strong>${f.name}</strong> - ${f.department || 'N/A'} (${f.staff_id})</span>
                <button onclick="openEditTeachForm('${f.staff_id}')" style="padding: 6px 12px; cursor: pointer; border: none; background: #007bff; color: white; border-radius: 4px;">✏️ Edit</button>
            </li>`;
    });
    html += `</ul>`;
    container.innerHTML = html;
}


function searchStudent() {
    const term = document.getElementById("searchStudInput").value.toLowerCase();
    const filtered = allStudents.filter(s =>
        s.register_no.toLowerCase().includes(term) ||
        s.name.toLowerCase().includes(term) ||
        (s.department && s.department.toLowerCase().includes(term))
    );
    renderStudents(filtered);
}

function searchFaculty() {
    const term = document.getElementById("searchTeachInput").value.toLowerCase();
    const filtered = allFaculty.filter(f =>
        f.staff_id.toLowerCase().includes(term) ||
        f.name.toLowerCase().includes(term) ||
        (f.department && f.department.toLowerCase().includes(term))
    );
    renderFaculty(filtered);
}



function closeForms() {
    document.getElementById("editStudForm").style.display = "none";
    document.getElementById("editTeachForm").style.display = "none";
}

function openEditStudForm(regNo) {
    const student = allStudents.find(s => s.register_no === regNo);
    if (!student) return;

    currentEditingStudentId = regNo;
    document.getElementById("editStudName").value = student.name || '';
    document.getElementById("editStudCourse").value = student.department || '';
    document.getElementById("editStudYear").value = student.year || '';
    document.getElementById("editStudSemester").value = student.semester || '';
    document.getElementById("editStudDOB").value = student.date_of_birth || '';
    document.getElementById("editStudMother").value = student.mother_name || '';
    document.getElementById("editStudFather").value = student.father_name || '';
    document.getElementById("editStudParentMobile").value = student.parent_mobile || '';
    document.getElementById("editStudHostler").value = student.is_hostler ? "true" : "false";
    document.getElementById("editStudTransport").value = student.college_transport ? "true" : "false";
    document.getElementById("editStudPassword").value = student.password || '';
    const form = document.getElementById("editStudForm");
    form.style.display = "flex";
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function updateStudent() {
    if (!currentEditingStudentId) return;

    const updatedData = {
        name: document.getElementById("editStudName").value,
        department: document.getElementById("editStudCourse").value,
        year: parseInt(document.getElementById("editStudYear").value) || 1,
        semester: parseInt(document.getElementById("editStudSemester").value) || 1,
        date_of_birth: document.getElementById("editStudDOB").value,
        mother_name: document.getElementById("editStudMother").value,
        father_name: document.getElementById("editStudFather").value,
        parent_mobile: document.getElementById("editStudParentMobile").value,
        is_hostler: document.getElementById("editStudHostler").value === "true",
        college_transport: document.getElementById("editStudTransport").value === "true",
        password: document.getElementById("editStudPassword").value
    };

    try {
        const res = await fetch(`${API_URL}/admin/students/${currentEditingStudentId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData)
        });

        if (res.ok) {
            Swal.fire("Success!", "Student updated successfully!", "success");
            document.getElementById("editStudForm").style.display = "none";
            loadStudents();
        } else {
            const err = await res.json();
            Swal.fire("Update Failed", err.detail || "Unknown error", "error");
        }
    } catch (e) {
        console.error("Update Error:", e);
        Swal.fire("Error", "Server connection failed.", "error");
    }
}

function openEditTeachForm(staffId) {
    const faculty = allFaculty.find(f => f.staff_id === staffId);
    if (!faculty) return;

    currentEditingFacultyId = staffId;
    document.getElementById("editTeachName").value = faculty.name || '';
    document.getElementById("editTeachDept").value = faculty.department || '';
    document.getElementById("editTeachSub").value = faculty.subject || '';
    document.getElementById("editTeachQualification").value = faculty.qualification || '';
    document.getElementById("editTeachEmail").value = faculty.email || '';
    document.getElementById("editTeachPhone").value = faculty.phone || '';
    document.getElementById("editTeachDOB").value = faculty.date_of_birth || '';
    document.getElementById("editTeachAddress").value = faculty.address || '';
    document.getElementById("editTeachJoinDate").value = faculty.joining_date || '';
    document.getElementById("editTeachPassword").value = faculty.password || '';


    const form = document.getElementById("editTeachForm");
    form.style.display = "flex";
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function updateFaculty() {
    if (!currentEditingFacultyId) return;

    const updatedData = {
        name: document.getElementById("editTeachName").value,
        department: document.getElementById("editTeachDept").value,
        subject: document.getElementById("editTeachSub").value,
        qualification: document.getElementById("editTeachQualification").value,
        email: document.getElementById("editTeachEmail").value,
        phone: document.getElementById("editTeachPhone").value,
        date_of_birth: document.getElementById("editTeachDOB").value,
        address: document.getElementById("editTeachAddress").value,
        joining_date: document.getElementById("editTeachJoinDate").value,
        password: document.getElementById("editTeachPassword").value
    };

    try {
        const res = await fetch(`${API_URL}/admin/faculty/${currentEditingFacultyId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData)
        });

        if (res.ok) {
            Swal.fire("Success!", "Faculty updated successfully!", "success");
            document.getElementById("editTeachForm").style.display = "none";
            loadFaculty();
        } else {
            const err = await res.json();
            Swal.fire("Update Failed", err.detail || "Unknown error", "error");
        }
    } catch (e) {
        console.error("Update Error:", e);
        Swal.fire("Error", "Server connection failed.", "error");
    }
}



async function deleteUser(role, dbColumn, searchInputId) {
    const userId = role === 'students' ? currentEditingStudentId : currentEditingFacultyId;

    if (!userId) {
        Swal.fire("Hold on", "Please select a user to delete first.", "info");
        return;
    }

    const result = await Swal.fire({
        title: "Are you sure?",
        text: `You are about to permanently delete this ${role}. You won't be able to revert this!`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#808080",
        confirmButtonText: "Yes, delete it!"
    });

    if (!result.isConfirmed) return;

    try {
        const res = await fetch(`${API_URL}/admin/users/${role}/${userId}`, {
            method: "DELETE"
        });

        if (res.ok) {
            Swal.fire("Deleted!", `${role} has been deleted.`, "success");

            if (role === 'students') {
                document.getElementById("editStudForm").style.display = "none";
                loadStudents();
            } else {
                document.getElementById("editTeachForm").style.display = "none";
                loadFaculty();
            }
        } else {
            Swal.fire("Error!", "Failed to delete.", "error");
        }
    } catch (e) {
        console.error("Delete Error:", e);
        Swal.fire("Error!", "Server connection failed.", "error");
    }
}

async function logout() {
    const result = await Swal.fire({
        title: "Ready to leave?",
        text: "You will be logged out of the admin panel.",
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



async function loadProfile() {
    const container = document.getElementById("profileContainer");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) return;

    container.innerHTML = "<p>⏳ Loading profile details...</p>";

    try {
        const res = await fetch(`${API_URL}/admin/profile/${user.id}`);

        if (res.ok) {
            const adminData = await res.json();


            const firstLetter = (adminData.name || adminData.admin_id).charAt(0).toUpperCase();

            container.innerHTML = `
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="width: 90px; height: 90px; background: #333; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 35px; margin: 0 auto; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        ${firstLetter}
                    </div>
                    <h3 style="margin: 15px 0 5px 0; font-size: 1.5rem; color: #222;">${adminData.name || 'System Admin'}</h3>
                    <span style="background: #eef2f5; color: #555; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: bold;">Administrator</span>
                </div>
                
                <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;">
                
                <div style="line-height: 2; font-size: 1rem; color: #444;">
                    <div style="display: flex; justify-content: space-between;">
                        <strong>Admin ID:</strong> <span>${adminData.admin_id}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <strong>Email:</strong> <span>${adminData.email || '<i style="color:#aaa">Not provided</i>'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <strong>Phone:</strong> <span>${adminData.phone || '<i style="color:#aaa">Not provided</i>'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <strong>Access Level:</strong> <span style="color: green; font-weight: bold;">Full Access</span>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = "<p style='color:red;'>❌ Failed to load profile details.</p>";
        }
    } catch (e) {
        console.error("Profile load error:", e);
        container.innerHTML = "<p style='color:red;'>❌ Server connection failed.</p>";
    }
}