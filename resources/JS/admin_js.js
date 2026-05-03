/**
 * Admin Dashboard JavaScript
 * Ohana Web Reservation
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize admin functionality
    initAdminTabs();
    initMobileNav();
    initFilters();
    initActionButtons();
    initPagination();
});

/**
 * Initialize Admin Tabs
 */
function initAdminTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    const tabContents = document.querySelectorAll('.admin-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab contents
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Show target tab content
            const targetContent = document.getElementById(`tab-${targetTab}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

/**
 * Initialize Mobile Navigation
 */
function initMobileNav() {
    const menuToggle = document.getElementById('menuToggle');
    const mobileNav = document.getElementById('mobileNav');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const mobileNavClose = document.getElementById('mobileNavClose');
    
    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', function() {
            mobileNav.classList.add('active');
            mobileOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', function() {
            mobileNav.classList.remove('active');
            this.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    if (mobileNavClose) {
        mobileNavClose.addEventListener('click', function() {
            mobileNav.classList.remove('active');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
}

/**
 * Initialize Filters
 */
function initFilters() {
    // Property filters
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const propertySearch = document.getElementById('propertySearch');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterProperties);
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProperties);
    }
    if (propertySearch) {
        propertySearch.addEventListener('input', debounce(filterProperties, 300));
    }
    
    // User filters
    const userTypeFilter = document.getElementById('userTypeFilter');
    const userStatusFilter = document.getElementById('userStatusFilter');
    const userSearch = document.getElementById('userSearch');
    
    if (userTypeFilter) {
        userTypeFilter.addEventListener('change', filterUsers);
    }
    if (userStatusFilter) {
        userStatusFilter.addEventListener('change', filterUsers);
    }
    if (userSearch) {
        userSearch.addEventListener('input', debounce(filterUsers, 300));
    }
    
    // Booking filters
    const bookingStatusFilter = document.getElementById('bookingStatusFilter');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    const bookingSearch = document.getElementById('bookingSearch');
    
    if (bookingStatusFilter) {
        bookingStatusFilter.addEventListener('change', filterBookings);
    }
    if (dateFrom) {
        dateFrom.addEventListener('change', filterBookings);
    }
    if (dateTo) {
        dateTo.addEventListener('change', filterBookings);
    }
    if (bookingSearch) {
        bookingSearch.addEventListener('input', debounce(filterBookings, 300));
    }
}

/**
 * Initialize Action Buttons
 */
function initActionButtons() {
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            showNotification('Refreshing data...', 'info');
            setTimeout(() => {
                showNotification('Data refreshed successfully', 'success');
            }, 1000);
        });
    }
    
    // Add Admin button
    const addAdminBtn = document.getElementById('addAdminBtn');
    if (addAdminBtn) {
        addAdminBtn.addEventListener('click', function() {
            showModal('Add New Admin', getAddAdminModalContent());
        });
    }
    
    // Add User button
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function() {
            showModal('Add New User', getAddUserModalContent());
        });
    }
    
    // Export buttons
    const exportProperties = document.getElementById('exportProperties');
    const exportUsers = document.getElementById('exportUsers');
    const exportBookings = document.getElementById('exportBookings');
    
    if (exportProperties) {
        exportProperties.addEventListener('click', () => exportToCSV('properties'));
    }
    if (exportUsers) {
        exportUsers.addEventListener('click', () => exportToCSV('users'));
    }
    if (exportBookings) {
        exportBookings.addEventListener('click', () => exportToCSV('bookings'));
    }
    
    // View All buttons
    const viewAllBtns = document.querySelectorAll('.btn-view-all');
    viewAllBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            switchTab(section);
        });
    });
}

/**
 * Initialize Pagination
 */
function initPagination() {
    const paginationBtns = document.querySelectorAll('.pagination-btn');
    const paginationPages = document.querySelectorAll('.pagination-page');
    
    paginationBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (!this.disabled) {
                const text = this.textContent;
                showNotification(`Loading page...`, 'info');
            }
        });
    });
    
    paginationPages.forEach(page => {
        page.addEventListener('click', function() {
            if (!this.classList.contains('active')) {
                document.querySelectorAll('.pagination-page').forEach(p => p.classList.remove('active'));
                this.classList.add('active');
                showNotification('Loading page...', 'info');
            }
        });
    });
}

/**
 * Filter Properties
 */
function filterProperties() {
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const propertySearch = document.getElementById('propertySearch');
    const propertiesTable = document.getElementById('propertiesTable');
    
    if (!propertiesTable) return;
    
    const statusValue = statusFilter ? statusFilter.value : 'all';
    const categoryValue = categoryFilter ? categoryFilter.value : 'all';
    const searchValue = propertySearch ? propertySearch.value.toLowerCase() : '';
    
    const tbody = propertiesTable.querySelector('tbody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        let showRow = true;
        
        // Filter by status
        if (statusValue !== 'all') {
            const statusBadge = row.querySelector('.status-badge');
            if (statusBadge) {
                const rowStatus = statusBadge.textContent.toLowerCase();
                if (statusValue === 'active' && !rowStatus.includes('active')) {
                    showRow = false;
                } else if (statusValue === 'pending' && !rowStatus.includes('pending')) {
                    showRow = false;
                } else if (statusValue === 'inactive' && !rowStatus.includes('inactive')) {
                    showRow = false;
                } else if (statusValue === 'declined' && !rowStatus.includes('declined')) {
                    showRow = false;
                }
            }
        }
        
        // Filter by category (check property name for type)
        if (showRow && categoryValue !== 'all') {
            const propertyName = row.querySelector('.table-property strong');
            if (propertyName) {
                const name = propertyName.textContent.toLowerCase();
                if (categoryValue === 'house' && !name.includes('house')) {
                    showRow = false;
                } else if (categoryValue === 'apartment' && !name.includes('apartment')) {
                    showRow = false;
                } else if (categoryValue === 'condo' && !name.includes('condo')) {
                    showRow = false;
                } else if (categoryValue === 'villa' && !name.includes('villa')) {
                    showRow = false;
                } else if (categoryValue === 'cabin' && !name.includes('cabin')) {
                    showRow = false;
                }
            }
        }
        
        // Filter by search text
        if (showRow && searchValue) {
            const rowText = row.textContent.toLowerCase();
            if (!rowText.includes(searchValue)) {
                showRow = false;
            }
        }
        
        // Show/hide row
        row.style.display = showRow ? '' : 'none';
        if (showRow) visibleCount++;
    });
    
    // Update pagination info
    updatePaginationInfo('propertiesTable', visibleCount);
    
    if (visibleCount === 0) {
        showNotification('No properties match the selected filters', 'info');
    }
}

/**
 * Filter Users
 */
function filterUsers() {
    const userTypeFilter = document.getElementById('userTypeFilter');
    const userStatusFilter = document.getElementById('userStatusFilter');
    const userSearch = document.getElementById('userSearch');
    const usersTable = document.getElementById('usersTable');
    
    if (!usersTable) return;
    
    const typeValue = userTypeFilter ? userTypeFilter.value : 'all';
    const statusValue = userStatusFilter ? userStatusFilter.value : 'all';
    const searchValue = userSearch ? userSearch.value.toLowerCase() : '';
    
    const tbody = usersTable.querySelector('tbody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        let showRow = true;
        
        // Filter by user type
        if (typeValue !== 'all') {
            const typeBadge = row.querySelector('.user-type-badge');
            if (typeBadge) {
                const rowType = typeBadge.textContent.toLowerCase();
                if (typeValue === 'guest' && !rowType.includes('guest')) {
                    showRow = false;
                } else if (typeValue === 'host' && !rowType.includes('host')) {
                    showRow = false;
                } else if (typeValue === 'admin' && !rowType.includes('admin')) {
                    showRow = false;
                }
            }
        }
        
        // Filter by status
        if (showRow && statusValue !== 'all') {
            const statusBadge = row.querySelector('.status-badge');
            if (statusBadge) {
                const rowStatus = statusBadge.textContent.toLowerCase();
                if (statusValue === 'active' && !rowStatus.includes('active')) {
                    showRow = false;
                } else if (statusValue === 'suspended' && !rowStatus.includes('suspended')) {
                    showRow = false;
                }
            }
        }
        
        // Filter by search text
        if (showRow && searchValue) {
            const rowText = row.textContent.toLowerCase();
            if (!rowText.includes(searchValue)) {
                showRow = false;
            }
        }
        
        // Show/hide row
        row.style.display = showRow ? '' : 'none';
        if (showRow) visibleCount++;
    });
    
    // Update pagination info
    updatePaginationInfo('usersTable', visibleCount);
    
    if (visibleCount === 0) {
        showNotification('No users match the selected filters', 'info');
    }
}

/**
 * Filter Bookings
 */
function filterBookings() {
    const bookingStatusFilter = document.getElementById('bookingStatusFilter');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    const bookingSearch = document.getElementById('bookingSearch');
    const bookingsTable = document.getElementById('bookingsTable');
    
    if (!bookingsTable) return;
    
    const statusValue = bookingStatusFilter ? bookingStatusFilter.value : 'all';
    const fromValue = dateFrom ? dateFrom.value : '';
    const toValue = dateTo ? dateTo.value : '';
    const searchValue = bookingSearch ? bookingSearch.value.toLowerCase() : '';
    
    const tbody = bookingsTable.querySelector('tbody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        let showRow = true;
        
        // Filter by status
        if (statusValue !== 'all') {
            const statusBadge = row.querySelector('.status-badge');
            if (statusBadge) {
                const rowStatus = statusBadge.textContent.toLowerCase();
                if (statusValue === 'confirmed' && !rowStatus.includes('confirmed')) {
                    showRow = false;
                } else if (statusValue === 'pending' && !rowStatus.includes('pending')) {
                    showRow = false;
                } else if (statusValue === 'completed' && !rowStatus.includes('completed')) {
                    showRow = false;
                } else if (statusValue === 'cancelled' && !rowStatus.includes('cancelled')) {
                    showRow = false;
                }
            }
        }
        
        // Filter by date range
        if (showRow && (fromValue || toValue)) {
            const checkInCell = row.querySelector('td:nth-child(4)');
            if (checkInCell) {
                const checkInDate = new Date(checkInCell.textContent);
                const fromDate = fromValue ? new Date(fromValue) : null;
                const toDate = toValue ? new Date(toValue) : null;
                
                if (fromDate && checkInDate < fromDate) {
                    showRow = false;
                } else if (toDate && checkInDate > toDate) {
                    showRow = false;
                }
            }
        }
        
        // Filter by search text
        if (showRow && searchValue) {
            const rowText = row.textContent.toLowerCase();
            if (!rowText.includes(searchValue)) {
                showRow = false;
            }
        }
        
        // Show/hide row
        row.style.display = showRow ? '' : 'none';
        if (showRow) visibleCount++;
    });
    
    // Update pagination info
    updatePaginationInfo('bookingsTable', visibleCount);
    
    if (visibleCount === 0) {
        showNotification('No bookings match the selected filters', 'info');
    }
}

/**
 * Update Pagination Info
 */
function updatePaginationInfo(tableId, visibleCount) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const paginationInfo = table.closest('.admin-tab-content').querySelector('.pagination-info');
    if (paginationInfo) {
        const totalText = paginationInfo.textContent.match(/of (\d+)/);
        const total = totalText ? parseInt(totalText[1]) : visibleCount;
        paginationInfo.textContent = `Showing ${visibleCount} of ${total} items`;
    }
}

/**
 * Approve Property
 */
function approveProperty(propertyId) {
    if (confirm('Are you sure you want to approve this property?')) {
        showNotification('Property approved successfully', 'success');
        // Add your approval logic here
        // Remove the item from pending list
        const pendingItem = document.querySelector(`[onclick="approveProperty(${propertyId})"]`).closest('.pending-item');
        if (pendingItem) {
            pendingItem.remove();
        }
        // Update stats
        updateStats('pendingApproval', -1);
        updateStats('activeListings', 1);
    }
}

/**
 * Decline Property
 */
function declineProperty(propertyId) {
    const reason = prompt('Please provide a reason for declining:');
    if (reason !== null) {
        showNotification('Property declined', 'info');
        // Add your decline logic here
        // Remove the item from pending list
        const pendingItem = document.querySelector(`[onclick="declineProperty(${propertyId})"]`).closest('.pending-item');
        if (pendingItem) {
            pendingItem.remove();
        }
        // Update stats
        updateStats('pendingApproval', -1);
    }
}

/**
 * Switch Tab
 */
function switchTab(tabName) {
    const tab = document.querySelector(`[data-tab="${tabName}"]`);
    if (tab) {
        tab.click();
    }
}

/**
 * Update Stats
 */
function updateStats(statId, change) {
    const statElement = document.getElementById(statId);
    if (statElement) {
        const currentValue = parseInt(statElement.textContent.replace(/,/g, ''));
        const newValue = currentValue + change;
        statElement.textContent = newValue.toLocaleString();
    }
}

/**
 * Export to CSV
 */
function exportToCSV(type) {
    showNotification(`Exporting ${type} to CSV...`, 'info');
    // Add your export logic here
    setTimeout(() => {
        showNotification(`${type} exported successfully`, 'success');
    }, 1000);
}

/**
 * Show Modal
 */
function showModal(title, content) {
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'admin-modal-overlay';
    modal.innerHTML = `
        <div class="admin-modal">
            <div class="admin-modal-header">
                <h3>${title}</h3>
                <button class="admin-modal-close">&times;</button>
            </div>
            <div class="admin-modal-content">
                ${content}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add close functionality
    const closeBtn = modal.querySelector('.admin-modal-close');
    closeBtn.addEventListener('click', () => modal.remove());
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

/**
 * Get Add Admin Modal Content
 */
function getAddAdminModalContent() {
    return `
        <form class="admin-modal-form">
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" placeholder="Enter full name" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" placeholder="Enter email" required>
            </div>
            <div class="form-group">
                <label>Role</label>
                <select required>
                    <option value="">Select role</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="support">Support</option>
                    <option value="moderator">Moderator</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-admin-secondary" onclick="this.closest('.admin-modal-overlay').remove()">Cancel</button>
                <button type="submit" class="btn-admin-primary">Add Admin</button>
            </div>
        </form>
    `;
}

/**
 * Get Add User Modal Content
 */
function getAddUserModalContent() {
    return `
        <form class="admin-modal-form">
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" placeholder="Enter full name" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" placeholder="Enter email" required>
            </div>
            <div class="form-group">
                <label>User Type</label>
                <select required>
                    <option value="">Select type</option>
                    <option value="guest">Guest</option>
                    <option value="host">Host</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-admin-secondary" onclick="this.closest('.admin-modal-overlay').remove()">Cancel</button>
                <button type="submit" class="btn-admin-primary">Add User</button>
            </div>
        </form>
    `;
}

/**
 * Show Notification
 */
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.admin-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `admin-notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Add close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => notification.remove());
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('notification-fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Debounce Helper
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Make functions globally available for onclick handlers
window.approveProperty = approveProperty;
window.declineProperty = declineProperty;
window.switchTab = switchTab;