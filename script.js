let heroCarouselInitialized = false;

// Enhanced Hero Carousel Functionality
function initHeroCarousel() {
    if (heroCarouselInitialized) return;

    const heroCakes = document.querySelectorAll('.hero-cake');
    const heroDots = document.querySelectorAll('.hero-dot');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const heroGallery = document.querySelector('.hero-gallery');

    if (heroCakes.length === 0) return;

    heroCarouselInitialized = true;
    
    let currentSlide = 0;
    let touchStartX = 0;
    let touchEndX = 0;
    let isTransitioning = false;
    let autoPlayInterval;
    const slideDuration = 5000; // 5 seconds per slide

    function showSlide(index) {
        if (isTransitioning) return;
        
        // Ensure index is within bounds
        if (index < 0) index = heroCakes.length - 1;
        if (index >= heroCakes.length) index = 0;
        
        isTransitioning = true;
        
        // Hide all slides
        heroCakes.forEach(cake => {
            cake.classList.remove('active');
        });
        
        // Remove active class from all dots
        heroDots.forEach(dot => {
            dot.classList.remove('active');
        });
        
        // Show current slide and activate corresponding dot
        if (heroCakes[index]) {
            heroCakes[index].classList.add('active');
        }
        if (heroDots[index]) {
            heroDots[index].classList.add('active');
        }
        
        currentSlide = index;
        
        // Allow transitions again after animation completes
        setTimeout(() => {
            isTransitioning = false;
        }, 400);
    }

    function nextSlide() {
        const nextIndex = (currentSlide + 1) % heroCakes.length;
        showSlide(nextIndex);
    }

    function prevSlide() {
        const prevIndex = (currentSlide - 1 + heroCakes.length) % heroCakes.length;
        showSlide(prevIndex);
    }



    function startAutoPlay() {
        stopAutoPlay();
        autoPlayInterval = setInterval(() => {
            if (!isTransitioning) {
                nextSlide();
            }
        }, slideDuration);
    }

    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
        }
    }

    function pauseAutoPlay() {
        stopAutoPlay();
    }

    function resumeAutoPlay() {
        startAutoPlay();
    }

    // Event Listeners
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isTransitioning) {
                prevSlide();
                pauseAutoPlay();
                setTimeout(resumeAutoPlay, 3000); // Resume after 3 seconds
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isTransitioning) {
                nextSlide();
                pauseAutoPlay();
                setTimeout(resumeAutoPlay, 3000); // Resume after 3 seconds
            }
        });
    }

    // Dot navigation
    heroDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            if (!isTransitioning) {
                showSlide(index);
                pauseAutoPlay();
                setTimeout(resumeAutoPlay, 3000); // Resume after 3 seconds
            }
        });
    });

    if (heroGallery) {
        // Touch/swipe functionality for mobile
        heroGallery.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            pauseAutoPlay();
        }, { passive: true });

        heroGallery.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
            setTimeout(resumeAutoPlay, 3000); // Resume after 3 seconds
        }, { passive: true });

        function handleSwipe() {
            const swipeThreshold = 50;
            const swipeDistance = touchEndX - touchStartX;

            if (Math.abs(swipeDistance) > swipeThreshold && !isTransitioning) {
                if (swipeDistance > 0) {
                    prevSlide();
                } else {
                    nextSlide();
                }
            }
        }

        // Pause autoplay on hover (desktop only)
        if (window.innerWidth > 768) {
            heroGallery.addEventListener('mouseenter', pauseAutoPlay);
            heroGallery.addEventListener('mouseleave', resumeAutoPlay);
        }
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!isTransitioning) {
            if (e.key === 'ArrowLeft') {
                prevSlide();
                pauseAutoPlay();
                setTimeout(resumeAutoPlay, 3000);
            } else if (e.key === 'ArrowRight') {
                nextSlide();
                pauseAutoPlay();
                setTimeout(resumeAutoPlay, 3000);
            }
        }
    });

    // Initialize carousel
    if (heroCakes.length > 0) {
        showSlide(0);
        startAutoPlay();
    }

    // Pause autoplay when page is not visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            pauseAutoPlay();
        } else {
            resumeAutoPlay();
        }
    });
}

