(function() {
    const links = Array.from(document.querySelectorAll(".sidebar-link"));
    const sections = Array.from(document.querySelectorAll(".content-section"));

    function setActiveSection(sectionId, updateHash) {
        const target = document.getElementById(sectionId);
        if (!target) return;

        sections.forEach((section) => {
            section.classList.toggle("active", section.id === sectionId);
        });

        links.forEach((link) => {
            link.classList.toggle("active", link.dataset.section === sectionId);
        });

        if (updateHash) {
            history.replaceState(null, "", "#" + sectionId);
        }
    }

    links.forEach((link) => {
        link.addEventListener("click", function(event) {
            event.preventDefault();
            setActiveSection(link.dataset.section, true);
        });
    });

    const initialHash = window.location.hash.replace("#", "");
    if (initialHash && document.getElementById(initialHash)) {
        setActiveSection(initialHash, false);
    } else if (links.length > 0) {
        setActiveSection(links[0].dataset.section, false);
    }

    window.addEventListener("hashchange", function() {
        const sectionFromHash = window.location.hash.replace("#", "");
        if (sectionFromHash) {
            setActiveSection(sectionFromHash, false);
        }
    });
})();

// ------------------------------------- CSS -------------------------------------

const modalStyles = `

.menu-toggle {
    display: flex; /* always visible */
}
    .nav-main {
    display: flex;
}

.side-dashboard {
position: fixed;
top: 0;
left: -280px;
width: 280px;
height: 100%;
background-color: var(--color-ivory);
box-shadow: 2px 0 12px rgba(0,0,0,0.2);
transition: left 0.3s ease;
z-index: 1500;
padding-top: 80px;
display: flex;
flex-direction: column;
gap: 10px; 
}
.side-dashboard.active { left: 0; }

.side-overlay {
position: fixed;
top: 0; left:0;
width: 100%; height: 100%;
background: rgba(0,0,0,0.4);
opacity: 0;
visibility: hidden;
transition: opacity 0.3s ease;
z-index: 1400;
}
.side-overlay.active { opacity: 1; visibility: visible; }


/* Responsive */
@media (max-width:992px){ .host-card { flex:1 1 calc(50% - var(--space-md)); }}
@media (max-width:600px){ .host-card { flex:1 1 100%; }}

/* --- LOGOUT MODAL STYLES --- */
.modal-overlay {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease;
    z-index: 9999; /* Make sure it sits above everything else */
}
.modal-overlay.active {
    opacity: 1;
    visibility: visible;
}
.modal-content {
    background: var(--color-cream, #FAF9F6);
    padding: 2rem;
    border-radius: 12px;
    text-align: center;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    transform: translateY(20px);
    transition: transform 0.3s ease;
}
.modal-overlay.active .modal-content {
    transform: translateY(0);
}
.modal-content h3 { margin-top: 0; color: var(--color-charcoal); }
.modal-content p { color: var(--color-charcoal); margin-bottom: 1.5rem; }
.modal-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
}

`;

function injectDashboardStyles() {
    if (document.getElementById('dashboard-inline-style')) {
        return;
    }

    const styleSheet = document.createElement('style');
    styleSheet.id = 'dashboard-inline-style';
    styleSheet.textContent = modalStyles;
    document.head.appendChild(styleSheet);
}

injectDashboardStyles();

