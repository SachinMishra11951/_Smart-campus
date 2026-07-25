// ══════════════════════════════════
//   API CONFIG & INITS
// ══════════════════════════════════
const API_BASE_URL = "http://127.0.0.1:8000";

// Background Star Generation
(function createStars() {
    const container = document.getElementById("stars");
    if (!container) return;
    for (let i = 0; i < 90; i++) {
        const s = document.createElement("div");
        s.className = "star";
        s.style.cssText = `
            width:${Math.random() * 2.5 + 0.5}px;
            height:${Math.random() * 2.5 + 0.5}px;
            left:${Math.random() * 100}%;
            top:${Math.random() * 100}%;
            --d:${Math.random() * 3 + 2}s;
            --del:${Math.random() * 4}s;
            --op:${Math.random() * 0.7 + 0.2};
        `;
        container.appendChild(s);
    }
})();

// Auto-redirect if token is already set
(function checkExistingSession() {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && role) {
        if (role === "admin") {
            window.location.href = "../admin/index.html";
        } else if (role === "student") {
            window.location.href = "../student/index.html";
        }
    }
})();

// ══════════════════════════════════
//   AUTHENTICATION HANDLER
// ══════════════════════════════════
async function doLogin() {
    const usernameInput = document.getElementById("login-user").value.trim();
    const passwordInput = document.getElementById("login-pass").value.trim();
    const btn = document.getElementById("login-btn");

    if (!usernameInput || !passwordInput) {
        alert("Please enter both username/email and password.");
        return;
    }

    btn.disabled = true;
    btn.textContent = "Authenticating...";
    btn.style.opacity = "0.7";

    try {
        const formData = new URLSearchParams();
        formData.append("username", usernameInput);
        formData.append("password", passwordInput);

        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || "Invalid credentials, please try again.");
            return;
        }

        // Store tokens & user state
        localStorage.setItem("token", data.access_token || data.token);
        localStorage.setItem("role", data.role || "student");
        if (data.user_id) localStorage.setItem("user_id", data.user_id);
        if (data.email) localStorage.setItem("email", data.email);
        if (data.name) localStorage.setItem("name", data.name);

        // Redirect by role
        if (data.role === "admin") {
            window.location.href = "../admin/index.html";
        } else {
            window.location.href = "../student/index.html";
        }

    } catch (err) {
        console.error("Login Error:", err);
        alert("Unable to connect to FastAPI backend server at " + API_BASE_URL);
    } finally {
        btn.disabled = false;
        btn.textContent = "Login";
        btn.style.opacity = "1";
    }
}

// ══════════════════════════════════
//   FORGOT PASSWORD MODAL
// ══════════════════════════════════

// Modal Controls
// Open Modal
function openForgotPassword() {
    document.getElementById("forgotModal").classList.add("show");
}

// Close Modal


// 1. Send OTP Request (Step 1 -> Step 2)
async function sendOTP(event) {
    if (event) event.preventDefault(); // Prevents any accidental page reload/form submission
    
    const email = document.getElementById("forgotEmail").value.trim();
    if (!email) {
        alert("Please enter your registered email address.");
        return;
    }
    const emailSection = document.getElementById('email-section');
    const otpVerifySection = document.getElementById('otp-verify-section');
    const statusMsg = document.getElementById('status-msg');
    const sendOtpBtn = document.getElementById('send-otp-btn');
    const instruction = document.getElementById('modal-instruction');

    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = "Sending...";

    try {
        const response = await fetch(`${API_BASE_URL}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });

        const data = await response.json();

        if (response.ok) {
            // Hide email section, reveal OTP section
            emailSection.classList.add('hidden');
            emailSection.style.display = 'none';

            otpVerifySection.classList.remove('hidden');
            otpVerifySection.style.display = 'block';

            instruction.textContent = "Enter the 6-digit OTP sent to your email.";
            statusMsg.textContent = 'OTP sent successfully!';
        } else {
            alert(data.detail || 'Failed to send OTP. Please try again.');
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        alert('Server error. Please check your network connection.');
    } finally {
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = "Get OTP";
    }
}


function verifyOTPCode() {
    const otp = document.getElementById("otpInput").value.trim();
    if (otp.length < 6) {
        alert("Please enter a valid 6-digit OTP.");
        return;
    }

    const otpVerifySection = document.getElementById('otp-verify-section');
    const passwordResetSection = document.getElementById('password-reset-section');
    const instruction = document.getElementById('modal-instruction');
    const statusMsg = document.getElementById('status-msg');


    // Hide OTP section, reveal New Password section
    otpVerifySection.classList.add('hidden');
    otpVerifySection.style.display = 'none';
    passwordResetSection.classList.remove('hidden');
    passwordResetSection.style.display = 'block';

    instruction.textContent = "Enter your new secure password.";
    statusMsg.textContent = "OTP verified. Now set your new password.";
}

// 3. Submit New Password (Final Step)
async function submitNewPassword() {
    const email = document.getElementById("forgotEmail").value.trim();
    const otp = document.getElementById("otpInput").value.trim();
    const newPassword = document.getElementById("newPasswordInput").value.trim();
    const btn = document.getElementById("reset-pass-btn");

    if (!newPassword) {
        alert("Please enter your new password.");
        return;
    }

    btn.disabled = true;
    btn.textContent = "Updating...";

    try {
        const response = await fetch(`${API_BASE_URL}/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: email,
                otp: otp,
                new_password: newPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || "Invalid or expired OTP. Please try again.");
            return;
        }

        alert("Password reset successfully! You can now log in with your new password.");
        closeForgotPassword();

    } catch (err) {
        console.error(err);
        alert("Error connecting to server.");
    } finally {
        btn.disabled = false;
        btn.textContent = "Reset Password";
    }
}

// Reset modal back to Step 1 on close
function closeForgotPassword() {
    document.getElementById("forgotModal").classList.remove("show");
    document.getElementById("forgotEmail").value = "";
    document.getElementById("otpInput").value = "";
    document.getElementById("newPasswordInput").value = "";
    document.getElementById("status-msg").textContent = "";
    document.getElementById("modal-instruction").textContent = "Enter your email to receive a verification OTP.";

    // Reset sections visibility
    document.getElementById("email-section").classList.remove("hidden");
    document.getElementById("email-section").style.display = "block";

    document.getElementById("otp-verify-section").classList.add("hidden");
    document.getElementById("otp-verify-section").style.display = "none";

    document.getElementById("password-reset-section").classList.add("hidden");
    document.getElementById("password-reset-section").style.display = "none";
}
// Toggle Password Visibility Helper
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (input.type === "password") {
        input.type = "text";
        icon.textContent = "🙈"; // Change to closed eye
    } else {
        input.type = "password";
        icon.textContent = "👁️"; // Change to open eye
    }
}