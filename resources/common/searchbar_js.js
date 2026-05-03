// --- GLOBAL LISTINGS DATA ---
const DEFAULT_LISTING_IMAGE = '/resources/images/maison-hero-02.jpg';
const PHP_PRICE_FORMATTER = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

window.appListings = Array.isArray(window.appListings) ? window.appListings : [];

function formatListingPrice(rawPrice) {
  const numericPrice = Number(rawPrice);
  if (!Number.isFinite(numericPrice)) {
    return 'Price unavailable';
  }
  return `${PHP_PRICE_FORMATTER.format(numericPrice)}/day`;
}

function formatDateListed(rawDate) {
  if (!rawDate) {
    return 'Date unavailable';
  }

  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Date unavailable';
  }

  return parsedDate.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatListingRating(rawRating) {
  const numericRating = Number(rawRating);
  if (!Number.isFinite(numericRating) || numericRating <= 0) {
    return 'No Rating';
  }
  return `${numericRating.toFixed(1)} ★`;
}

function resolveListingImage(rawImage) {
  if (Array.isArray(rawImage)) {
    const firstValid = rawImage.find((entry) => typeof entry === 'string' && entry.trim());
    return firstValid || DEFAULT_LISTING_IMAGE;
  }

  if (typeof rawImage === 'string' && rawImage.trim()) {
    return rawImage.trim();
  }

  return DEFAULT_LISTING_IMAGE;
}

async function buildHostMap(hostIds) {
  const hostMap = {};
  const uniqueHostIds = [...new Set((hostIds || []).filter(Boolean))];

  if (!window.supabaseClient || uniqueHostIds.length === 0) {
    return hostMap;
  }

  const { data: profileRows, error: profileError } = await window.supabaseClient
    .from('profiles')
    .select('profile_id, username')
    .in('profile_id', uniqueHostIds);

  if (profileError) {
    console.warn('Failed to resolve host usernames:', profileError.message);
    return hostMap;
  }

  (profileRows || []).forEach((profile) => {
    hostMap[profile.profile_id] = profile.username || 'Host';
  });

  return hostMap;
}

async function getHostById(hostId) {
  if (!window.supabaseClient || !hostId) {
    return null;
  }

  const { data: profile, error } = await window.supabaseClient
    .from('profiles')
    .select('profile_id, username, email, created_at, avatar_url')
    .eq('profile_id', hostId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch host by ID:', error.message);
    return null;
  }

  if (!profile) {
    return null;
  }

  return {
    id: profile.profile_id,
    username: profile.username || 'Host',
    email: profile.email || '',
    joinDate: profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown',
    avatar: profile.avatar_url || '/resources/images/default_pic.jpg'
  };
}

window.getHostById = getHostById;

function mapListingRow(row, hostMap = {}) {
  return {
    id: Number(row.listing_id),
    hostId: row.host_id,
    title: row.title || 'Untitled Listing',
    host: hostMap[row.host_id] || 'Host',
    price: formatListingPrice(row.price),
    location: row.location || 'Location unavailable',
    city: row.city || '',
    img: resolveListingImage(row.img_url),
    description: row.description || 'No description available.',
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    maxGuests: row.max_guests ?? '-',
    bedrooms: row.bedrooms ?? '-',
    bathrooms: row.bathrooms ?? '-',
    dateListed: formatDateListed(row.created_at),
    petFriendly: Boolean(row.pet_friendly),
    rating: formatListingRating(row.rating),
  };
}

window.loadAppListingsFromDatabase = async function loadAppListingsFromDatabase(query = '', options = {}) {
  if (!window.supabaseClient) {
    console.error('Supabase client is not ready.');
    window.appListings = [];
    return options.withMeta ? { listings: [], totalCount: 0, totalPages: 0, currentPage: 1 } : [];
  }

  const normalizedQuery = String(query || '').trim();
  const safeQuery = normalizedQuery.replace(/[,%]/g, ' ').replace(/\s+/g, ' ').trim();
  const pageSize = Number(options.pageSize) > 0 ? Number(options.pageSize) : 9;
  const requestedPage = Number(options.page) > 0 ? Number(options.page) : 1;
  const from = (requestedPage - 1) * pageSize;
  const to = from + pageSize - 1;

  let listingsQuery = window.supabaseClient
    .from('listings')
    .select('listing_id, title, host_id, price, location, city, img_url, description, amenities, max_guests, bedrooms, bathrooms, created_at, pet_friendly, rating', { count: 'exact' })
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (safeQuery) {
    listingsQuery = listingsQuery.or(`title.ilike.%${safeQuery}%,location.ilike.%${safeQuery}%,city.ilike.%${safeQuery}%`);
  }

  const { data: listingRows, error: listingError, count } = await listingsQuery;
  if (listingError) {
    console.error('Failed to fetch listings:', listingError.message);
    window.appListings = [];
    return options.withMeta ? { listings: [], totalCount: 0, totalPages: 0, currentPage: requestedPage } : [];
  }

  const hostMap = await buildHostMap((listingRows || []).map((row) => row.host_id));
  const mappedListings = (listingRows || []).map((row) => mapListingRow(row, hostMap));
  const totalCount = Number(count || 0);
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;

  window.appListings = mappedListings;
  if (options.withMeta) {
    return {
      listings: mappedListings,
      totalCount,
      totalPages,
      currentPage: requestedPage,
    };
  }

  return mappedListings;
};

