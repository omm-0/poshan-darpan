/* ============================================================
   POSHAN DARPAN - AUTH LOGIC
============================================================ */

// ---------- LOGIN ----------

function handleLogin(event) {
  event.preventDefault();
  const form  = event.target;
  const email = form.email.value.trim();
  const pwd   = form.password.value;
  const btn   = form.querySelector('button[type="submit"]');
  const errEl = document.getElementById("loginError");

  if (errEl) errEl.textContent = "";

  if (!email || !pwd) {
    if (errEl) errEl.textContent = "Email and password are required.";
    return;
  }
  if (!isValidEmail(email)) {
    if (errEl) errEl.textContent = "Please enter a valid email.";
    return;
  }

  // Loading state
  const originalLabel = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="ph ph-spinner spin"></i> Logging in...';

  setTimeout(() => {
    const user = authenticateUser(email, pwd);
    if (!user) {
      btn.disabled = false;
      btn.innerHTML = originalLabel;
      if (errEl) errEl.textContent = "Invalid email or password.";
      showToast("Invalid email or password", "error");
      return;
    }
    saveSession(user);
    showToast("Welcome, " + user.name, "success");
    setTimeout(() => {
      if (user.role === "school") window.location.href = "school-dashboard.html";
      else window.location.href = "gov-dashboard.html";
    }, 800);
  }, 500);
}

// ---------- REGISTER ----------

function handleRegister(event) {
  event.preventDefault();
  const form = event.target;

  const name            = form.name.value.trim();
  const email           = form.email.value.trim();
  const password        = form.password.value;
  const confirmPassword = form.confirmPassword.value;
  const role            = form.role.value;
  const schoolId        = form.schoolId ? form.schoolId.value : "";
  const district        = form.district ? form.district.value.trim() : "";

  // Clear previous errors
  qsa(".field-error", form).forEach(e => e.textContent = "");

  let hasError = false;
  function err(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
    hasError = true;
  }

  if (!name || name.length < 2) err("err-name", "Name must be at least 2 characters.");
  if (!email)                   err("err-email", "Email is required.");
  else if (!isValidEmail(email)) err("err-email", "Please enter a valid email.");
  else {
    const users = JSON.parse(localStorage.getItem("poshanUsers") || "[]");
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      err("err-email", "This email is already registered.");
    }
  }
  if (!password)                       err("err-password", "Password is required.");
  else if (!isStrongPassword(password)) err("err-password", "Password must be at least 6 characters.");

  if (!confirmPassword)             err("err-confirm", "Please confirm your password.");
  else if (password !== confirmPassword) err("err-confirm", "Passwords do not match.");

  if (!role) err("err-role", "Please select a role.");

  if (role === "school" && !schoolId) err("err-school", "Please select your school.");
  if (role === "government" && !district) err("err-district", "Please enter your district.");

  if (hasError) return;

  const btn = form.querySelector('button[type="submit"]');
  const originalLabel = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="ph ph-spinner spin"></i> Creating account...';

  setTimeout(() => {
    const result = registerNewUser(name, email, password, role, schoolId, district);
    if (!result.success) {
      btn.disabled = false;
      btn.innerHTML = originalLabel;
      err("err-email", result.error || "Could not register.");
      showToast(result.error || "Could not register", "error");
      return;
    }
    saveSession(result.user);
    showToast("Account created. Welcome, " + result.user.name + "!", "success");
    setTimeout(() => {
      if (result.user.role === "school") window.location.href = "school-dashboard.html";
      else window.location.href = "gov-dashboard.html";
    }, 800);
  }, 500);
}

// ---------- LOGOUT ----------

function handleLogout() {
  showConfirmDialog(
    "Logout",
    "Are you sure you want to log out?",
    () => {
      clearSession();
      showToast("Logged out successfully", "info");
      setTimeout(() => { window.location.href = "index.html"; }, 500);
    }
  );
}

// ---------- ROUTE GUARD ----------

function guardRoute(requiredRole) {
  const session = getCurrentSession();
  if (!session) {
    window.location.href = "index.html";
    return null;
  }
  if (session.role !== requiredRole) {
    if (session.role === "school") window.location.href = "school-dashboard.html";
    else window.location.href = "gov-dashboard.html";
    return null;
  }
  return session;
}

// ---------- SESSION CHECK ----------

function checkExistingSession() {
  const session = getCurrentSession();
  if (!session) return;
  if (session.role === "school") window.location.href = "school-dashboard.html";
  else window.location.href = "gov-dashboard.html";
}

// ---------- ROLE FIELD TOGGLER (register page) ----------

function setupRoleFieldToggle() {
  const roleSel       = document.getElementById("role");
  const schoolWrap    = document.getElementById("schoolFieldWrap");
  const districtWrap  = document.getElementById("districtFieldWrap");
  if (!roleSel) return;

  function update() {
    const v = roleSel.value;
    if (v === "school") {
      if (schoolWrap)   schoolWrap.classList.add("show");
      if (districtWrap) districtWrap.classList.remove("show");
    } else if (v === "government") {
      if (schoolWrap)   schoolWrap.classList.remove("show");
      if (districtWrap) districtWrap.classList.add("show");
    } else {
      if (schoolWrap)   schoolWrap.classList.remove("show");
      if (districtWrap) districtWrap.classList.remove("show");
    }
  }
  roleSel.addEventListener("change", update);
  update();
}

function populateSchoolDropdown() {
  const sel = document.getElementById("schoolId");
  if (!sel) return;
  // Only active schools are eligible — registering against an inactive school
  // would let a user create an account that can never submit attendance.
  const schools = (typeof getActiveSchools === "function" ? getActiveSchools() : getAllSchools().filter(s => s.status === "active"));
  sel.innerHTML = '<option value="">Select your school...</option>' +
    schools.map(s => '<option value="' + s.schoolId + '">' + escapeHtml(s.name) + '</option>').join("");
}

// ---------- PASSWORD TOGGLE ----------

function setupPasswordToggle() {
  qsa(".pwd-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (!input) return;
      const icon = btn.querySelector("i");
      if (input.type === "password") {
        input.type = "text";
        icon.className = "ph ph-eye-slash";
      } else {
        input.type = "password";
        icon.className = "ph ph-eye";
      }
    });
  });
}

// ---------- INLINE ERROR CLEAR ON TYPING ----------

function setupInlineErrorClear() {
  qsa(".form-input, .form-select").forEach(inp => {
    inp.addEventListener("input", () => {
      const wrap = inp.closest(".form-group");
      if (!wrap) return;
      const errEl = wrap.querySelector(".field-error");
      if (errEl) errEl.textContent = "";
    });
    inp.addEventListener("change", () => {
      const wrap = inp.closest(".form-group");
      if (!wrap) return;
      const errEl = wrap.querySelector(".field-error");
      if (errEl) errEl.textContent = "";
    });
  });
}
