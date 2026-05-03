// --- /resources/common/modal_handler.js ---

// 1. GLOBAL FUNCTIONS TO SHOW/HIDE MODALS
window.showAuthModal = function(mode = 'login') {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    
    modal.style.display = 'block';
    
    // Hide all forms first
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active', 'fade-out-form');
    });

    // Show the specific requested form
    const targetForm = document.getElementById(mode + 'Form');
    if (targetForm) {
        targetForm.classList.add('active');
    }
};

window.hideAuthModal = function() {
    const modal = document.getElementById('authModal');
    const loginFormElement = document.getElementById('loginFormElement');
    const signupFormElement = document.getElementById('signupFormElement');
    
    if (!modal) return;

    // 1. Trigger the fade-out animations
    modal.classList.add('fade-out');

    // 2. Wait 200ms for the animation to finish
    setTimeout(() => {
        // Hide the modal completely
        modal.style.display = 'none';
        
        // Remove the fade-out class so it can animate correctly next time it opens
        modal.classList.remove('fade-out'); 

        // 3. Clear all existing text in the textboxes
        if (loginFormElement) loginFormElement.reset();
        if (signupFormElement) signupFormElement.reset();

        // 4. Reset the modal to show the Login view next time
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.classList.add('active');
        
    }, 200); // Matches the 0.2s in your CSS
};

window.showSignupSuccessModal = function() {
    const modal = document.getElementById('signupSuccessModal');
    if (!modal) return;

    modal.style.display = 'block';
};

window.hideSignupSuccessModal = function() {
    const modal = document.getElementById('signupSuccessModal');
    if (!modal) return;

    modal.style.display = 'none';
};

window.showLogoutModal = function() {
    const modal = document.getElementById('logoutModal');
    if (modal) modal.classList.add('active'); 
};

window.hideLogoutModal = function() {
    const modal = document.getElementById('logoutModal');
    if (modal) modal.classList.remove('active');
};

// Terms and Conditions Modal handlers
window.showTermsModal = function() {
    const modal = document.getElementById('termsModal');
    if (modal) modal.style.display = 'block';
};

window.hideTermsModal = function() {
    const modal = document.getElementById('termsModal');
    if (modal) modal.style.display = 'none';
};

// --- ANIMATION HELPER: SWITCHING FORMS ---
window.switchAuthForms = function(hideFormId, showFormId) {
    const hideForm = document.getElementById(hideFormId);
    const showForm = document.getElementById(showFormId);
    if (!hideForm || !showForm) return;

    // 1. Trigger the fade-out animation on the current form
    hideForm.classList.add('fade-out-form');

    // 2. Wait for the animation to finish (200ms matches the CSS)
    setTimeout(() => {
        // Hide the old form and remove the animation class
        hideForm.classList.remove('active', 'fade-out-form');
        
        // Show the new form (this automatically triggers the formFadeIn animation)
        showForm.classList.add('active');
    }, 200); 
}