// Fallback initialization
window.addEventListener('load', function() {
    const heroCakes = document.querySelectorAll('.hero-cake');
    if (heroCakes.length > 0 && !document.querySelector('.hero-cake.active')) {
        initHeroCarousel();
    }
});

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure all elements are properly rendered
    setTimeout(() => {
        initHeroCarousel();
    }, 100);
});

// Mobile Navigation Toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking on nav links
const navLinks = document.querySelectorAll('.nav-link');
if (hamburger && navMenu) {
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

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

// Navbar scroll effect - add background when scrolling
const navbar = document.getElementById('navbar');
let lastScrollY = window.scrollY;

if (navbar) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

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
document.addEventListener('DOMContentLoaded', () => {
    const sections = Array.from(document.querySelectorAll('section[id]'));
    const sectionNavLinks = sections.map(section => {
        const id = section.getAttribute('id');
        return document.querySelector(`.nav-link[href="#${id}"]`);
    });
    const activeNavLinks = Array.from(document.querySelectorAll('.nav-link'));
    let navScrollTicking = false;

    if (sections.length === 0 || activeNavLinks.length === 0) return;

    function updateActiveNavigation() {
        const scrollPos = window.scrollY + 100;

        sections.forEach((section, index) => {
            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;
            const navLink = sectionNavLinks[index];

            if (scrollPos >= top && scrollPos <= bottom) {
                activeNavLinks.forEach(link => {
                    link.classList.remove('active');
                });
                if (navLink) {
                    navLink.classList.add('active');
                }
            }
        });

        navScrollTicking = false;
    }

    window.addEventListener('scroll', () => {
        if (!navScrollTicking) {
            window.requestAnimationFrame(updateActiveNavigation);
            navScrollTicking = true;
        }
    });

    updateActiveNavigation();
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
    if (e.key === 'Escape' && navMenu && hamburger && navMenu.classList.contains('active')) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// Focus management for mobile menu
if (hamburger) {
    hamburger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            hamburger.click();
        }
    });
}

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
    const submitOrderBtn = orderForm ? orderForm.querySelector('.submit-order-btn') : null;

    if (!orderForm || !layersSelect || !sizeSelect || !basePriceElement || !fillingsPriceElement || !extrasPriceElement || !totalPriceElement || !submitOrderBtn) {
        return;
    }

    // Pricing structure based on your menu
    const basePrices = {
        2: { 6: 65, 8: 75, 10: 85 },
        3: { 6: 75, 8: 85, 10: 95 },
        4: { 6: 85, 8: 95, 10: 105 }
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

    function getRequestIntent() {
        return orderForm?.querySelector('input[name="requestIntent"]:checked')?.value || 'quote';
    }

    function updateRequestIntentCopy() {
        if (!submitOrderBtn) return;

        submitOrderBtn.textContent = getRequestIntent() === 'order'
            ? 'Submit Order Request'
            : 'Submit Quote Request';
    }

    document.querySelectorAll('input[name="requestIntent"]').forEach(radio => {
        radio.addEventListener('change', updateRequestIntentCopy);
    });

    // Form submission handling
    if (orderForm) {
        orderForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const requestIntent = getRequestIntent();
            
            // Basic form validation for required fields
            const requiredFields = ['name', 'phone', 'email', 'shape', 'servings', 'layers', 'size', 'colors', 'message', 'occasion', 'pickupTime', 'delivery', 'pricingAck', 'termsAck'];

            // Check if all required fields are filled
            for (let fieldName of requiredFields) {
                const field = orderForm.querySelector(`[name="${fieldName}"]`);
                if (!field || !field.value.trim()) {
                    showNotification('Please fill in all required fields.', 'error');
                    return;
                }
            }

            if (requestIntent === 'order') {
                const fieldsThatMustBeFinal = ['shape', 'layers', 'size', 'pickupTime', 'delivery'];
                const hasUncertainOrderDetail = fieldsThatMustBeFinal.some(fieldName => {
                    const field = orderForm.querySelector(`[name="${fieldName}"]`);
                    return field && field.value === 'Not sure yet';
                });

                if (hasUncertainOrderDetail || !orderForm.querySelector('[name="eventDate"]').value) {
                    showNotification('For order requests, please choose final details and an event date. Use Price Quote if anything is still flexible.', 'error');
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
            if (eventDateField.value) {
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

                if (requestIntent === 'order' && eventDate < minDate) {
                    showNotification('Please allow at least 3 days for cake preparation.', 'error');
                    return;
                }
            }

            // Collect form data
            const submitBtn = orderForm.querySelector('.submit-order-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = requestIntent === 'order' ? 'Submitting Order...' : 'Submitting Quote...';
            submitBtn.disabled = true;

            try {
                // Collect all form data
                const formData = new FormData(orderForm);

                // Collect selected flavors and extras
                const flavors = Array.from(orderForm.querySelectorAll('input[name="flavors"]:checked'))
                    .map(cb => cb.value).join(', ');
                const extras = Array.from(orderForm.querySelectorAll('input[name="extras"]:checked'))
                    .map(cb => cb.value).join(', ');

                // Delete individual checkbox entries to avoid duplicates
                formData.delete('flavors');
                formData.delete('extras');

                // Add comma-separated flavors and extras to form data
                formData.append('flavors', flavors);
                formData.append('extras', extras);
                formData.append('formType', 'order');
                formData.set('requestIntent', requestIntent);

                // Submit to Google Apps Script with base64 encoded files
                const response = await fetch('https://script.google.com/macros/s/AKfycbzJgHWxhgSIaLeP0xLaTwBRww5A2lCeH-D9zcyQJiUp3KkxzNk5St9jaonRLUWG7BHS/exec', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams(formData)
                });

                const result = await response.json();

                if (result.status === 'success') {
                    // Get order details for confirmation modal
                    const customerName = formData.get('name');
                    const occasion = formData.get('occasion');
                    const eventDate = formData.get('eventDate');
                    const cakeSize = formData.get('size');
                    const cakeLayers = formData.get('layers');
                    const cakeShape = formData.get('shape');
                    const totalPrice = document.getElementById('total-price').textContent;

                    // Show confirmation modal
                    showOrderConfirmation({
                        requestIntent: requestIntent,
                        name: customerName,
                        occasion: occasion,
                        date: eventDate,
                        cake: `${cakeSize}, ${cakeLayers} layers, ${cakeShape}`,
                        total: totalPrice
                    });

                    // Reset form
                    orderForm.reset();
                    updatePricing(); // Reset pricing display
                    updateRequestIntentCopy();
                } else {
                    throw new Error(result.message || 'Submission failed');
                }

            } catch (error) {
                showNotification('Sorry, there was an error submitting your order. Please try again or contact us directly.', 'error');
            }

            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    }



    // Initialize pricing display
    updatePricing();
    updateRequestIntentCopy();
});

// Contact Form Functionality
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        const submitBtn = contactForm.querySelector('.submit-btn');
        if (!submitBtn) return;

        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Basic validation
            const name = contactForm.querySelector('[name="name"]').value.trim();
            const email = contactForm.querySelector('[name="email"]').value.trim();
            const message = contactForm.querySelector('[name="message"]').value.trim();
            const inquiryType = contactForm.querySelector('[name="inquiry-type"]').value;
            
            if (!name || !email || !message || !inquiryType) {
                showNotification('Please fill in all required fields.', 'error');
                return;
            }
            
            if (!isValidEmail(email)) {
                showNotification('Please enter a valid email address.', 'error');
                return;
            }
            
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending Message...';
            submitBtn.disabled = true;
            
            try {
                // Collect form data
                const formData = new FormData(contactForm);
                
                // Add cake image info if available
                const cakeImageInput = document.getElementById('cakeImageInput');
                const cakeTitleInput = document.getElementById('cakeTitleInput');
                
                if (cakeImageInput && cakeImageInput.value) {
                    formData.append('cakeImage', cakeImageInput.value);
                    formData.append('cakeTitle', cakeTitleInput.value);
                }
                
                // Create data object for Google Apps Script
                const contactData = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    phone: formData.get('phone') || '',
                    inquiryType: formData.get('inquiry-type'),
                    message: formData.get('message'),
                    cakeImage: formData.get('cakeImage') || '',
                    cakeTitle: formData.get('cakeTitle') || ''
                };

                // Google Apps Script web app URL for contact form
                const CONTACT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJgHWxhgSIaLeP0xLaTwBRww5A2lCeH-D9zcyQJiUp3KkxzNk5St9jaonRLUWG7BHS/exec';

                // Add form type identifier
                contactData.formType = 'contact';

                // Submit to Google Apps Script
                const response = await fetch(CONTACT_APPS_SCRIPT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams(contactData)
                });

                const result = await response.json();

                if (result.status === 'success') {
                    showNotification('Thank you for your message! I\'ll get back to you within 24 hours.', 'success');
                    contactForm.reset();
                    
                    // Reset cake image display if it was shown
                    const cakeContainer = document.getElementById('cakeImageContainer');
                    if (cakeContainer) {
                        cakeContainer.style.display = 'none';
                    }
                } else {
                    throw new Error(result.message || 'Submission failed');
                }
                
            } catch (error) {
                showNotification('Sorry, there was an error sending your message. Please try again or contact us directly.', 'error');
            }
            
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    }

    // Initialize Order Progress Indicator
    initOrderProgress();
});

