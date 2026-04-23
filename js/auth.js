import {
  auth, db,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  collection, doc, getDoc, getDocs, setDoc, serverTimestamp
} from './firebase-config.js';
import { showToast, isValidEmail } from './utils.js';

// ─── Auth State Guard ─────────────────────────────────────────────────────────

const page = window.location.pathname.split('/').pop() || 'index.html';
const AUTH_PAGES = new Set(['index.html', 'register.html', '']);
const DASH_PAGES = new Set(['school-dashboard.html', 'gov-dashboard.html']);

// Prevents onAuthStateChanged from racing with an in-progress form submission.
// Set to true while login/register is being processed; cleared after redirect or error.
let _formHandling = false;

onAuthStateChanged(auth, async (user) => {
  if (_formHandling) return;

  if (user) {
    // Auto-redirect already-logged-in users away from auth pages
    if (AUTH_PAGES.has(page)) {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const role = snap.data().role;
          if (role === 'school' || role === 'government') {
            window.location.href = role === 'government'
              ? 'gov-dashboard.html'
              : 'school-dashboard.html';
          }
          // If role is invalid, stay on auth page so the user can re-register
        }
      } catch (e) {
        console.error('Auth state guard failed:', e);
      }
    }
  } else {
    // Protect dashboard pages from unauthenticated access
    if (DASH_PAGES.has(page)) {
      window.location.href = 'index.html';
    }
  }
});

// ─── Login Page ───────────────────────────────────────────────────────────────

const loginForm = document.getElementById('login-form');
if (loginForm) initLoginPage();

function initLoginPage() {
  const emailInput    = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const emailError    = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');
  const spinner       = document.getElementById('spinner');
  const loginBtn      = document.getElementById('login-btn');
  const togglePwd     = document.getElementById('toggle-pwd');
  const toggleIcon    = document.getElementById('toggle-pwd-icon');
  const forgotLink    = document.getElementById('forgot-link');

  // Password visibility toggle
  togglePwd?.addEventListener('click', () => {
    const isText = passwordInput.type === 'text';
    passwordInput.type = isText ? 'password' : 'text';
    toggleIcon.className = isText ? 'ph-bold ph-eye' : 'ph-bold ph-eye-slash';
  });

  // Forgot password
  forgotLink?.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email || !isValidEmail(email)) {
      showToast('Please enter a valid email address first.', 'warning');
      emailInput.focus();
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showToast('Password reset email sent. Check your inbox.', 'success');
    } catch (err) {
      showToast(friendlyAuthError(err.code), 'error');
    }
  });

  // Form submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors([emailError, passwordError]);

    const email    = emailInput.value.trim();
    const password = passwordInput.value;
    let valid = true;

    if (!email || !isValidEmail(email)) {
      showFieldError(emailError, 'Please enter a valid email address.');
      valid = false;
    }
    if (!password) {
      showFieldError(passwordError, 'Password is required.');
      valid = false;
    }
    if (!valid) return;

    spinner.classList.add('show');
    loginBtn.disabled = true;
    _formHandling = true;

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // ── CRITICAL: Read the Firestore profile BEFORE making any writes.
      // Doing setDoc first was the cause of the login-redirect loop: it created
      // a partial doc {lastLogin} with no role, which then caused the dashboard
      // auth guard to reject the user and redirect back to login. ──
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (!snap.exists()) {
        // Firebase Auth user exists but has no app profile — abort cleanly
        await signOut(auth).catch(() => {});
        throw { code: 'app/no-profile' };
      }

      const role = snap.data().role;
      if (role !== 'school' && role !== 'government') {
        await signOut(auth).catch(() => {});
        throw { code: 'app/invalid-role' };
      }

      // Update lastLogin — non-critical; failure must never block login
      setDoc(doc(db, 'users', cred.user.uid), { lastLogin: serverTimestamp() }, { merge: true })
        .catch(err => console.warn('lastLogin update failed:', err));

      showToast('Login successful! Redirecting…', 'success');
      setTimeout(() => {
        _formHandling = false;
        window.location.href = role === 'government' ? 'gov-dashboard.html' : 'school-dashboard.html';
      }, 600);
    } catch (err) {
      _formHandling = false;
      spinner.classList.remove('show');
      loginBtn.disabled = false;
      showToast(friendlyAuthError(err.code || err.message), 'error');
    }
  });
}

// ─── Register Page ────────────────────────────────────────────────────────────

const registerForm = document.getElementById('register-form');
if (registerForm) initRegisterPage();

