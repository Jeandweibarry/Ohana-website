function initAccountSettings() {
    const links = Array.from(document.querySelectorAll(".sidebar-link"));
    const sections = Array.from(document.querySelectorAll(".content-section"));
    const sidebar = document.querySelector(".settings-sidebar");
    const container = document.querySelector(".settings-content");
    const settingsWrapper = document.querySelector(".settings-wrapper");
    const settingsContainer = document.querySelector(".account-settings-container");

    if (!links.length || !sections.length) {
        return;
    }

    const validIds = new Set(sections.map((section) => section.id));

    function setActiveSection(sectionId, updateHash) {
        if (!validIds.has(sectionId)) {
            return;
        }

        links.forEach((link) => {
            const isActive = link.dataset.section === sectionId;
            link.classList.toggle("active", isActive);
            link.setAttribute("aria-current", isActive ? "page" : "false");
        });

        sections.forEach((section) => {
            section.classList.toggle("active", section.id === sectionId);
        });

        clearUploadFeedback();

        if (updateHash) {
            history.replaceState(null, "", `#${sectionId}`);
        }

        if (window.matchMedia("(max-width: 900px)").matches && sidebar) {
            sidebar.classList.remove("mobile-open");
            const toggleButton = document.querySelector(".settings-mobile-toggle");
            if (toggleButton) {
                toggleButton.classList.remove("is-open");
                toggleButton.setAttribute("aria-expanded", "false");
            }
        }
    }

    function getRequestedSection() {
        const hashId = window.location.hash.replace("#", "");
        if (hashId && validIds.has(hashId)) {
            return hashId;
        }

        const currentLink = links.find((link) => link.classList.contains("active"));
        return currentLink?.dataset.section || sections[0].id;
    }

    links.forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const sectionId = link.dataset.section;
            if (sectionId) {
                setActiveSection(sectionId, true);
            }
        });
    });

    window.addEventListener("hashchange", () => {
        const sectionId = window.location.hash.replace("#", "");
        if (validIds.has(sectionId)) {
            setActiveSection(sectionId, false);
        }
    });

    if (sidebar && container && !document.querySelector(".settings-mobile-toggle")) {
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "btn-secondary settings-mobile-toggle";
        toggle.setAttribute("aria-expanded", "false");
        toggle.innerHTML = 'Menu <span class="settings-mobile-toggle-icon">&#9662;</span>';

        toggle.addEventListener("click", () => {
            const isOpen = sidebar.classList.toggle("mobile-open");
            toggle.classList.toggle("is-open", isOpen);
            toggle.setAttribute("aria-expanded", String(isOpen));
        });

        if (settingsContainer && settingsWrapper) {
            settingsContainer.insertBefore(toggle, settingsWrapper);
        } else {
            container.parentNode.insertBefore(toggle, container);
        }
    }

    setActiveSection(getRequestedSection(), false);
}