// Order Progress Indicator Functionality
function initOrderProgress() {
    const progressContainer = document.getElementById('order-progress');
    const orderForm = document.getElementById('order-form');

    if (!progressContainer || !orderForm) return;

    const formSections = orderForm.querySelectorAll('.form-section');
    const progressSteps = progressContainer.querySelectorAll('.progress-step');
    const progressConnectors = progressContainer.querySelectorAll('.progress-connector');

    if (formSections.length === 0 || progressSteps.length === 0) return;

    // Update progress based on scroll position
    function updateProgress() {
        const scrollPosition = window.scrollY + window.innerHeight / 2;

        let activeSection = 0;
        formSections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                activeSection = index;
            } else if (scrollPosition >= sectionBottom) {
                activeSection = Math.min(index + 1, formSections.length - 1);
            }
        });

        // Map form sections to progress steps (we have 4 progress steps)
        // Sections: Customer Info (0), Event Details (1), Cake Config (2), Extras (3), Allergies (4), Review (5)
        // Progress: Your Info (0), Event Details (1), Cake Design (2), Extras (3)
        let progressIndex = Math.min(activeSection, progressSteps.length - 1);

        // Update progress steps
        progressSteps.forEach((step, index) => {
            step.classList.remove('active', 'completed');

            if (index < progressIndex) {
                step.classList.add('completed');
            } else if (index === progressIndex) {
                step.classList.add('active');
            }
        });

        // Update connectors
        progressConnectors.forEach((connector, index) => {
            connector.classList.remove('active');
            if (index < progressIndex) {
                connector.classList.add('active');
            }
        });
    }

    // Throttle scroll events
    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                updateProgress();
                ticking = false;
            });
            ticking = true;
        }
    });

    // Initial update
    updateProgress();
}