window.getAppListingByIdFromDatabase = async function getAppListingByIdFromDatabase(listingId) {
  if (!window.supabaseClient) {
    return null;
  }

  const numericId = Number(listingId);
  if (!Number.isFinite(numericId)) {
    return null;
  }

  const { data: row, error } = await window.supabaseClient
    .from('listings')
    .select('listing_id, title, host_id, price, location, city, img_url, description, amenities, max_guests, bedrooms, bathrooms, created_at, pet_friendly, rating')
    .eq('listing_id', numericId)
    .eq('is_available', true)
    .maybeSingle();

  if (error || !row) {
    if (error) {
      console.error('Failed to fetch listing by id:', error.message);
    }
    return null;
  }

  const hostMap = await buildHostMap([row.host_id]);
  return mapListingRow(row, hostMap);
};


// ------------------------------------- SEARCH FUNCTIONALITY -------------------------------------
function initSearch() {
  const searchBar = document.getElementById('searchBar');
  const mobileSearchBar = document.getElementById('mobileSearchBar');
  const searchBtn = document.querySelector('.search-btn');

  // Pagination State Variables
  let currentFilteredResults = [];
  let currentSearchQuery = '';
  let totalResultCount = 0;
  let totalPages = 0;
  let currentPage = 1;
  const ITEMS_PER_PAGE = 9;

  async function handleBookNowAction(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    let access = { isLoggedIn: false, isVerified: false };
    if (typeof window.getBookingAccessState === 'function') {
      access = await window.getBookingAccessState();
    } else if (window.supabaseClient?.auth) {
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
  }

  window.handleBookNowAction = handleBookNowAction;

  async function performSearch(query, options = {}) {
    const normalizedQuery = String(query || '').trim();
    const shouldScroll = options.scroll !== false;
    const requestedPage = Number(options.page) > 0 ? Number(options.page) : 1;

    const mobileNav = document.getElementById('mobileNav');
    const mobileOverlay = document.getElementById('mobileOverlay');
    if (mobileNav && mobileNav.classList.contains('active')) {
        mobileNav.classList.remove('active');
        mobileOverlay.classList.remove('active');
    }

    const result = await window.loadAppListingsFromDatabase(normalizedQuery, {
      page: requestedPage,
      pageSize: ITEMS_PER_PAGE,
      withMeta: true,
    });

    currentSearchQuery = normalizedQuery;
    currentFilteredResults = result.listings;
    currentPage = result.currentPage;
    totalPages = result.totalPages;
    totalResultCount = result.totalCount;

    if (shouldScroll) {
      document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' });
    }
    displaySearchResults(currentFilteredResults, currentSearchQuery, totalResultCount);

    if (searchBar) searchBar.value = '';
    if (mobileSearchBar) mobileSearchBar.value = '';
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }

function createCardHTML(listing) {
    const isLoggedIn = window.isUserLoggedIn;
    const signInNote = !isLoggedIn ? `<p class="browse-note" style="margin-top: 10px; font-size: 0.8rem; color: #888; text-align: center;">Sign in to book</p>` : ``;

    return `
      <img src="${listing.img}" alt="${listing.title}" onclick="viewRoomDetails(${listing.id})" style="cursor: pointer;" title="Quick View">
      
      <div class="host-card-content">
        <h4 onclick="viewRoomDetails(${listing.id})" style="cursor: pointer;" title="Quick View">${listing.title}</h4>
        <p style="font-size: 0.85rem; color: #888; margin-bottom: 0.3rem;">Hosted by <a href="host_details.html?id=${listing.hostId}" style="color: #1e3a8a; text-decoration: none; font-weight: 600; cursor: pointer;">${listing.host}</a></p>
        <p class="location">${listing.location}</p>
        <p class="price">${listing.price}</p>
        <p style="font-size: 0.85rem; color: #555; margin: 0.35rem 0 0.65rem;">Rating: <strong>${listing.rating}</strong></p>
        
        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: auto;">
            <button onclick="handleBookNowAction(event)" class="card-btn btn-book">Book Now</button>
            <button onclick="window.location.href='/listing_details?id=${listing.id}'" class="card-btn btn-details">View Details</button>
        </div>
        ${signInNote}
      </div>
    `;
  }

  function displaySearchResults(results, query, resultCount) {
    const listingsSection = document.getElementById('listings');
    if (!listingsSection) return;
    const container = listingsSection.querySelector('.container');

    const collectionsGrid = container.querySelector('.collections-grid');
    if (collectionsGrid) {
        collectionsGrid.style.display = 'none'; 
        const sectionHeader = container.querySelector('.section-header-left');
        if (sectionHeader) {
          sectionHeader.innerHTML = `
            <h2 class="heading-display section-title">Search Results</h2>
            <p class="text-body section-subtitle">${resultCount} accommodation${resultCount !== 1 ? 's' : ''}${query ? ` found for "${query}"` : ' available'}</p>
          `;
        }
    }
    
    // Call the rendering function
    renderCurrentPage();
  }

  // --- NEW: PAGINATION RENDERING ---
  function renderCurrentPage() {
    let dashboardContainer = document.getElementById('publicListingsContainer');
    if (!dashboardContainer) {
        dashboardContainer = document.createElement('div');
        dashboardContainer.id = 'publicListingsContainer';
        document.getElementById('listings').querySelector('.container').appendChild(dashboardContainer);
    }

    dashboardContainer.className = 'host-listings'; 
    dashboardContainer.style.display = ''; 
    dashboardContainer.innerHTML = '';
    
    if (currentFilteredResults.length > 0) {
      currentFilteredResults.forEach(listing => {
        const card = document.createElement('div');
        card.className = 'host-card';
        card.innerHTML = createCardHTML(listing);
        dashboardContainer.appendChild(card);
      });
      renderPaginationControls();
    } else {
      dashboardContainer.className = ''; 
      dashboardContainer.style.display = 'block'; 
      dashboardContainer.innerHTML = `
        <div class="no-results" style="width: 100%; text-align: center; padding: 4rem 2rem; background: #fff; border-radius: 12px; border: 1px solid #eaeaea;">
          <h3 style="margin-bottom: 0.5rem;">No accommodations found</h3>
          <p style="color: #666;">Try searching for cities like "Boracay", "Baguio", "Makati", or "Cebu"</p>
        </div>
      `;
      // Clear pagination if no results
      const pagContainer = document.getElementById('paginationContainer');
      if (pagContainer) pagContainer.innerHTML = '';
    }
  }

  // --- NEW: PAGINATION BUTTON CONTROLS ---
  function renderPaginationControls() {
    let paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'paginationContainer';
        document.getElementById('publicListingsContainer').after(paginationContainer);
    }

    // Hide controls if there's only 1 page
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = `<div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 2.5rem; width: 100%;">`;

    // Prev Button
    html += `<button onclick="changePage(${currentPage - 1})" class="card-btn btn-details" style="width: auto; padding: 0.5rem 1rem; ${currentPage === 1 ? 'opacity: 0.5; cursor: not-allowed;' : ''}" ${currentPage === 1 ? 'disabled' : ''}>&laquo; Prev</button>`;

    // Numbered Buttons
    for (let i = 1; i <= totalPages; i++) {
        const isActive = i === currentPage ? 'background-color: #333; color: white;' : '';
        html += `<button onclick="changePage(${i})" class="card-btn btn-details" style="width: auto; padding: 0.5rem 1rem; ${isActive}">${i}</button>`;
    }

    // Next Button
    html += `<button onclick="changePage(${currentPage + 1})" class="card-btn btn-details" style="width: auto; padding: 0.5rem 1rem; ${currentPage === totalPages ? 'opacity: 0.5; cursor: not-allowed;' : ''}" ${currentPage === totalPages ? 'disabled' : ''}>Next &raquo;</button>`;

    html += `</div>`;
    paginationContainer.innerHTML = html;
  }

  // Global function so the onclick buttons can trigger it
  window.changePage = async function(page) {
    if (page < 1 || page > totalPages) return;
    await performSearch(currentSearchQuery, { page, scroll: false });
    
    // Scroll cleanly to the top of the listings section when changing pages
    document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

// --- Quick View Modal Update ---
  function viewRoomDetails(listingId) {
    const listing = window.appListings.find(item => item.id === listingId);
    if (!listing) return;

    const isLoggedIn = window.isUserLoggedIn;
    const signInNote = !isLoggedIn ? `<p style="color: #888; font-style: italic; font-size: 0.9rem; margin-bottom: 1rem;">*Please sign in or create an account to book this accommodation.</p>` : ``;

    const modal = document.createElement('div');
    modal.className = 'room-details-modal';
    
    // Make wrapper full-screen Flexbox
    modal.style.position = 'fixed'; modal.style.top = '0'; modal.style.left = '0'; modal.style.width = '100%'; modal.style.height = '100%'; modal.style.display = 'flex'; modal.style.alignItems = 'center'; modal.style.justifyContent = 'center'; modal.style.zIndex = '9999';

    modal.innerHTML = `
      <div class="room-details-backdrop" onclick="closeRoomDetails()" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); opacity: 0; transition: opacity 0.3s ease;"></div>
      
      <div class="room-details-content" style="position: relative; background: white; padding: 2rem; border-radius: 12px; z-index: 1; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; opacity: 0; transform: translateY(30px); transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); text-align: left;">
        <button class="room-details-close" onclick="closeRoomDetails()" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; cursor: pointer; z-index: 2;">×</button>
        <div class="room-details-body">
          <img src="${listing.img}" alt="${listing.title}" style="width:100%; border-radius:8px; aspect-ratio: 16/9; object-fit: cover; margin-bottom: 1rem;">
          
          <h2>${listing.title}</h2>
          <p style="font-size: 1rem; color: #555; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 8px;">
            <i class="fa fa-user-circle" aria-hidden="true" style="font-size: 1.2rem; color: #b89851;"></i> 
            Hosted by: <a href="host_details.html?id=${listing.hostId}" style="color: #1e3a8a; text-decoration: none; font-weight: 600; cursor: pointer;">${listing.host}</a>
            Date Listed: <strong>${listing.dateListed}</strong>
          </p>
          
          
          <p style="color: #666; margin-bottom: 0.5rem;">${listing.location}</p>
          <p style="font-weight: bold; font-size: 1.2rem; margin-bottom: 1rem;">${listing.price}</p>
          
          <div style="display:flex; gap:15px; margin-bottom: 1rem; padding: 1rem; background: #f9f9f9; border-radius: 8px; flex-wrap: wrap;">
            <div><strong>Max Guests:</strong> ${listing.maxGuests}</div>
            <div><strong>Bedrooms:</strong> ${listing.bedrooms}</div>
            <div><strong>Bathrooms:</strong> ${listing.bathrooms}</div>
            <div><strong>Rating:</strong> ${listing.rating}</div>
            <div><strong>Pet Friendly:</strong> ${listing.petFriendly ? 'Yes' : 'No'}</div>
          </div>
          
          <h3 style="margin-bottom: 0.5rem;">Description</h3>
          <p style="line-height: 1.6; margin-bottom: 1.5rem;">${listing.description}</p>
          <h3 style="margin-bottom: 0.5rem;">Amenities</h3>
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom: 1.5rem;">
            ${listing.amenities.map(amenity => `<span style="background:#f0f0f0; padding:6px 12px; border-radius:20px; font-size:0.9rem;">${amenity}</span>`).join('')}
          </div>
          
          ${signInNote}
          
          <div style="display: flex; gap: 10px;">
            <button onclick="window.location.href='/listing_details?id=${listing.id}'" class="card-btn btn-details">View Listing</button>
            <button onclick="handleBookNowAction(event)" class="card-btn btn-book">Book Now</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
      modal.querySelector('.room-details-backdrop').style.opacity = '1';
      const content = modal.querySelector('.room-details-content');
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
    }, 10);
  } 

  window.viewRoomDetails = viewRoomDetails;

  window.closeRoomDetails = function() {
    const modal = document.querySelector('.room-details-modal');
    if (modal) modal.remove();
  }

    // Auto-display listings whenever this page includes the listings section.
    if (document.getElementById('listings')) {
      performSearch('', { scroll: false });
    }

  // Event Listeners for Search Bars
  function handleEnterSearch(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      performSearch(event.target.value);
    }
  }

  if (searchBar) {
    searchBar.addEventListener('keydown', handleEnterSearch);
  }

  if (searchBtn && searchBar) {
    searchBtn.addEventListener('click', function() {
      performSearch(searchBar.value);
    });
  }

  if (mobileSearchBar) {
    mobileSearchBar.addEventListener('keydown', handleEnterSearch);
  }

  if (!window.__browseHomesRedirectHandlerBound) {
    document.addEventListener('click', function(event) {
      const browseHomesLink = event.target.closest('a[href="#listings"]');
      if (!browseHomesLink) {
        return;
      }

      const hasListingsSection = !!document.getElementById('listings');
      if (!hasListingsSection) {
        event.preventDefault();
        window.location.href = '/dashboard';
        return;
      }

      // Keep behavior consistent across header and footer links.
      event.preventDefault();
      document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    window.__browseHomesRedirectHandlerBound = true;
  }
}