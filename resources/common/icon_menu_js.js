// ------------------------------------- MASTER CLICK HANDLER -------------------------------------
document.body.addEventListener('click', async function(e) {

    // ==========================================
    // 1. LOGOUT LOGIC (WITH MODAL)
    // ==========================================
    const logoutModal = document.getElementById('logoutModal');

    // A. User clicks the main "Log Out" link in the navigation
    if (e.target.closest('#logoutBtn')) {
        e.preventDefault(); 
        if (logoutModal) logoutModal.classList.add('active'); // Show modal
        return; 
    }

    // B. User clicks "Cancel" OR clicks the dark overlay outside the modal box
    if (e.target.closest('#cancelLogoutBtn') || e.target.id === 'logoutModal') {
        e.preventDefault();
        if (logoutModal) logoutModal.classList.remove('active'); // Hide modal
        return;
    }

    // C. User clicks "Yes, Log Out"
    if (e.target.closest('#confirmLogoutBtn')) {
        e.preventDefault();
        
        // Optional UX polish: Change text so they know it's working
        e.target.textContent = "Logging out...";
        e.target.style.opacity = "0.7";
        e.target.style.pointerEvents = "none";

        const { error } = await window.supabaseClient.auth.signOut();

        if (error) {
            console.error("Error logging out:", error.message);
            alert("There was an issue logging out. Please try again.");
            
            // Reset the button if it failed
            e.target.textContent = "Yes, Log Out";
            e.target.style.opacity = "1";
            e.target.style.pointerEvents = "auto";
            if (logoutModal) logoutModal.classList.remove('active');
        } else {
            window.location.href = "/"; 
        }
        return; 
    }

    // ==========================================
    // 2. MOBILE MENU LOGIC
    // ==========================================
    const mobileNav = document.getElementById('mobileNav');
    const overlay = document.getElementById('mobileOverlay');

    if (mobileNav && overlay) {
        // OPEN MENU
        if (e.target.closest('#menuToggle')) {
            e.preventDefault();
            mobileNav.classList.add('active');
            overlay.classList.add('active');
        }
        // CLOSE (X button)
        else if (e.target.closest('#mobileNavClose')) {
            mobileNav.classList.remove('active');
            overlay.classList.remove('active');
        }
        // CLOSE (overlay click)
        else if (e.target.id === 'mobileOverlay') {
            mobileNav.classList.remove('active');
            overlay.classList.remove('active');
        }
        // AUTO CLOSE when clicking links
        else if (e.target.closest('.mobile-nav a')) {
            mobileNav.classList.remove('active');
            overlay.classList.remove('active');
        }
    }
});