// Hero Carousel Functionality
function initHeroCarousel() {
    const heroCakes = document.querySelectorAll('.hero-cake');
    const heroDots = document.querySelectorAll('.hero-dot');
    let currentSlide = 0;
    let touchStartX = 0;
    let touchEndX = 0;
    let isTransitioning = false;

    function showSlide(index) {
        // Prevent rapid transitions
        if (isTransitioning) return;
        
        // Ensure index is within bounds
        if (index < 0) index = heroCakes.length - 1;
        if (index >= heroCakes.length) index = 0;
        
        isTransitioning = true;
        
        // Hide all slides with proper transition
        heroCakes.forEach(cake => {
            cake.classList.remove('active');
            cake.style.opacity = '0';
            cake.style.transform = 'scale(0.9)';
        });
        
        // Remove active class from all dots
        heroDots.forEach(dot => {
            dot.classList.remove('active');
        });
        
        // Show current slide and activate corresponding dot
        if (heroCakes[index]) {
            heroCakes[index].classList.add('active');
            heroCakes[index].style.opacity = '1';
            heroCakes[index].style.transform = 'scale(1)';
        }
        if (heroDots[index]) {
            heroDots[index].classList.add('active');
        }
        
        currentSlide = index;
        
        // Allow transitions again after animation completes
        setTimeout(() => {
            isTransitioning = false;
        }, 600); // Match CSS transition duration
    }

    function nextSlide() {
        const nextIndex = (currentSlide + 1) % heroCakes.length;
        showSlide(nextIndex);
    }

    function prevSlide() {
        const prevIndex = (currentSlide - 1 + heroCakes.length) % heroCakes.length;
        showSlide(prevIndex);
    }

    // Add click event listeners to dots
    heroDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            if (!isTransitioning) {
                showSlide(index);
            }
        });
    });

    // Initialize first slide
    if (heroCakes.length > 0) {
        showSlide(0);
    }

    // Touch/swipe functionality for mobile
    const heroGallery = document.querySelector('.hero-gallery');
    if (heroGallery) {
        // Touch events for mobile swipe
        heroGallery.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        heroGallery.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const swipeThreshold = 50; // Minimum swipe distance
            const swipeDistance = touchEndX - touchStartX;
            
            if (Math.abs(swipeDistance) > swipeThreshold && !isTransitioning) {
                if (swipeDistance > 0) {
                    // Swipe right - go to previous slide
                    prevSlide();
                } else {
                    // Swipe left - go to next slide
                    nextSlide();
                }
            }
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!isTransitioning) {
                if (e.key === 'ArrowLeft') {
                    prevSlide();
                } else if (e.key === 'ArrowRight') {
                    nextSlide();
                }
            }
        });
    }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initHeroCarousel();
});

// Mobile Navigation Toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on nav links
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar scroll effect
const navbar = document.getElementById('navbar');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.backdropFilter = 'blur(10px)';
    } else {
        navbar.style.background = 'var(--white)';
        navbar.style.backdropFilter = 'none';
    }
    
    lastScrollY = window.scrollY;
});

// Netlify form handling - form will be handled automatically by Netlify
// No additional JavaScript needed for form submission

// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    `;
    
    if (type === 'success') {
        notification.style.background = '#4CAF50';
    } else if (type === 'error') {
        notification.style.background = '#f44336';
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 4000);
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animations
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.menu-item, .gallery-item, .info-item');
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
});

// Active navigation highlighting
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const scrollPos = window.scrollY + 100;
    
    sections.forEach(section => {
        const top = section.offsetTop;
        const bottom = top + section.offsetHeight;
        const id = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${id}"]`);
        
        if (scrollPos >= top && scrollPos <= bottom) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            if (navLink) {
                navLink.classList.add('active');
            }
        }
    });
});

// Gallery hover effects enhancement
document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    item.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Menu item hover effects enhancement
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    item.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Loading animation for page
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Keyboard accessibility improvements
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// Focus management for mobile menu
hamburger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        hamburger.click();
    }
});

// Preload important images (when actual images are added)
const imageUrls = [
    // Add actual image URLs here when available
];

imageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
});

// Performance optimization: Debounced scroll handler
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

// Apply debouncing to scroll events
const debouncedScrollHandler = debounce(() => {
    // Scroll-dependent functionality here
}, 16); // ~60fps

window.addEventListener('scroll', debouncedScrollHandler);

