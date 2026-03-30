const supabaseUrl = 'https://xhrdruicvegglvzjnzva.supabase.co'; 
const supabaseKey = 'sb_publishable_LZErDqo-5ZrfN9LY_G5aJQ_PYb31hcA';

function showAuthModal(mode = 'login') {  
  const modal = document.getElementById('authModal');
  const loginForm = document.getElementById ('loginForm');
  const signupForm = document.getElementById('signupForm');

  modal.style.display = 'block';
  if (mode === 'signup') {
    loginForm.classList.remove('active');
    signupForm.classList.add('active');
  } else {
    signupForm.classList.remove('active');
    loginForm.classList.add('active');
  }
}

async function checkAccount(email, password) {
  try {
    // First, check if email exists
    const emailQuery = `${supabaseUrl}/rest/v1/Account?select=email,password&email=eq.${encodeURIComponent(email)}`;
    const response = await fetch(emailQuery, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Supabase request failed with ' + response.status);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      alert('Email not found.');
      return;
    }

    const account = data[0];
    if (account.password === password) {
      alert('Login successful! Welcome.');
    } else {
      alert('Invalid password.');
    }
  } catch (err) {
    console.error(err);
    alert('Error verifying account. Please try again later.');
  }
}

async function createAccount(username, email, password) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/Account`, {
      method: 'POST',
      headers: {
        apikey: supabaseSecretKey,
        Authorization: `Bearer ${supabaseSecretKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        username: username,
        email: email,
        password: password,
        user_type: null
      })
    });

    if (!response.ok) {
      if (response.status === 409) {
        alert('An account with this email already exists.');
      } else {
        throw new Error('Supabase request failed with ' + response.status);
      }
      return;
    }

    alert('Account created successfully! You can now log in.');
  } catch (err) {
    console.error(err);
    alert('Error creating account. Please try again later.');
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const modal = document.getElementById('authModal');
  const signupBtn = document.getElementById('signupBtn');
  const closeBtn = document.getElementsByClassName('close')[0];
  const showSignup = document.getElementById('showSignup');
  const showLogin = document.getElementById('showLogin');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  const openerButtons = ['bookNowBtn', 'viewAllListingsBtn', 'startHostingBtn', 'signupBtn'];

  openerButtons.forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        showAuthModal('login');
      });
    }
  });

  if (closeBtn) {
    closeBtn.onclick = function () {
      modal.style.display = 'none';
    };
  }

  window.onclick = function (event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };

  if (showSignup) {
    showSignup.onclick = function (e) {
      e.preventDefault();
      loginForm.classList.remove('active');
      signupForm.classList.add('active');
    };
  }

  if (showLogin) {
    showLogin.onclick = function (e) {
      e.preventDefault();
      signupForm.classList.remove('active');
      loginForm.classList.add('active');
    };
  }

  const loginFormElement = document.getElementById('loginFormElement');
  if (loginFormElement) {
    loginFormElement.onsubmit = async function (e) {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      if (!email || !password) {
        alert('Please enter both email and password.');
        return;
      }
      await checkAccount(email, password);
      modal.style.display = 'none';
    };
  }

  const signupFormElement = document.getElementById('signupFormElement');
  if (signupFormElement) {
    signupFormElement.onsubmit = async function (e) {
      e.preventDefault();
      const username = document.getElementById('signupUsername').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;
      const confirmPassword = document.getElementById('signupConfirmPassword').value;

      if (!username || !email || !password || !confirmPassword) {
        alert('All fields are required.');
        return;
      }
      if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
      }

      await createAccount(username, email, password);
      modal.style.display = 'none';
    };
  }
});

const modalStyles = `
/* Modal Styles */
.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
    background-color: #fefefe;
    margin: 5% auto;
    padding: 0;
    border: 1px solid #888;
    width: 90%;
    max-width: 400px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
    from { opacity: 0; transform: translateY(-50px); }
    to { opacity: 1; transform: translateY(0); }
}

.close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
    margin: 10px;
    cursor: pointer;
}

.close:hover {
    color: #000;
}

.auth-form {
    display: none;
    padding: 20px 30px 30px;
    text-align: center;
}

.auth-form.active {
    display: block;
}

.auth-form h2 {
    margin-bottom: 10px;
    color: #333;
    font-family: 'Cormorant Garamond', serif;
}

.auth-form p {
    margin-bottom: 20px;
    color: #666;
    font-size: 14px;
}

.form-group {
    margin-bottom: 15px;
    text-align: left;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #333;
}

.form-group input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    box-sizing: border-box;
}

.form-group input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.auth-btn {
    width: 100%;
    padding: 12px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s;
}

.auth-btn:hover {
    background-color: #0056b3;
}

.auth-switch {
    margin-top: 20px;
    font-size: 14px;
    color: #666;
}

.auth-switch a {
    color: #007bff;
    text-decoration: none;
}

.auth-switch a:hover {
    text-decoration: underline;
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = modalStyles;
document.head.appendChild(styleSheet);
