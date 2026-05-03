// resources/JS/global_auth.js

// 1. ROUTING SETUP
// Pages ONLY for logged-out users (The login page)
const publicPages = [
    '/', 
    '/index',
];

// Pages ONLY for logged-in users (Protected pages)
const authPages = [
    '/dashboard',
    '/account_settings',
    '/messages'
];

// NOTE: Any page not listed in the two arrays above (like /resources/html/listing_details) 
// will be treated as a "Shared Page" that anyone can view!

// 2. INITIALIZE SUPABASE
// Read runtime config injected by /supabase_config.js.
const supabaseUrl = window.LOCAL_ENV?.SUPABASE_URL || window.RUNTIME_ENV?.SUPABASE_URL;
const supabaseKey = window.LOCAL_ENV?.SUPABASE_ANON_KEY || window.RUNTIME_ENV?.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase runtime config. Set SUPABASE_URL and SUPABASE_ANON_KEY and ensure /supabase_config.js is generated.');
}

window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
const MAX_FAILED_LOGIN_ATTEMPTS = 3;

function isPasswordRecoveryFlow() {
    return window.location.hash.includes('type=recovery');
}

// 3. SECURITY BOUNCER
async function enforceAuth() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    const currentPath = window.location.pathname;
    
    // Check which category the current page falls into
    const isPublicPage = publicPages.includes(currentPath);
    const isAuthPage = authPages.some(path => currentPath.includes(path));

    // RULE A: Not logged in + trying to view a Protected page = Kick to Login
    if (!session && isAuthPage) {
        window.location.href = '/'; 
        return; 
    }

    // RULE B: Already logged in + trying to view a Public page (Login page) = Send to Dashboard
    if (session && isPublicPage && !isPasswordRecoveryFlow()) {
        window.location.href = '/dashboard';
        return;
    }

   // 4. KEEP LISTENING FOR CHANGES
    window.supabaseClient.auth.onAuthStateChange((event, session) => {
        const path = window.location.pathname;
        const currentlyOnPublic = publicPages.includes(path);
        const currentlyOnAuth = authPages.some(p => path.includes(p));

        if (event === 'SIGNED_OUT' || !session) {
            // If they log out while on a protected page, kick them to home
            if (currentlyOnAuth) {
                window.location.href = '/';
            }
        } 
        else if (event === 'SIGNED_IN') {
            // If they sign in while on the login page, send to dashboard
            if (currentlyOnPublic && !isPasswordRecoveryFlow()) {
                window.location.href = '/dashboard';
            }
        } else if (event === 'PASSWORD_RECOVERY') {
            if (typeof window.showAuthModal === 'function') {
                window.showAuthModal('newPassword');
            }
        }
    });
}

// Run the bouncer!
enforceAuth();

// 1. Create a global variable that defaults to false
window.isUserLoggedIn = false;
window.isUserVerified = false;
window.currentUserType = null;
window.__bookingAccessCache = null;

function normalizeUserType(userType) {
    return String(userType || '').trim().toLowerCase();
}

function isVerifiedUserType(userType) {
    const normalizedUserType = normalizeUserType(userType);
    return normalizedUserType === 'verified' || normalizedUserType === 'host_verified' || normalizedUserType === 'true' || normalizedUserType === '1';
}

window.getBookingAccessState = async function(options = {}) {
    const forceRefresh = Boolean(options.forceRefresh);
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        window.isUserVerified = false;
        window.currentUserType = null;
        window.__bookingAccessCache = null;
        return { isLoggedIn: false, isVerified: false, userType: null, userId: null };
    }

    if (!forceRefresh && window.__bookingAccessCache?.userId === user.id) {
        return {
            isLoggedIn: true,
            isVerified: window.__bookingAccessCache.isVerified,
            userType: window.__bookingAccessCache.userType,
            userId: user.id,
        };
    }

    const { data, error } = await supabaseClient
        .from('profiles')
        .select('user_type')
        .eq('profile_id', user.id)
        .single();

    if (error) {
        console.error('Failed to fetch booking access profile:', error.message);
        window.isUserVerified = false;
        window.currentUserType = null;
        return { isLoggedIn: true, isVerified: false, userType: null, userId: user.id };
    }

    const userType = data?.user_type || null;
    const isVerified = isVerifiedUserType(userType);

    window.currentUserType = userType;
    window.isUserVerified = isVerified;
    window.__bookingAccessCache = {
        userId: user.id,
        userType,
        isVerified,
    };

    return { isLoggedIn: true, isVerified, userType, userId: user.id };
};