document.addEventListener('DOMContentLoaded', () => {
    const DEFAULT_AVATAR = '/resources/images/default_pic.jpg';
    const profileForm = document.querySelector('.profile-form');
    const firstNameInput = document.getElementById('firstNameInput');
    const lastNameInput = document.getElementById('lastNameInput');
    const phoneInput = document.getElementById('phoneInput');
    const usernameInput = document.getElementById('usernameInput');
    const addressInput = document.getElementById('addressInput');
    const emailInput = document.getElementById('emailInput');
    const profileEditSaveBtn = document.getElementById('profileEditSaveBtn');
    const profileAvatar = document.getElementById('profileAvatar');
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const fileInput = document.getElementById('profilePhotoInput');
    const uploadFeedback = document.getElementById('profilePhotoFeedback');

    const editableInputs = [usernameInput, firstNameInput, lastNameInput, phoneInput, addressInput].filter(Boolean);
    let isProfileEditing = false;
    let currentProfileSnapshot = null;

    if (profileForm) {
        profileForm.addEventListener('submit', (event) => {
            event.preventDefault();
        });
    }

    function showFeedback(message, isError) {
        if (!uploadFeedback) {
            return;
        }

        uploadFeedback.textContent = message || '';
        uploadFeedback.classList.toggle('is-error', Boolean(isError));
    }

    function clearUploadFeedback() {
        showFeedback('', false);
    }

    function setProfileEditingState(isEditing) {
        isProfileEditing = isEditing;
        editableInputs.forEach((input) => {
            input.disabled = !isEditing;
        });

        if (profileEditSaveBtn) {
            profileEditSaveBtn.textContent = isEditing ? 'Save Profile' : 'Edit Profile';
            profileEditSaveBtn.classList.toggle('is-editing', isEditing);
        }
    }

    function setAvatarImage(url) {
        if (!profileAvatar) {
            return;
        }

        const nextUrl = url || profileAvatar.getAttribute('src') || DEFAULT_AVATAR;
        profileAvatar.src = nextUrl;
        profileAvatar.onerror = () => {
            profileAvatar.onerror = null;
            profileAvatar.src = DEFAULT_AVATAR;
        };
    }

    async function getCurrentUser() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        return user;
    }

    function refreshHeaderUserData() {
        if (typeof window.loadUserData === 'function') {
            window.loadUserData();
        }
    }

    function extractBucketPathFromPublicUrl(url, bucketName) {
        if (!url || typeof url !== 'string') {
            return null;
        }

        try {
            const parsed = new URL(url);
            const marker = `/storage/v1/object/public/${bucketName}/`;
            const index = parsed.pathname.indexOf(marker);
            if (index === -1) {
                return null;
            }
            return decodeURIComponent(parsed.pathname.slice(index + marker.length));
        } catch (_error) {
            return null;
        }
    }

    // --- 1. FETCH PROFILE DATA ---
    async function loadProfileData() {
        const user = await getCurrentUser();
        if (!user) {
            return;
        }

        if (emailInput) {
            emailInput.value = user.email || '';
        }

        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('username, first_name, last_name, phone_number, address, avatar_url')
            .eq('profile_id', user.id)
            .single();

        if (error) {
            console.error('Failed to load profile:', error.message);
            return;
        }

        if (!profile) {
            return;
        }

        if (firstNameInput) {
            firstNameInput.value = profile.first_name || '';
        }
        if (usernameInput) {
            usernameInput.value = profile.username || '';
        }
        if (lastNameInput) {
            lastNameInput.value = profile.last_name || '';
        }
        if (phoneInput) {
            phoneInput.value = profile.phone_number || '';
        }
        if (addressInput) {
            addressInput.value = profile.address || '';
        }

        currentProfileSnapshot = {
            username: profile.username || '',
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            phone_number: profile.phone_number || '',
            address: profile.address || '',
        };

        setAvatarImage(profile.avatar_url);
    }

    async function saveProfileData() {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('You must be logged in to update your profile.');
        }

        const nextValues = {
            username: usernameInput ? usernameInput.value.trim() : '',
            first_name: firstNameInput ? firstNameInput.value.trim() : '',
            last_name: lastNameInput ? lastNameInput.value.trim() : '',
            phone_number: phoneInput ? phoneInput.value.trim() : '',
            address: addressInput ? addressInput.value.trim() : '',
        };

        const baseline = currentProfileSnapshot || {
            username: '',
            first_name: '',
            last_name: '',
            phone_number: '',
            address: '',
        };

        const payload = Object.fromEntries(
            Object.entries(nextValues).filter(([key, value]) => (baseline[key] || '') !== value)
        );

        if (Object.keys(payload).length === 0) {
            return;
        }

        const { data, error } = await supabaseClient
            .from('profiles')
            .update(payload)
            .eq('profile_id', user.id)
            .select('profile_id');

        if (error) {
            throw new Error(error.message || 'Could not update profile.');
        }

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Profile update was blocked. Please verify Supabase update policy for profiles table.');
        }

        currentProfileSnapshot = {
            ...baseline,
            ...payload,
        };
    }

    // --- 2. SINGLE PROFILE EDIT/SAVE ---
    if (profileEditSaveBtn) {
        profileEditSaveBtn.addEventListener('click', async () => {
            if (!isProfileEditing) {
                clearUploadFeedback();
                setProfileEditingState(true);
                if (editableInputs[0]) {
                    editableInputs[0].focus();
                    editableInputs[0].select();
                }
                return;
            }

            profileEditSaveBtn.disabled = true;
            const originalLabel = profileEditSaveBtn.textContent;
            profileEditSaveBtn.textContent = 'Saving...';

            try {
                await saveProfileData();
                setProfileEditingState(false);
                showFeedback('Profile updated successfully.', false);
                refreshHeaderUserData();
            } catch (err) {
                profileEditSaveBtn.textContent = originalLabel;
                showFeedback(err.message || 'Unable to update profile.', true);
            } finally {
                profileEditSaveBtn.disabled = false;
            }
        });
    }

    // --- 3. DIRECT PHOTO UPLOAD TO SUPABASE ---
    async function uploadProfilePhoto(file) {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('You must be logged in to upload a photo.');
        }

        const { data: currentProfile, error: profileReadError } = await supabaseClient
            .from('profiles')
            .select('avatar_url')
            .eq('profile_id', user.id)
            .single();

        if (profileReadError) {
            throw new Error(profileReadError.message || 'Unable to read current profile photo.');
        }

        const previousAvatarPath = extractBucketPathFromPublicUrl(currentProfile?.avatar_url, 'avatars');

        const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabaseClient.storage
            .from('avatars')
            .upload(fileName, file, { upsert: true });

        if (uploadError) {
            const bucketMissing = (uploadError.message || '').toLowerCase().includes('bucket not found');
            if (bucketMissing) {
                throw new Error('Photo upload is not configured yet (storage bucket missing). Your current profile icon is unchanged.');
            }
            throw new Error(uploadError.message || 'Photo upload failed.');
        }

        const { data: publicUrlData } = supabaseClient.storage
            .from('avatars')
            .getPublicUrl(fileName);

        const publicUrl = publicUrlData?.publicUrl;
        if (!publicUrl) {
            throw new Error('Could not resolve uploaded photo URL.');
        }

        const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('profile_id', user.id);

        if (updateError) {
            throw new Error(updateError.message || 'Could not save photo URL to profile.');
        }

        if (previousAvatarPath && previousAvatarPath !== fileName) {
            const { error: deleteError } = await supabaseClient.storage
                .from('avatars')
                .remove([previousAvatarPath]);

            if (deleteError) {
                console.warn('Previous avatar cleanup failed:', deleteError.message);
            }
        }

        return publicUrl;
    }

    if (changePhotoBtn && fileInput) {
        changePhotoBtn.addEventListener('click', () => {
            showFeedback('', false);
            fileInput.click();
        });

        fileInput.addEventListener('change', async () => {
            const file = fileInput.files?.[0];
            if (!file) {
                return;
            }

            if (!file.type.startsWith('image/')) {
                showFeedback('Please choose a valid image file.', true);
                fileInput.value = '';
                return;
            }

            changePhotoBtn.disabled = true;
            const originalLabel = changePhotoBtn.textContent;
            changePhotoBtn.textContent = 'Uploading...';
            showFeedback('', false);

            try {
                const url = await uploadProfilePhoto(file);
                setAvatarImage(url);
                showFeedback('Profile photo updated.', false);
                refreshHeaderUserData();
            } catch (err) {
                showFeedback(err.message || 'Unable to upload photo.', true);
            } finally {
                changePhotoBtn.disabled = false;
                changePhotoBtn.textContent = originalLabel;
                fileInput.value = '';
            }
        });
    }

    if (typeof supabaseClient !== 'undefined') {
        setProfileEditingState(false);
        setAvatarImage('');
        loadProfileData();
    }
});

