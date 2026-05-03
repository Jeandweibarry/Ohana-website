// LOG OUT BUTTON LOGIC
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabaseClient.auth.signOut();
        window.location.href = '/';
    });
}

// Dynamic Username
async function loadUser() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (!user) return;

    // Fetch from your custom table (change table name if needed)
    const { data, error: dbError } = await supabaseClient
        .from('profiles') // 👈 your table name
        .select('username')
        .eq('profile_id', user.id)
        .single();

    if (data) {
        const usernameElement = document.getElementById("userGreeting");
        if (usernameElement) {
            usernameElement.textContent = `Welcome, ${data.username}`;
        }
    } else {
        console.error(dbError);
    }
}

loadUser();

// ------------------------------------- HOST DETAILS DYNAMIC LOADING -------------------------------------

async function populateHostData() {
    console.log("1. Host details script started. Looking for ID in URL...");

    // 1. Grab the ?id= from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const hostId = urlParams.get('id');

    if (!hostId) {
        console.error("No host ID found in the URL.");
        showHostNotFound();
        return;
    }
    console.log("Extracted Host ID:", hostId);

    // 2. Get host data
    let host = null;
    if (typeof window.getHostById === 'function') {
        host = await window.getHostById(hostId);
    }

    if (!host) {
        console.error("Host not found in database.");
        showHostNotFound();
        return;
    }
    console.log("2. Found Host:", host);

    // 3. Populate host information
    console.log("3. Populating host information...");

    // Host name
    const hostNameElement = document.getElementById('hostName');
    if (hostNameElement) {
        hostNameElement.textContent = host.username;
    }

    // Host image
    const hostImageElement = document.getElementById('hostImage');
    if (hostImageElement) {
        hostImageElement.src = host.avatar || '/resources/images/default_pic.jpg';
        hostImageElement.alt = `${host.username}'s profile picture`;
        hostImageElement.onerror = function() {
            this.src = '/resources/images/default_pic.jpg';
        };
    }

    // Host bio (dynamic based on host data)
    const hostBioElement = document.getElementById('hostBio');
    if (hostBioElement) {
        const joinYear = host.joinDate !== 'Unknown' ? new Date(host.joinDate).getFullYear() : 'recently';
        hostBioElement.textContent = `Experienced host since ${joinYear}. ${host.username} is passionate about sharing unique accommodations and creating memorable experiences for travelers across the Philippines. Known for excellent communication and attention to detail.`;
    }

    // 4. Load host's listings
    await loadHostListings(hostId);

    // 5. Load host reviews/stats
    await loadHostStats(hostId);

    // 6. Load host reviews
    await loadHostReviews(hostId);

    console.log("4. Host details population complete!");
}

async function loadHostListings(hostId) {
    console.log("Loading host listings for host ID:", hostId);

    if (!window.supabaseClient) {
        console.error('Supabase client not available');
        return;
    }

    const { data: listings, error } = await window.supabaseClient
        .from('listings')
        .select('listing_id, title, price, location, img_url, rating')
        .eq('host_id', hostId)
        .eq('is_available', true)
        .limit(6);

    if (error) {
        console.error('Failed to load host listings:', error);
        return;
    }

    const container = document.getElementById('hostListingsContainer');
    if (!container) return;

    if (!listings || listings.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">This host has no active listings.</p>';
        return;
    }

    // Update total listings count
    const totalListingsElement = document.getElementById('totalListings');
    if (totalListingsElement) {
        totalListingsElement.textContent = listings.length;
    }

    // Create listing cards
    const listingsHTML = listings.map(listing => `
        <div class="collection-item">
            <div class="collection-image">
                <img src="${listing.img_url || '/resources/images/default_listing.jpg'}" alt="${listing.title}">
            </div>
            <div class="collection-overlay">
                <h3 class="collection-name">${listing.title}</h3>
                <p class="collection-price">₱${listing.price}/night</p>
                <p class="collection-location">${listing.location}</p>
                <button class="btn-secondary" onclick="window.location.href='listing_details.html?id=${listing.listing_id}'">View Details</button>
            </div>
        </div>
    `).join('');

    container.innerHTML = `<div class="collections-grid">${listingsHTML}</div>`;
}