// 2. Supabase will automatically update this on EVERY page load
// It also updates instantly the moment a user logs in or logs out!
supabaseClient.auth.onAuthStateChange((event, session) => {
    window.isUserLoggedIn = !!session; // Sets to true if a session exists, false if null
    if (!session) {
        window.isUserVerified = false;
        window.currentUserType = null;
        window.__bookingAccessCache = null;
    }
});

async function loadUserData() {
    const defaultAvatar = '/resources/images/default_pic.jpg';
    const verifiedIcon = '/resources/images/verified.png';
    const unverifiedIcon = '/resources/images/unverified.png';

    // 1. Ask Supabase who is currently logged in
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
        console.error("No user is logged in!");
        return; // Redirect them to login here if you want!
    }

    // 2. Fetch their specific details from your 'profiles' table
    const { data, error: dbError } = await supabaseClient
        .from('profiles')
        .select('username, first_name, last_name, avatar_url, user_type')
        .eq('profile_id', user.id)
        .single();

    if (data) {
        const usernameElement = document.getElementById("userGreeting");
        if (usernameElement) {
            usernameElement.innerHTML = `Welcome, <span>${data.username}</span>`;
        }
        const mobileUserGreetingElement = document.getElementById("mobileUserGreeting");
        if (mobileUserGreetingElement) {
            mobileUserGreetingElement.textContent = data.username;
        }

        const mobileUserFullNameElement = document.getElementById('mobileUserFullName');
        if (mobileUserFullNameElement) {
            const firstName = (data.first_name || '').trim();
            const lastName = (data.last_name || '').trim();
            const fullName = `${firstName} ${lastName}`.trim();

            if (fullName) {
                mobileUserFullNameElement.textContent = fullName;
                mobileUserFullNameElement.style.display = 'block';
            } else {
                mobileUserFullNameElement.textContent = '';
                mobileUserFullNameElement.style.display = 'none';
            }
        }

        const avatarUrl = data.avatar_url || defaultAvatar;
        const desktopAvatarElement = document.getElementById('user_pic');
        const mobileAvatarElement = document.getElementById('user_pic_mobile');
        const verificationLink = document.getElementById('mobileUserVerificationLink');
        const verificationIcon = document.getElementById('mobileUserVerificationIcon');

        const isVerified = isVerifiedUserType(data.user_type);
        const verificationIconSrc = isVerified ? verifiedIcon : unverifiedIcon;

        window.currentUserType = data.user_type || null;
        window.isUserVerified = isVerified;
        window.__bookingAccessCache = {
            userId: user.id,
            userType: window.currentUserType,
            isVerified,
        };

        if (desktopAvatarElement) {
            desktopAvatarElement.src = avatarUrl;
            desktopAvatarElement.onerror = () => {
                desktopAvatarElement.onerror = null;
                desktopAvatarElement.src = defaultAvatar;
            };
        }

        if (mobileAvatarElement) {
            mobileAvatarElement.src = avatarUrl;
            mobileAvatarElement.onerror = () => {
                mobileAvatarElement.onerror = null;
                mobileAvatarElement.src = defaultAvatar;
            };
        }

        if (verificationIcon) {
            verificationIcon.src = verificationIconSrc;
            verificationIcon.alt = isVerified ? 'Verified user' : 'Unverified user';
            verificationIcon.title = isVerified ? 'Verified Account' : 'Unverified Account';
            verificationIcon.onerror = () => {
                verificationIcon.onerror = null;
                verificationIcon.src = unverifiedIcon;
            };
        }

        if (verificationLink) {
            verificationLink.href = '/account_settings#privacy';
        }
    } else {
        console.error(dbError);
    }
}

// --- DATABASE AUTH LOGIC ---

