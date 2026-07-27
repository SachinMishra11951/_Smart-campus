const API_BASE_URL = "http://127.0.0.1:8000";

// Feature: Dynamic Background Effect Configuration
(function createStars() {
    const container = document.getElementById("stars");
    if (!container) return;
    for (let i = 0; i < 70; i++) {
        const s = document.createElement("div");
        s.className = "star";
        s.style.cssText = `
            width:${Math.random() * 2 + 1}px;
            height:${Math.random() * 2 + 1}px;
            left:${Math.random() * 100}%;
            top:${Math.random() * 100}%;
            --d:${Math.random() * 4 + 3}s;
            --del:${Math.random() * 5}s;
            --op:${Math.random() * 0.6 + 0.3};
        `;
        container.appendChild(s);
    }
})();

// Feature: Credential Handlers and JWT Caching Operations
async function doLogin() {
    const usernameInput = document.getElementById("login-user").value.trim();
    const passwordInput = document.getElementById("login-pass").value.trim();
    const btn = document.getElementById("login-btn");
    const btnText = btn.querySelector('span');

    if (!usernameInput || !passwordInput) {
        alert("Please enter both username/email and password.");
        return;
    }

    const originalText = btnText.textContent;
    btn.style.pointerEvents = "none";
    btnText.textContent = "Authenticating...";

    try {
        const formData = new URLSearchParams();
        formData.append("username", usernameInput);
        formData.append("password", passwordInput);

        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || "Invalid credentials, please try again.");
            return;
        }

        localStorage.setItem("token", data.access_token || data.token);
        localStorage.setItem("role", data.role || "student");
        
        window.location.href = data.role === "admin" ? "../admin/index.html" : "../student/index.html";

    } catch (err) {
        console.error("Login Error:", err);
        alert("Unable to connect to backend server.");
    } finally {
        btn.style.pointerEvents = "auto";
        btnText.textContent = originalText;
    }
}

// Feature: Dynamic Form Step Tracking logic
function showMsg(type, text) {
    const statusEl = document.getElementById("status-msg");
    const errorEl = document.getElementById("error-msg");
    
    statusEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    
    if (type === 'success') {
        statusEl.textContent = text;
        statusEl.classList.remove('hidden');
    } else if (type === 'error') {
        errorEl.textContent = text;
        errorEl.classList.remove('hidden');
    }
}

function updateSteps(stepNumber) {
    document.querySelectorAll('.step-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index < stepNumber);
    });
    
    const steps = ['email-section', 'otp-verify-section', 'password-reset-section'];
    steps.forEach((id, index) => {
        const el = document.getElementById(id);
        if (index + 1 === stepNumber) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
}

function openForgotPassword() {
    document.getElementById("forgotModal").classList.add("show");
    showMsg('clear', '');
    updateSteps(1);
    document.getElementById("forgotEmail").focus();
}

function closeForgotPassword() {
    document.getElementById("forgotModal").classList.remove("show");
    
    setTimeout(() => {
        document.getElementById("forgotEmail").value = "";
        document.getElementById("newPasswordInput").value = "";
        document.querySelectorAll('.otp-digit').forEach(input => input.value = ''); 
        showMsg('clear', '');
        document.getElementById("modal-instruction").textContent = "Enter your email to receive a verification OTP.";
        updateSteps(1);
    }, 400);
}

function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    input.focus();
}

document.addEventListener("DOMContentLoaded", () => {
    const otpInputs = document.querySelectorAll('.otp-digit');
    
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, ''); 
            if (e.target.value !== '' && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                otpInputs[index - 1].focus();
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
            pastedData.split('').forEach((char, i) => {
                if (i < otpInputs.length) {
                    otpInputs[i].value = char;
                    if (i < otpInputs.length - 1) otpInputs[i + 1].focus();
                }
            });
            const lastFilled = Math.min(pastedData.length, otpInputs.length) - 1;
            if(lastFilled >= 0) otpInputs[lastFilled].focus();
        });
    });
});

// Feature: API Controller Calls and Post Handlers
async function sendOTP() {
    const email = document.getElementById("forgotEmail").value.trim();
    if (!email) return showMsg('error', "Please enter your registered email.");

    const btn = document.getElementById("send-otp-btn");
    btn.disabled = true; btn.textContent = "Sending...";

    try {
        const res = await fetch(`${API_BASE_URL}/forgot-password`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email })
        });
        if (!res.ok) throw new Error((await res.json()).detail || "Unable to send OTP.");
        
        updateSteps(2);
        showMsg('success', "Security code sent to your email.");
        document.getElementById("modal-instruction").textContent = "We sent a 6-digit code. Please enter it below.";
        setTimeout(() => document.querySelector('.otp-digit').focus(), 100);

    } catch (err) {
        showMsg('error', err.message || "Server Error.");
    } finally {
        btn.disabled = false; btn.textContent = "Send Verification Code";
    }
}

async function verifyOTPCode() {
    const email = document.getElementById("forgotEmail").value.trim();
    const otp = Array.from(document.querySelectorAll('.otp-digit')).map(i => i.value).join('');
    if (otp.length !== 6) return showMsg('error', "Please fill out all 6 digits.");

    const btn = document.getElementById("verify-otp-btn");
    btn.disabled = true; btn.textContent = "Verifying...";

    try {
        const res = await fetch(`${API_BASE_URL}/verify-otp`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp })
        });
        if (!res.ok) throw new Error((await res.json()).detail || "Invalid or expired code.");

        updateSteps(3);
        showMsg('success', "Identity Verified.");
        document.getElementById("modal-instruction").textContent = "Secure your account with a new password.";
        setTimeout(() => document.getElementById("newPasswordInput").focus(), 100);

    } catch (err) {
        showMsg('error', err.message);
        document.querySelectorAll('.otp-digit').forEach(i => i.value = '');
        document.querySelector('.otp-digit').focus();
    } finally {
        btn.disabled = false; btn.textContent = "Verify Security Code";
    }
}

async function submitNewPassword() {
    const email = document.getElementById("forgotEmail").value.trim();
    const otp = Array.from(document.querySelectorAll('.otp-digit')).map(i => i.value).join('');
    const new_password = document.getElementById("newPasswordInput").value.trim();
    if (!new_password) return showMsg('error', "Please enter your new password.");

    const btn = document.getElementById("reset-pass-btn");
    btn.disabled = true; btn.textContent = "Updating Securely...";

    try {
        const res = await fetch(`${API_BASE_URL}/reset-password`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp, new_password })
        });
        if (!res.ok) throw new Error((await res.json()).detail || "Error resetting password.");

        alert("Password reset successfully! You can now log in.");
        closeForgotPassword();

    } catch (err) {
        showMsg('error', err.message);
    } finally {
        btn.disabled = false; btn.textContent = "Confirm New Password";
    }
}