async function loadHostStats(hostId) {
    console.log("Loading host stats for host ID:", hostId);

    if (!window.supabaseClient) {
        console.error('Supabase client not available');
        return;
    }

    // Calculate years hosting (simplified - using join date)
    const host = await window.getHostById(hostId);
    if (host && host.joinDate !== 'Unknown') {
        const joinDate = new Date(host.joinDate);
        const now = new Date();
        const yearsHosting = Math.max(1, Math.floor((now - joinDate) / (365.25 * 24 * 60 * 60 * 1000)));

        const yearsElement = document.getElementById('yearsHosting');
        if (yearsElement) {
            yearsElement.textContent = yearsHosting;
        }
    }

    // Calculate average rating from listings
    const { data: listings, error } = await window.supabaseClient
        .from('listings')
        .select('rating')
        .eq('host_id', hostId)
        .not('rating', 'is', null);

    if (!error && listings && listings.length > 0) {
        const avgRating = listings.reduce((sum, listing) => sum + (listing.rating || 0), 0) / listings.length;
        const ratingElement = document.getElementById('hostRating');
        if (ratingElement) {
            ratingElement.textContent = avgRating.toFixed(1);
        }
    }
}

async function loadHostReviews(hostId) {
    console.log("Loading host reviews for host ID:", hostId);

    // For now, reviews are not implemented in the database
    // This would require a reviews table with guest_id, host_id, rating, comment, date, etc.

    const container = document.getElementById('reviewsContainer');
    if (!container) return;

    // Show message that reviews are coming soon
    container.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: #666;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📝</div>
            <h3 style="color: #1e3a8a; margin-bottom: 1rem;">Reviews Coming Soon</h3>
            <p>Guest reviews will be available once the review system is implemented.</p>
            <p style="font-size: 0.9rem; margin-top: 1rem;">This feature will allow guests to share their experiences and help other travelers make informed decisions.</p>
        </div>
    `;

    // Update reviews title to indicate coming soon
    const reviewsTitle = document.getElementById('reviewsTitle');
    if (reviewsTitle) {
        reviewsTitle.textContent = 'Guest Reviews (Coming Soon)';
    }
}

function showHostNotFound() {
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroSection.innerHTML = `
            <div class="container" style="padding: 4rem 2rem; text-align: center;">
                <h2>Host not found</h2>
                <p>Sorry, we couldn't find the host you're looking for.</p>
                <a href="/" class="btn-primary" style="margin-top: 1rem; display: inline-block;">Back to Home</a>
            </div>
        `;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    populateHostData();

    // Add message host button functionality
    const messageHostBtn = document.getElementById('messageHostBtn');
    if (messageHostBtn) {
        messageHostBtn.addEventListener('click', function() {
            // For now, show an alert. In a real app, this would open a messaging interface
            alert('Messaging feature coming soon! You can contact the host directly via email.');
        });
    }
});

// ------------------------------------- MOBILE MENU LOGIC -------------------------------------

// ------------------------------------- MOBILE MENU LOGIC -------------------------------------
document.body.addEventListener('click', function(e) {

    const mobileNav = document.getElementById('mobileNav');
    const overlay = document.getElementById('mobileOverlay');

    if (!mobileNav || !overlay) return;

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
});

// --------------------------------------------------------------- //
// --- HOST DETAILS PAGE LOGIC ---
// --------------------------------------------------------------- //

// Get host ID from URL parameters (e.g., ?host=123)
const urlParams = new URLSearchParams(window.location.search);
const hostId = urlParams.get('host') || '1'; // Default to host 1 if no param

// Dummy host data (replace with actual database fetch)
const hostData = {
    id: 1,
    name: 'John Doe',
    bio: 'Passionate host sharing unique accommodations across the Philippines. Committed to providing memorable experiences for travelers.',
    image: '/resources/images/avatar-01.jpg',
    totalListings: 5,
    rating: 4.8,
    yearsHosting: 3,
    listings: [
        {id: 101, title: 'Beachfront Villa', price: '₱12,500/night', img: '/resources/images/maison-hero-02.jpg', location: 'Boracay'},
        {id: 102, title: 'Mountain Cabin', price: '₱4,500/night', img: '/resources/images/maison-hero-01.jpg', location: 'Baguio'},
        {id: 103, title: 'City Loft', price: '₱6,000/night', img: '/resources/images/maison-hero-03.jpg', location: 'Makati'},
        {id: 104, title: 'Island Resort', price: '₱8,500/night', img: '/resources/images/maison-doree-01.jpg', location: 'Palawan'},
        {id: 105, title: 'Countryside Home', price: '₱3,500/night', img: '/resources/images/maison-doree-02.jpg', location: 'Laguna'}
    ],
    reviews: [
        {name: 'Anna Santos', text: 'Amazing stay! The host was very welcoming and the place was exactly as described.', stars: 5, date: '2024-01-15'},
        {name: 'Mark Reyes', text: 'Very relaxing getaway. Clean, comfortable, and great location.', stars: 4, date: '2024-02-20'},
        {name: 'John Cruz', text: 'Cozy and clean! Would definitely book again.', stars: 5, date: '2024-03-10'},
        {name: 'Maria Garcia', text: 'Perfect for our family vacation. Highly recommended!', stars: 5, date: '2024-04-05'},
        {name: 'Carlos Mendoza', text: 'Good value for money. The host responded quickly to our questions.', stars: 4, date: '2024-05-12'}
    ]
};

// Load host information
function loadHostInfo() {
    document.getElementById('hostName').textContent = hostData.name;
    document.getElementById('hostBio').textContent = hostData.bio;
    document.getElementById('hostImage').src = hostData.image;
    document.getElementById('totalListings').textContent = hostData.totalListings;
    document.getElementById('hostRating').textContent = hostData.rating;
    document.getElementById('yearsHosting').textContent = hostData.yearsHosting;
}

// Load host listings
function loadHostListings() {
    const container = document.getElementById('hostListingsContainer');
    if (!container) return;

    container.innerHTML = ''; // Clear existing

    hostData.listings.forEach(listing => {
        const card = document.createElement('div');
        card.className = 'host-card';
        card.innerHTML = `
            <div class="host-card-image">
                <img src="${listing.img}" alt="${listing.title}">
            </div>
            <div class="host-card-content">
                <h4 class="host-card-title">${listing.title}</h4>
                <p class="host-card-location">${listing.location}</p>
                <div class="host-card-footer">
                    <span class="host-card-price">${listing.price}</span>
                    <button class="host-card-btn">View Details</button>
                </div>
            </div>
        `;
        card.addEventListener('click', () => {
            // Navigate to listing details page
            window.location.href = `/listing_details?id=${listing.id}`;
        });
        container.appendChild(card);
    });
}

// Load reviews
function loadReviews() {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;

    container.innerHTML = ''; // Clear existing

    hostData.reviews.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        reviewCard.innerHTML = `
            <div class="review-header">
                <strong>${review.name}</strong>
                <div class="review-stars">${'★'.repeat(review.stars)}${'☆'.repeat(5 - review.stars)}</div>
            </div>
            <p>"${review.text}"</p>
            <small>${new Date(review.date).toLocaleDateString()}</small>
        `;
        container.appendChild(reviewCard);
    });
}

// Message host button
document.getElementById('messageHostBtn')?.addEventListener('click', () => {
    // Implement messaging functionality
    alert('Message functionality would open a chat modal or redirect to messaging page');
});

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadHostInfo();
    loadHostListings();
    loadReviews();
});

// Add styles for host cards
const hostCardStyles = `
.host-listings {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--space-lg);
    margin-top: var(--space-md);
}

