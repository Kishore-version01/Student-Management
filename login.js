const studentBtn = document.getElementById("studentloginToggle");
const teacherBtn = document.getElementById("teacherloginToggle");
const adminBtn = document.getElementById("adminloginToggle");
const API_URL = "https://student-management-two-woad.vercel.app/api";


const forms = document.querySelectorAll(".form-wrapper form");


adminBtn.addEventListener("click", () => {
    forms[0].style.display = "flex";
    forms[1].style.display = "none";
    forms[2].style.display = "none";
});


teacherBtn.addEventListener("click", () => {
    forms[0].style.display = "none";
    forms[1].style.display = "flex";
    forms[2].style.display = "none";

});


studentBtn.addEventListener("click", () => {
    forms[0].style.display = "none";
    forms[1].style.display = "none";
    forms[2].style.display = "flex";

});


const toggles = document.querySelectorAll(".fa-eye");

toggles.forEach(toggle => {
    toggle.addEventListener("click", function () {
        const passwordInput = this.previousElementSibling;

        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            this.classList.replace("fa-eye", "fa-eye-slash");
        } else {
            passwordInput.type = "password";
            this.classList.replace("fa-eye-slash", "fa-eye");
        }
    });
});

async function loginUser(event, role) {
    event.preventDefault();

    let userId, password, errorId;

    if (role === "admin") {
        userId = document.getElementById("adminuserId").value;
        password = document.getElementById("adminpassword").value;
        errorId = "aerrorMsg";
    }
    else if (role === "faculty") {
        userId = document.getElementById("facultyuserId").value;
        password = document.getElementById("facultypassword").value;
        errorId = "ferrorMsg";
    }
    else {
        userId = document.getElementById("studentuserId").value;
        password = document.getElementById("studentpassword").value;
        errorId = "serrorMsg";
    }

    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = "";
    }
    
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: userId,
                password: password,
                role: role
            })
        });

        const data = await res.json();

        if (res.ok) {
            document.getElementById(errorId).textContent = "";

          
            localStorage.setItem("user", JSON.stringify(data));

            
            if (data.role === "admin") {
                window.location.href = "adminhome.html";
            } else if (data.role === "faculty") {
                window.location.href = "facultyhome.html";
            } else {
                window.location.href = "studenthome.html";
            }

        } else {
            document.getElementById(errorId).textContent = data.message || "Login failed, enter correct credentials.";
        }

    } catch (error) {
        document.getElementById(errorId).textContent = "Server error. Try again.";
    }
}

const hintBtn = document.getElementById("hintToggle");
const hintBox = document.getElementById("hintBox");

hintBtn.addEventListener("click", () => {
    if (hintBox.style.display === "none") {
        hintBox.style.display = "block";
        hintBtn.textContent = "Hide Login Hints";
    } else {
        hintBox.style.display = "none";
        hintBtn.textContent = "Show Login Hints";
    }
});