// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Handle form submission
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        alert('Thank you for your message! We will get back to you soon.');
        this.reset();
    });
}

// Add animation on scroll
const observerOptions = {
    threshold: 0.3,
    rootMargin: '-150px 0px -100px 0px'
};

const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }        
        if (!(entry.isIntersecting)) {
            entry.target.style.opacity = '0';
            entry.target.style.transform = 'translateY(1)';
        }
    });
}, observerOptions);

document.querySelectorAll('.service-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s, transform 0.5s';
    observer.observe(card);
});

// Map initialization function for Google Maps API
function initMap() {
  const myLatLng = { lat: -34.397, lng: 150.644 };

  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 8, // Initial zoom level
    center: myLatLng,
  });

  // Marker
  new google.maps.Marker({
    position: myLatLng,
    map,
    title: "Testing",
  });
}