function initRegisterPage() {
  const spinner       = document.getElementById('spinner');
  const togglePwd     = document.getElementById('toggle-pwd');
  const toggleIcon    = document.getElementById('toggle-pwd-icon');
  const roleSchoolLbl = document.getElementById('role-school-label');
  const roleGovLbl    = document.getElementById('role-gov-label');
  const schoolField   = document.getElementById('school-field');
  const districtField = document.getElementById('district-field');
  const schoolSelect  = document.getElementById('school-select');
  const registerBtn   = document.getElementById('register-btn');

  loadSchools(schoolSelect);

  togglePwd?.addEventListener('click', () => {
    const pwdInput = document.getElementById('password');
    const isText   = pwdInput.type === 'text';
    pwdInput.type  = isText ? 'password' : 'text';
    toggleIcon.className = isText ? 'ph-bold ph-eye' : 'ph-bold ph-eye-slash';
  });

  [roleSchoolLbl, roleGovLbl].forEach(lbl => {
    lbl?.addEventListener('click', () => {
      roleSchoolLbl?.classList.remove('selected');
      roleGovLbl?.classList.remove('selected');
      lbl.classList.add('selected');
      const radio = lbl.querySelector('input');
      if (radio) radio.checked = true;
      const role = radio?.value;
      schoolField?.classList.toggle('show', role === 'school');
      districtField?.classList.toggle('show', role === 'government');
    });
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name            = document.getElementById('name')?.value.trim()            || '';
    const email           = document.getElementById('email')?.value.trim()           || '';
    const password        = document.getElementById('password')?.value               || '';
    const confirmPassword = document.getElementById('confirm-password')?.value       || '';
    const roleEl          = document.querySelector('input[name="role"]:checked');
    const schoolId        = schoolSelect?.value                                       || '';
    const district        = document.getElementById('district')?.value.trim()        || '';

    const errs = {
      name:     document.getElementById('name-error'),
      email:    document.getElementById('email-error'),
      password: document.getElementById('password-error'),
      confirm:  document.getElementById('confirm-error'),
      role:     document.getElementById('role-error'),
      school:   document.getElementById('school-error'),
      district: document.getElementById('district-error'),
    };
    clearErrors(Object.values(errs));

    let valid = true;
    if (!name)                          { showFieldError(errs.name,     'Full name is required.');                  valid = false; }
    if (!email || !isValidEmail(email)) { showFieldError(errs.email,    'Enter a valid email address.');            valid = false; }
    if (password.length < 6)            { showFieldError(errs.password, 'Password must be at least 6 characters.'); valid = false; }
    if (password !== confirmPassword)   { showFieldError(errs.confirm,  'Passwords do not match.');                 valid = false; }
    if (!roleEl)                        { showFieldError(errs.role,     'Please select a role.');                   valid = false; }
    if (roleEl?.value === 'school' && !schoolId) {
      showFieldError(errs.school, 'Please select a school.'); valid = false;
    }
    if (roleEl?.value === 'government' && !district) {
      showFieldError(errs.district, 'Please enter your district / state.'); valid = false;
    }
    if (!valid) return;

    spinner.classList.add('show');
    registerBtn.disabled = true;
    _formHandling = true;

    try {
      const role = roleEl.value;
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid  = cred.user.uid;

      const userData = {
        email, name, role,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };
      if (role === 'school')     userData.schoolId = schoolId;
      if (role === 'government') userData.district = district;

      await setDoc(doc(db, 'users', uid), userData);

      showToast('Account created! Redirecting…', 'success');
      setTimeout(() => {
        _formHandling = false;
        window.location.href = role === 'government' ? 'gov-dashboard.html' : 'school-dashboard.html';
      }, 700);
    } catch (err) {
      _formHandling = false;
      spinner.classList.remove('show');
      registerBtn.disabled = false;
      showToast(friendlyAuthError(err.code || err.message), 'error');
    }
  });
}

async function loadSchools(selectEl) {
  if (!selectEl) return;
  try {
    const snap = await getDocs(collection(db, 'schools'));
    if (snap.empty) {
      const opt = document.createElement('option');
      opt.value    = '';
      opt.disabled = true;
      opt.textContent = '— No schools available (run seed first) —';
      selectEl.appendChild(opt);
      return;
    }
    snap.forEach(d => {
      const opt = document.createElement('option');
      opt.value       = d.id;
      opt.textContent = d.data().name;
      selectEl.appendChild(opt);
    });
  } catch (e) {
    console.error('Failed to load schools:', e);
    showToast('Failed to load schools list. Please refresh.', 'warning');
  }
}

// ─── Logout (exported for potential external use) ─────────────────────────────

export async function logout() {
  try {
    await signOut(auth);
    window.location.href = 'index.html';
  } catch {
    showToast('Logout failed. Please try again.', 'error');
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function showFieldError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}

function clearErrors(els) {
  els.forEach(el => {
    if (!el) return;
    el.textContent = '';
    el.classList.remove('show');
  });
}

function friendlyAuthError(code) {
  const map = {
    'auth/invalid-email':          'Invalid email address.',
    'auth/user-not-found':         'No account found with this email.',
    'auth/wrong-password':         'Incorrect password. Please try again.',
    'auth/invalid-credential':     'Invalid email or password.',
    'auth/email-already-in-use':   'This email is already registered.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'auth/too-many-requests':      'Too many attempts. Please wait and try again.',
    'auth/user-disabled':          'This account has been disabled.',
    'app/no-profile':              'Account setup is incomplete. Please register first.',
    'app/invalid-role':            'Your account role is invalid. Please contact support.',
  };
  return map[code] || 'An unexpected error occurred. Please try again.';
}
