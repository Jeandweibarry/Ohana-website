// --- /resources/JS/listing_details_js.js ---

async function populateListingData() {
    console.log("1. Script started. Looking for ID in URL...");
    
    // 1. Grab the ?id= from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const id = parseInt(urlParams.get('id'));
    
    if (!id) {
        console.error("No valid ID found in the URL.");
        return;
    }
    console.log("Extracted ID:", id);

    // 2. Find the listing by ID from database helper, then fallback to loaded collection.
    let listing = null;
    if (typeof window.getAppListingByIdFromDatabase === 'function') {
        listing = await window.getAppListingByIdFromDatabase(id);
    }

    if (!listing) {
        if ((!Array.isArray(window.appListings) || window.appListings.length === 0) && typeof window.loadAppListingsFromDatabase === 'function') {
            await window.loadAppListingsFromDatabase('');
        }
        if (Array.isArray(window.appListings)) {
            listing = window.appListings.find((l) => l.id === id);
        }
    }
    console.log("2. Found Listing:", listing);

    if (listing) {
        console.log("3. Injecting data into HTML elements...");

        // Image
        const img = document.querySelector('.featured-image img');
        if (img) { img.src = listing.img; img.alt = listing.title; } 
        else { console.warn("Warning: Could not find element '.featured-image img'"); }
        
        // Title
        const title = document.querySelector('.featured-title');
        if (title) title.textContent = listing.title; 
        else { console.warn("Warning: Could not find element '.featured-title'"); }
        
        // Host Label
        const label = document.querySelector('.featured-label');
        if (label) label.innerHTML = `Listed by: <strong>${listing.host}</strong>`;

        const metaLine = document.getElementById('listingMetaLine');
        if (metaLine) {
            const rating = listing.rating || 'New';
            const dateListed = listing.dateListed || 'Date unavailable';
            metaLine.innerHTML = `Rating: <strong>${rating}</strong> &bull; Date listed: <strong>${dateListed}</strong>`;
        }
        
        // Description
        const desc = document.querySelector('.featured-description');
        if (desc) desc.textContent = listing.description;
        
        // Price
        const price = document.querySelector('.featured-price');
        if (price) price.innerHTML = `<b>${listing.price}</b>`;
        
        // Layout mapping based on your HTML structure
        const detailValues = document.querySelectorAll('.detail-value');
        if (detailValues.length >= 5) {
            detailValues[0].textContent = listing.location;
            detailValues[1].textContent = listing.maxGuests;
            detailValues[2].textContent = listing.bedrooms;
            detailValues[3].textContent = listing.bathrooms;
            detailValues[4].textContent = listing.petFriendly ? 'Yes' : 'No';
        } else {
            console.warn(`Warning: Found only ${detailValues.length} '.detail-value' elements. Expected at least 5.`);
        }
        
        // Format Amenities
        const amenitiesContainer = document.querySelector('.Amenities');
        if (amenitiesContainer) {
            amenitiesContainer.style.display = "flex";
            amenitiesContainer.style.flexWrap = "wrap";
            amenitiesContainer.style.gap = "8px";
            amenitiesContainer.innerHTML = listing.amenities.map(amenity => 
                `<span class="amenity" style="background:#f0f0f0; padding:6px 12px; border-radius:20px; font-size:0.9rem;">${amenity}</span>`
            ).join('');
        }

        // Book Now Button - Now securely uses Supabase to check login status!
        const bookNowBtn = document.getElementById('bookNowBtn');
        if (bookNowBtn) {
            bookNowBtn.onclick = async function(event) {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }

                let access = { isLoggedIn: false, isVerified: false };
                if (typeof window.getBookingAccessState === 'function') {
                    access = await window.getBookingAccessState();
                } else {
                    const { data: { session } } = await window.supabaseClient.auth.getSession();
                    access.isLoggedIn = Boolean(session);
                }

                if (!access.isLoggedIn) {
                    if (typeof window.showAuthModal === 'function') {
                        window.showAuthModal('login');
                    }
                    return;
                }

                if (!access.isVerified) {
                    const overlay = document.createElement('div');
                    overlay.className = 'verification-modal-overlay';
                    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';
                    overlay.innerHTML = '<div style="background:white;padding:2rem;border-radius:8px;max-width:400px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.15);"><h3 style="color:#1e3a8a;margin-top:0;">Account Verification Required</h3><p style="color:#666;margin:1rem 0;">Your account needs to be verified before you can book accommodations.</p><button onclick="this.closest(\'.verification-modal-overlay\').remove()" style="padding:10px 30px;background:#1e3a8a;color:white;border:none;border-radius:5px;cursor:pointer;font-weight:600;">OK</button></div>';
                    document.body.appendChild(overlay);
                    return;
                }

                window.location.href = 'booking_section.html';
            };
        }
        
        console.log("4. Page population complete!");

    } else {
        // Failsafe: if an ID is missing or incorrect
        console.error("Listing ID not found in database.");
        const container = document.querySelector('.featured-piece');
        if (container) {
            container.innerHTML = `
                <div class="container" style="padding: 4rem 2rem; text-align: center;">
                    <h2>Listing not found</h2>
                    <a href="/" class="btn-primary" style="margin-top: 1rem; display: inline-block;">Back to Home</a>
                </div>
            `;
        }
    }
}

// 4. BULLETPROOF TRIGGER
// This ensures the code runs immediately if the page is already loaded, 
// or waits safely if it's still loading.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', populateListingData);
} else {
    populateListingData();
}

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

function injectListingDetailsStyles() {
    if (document.getElementById('listing-details-inline-style')) {
        return;
    }

    const styleSheet = document.createElement('style');
    styleSheet.id = 'listing-details-inline-style';
    styleSheet.textContent = modalStyles;
    document.head.appendChild(styleSheet);
}

injectListingDetailsStyles();