async function createAccount(username, email, password) {
    try {
        const normalizedUsername = (username || '').trim();
        const normalizedEmail = (email || '').trim().toLowerCase();

        const feedback = document.getElementById('signupFeedback');
        const setSignupFeedback = (message) => {
            if (feedback) {
                feedback.style.display = 'block';
                feedback.textContent = message;
            }
        };

        if (!normalizedUsername || !normalizedEmail || !password) {
            setSignupFeedback('Please complete all required fields.');
            return;
        }

        // Check if T&C checkbox is checked
        const termsCheckbox = document.getElementById('agreeTerms');
        if (!termsCheckbox || !termsCheckbox.checked) {
            setSignupFeedback('You must accept the Terms and Conditions to create an account.');
            return;
        }

        // Username must be unique in public.profiles.
        const { data: existingUsername, error: usernameLookupError } = await window.supabaseClient
            .from('profiles')
            .select('profile_id')
            .ilike('username', normalizedUsername)
            .maybeSingle();

        if (usernameLookupError) {
            throw usernameLookupError;
        }

        if (existingUsername) {
            setSignupFeedback('Username is already taken.');
            return;
        }
        
        const { data, error } = await window.supabaseClient.auth.signUp({
            email: normalizedEmail,
            password: password,
            options: { 
                data: { 
                    username: normalizedUsername,
                    email: normalizedEmail  // Store email in profile for easy lookup during login
                } 
            }
        });

        const duplicateEmailFromResponse =
            Array.isArray(data?.user?.identities) && data.user.identities.length === 0;

        if (error) {
            const errorMessage = (error.message || '').toLowerCase();

            if (
                errorMessage.includes('already registered') ||
                errorMessage.includes('user already registered') ||
                errorMessage.includes('email exists') ||
                errorMessage.includes('already been registered')
            ) {
                setSignupFeedback('Email is already taken.');
                return;
            }

            if (errorMessage.includes('profiles_username_key') || errorMessage.includes('duplicate key value')) {
                setSignupFeedback('Username is already taken.');
                return;
            }

            throw error;
        }

        if (duplicateEmailFromResponse) {
            setSignupFeedback('Email is already taken.');
            return;
        }

        console.log('Account created securely:', data);
        if (typeof window.hideAuthModal === 'function') {
            window.hideAuthModal();
            setTimeout(() => {
                if (typeof window.showSignupSuccessModal === 'function') {
                    window.showSignupSuccessModal();
                }
            }, 240);
        } else if (typeof window.showSignupSuccessModal === 'function') {
            window.showSignupSuccessModal();
        }
    } catch (error) {
        const feedback = document.getElementById('signupFeedback');
        if (feedback) {
            feedback.style.display = 'block';
            feedback.textContent = error.message;
        }
    }
}

// Helper function to check if input is an email or username
function isEmail(input) {
    return input.includes('@');
}

async function getProfileByemailorusername(emailOrUsername) {
    const emailorusername = (emailOrUsername || '').trim();
    if (!emailorusername) {
        return null;
    }

    const column = isEmail(emailorusername) ? 'email' : 'username';

    const { data, error } = await window.supabaseClient
        .from('profiles')
        .select('profile_id, email, failed_login_attempts, is_locked')
        .eq(column, emailorusername)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

function isInvalidCredentialsError(error) {
    const message = (error?.message || '').toLowerCase();
    return message.includes('invalid login credentials') || message.includes('invalid credentials');
}

async function incrementFailedLoginAttemptByEmail(email) {
    const { data, error } = await window.supabaseClient.rpc('record_failed_login', {
        target_email: email
    });

    if (error) {
        throw error;
    }

    const nextAttempts = Number(data || 0);
    return {
        nextAttempts,
        shouldLock: nextAttempts >= MAX_FAILED_LOGIN_ATTEMPTS
    };
}

async function resetLoginAttemptsByEmail(email) {
    const { error } = await window.supabaseClient.rpc('reset_login_attempts', {
        target_email: email
    });

    if (error) {
        throw error;
    }
}

async function sendResetPasswordEmail(email) {
    const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
    });

    if (error) {
        throw error;
    }
}

async function updatePasswordAndUnlock(newPassword) {
    const { error: updateError } = await window.supabaseClient.auth.updateUser({
        password: newPassword
    });

    if (updateError) {
        throw updateError;
    }

    const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
    if (userError || !user) {
        throw userError || new Error('Unable to identify user after password update.');
    }

    if (user.email) {
        await resetLoginAttemptsByEmail(user.email);
    }
    await window.supabaseClient.auth.signOut();
}

function setLoginFeedbackMessage(message) {
    const feedback = document.getElementById('loginFeedback');
    if (feedback) {
        feedback.style.display = 'block';
        feedback.textContent = message;
    }
}

async function loginUser(emailOrUsername, password) {
    const feedbackEl = document.getElementById('loginFeedback');
    if (feedbackEl) feedbackEl.style.display = 'none';

    try {
        // 1. Ask the server for the real email and lock status
        const { data: userInfo, error: lookupError } = await window.supabaseClient
            .rpc('get_login_info', { user_input: emailOrUsername });

        if (lookupError || !userInfo) {
            throw new Error("Invalid username/email or password.");
        }

        if (userInfo.is_locked) {
            throw new Error("Account locked. Please reset your password to unlock.");
        }

        // 2. Log in using the REAL email we got from the database
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: userInfo.email, 
            password: password,
        });

        if (error) {
            const authErrorMessage = (error.message || '').toLowerCase();

            if (
                authErrorMessage.includes('email not confirmed') ||
                authErrorMessage.includes('email not verified')
            ) {
                throw new Error('Email not yet verified');
            }

            // 3. Increment failures on the server
            const { data: currentFailures } = await window.supabaseClient.rpc('record_failed_login', { 
                target_email: userInfo.email 
            });

            const remaining = 3 - (currentFailures || 0);
            
            if (remaining <= 0) {
                throw new Error("Too many failed attempts. Account is now locked.");
            } else {
                throw new Error(`Invalid credentials. ${remaining} attempt(s) remaining.`);
            }
        }

        // 4. Reset failures on success
        await window.supabaseClient.rpc('reset_login_attempts', { target_email: userInfo.email });
        
        console.log("Logged in successfully!");
        window.location.href = '/dashboard'; // Or wherever you route users

    } catch (err) {
        if (feedbackEl) {
            feedbackEl.innerText = err.message;
            feedbackEl.style.display = 'block';
            feedbackEl.style.color = '#d9534f';
        }
    }
}