.host-card {
    background-color: var(--color-warm-white);
    border: 1px solid var(--color-ivory);
    border-radius: 12px;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    cursor: pointer;
}

.host-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.host-card-image {
    position: relative;
    height: 200px;
    overflow: hidden;
}

.host-card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.host-card:hover .host-card-image img {
    transform: scale(1.05);
}

.host-card-content {
    padding: var(--space-md);
}

.host-card-title {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 500;
    color: var(--color-charcoal);
    margin: 0 0 var(--space-xs) 0;
}

.host-card-location {
    font-size: 0.9rem;
    color: var(--color-charcoal-soft);
    margin: 0 0 var(--space-sm) 0;
}

.host-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: var(--space-sm);
}

.host-card-price {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-gold-dark);
}

.host-card-btn {
    background-color: var(--color-ivory);
    color: var(--color-charcoal);
    border: 1px solid var(--color-charcoal);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
}

.host-card-btn:hover {
    background-color: var(--color-charcoal);
    color: var(--color-ivory);
}

/* Review card styles */
.reviews-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: var(--space-lg);
    margin-top: var(--space-lg);
}

.review-card {
    background-color: var(--color-warm-white);
    border: 1px solid var(--color-ivory);
    border-radius: 12px;
    padding: var(--space-lg);
}

.review-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-sm);
}

.review-stars {
    color: var(--color-gold-dark);
    font-size: 1.1rem;
}

.review-card p {
    color: var(--color-charcoal-soft);
    line-height: 1.6;
    margin-bottom: var(--space-sm);
}

.review-card small {
    color: var(--color-charcoal-soft);
    font-size: 0.85rem;
}

/* Responsive */
@media (max-width: 768px) {
    .host-listings {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: var(--space-md);
    }
    
    .reviews-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 480px) {
    .host-listings {
        grid-template-columns: 1fr;
    }
}
`;

function injectHostDetailsStyles() {
    if (document.getElementById('host-details-inline-style')) {
        return;
    }

    const styleSheet = document.createElement('style');
    styleSheet.id = 'host-details-inline-style';
    styleSheet.textContent = hostCardStyles;
    document.head.appendChild(styleSheet);
}

injectHostDetailsStyles();