// ------------------------------------- CSS -------------------------------------

const modalStyles = `
.account-settings-page {
    margin-top: 80px;
}

.account-settings-container {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 2rem;
    padding: 0;
}

.settings-wrapper {
    display: contents;
}

.settings-sidebar {
    background: linear-gradient(180deg, #1c1c1c 0%, #171717 100%);
    padding: 1.25rem;
    border-radius: 0;
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: 0 14px 30px rgba(0, 0, 0, 0.22);
    height: fit-content;
    position: sticky;
    top: 100px;
}

.sidebar-title {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.78);
    margin-bottom: 0.65rem;
    margin-top: 1.15rem;
    padding-left: 0.35rem;
}

.sidebar-title:first-child {
    margin-top: 0;
}

.sidebar-menu {
    list-style: none;
    padding: 0;
    margin: 0 0 0.45rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.sidebar-menu li {
    margin-bottom: 0;
}

.sidebar-link {
    display: block;
    position: relative;
    padding: 0.62rem 0.85rem 0.62rem 1.15rem;
    color: var(--color-warm-white);
    text-decoration: none;
    border-radius: 0;
    transition: background 0.25s ease, color 0.25s ease, transform 0.2s ease;
    font-size: 0.9rem;
    line-height: 1.25;
}

.sidebar-link::before {
    content: "";
    position: absolute;
    left: 0.55rem;
    top: 50%;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    transform: translateY(-50%);
    transition: background 0.25s ease, box-shadow 0.25s ease;
}

.sidebar-link:hover,
.sidebar-link.active {
    background: var(--color-blue-dark);
    color: var(--color-warm-white);
    transform: translateX(2px);
}

.sidebar-link:hover::before,
.sidebar-link.active::before {
    background: #ffffff;
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.18);
}

.settings-content {
    background: white;
    padding: 2rem;
    border-radius: 0;
    border: 1px solid #e6e2da;
}

.settings-content h1 {
    margin-bottom: 1rem;
}

.content-section {
    display: none;
}

.content-section.active {
    display: block;
}

.settings-mobile-toggle {
    display: none;
}

#account-settings .profile-picture img,
#account-settings .profile-icon,
#account-settings .avatar-icon {
    border-radius: 50%;
}

#account-settings .profile-container {
    display: block;
}

#account-settings .profile-picture {
    width: 88px;
    height: 88px;
}

#account-settings .profile-picture img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: 1px solid #d8d1c6;
}

#account-settings .profile-picture-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.65rem;
}

#account-settings .profile-form,
#account-settings .payment-container,
#account-settings .privacy-container,
#account-settings .transactions-container {
    display: grid;
    gap: 0.9rem;
}

#account-settings .profile-form {
    max-width: 760px;
}

#account-settings .form-group {
    margin: 0;
}

#account-settings .form-group > label {
    display: block;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #5b5a56;
    margin-bottom: 0.4rem;
}

#account-settings .form-input-wrapper,
#account-settings .saved-cards,
#account-settings .add-payment,
#account-settings .privacy-item,
#account-settings .delete-container,
#account-settings .no-bookings,
#account-settings .no-saved,
#account-settings .no-reviews,
#account-settings .no-transactions,
#account-settings .transactions-filters,
#account-settings .transaction-item {
    border-radius: 0;
    border: 1px solid #e4dfd5;
    background: #fbfaf8;
}

#account-settings .form-input-wrapper,
#account-settings .transactions-filters,
#account-settings .transaction-item {
    padding: 0.65rem 0.75rem;
}

#account-settings .form-input-wrapper {
    display: flex;
    align-items: stretch;
    gap: 0.55rem;
}

#account-settings .saved-cards,
#account-settings .add-payment,
#account-settings .privacy-item,
#account-settings .delete-container,
#account-settings .no-bookings,
#account-settings .no-saved,
#account-settings .no-reviews,
#account-settings .no-transactions {
    padding: 1rem;
}

#account-settings .form-input,
#account-settings .filter-input,
#account-settings .filter-select {
    width: 100%;
    min-width: 0;
    border: 1px solid #d4cebf;
    background: #fff;
    padding: 0.52rem 0.6rem;
    border-radius: 0;
    min-height: 42px;
}

#account-settings .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
}

#account-settings .transactions-filters {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.65rem;
}

#account-settings .transaction-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
}

#account-settings .transaction-info {
    min-width: 0;
}

#account-settings .btn-secondary,
#account-settings .btn-primary,
#account-settings .btn-danger,
.settings-mobile-toggle {
    border-radius: 0;
}

#account-settings .btn-primary,
#account-settings .btn-secondary:not(.settings-mobile-toggle),
#account-settings .btn-danger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 0.62rem 0.95rem;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border: 1px solid var(--color-charcoal);
    background: var(--color-charcoal);
    color: var(--color-warm-white);
}

#account-settings .btn-primary:hover,
#account-settings .btn-secondary:not(.settings-mobile-toggle):hover,
#account-settings .btn-danger:hover {
    background: var(--color-blue-dark);
    border-color: var(--color-blue-dark);
    color: var(--color-warm-white);
}

#account-settings .form-input-wrapper .btn-secondary:not(.settings-mobile-toggle),
#account-settings .form-input-wrapper .btn-danger,
#account-settings .form-input-wrapper .btn-primary {
    align-self: stretch;
    min-height: 42px;
    margin: 0;
    white-space: nowrap;
}

.settings-mobile-toggle-icon {
    display: inline-flex;
    align-items: center;
    transition: transform 0.25s ease;
}

.settings-mobile-toggle.is-open .settings-mobile-toggle-icon {
    transform: rotate(180deg);
}

@media (max-width: 900px) {
    .account-settings-container {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .settings-mobile-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        gap: 0.5rem;
        margin-bottom: 0.7rem;
        padding: 0.65rem 0.9rem;
        border-radius: 0;
    }

    .settings-sidebar {
        display: block;
        position: relative;
        top: 0;
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        transform: translateY(-8px);
        transition: max-height 0.35s ease, opacity 0.25s ease, transform 0.25s ease, margin-bottom 0.25s ease;
        pointer-events: none;
    }

    .settings-sidebar.mobile-open {
        max-height: 520px;
        opacity: 1;
        transform: translateY(0);
        margin-bottom: 1rem;
        pointer-events: auto;
    }

    .settings-wrapper {
        display: block;
    }

    .settings-content {
        padding: 1.5rem;
    }

    #account-settings .profile-container {
        grid-template-columns: 1fr;
    }

    #account-settings .profile-picture-section {
        flex-direction: row;
        justify-content: flex-start;
    }

    #account-settings .transactions-filters,
    #account-settings .form-row {
        grid-template-columns: 1fr;
    }

    #account-settings .transaction-item {
        flex-wrap: wrap;
    }
}
`;

function injectAccountSettingsStyles() {
    if (document.getElementById("account-settings-inline-style")) {
        return;
    }

    const styleSheet = document.createElement("style");
    styleSheet.id = "account-settings-inline-style";
    styleSheet.textContent = modalStyles;
    document.head.appendChild(styleSheet);
}


injectAccountSettingsStyles();

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAccountSettings);
} else {
    initAccountSettings();
}