// 2. THE CALLBACK FUNCTION (Runs ONLY after HTML is injected via jQuery)
window.initializeAuthEvents = function() {
    if (window.__authEventsInitialized) return;
    window.__authEventsInitialized = true;

    console.log("Modal HTML successfully loaded. Binding UI events & animations...");

    if (typeof window.bindSupabaseForms === 'function') {
        window.bindSupabaseForms();
    }

    // --- Opener Buttons (NEW: Event Delegation) ---
    // This listens to the whole document, so it works even for dynamically loaded buttons!
    document.addEventListener('click', async function (e) {
        // Check if the click happened on the bookNowBtn
        if (e.target.closest('#bookNowBtn')) {
            e.preventDefault();
            // Check if user is logged in
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session) {
                window.location.href = 'booking_section.html';
            } else {
                window.showAuthModal('login');
            }
            return;
        }

        // List the IDs of other buttons that should trigger the login modal
        const otherOpenerSelector = '#startHostingBtn, #signupBtn, #headerSignInBtn';

        // Check if the click happened on (or inside) an element with one of those IDs
        if (e.target.closest(otherOpenerSelector)) {
            e.preventDefault();
            window.showAuthModal('login');
        }
    });

    // --- Close Modal Behaviors ---
    // Clicking the auth modal 'X' button
    document.querySelectorAll('#authModal .close').forEach(btn => {
        btn.addEventListener('click', window.hideAuthModal);
    });

    const signupSuccessModal = document.getElementById('signupSuccessModal');
    if (signupSuccessModal) {
        signupSuccessModal.style.display = 'none';

        window.addEventListener('click', (event) => {
            if (event.target === signupSuccessModal) {
                window.hideSignupSuccessModal();
            }
        });
    }

    const signupSuccessModalClose = document.getElementById('signupSuccessModalClose');
    if (signupSuccessModalClose) {
        signupSuccessModalClose.addEventListener('click', window.hideSignupSuccessModal);
    }

    const signupSuccessModalOk = document.getElementById('signupSuccessModalOk');
    if (signupSuccessModalOk) {
        signupSuccessModalOk.addEventListener('click', window.hideSignupSuccessModal);
    }

    // Safe Backdrop Clicker (Requires mousedown + mouseup on the dark area)
    const authModal = document.getElementById('authModal');
    let isMouseDownOnBackdrop = false;

    if (authModal) {
        authModal.style.display = 'none';
        authModal.classList.remove('fade-out');

        window.addEventListener('mousedown', function (event) {
            isMouseDownOnBackdrop = (event.target === authModal);
        });

        window.addEventListener('mouseup', function (event) {
            if (isMouseDownOnBackdrop && event.target === authModal) {
                window.hideAuthModal();
            }
            isMouseDownOnBackdrop = false; // Reset the tracker
        });
    }

    const logoutModal = document.getElementById('logoutModal');
    if (logoutModal) {
        logoutModal.classList.remove('active');
    }

    // --- Form Switching Animations ---
    const formSwitches = [
        { linkId: 'showSignup', hide: 'loginForm', show: 'signupForm' },
        { linkId: 'showLogin', hide: 'signupForm', show: 'loginForm' },
        { linkId: 'showResetRequest', hide: 'loginForm', show: 'resetRequestForm' },
        { linkId: 'showLoginFromReset', hide: 'resetRequestForm', show: 'loginForm' }
    ];

    formSwitches.forEach(sw => {
        const link = document.getElementById(sw.linkId);
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.switchAuthForms(sw.hide, sw.show);
            });
        }
    });

    // --- Terms and Conditions Modal Event Listeners ---
    const openTermsLink = document.getElementById('openTermsModal');
    if (openTermsLink) {
        openTermsLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.showTermsModal === 'function') {
                window.showTermsModal();
            }
        });
    }

    const termsModalClose = document.getElementById('termsModalClose');
    if (termsModalClose) {
        termsModalClose.addEventListener('click', () => {
            if (typeof window.hideTermsModal === 'function') {
                window.hideTermsModal();
            }
        });
    }

    const termsModalCloseBtn = document.getElementById('termsModalCloseBtn');
    if (termsModalCloseBtn) {
        termsModalCloseBtn.addEventListener('click', () => {
            // Check the T&C checkbox in signup form
            const agreeTermsCheckbox = document.getElementById('agreeTerms');
            if (agreeTermsCheckbox) {
                agreeTermsCheckbox.checked = true;
            }
            if (typeof window.hideTermsModal === 'function') {
                window.hideTermsModal();
            }
        });
    }

    // Close T&C modal when clicking outside on backdrop
    const termsModal = document.getElementById('termsModal');
    if (termsModal) {
        termsModal.style.display = 'none';

        window.addEventListener('click', (event) => {
            if (event.target === termsModal) {
                if (typeof window.hideTermsModal === 'function') {
                    window.hideTermsModal();
                }
            }
        });
    }

    // --- Logout Modal Behaviors ---
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', window.hideLogoutModal);
    }
};

// 3. GLOBAL MOBILE MENU LOGIC
document.body.addEventListener('click', function(e) {
    const mobileNav = document.getElementById('mobileNav');
    const overlay = document.getElementById('mobileOverlay');

    if (!mobileNav || !overlay) return;

    // Open logout confirmation modal from mobile menu across pages.
    if (e.target.closest('#logoutBtn')) {
        e.preventDefault();
        if (typeof window.showLogoutModal === 'function') {
            window.showLogoutModal();
        }
        mobileNav.classList.remove('active');
        overlay.classList.remove('active');
        return;
    }

    // Open Menu
    if (e.target.closest('#menuToggle') || e.target.closest('#userGreeting')) {
        e.preventDefault();
        mobileNav.classList.add('active');
        overlay.classList.add('active');
    }
    // Close Menu (X button)
    else if (e.target.closest('#mobileNavClose')) {
        e.preventDefault();
        mobileNav.classList.remove('active');
        overlay.classList.remove('active');
    }
    // Close Menu (Clicking overlay)
    else if (e.target.id === 'mobileOverlay') {
        mobileNav.classList.remove('active');
        overlay.classList.remove('active');
    }
    // Auto-Close when clicking a link
    else if (e.target.closest('.mobile-nav-links a') || e.target.closest('.mobile-nav-cta a')) {
        mobileNav.classList.remove('active');
        overlay.classList.remove('active');
    }
});