// Order Form Functionality
document.addEventListener('DOMContentLoaded', function() {
    const orderForm = document.getElementById('order-form');
    const layersSelect = document.getElementById('cake-layers');
    const sizeSelect = document.getElementById('cake-size');
    const basePriceElement = document.getElementById('base-price');
    const fillingsPriceElement = document.getElementById('fillings-price');
    const extrasPriceElement = document.getElementById('extras-price');
    const totalPriceElement = document.getElementById('total-price');

    // Pricing structure based on your menu
    const basePrices = {
        2: { 6: 60, 8: 70, 10: 80 },
        3: { 6: 70, 8: 80, 10: 90 },
        4: { 6: 80, 8: 90, 10: 100 }
    };

    // Calculate and update pricing
    function updatePricing() {
        const layers = parseInt(layersSelect.value) || 0;
        const size = parseInt(sizeSelect.value) || 0;
        
        // Calculate base price
        let basePrice = 0;
        if (layers && size && basePrices[layers] && basePrices[layers][size]) {
            basePrice = basePrices[layers][size];
        }

        // Calculate fillings price
        let fillingsPrice = 0;
        const fillingCheckboxes = document.querySelectorAll('input[name="flavors"]:checked:not([disabled])');
        fillingCheckboxes.forEach(checkbox => {
            const price = parseFloat(checkbox.getAttribute('data-price')) || 0;
            fillingsPrice += price;
        });

        // Calculate extras price
        let extrasPrice = 0;
        const extraCheckboxes = document.querySelectorAll('input[name="extras"]:checked');
        extraCheckboxes.forEach(checkbox => {
            const price = parseFloat(checkbox.getAttribute('data-price')) || 0;
            extrasPrice += price;
        });

        // Update display
        basePriceElement.textContent = `$${basePrice}`;
        fillingsPriceElement.textContent = `$${fillingsPrice}`;
        extrasPriceElement.textContent = `$${extrasPrice}`;
        
        const total = basePrice + fillingsPrice + extrasPrice;
        totalPriceElement.textContent = `$${total}`;
    }

    // Add event listeners for price updates
    if (layersSelect) layersSelect.addEventListener('change', updatePricing);
    if (sizeSelect) sizeSelect.addEventListener('change', updatePricing);
    
    // Add listeners for all checkboxes
    document.querySelectorAll('input[name="flavors"], input[name="extras"]').forEach(checkbox => {
        checkbox.addEventListener('change', updatePricing);
    });

    // Form submission handling
    if (orderForm) {
        orderForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Basic form validation for required fields
            const requiredFields = ['name', 'phone', 'layers', 'size', 'colors', 'message', 'occasion', 'eventDate', 'pickupTime', 'delivery', 'pricingAck', 'termsAck'];

            // Check if all required fields are filled
            for (let fieldName of requiredFields) {
                const field = orderForm.querySelector(`[name="${fieldName}"]`);
                if (!field || !field.value.trim()) {
                    showNotification('Please fill in all required fields.', 'error');
                    return;
                }
            }

            // Check that at least one flavor is selected
            const flavorChecked = orderForm.querySelector('input[name="flavors"]:checked');
            if (!flavorChecked) {
                showNotification('Please select at least one flavor.', 'error');
                return;
            }

            // Validate event date (should be in the future)
            const eventDateField = orderForm.querySelector('[name="eventDate"]');
            const eventDate = new Date(eventDateField.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (eventDate < today) {
                showNotification('Event date must be in the future.', 'error');
                return;
            }

            // Check if event date is within reasonable timeframe (at least 3 days from now)
            const minDate = new Date();
            minDate.setDate(minDate.getDate() + 3);
            minDate.setHours(0, 0, 0, 0);
            
            if (eventDate < minDate) {
                showNotification('Please allow at least 3 days for cake preparation.', 'error');
                return;
            }

            // Collect form data
            const submitBtn = orderForm.querySelector('.submit-order-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Submitting Order...';
            submitBtn.disabled = true;

            try {
                // Collect all form data
                const formData = new FormData(orderForm);
                
                // Collect selected flavors and extras
                const flavors = Array.from(orderForm.querySelectorAll('input[name="flavors"]:checked'))
                    .map(cb => cb.value).join(', ');
                const extras = Array.from(orderForm.querySelectorAll('input[name="extras"]:checked'))
                    .map(cb => cb.value).join(', ');
                
                // Create data object for submission
                const orderData = {
                    name: formData.get('name'),
                    phone: formData.get('phone'),
                    shape: formData.get('shape'),
                    servings: formData.get('servings'),
                    layers: formData.get('layers'),
                    size: formData.get('size'),
                    flavors: flavors,
                    extras: extras,
                    colors: formData.get('colors'),
                    message: formData.get('message'),
                    occasion: formData.get('occasion'),
                    eventDate: formData.get('eventDate'),
                    pickupTime: formData.get('pickupTime'),
                    delivery: formData.get('delivery'),
                    pricingAck: formData.get('pricingAck'),
                    termsAck: formData.get('termsAck')
                };

                // Google Apps Script web app URL
                const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyqWNlM6jJkzJNJi5h0na0YbzksCwtCG0D9mdCP26onxj_rOr2UdpR10UO86_zmgz_I/exec';

                // Submit to Google Apps Script
                const response = await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams(orderData)
                });

                const result = await response.json();

                if (result.status === 'success') {
                    showNotification('Thank you for your order! We\'ll review your request and get back to you within 24 hours.', 'success');
                    
                    // Reset form
                    orderForm.reset();
                    updatePricing(); // Reset pricing display
                } else {
                    throw new Error(result.message || 'Submission failed');
                }

            } catch (error) {
                console.error('Form submission error:', error);
                showNotification('Sorry, there was an error submitting your order. Please try again or contact us directly.', 'error');
            }

            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    }



    // Initialize pricing display
    updatePricing();
});