// Order Confirmation Modal Functions
function showOrderConfirmation(orderDetails) {
    const modal = document.getElementById('orderConfirmationModal');
    if (!modal) return;

    const isOrder = orderDetails.requestIntent === 'order';
    const title = document.getElementById('confirmation-title');
    const message = document.getElementById('confirmation-message');
    if (title) title.textContent = isOrder ? 'Order Request Received!' : 'Quote Request Received!';
    if (message) {
        message.textContent = isOrder
            ? 'Thank you for your order request. I will review it and follow up about your deposit.'
            : 'Thank you for your quote request. I will review the details and follow up with pricing.';
    }

    // Populate order details
    document.getElementById('confirm-name').textContent = orderDetails.name || 'N/A';
    document.getElementById('confirm-occasion').textContent = orderDetails.occasion || 'N/A';

    // Format date nicely
    if (orderDetails.date) {
        const date = new Date(orderDetails.date + 'T00:00:00');
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('confirm-date').textContent = formattedDate;
    } else {
        document.getElementById('confirm-date').textContent = 'N/A';
    }

    document.getElementById('confirm-cake').textContent = orderDetails.cake || 'N/A';
    document.getElementById('confirm-total').textContent = orderDetails.total || '$0';

    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeConfirmationModal() {
    const modal = document.getElementById('orderConfirmationModal');
    if (!modal) return;

    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('orderConfirmationModal');
    if (e.target === modal) {
        closeConfirmationModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeConfirmationModal();
    }
});
