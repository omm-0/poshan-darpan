/* ============================================================
   POSHAN DARPAN — AUTHENTICATION
   Pure-frontend auth using localStorage. No Firebase.
   Used by: index.html (login), register.html (register).
   Also exposes guardRoute() / handleLogout() for dashboard pages.
   ============================================================ */

(function () {
  'use strict';

  const D = window.PD_Data;
  const U = window.PD_Utils;

  // ============================================================
  // SESSION GUARD (used by dashboards)
  // ============================================================
  function guardRoute(requiredRole) {
    const user = D.getCurrentUser();
    if (!user) {
      window.location.href = 'index.html';
      return null;
    }
    if (requiredRole && user.role !== requiredRole) {
      // Wrong role → redirect to their dashboard
      if (user.role === 'school') window.location.href = 'school-dashboard.html';
      else if (user.role === 'government') window.location.href = 'gov-dashboard.html';
      else window.location.href = 'index.html';
      return null;
    }
    return user;
  }

  function handleLogout() {
    U.showConfirmDialog(
      'Sign out?',
      'You will be returned to the login screen.',
      function () {
        D.logoutUser();
        U.showToast('Signed out successfully', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 400);
      }
    );
  }

  function checkExistingSession() {
    const user = D.getCurrentUser();
    if (!user) return;
    if (user.role === 'school')      window.location.href = 'school-dashboard.html';
    else if (user.role === 'government') window.location.href = 'gov-dashboard.html';
  }

  // ============================================================
  // INPUT ERROR HELPERS
  // ============================================================
  function setError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('show', !!msg);
  }
  function clearErrors(ids) { ids.forEach(id => setError(id, '')); }

  function setLoading(btnId, spinnerId, isLoading) {
    const btn = document.getElementById(btnId);
    if (btn) btn.disabled = isLoading;
    const sp = document.getElementById(spinnerId);
    if (sp) sp.classList.toggle('show', isLoading);
  }

  // ============================================================
  // PASSWORD VISIBILITY TOGGLE
  // ============================================================
  function setupPasswordToggle() {
    const toggle = document.getElementById('toggle-pwd');
    const icon = document.getElementById('toggle-pwd-icon');
    const input = document.getElementById('password');
    if (!toggle || !input) return;
    toggle.addEventListener('click', function () {
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      if (icon) {
        icon.classList.toggle('ph-eye', showing);
        icon.classList.toggle('ph-eye-slash', !showing);
      }
    });
  }

  // ============================================================
  // LOGIN PAGE
  // ============================================================
  function initLoginPage() {
    checkExistingSession();
    setupPasswordToggle();

    const form = document.getElementById('login-form');
    if (!form) return;

    const forgot = document.getElementById('forgot-link');
    if (forgot) {
      forgot.addEventListener('click', function (e) {
        e.preventDefault();
        U.showToast('Demo mode: password reset is disabled. Use rajesh@school.com / school123 or sanjay@gov.com / gov123.', 'info');
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors(['email-error', 'password-error']);

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      let valid = true;
      if (!email)                  { setError('email-error', 'Email is required.'); valid = false; }
      else if (!U.isValidEmail(email)) { setError('email-error', 'Please enter a valid email.'); valid = false; }
      if (!password)               { setError('password-error', 'Password is required.'); valid = false; }
      if (!valid) return;

      setLoading('login-btn', 'spinner', true);

      // Simulate small delay for UX
      setTimeout(function () {
        const user = D.authenticateUser(email, password);
        if (!user) {
          setLoading('login-btn', 'spinner', false);
          U.showToast('Invalid email or password.', 'error');
          setError('password-error', 'Invalid credentials.');
          return;
        }
        D.setCurrentUser(user);
        U.showToast('Welcome back, ' + user.name + '!', 'success');
        setTimeout(function () {
          if (user.role === 'school')      window.location.href = 'school-dashboard.html';
          else if (user.role === 'government') window.location.href = 'gov-dashboard.html';
          else window.location.href = 'index.html';
        }, 600);
      }, 350);
    });
  }

  // ============================================================
  // REGISTER PAGE
  // ============================================================
  function populateSchoolDropdown() {
    const select = document.getElementById('school-select');
    if (!select) return;
    const schools = D.getAllSchools();
    schools.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.schoolId;
      opt.textContent = s.name;
      select.appendChild(opt);
    });
  }

  function initRegisterPage() {
    checkExistingSession();
    setupPasswordToggle();
    populateSchoolDropdown();

    const form = document.getElementById('register-form');
    if (!form) return;

    const schoolField = document.getElementById('school-field');
    const districtField = document.getElementById('district-field');
    const roleSchool = document.getElementById('role-school');
    const roleGov = document.getElementById('role-gov');

    function applyRole() {
      const role = (document.querySelector('input[name="role"]:checked') || {}).value;
      const schoolLabel = document.getElementById('role-school-label');
      const govLabel = document.getElementById('role-gov-label');
      if (schoolLabel) schoolLabel.classList.toggle('selected', role === 'school');
      if (govLabel) govLabel.classList.toggle('selected', role === 'government');
      if (role === 'school') {
        schoolField.classList.add('show');
        districtField.classList.remove('show');
      } else if (role === 'government') {
        districtField.classList.add('show');
        schoolField.classList.remove('show');
      } else {
        schoolField.classList.remove('show');
        districtField.classList.remove('show');
      }
    }
    if (roleSchool) roleSchool.addEventListener('change', applyRole);
    if (roleGov)    roleGov.addEventListener('change', applyRole);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors(['name-error', 'email-error', 'password-error', 'confirm-error', 'role-error', 'school-error', 'district-error']);

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirm = document.getElementById('confirm-password').value;
      const role = (document.querySelector('input[name="role"]:checked') || {}).value;
      const schoolId = (document.getElementById('school-select') || {}).value;
      const district = (document.getElementById('district') || {}).value;

      let valid = true;
      if (!name)                          { setError('name-error', 'Full name is required.'); valid = false; }
      if (!email)                         { setError('email-error', 'Email is required.'); valid = false; }
      else if (!U.isValidEmail(email))    { setError('email-error', 'Please enter a valid email.'); valid = false; }
      if (!password)                      { setError('password-error', 'Password is required.'); valid = false; }
      else if (!U.isPasswordStrong(password)) { setError('password-error', 'Password must be at least 6 characters.'); valid = false; }
      if (!confirm)                       { setError('confirm-error', 'Please confirm your password.'); valid = false; }
      else if (password !== confirm)      { setError('confirm-error', 'Passwords do not match.'); valid = false; }
      if (!role)                          { setError('role-error', 'Please select a role.'); valid = false; }
      if (role === 'school' && !schoolId)         { setError('school-error', 'Please select your school.'); valid = false; }
      if (role === 'government' && !(district && district.trim())) { setError('district-error', 'Please enter your district / state.'); valid = false; }
      if (!valid) return;

      setLoading('register-btn', 'spinner', true);

      setTimeout(function () {
        const result = D.registerUser(name, email, password, role,
          role === 'school' ? schoolId : null,
          role === 'government' ? district.trim() : null
        );
        if (!result.success) {
          setLoading('register-btn', 'spinner', false);
          U.showToast(result.error, 'error');
          setError('email-error', result.error);
          return;
        }
        D.setCurrentUser(result.data);
        U.showToast('Account created! Welcome, ' + result.data.name, 'success');
        setTimeout(function () {
          if (result.data.role === 'school') window.location.href = 'school-dashboard.html';
          else window.location.href = 'gov-dashboard.html';
        }, 600);
      }, 350);
    });
  }

  // ============================================================
  // EXPOSE + AUTO-INIT
  // ============================================================
  window.PD_Auth = {
    guardRoute: guardRoute,
    handleLogout: handleLogout,
    checkExistingSession: checkExistingSession,
    initLoginPage: initLoginPage,
    initRegisterPage: initRegisterPage
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('login-form'))    initLoginPage();
    if (document.getElementById('register-form')) initRegisterPage();
  });
})();