async function logoutUser() {
    try {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) throw error;
        console.log('Logged out securely');
        if (typeof window.hideLogoutModal === 'function') window.hideLogoutModal();
        // The security bouncer will automatically redirect to the home page!
    } catch (error) {
        console.error('Error logging out:', error.message);
    }
}

// --- FORM EVENT BINDINGS (Runs after the modal HTML loads!) ---
window.bindSupabaseForms = function() {
    console.log("Binding database logic to forms...");
    const loginForm = document.getElementById('loginFormElement');
    
    if (loginForm) {
        // Remove any old listeners to prevent duplicates
        loginForm.onsubmit = async function(e) {
            e.preventDefault(); // STOP THE URL REFRESH
            e.stopPropagation(); // STOP THE EVENT FROM BUBBLING
            
            const emailOrUsername = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            console.log("Attempting login with:", emailOrUsername);
            
            // Call your existing login function
            if (typeof loginUser === 'function') {
                await loginUser(emailOrUsername, password);
            } else {
                console.error("loginUser function not found in global_auth.js");
            }
            return false; // Triple-check the form doesn't submit
        };
    }

    const signupFormElement = document.getElementById('signupFormElement');
    if (signupFormElement) {
        signupFormElement.onsubmit = async function(e) {
            e.preventDefault();
            const username = document.getElementById('signupUsername').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('signupConfirmPassword').value;
            
            // Validate passwords match
            if (password !== confirmPassword) {
                const feedback = document.getElementById('signupFeedback');
                if (feedback) {
                    feedback.style.display = 'block';
                    feedback.textContent = 'Passwords do not match.';
                }
                return false;
            }
            
            if (typeof createAccount === 'function') {
                await createAccount(username, email, password);
            } else {
                console.error("createAccount function not found in global_auth.js");
            }
            return false;
        };
    }

    const resetRequestFormElement = document.getElementById('resetRequestFormElement');
    if (resetRequestFormElement) {
        resetRequestFormElement.onsubmit = async function(e) {
            e.preventDefault();
            const resetEmail = document.getElementById('resetEmail')?.value?.trim();
            const resetFeedback = document.getElementById('resetFeedback');

            try {
                await sendResetPasswordEmail(resetEmail);
                if (resetFeedback) {
                    resetFeedback.style.display = 'block';
                    resetFeedback.style.color = '#2d6a4f';
                    resetFeedback.textContent = 'Password reset link sent. Check your email to continue.';
                }
            } catch (error) {
                if (resetFeedback) {
                    resetFeedback.style.display = 'block';
                    resetFeedback.style.color = '#d9534f';
                    resetFeedback.textContent = error.message || 'Failed to send reset email.';
                }
            }

            return false;
        };
    }

    const newPasswordFormElement = document.getElementById('newPasswordFormElement');
    if (newPasswordFormElement) {
        newPasswordFormElement.onsubmit = async function(e) {
            e.preventDefault();
            const newPassword = document.getElementById('newPassword')?.value;
            const newPasswordFeedback = document.getElementById('newPasswordFeedback');

            try {
                await updatePasswordAndUnlock(newPassword);
                if (newPasswordFeedback) {
                    newPasswordFeedback.style.display = 'block';
                    newPasswordFeedback.style.color = '#2d6a4f';
                    newPasswordFeedback.textContent = 'Password updated and account unlocked. Please sign in again.';
                }
                if (typeof window.switchAuthForms === 'function') {
                    window.switchAuthForms('newPasswordForm', 'loginForm');
                }
            } catch (error) {
                if (newPasswordFeedback) {
                    newPasswordFeedback.style.display = 'block';
                    newPasswordFeedback.style.color = '#d9534f';
                    newPasswordFeedback.textContent = error.message || 'Unable to update password.';
                }
            }

            return false;
        };
    }

    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', logoutUser);
    }

    if (isPasswordRecoveryFlow() && typeof window.showAuthModal === 'function') {
        window.showAuthModal('newPassword');
    }
};