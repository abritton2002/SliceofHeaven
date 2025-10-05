// Enhanced Hero Carousel Functionality
function initHeroCarousel() {
    const heroCakes = document.querySelectorAll('.hero-cake');
    const heroDots = document.querySelectorAll('.hero-dot');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    // Debug logging
    console.log('Carousel initialization started');
    console.log('Hero cakes found:', heroCakes.length);
    console.log('Hero dots found:', heroDots.length);
    console.log('Prev button found:', !!prevBtn);
    console.log('Next button found:', !!nextBtn);
    
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
        
        console.log('Showing slide:', index, 'Total slides:', heroCakes.length);
        
        isTransitioning = true;
        
        // Hide all slides
        heroCakes.forEach((cake, i) => {
            cake.classList.remove('active');
            console.log(`Slide ${i} classes after remove:`, cake.className);
        });
        
        // Remove active class from all dots
        heroDots.forEach(dot => {
            dot.classList.remove('active');
        });
        
        // Show current slide and activate corresponding dot
        if (heroCakes[index]) {
            heroCakes[index].classList.add('active');
            console.log(`Slide ${index} classes after add:`, heroCakes[index].className);
            console.log(`Slide ${index} image src:`, heroCakes[index].querySelector('img')?.src);
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
            console.log('Prev button clicked');
            if (!isTransitioning) {
                prevSlide();
                pauseAutoPlay();
                setTimeout(resumeAutoPlay, 3000); // Resume after 3 seconds
            }
        });
    } else {
        console.error('Prev button not found');
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Next button clicked');
            if (!isTransitioning) {
                nextSlide();
                pauseAutoPlay();
                setTimeout(resumeAutoPlay, 3000); // Resume after 3 seconds
            }
        });
    } else {
        console.error('Next button not found');
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

    // Touch/swipe functionality for mobile
    const heroGallery = document.querySelector('.hero-gallery');
    console.log('Hero gallery found:', !!heroGallery);
    
    if (heroGallery) {
        heroGallery.addEventListener('touchstart', (e) => {
            console.log('Touch start detected:', e.changedTouches[0].screenX);
            touchStartX = e.changedTouches[0].screenX;
            pauseAutoPlay();
        }, { passive: true });

        heroGallery.addEventListener('touchend', (e) => {
            console.log('Touch end detected:', e.changedTouches[0].screenX);
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
            setTimeout(resumeAutoPlay, 3000); // Resume after 3 seconds
        }, { passive: true });

        function handleSwipe() {
            const swipeThreshold = 50;
            const swipeDistance = touchEndX - touchStartX;
            console.log('Swipe distance:', swipeDistance);
            
            if (Math.abs(swipeDistance) > swipeThreshold && !isTransitioning) {
                if (swipeDistance > 0) {
                    console.log('Swipe right - going to previous slide');
                    prevSlide();
                } else {
                    console.log('Swipe left - going to next slide');
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
        console.log('Initializing carousel with', heroCakes.length, 'slides');
        
        // Check if all images are loaded
        heroCakes.forEach((cake, index) => {
            const img = cake.querySelector('img');
            if (img) {
                console.log(`Slide ${index} image:`, img.src);
                console.log(`Slide ${index} image display:`, window.getComputedStyle(img).display);
                console.log(`Slide ${index} image opacity:`, window.getComputedStyle(img).opacity);
                console.log(`Slide ${index} image visibility:`, window.getComputedStyle(img).visibility);
                
                if (img.complete) {
                    console.log(`Slide ${index} image loaded:`, img.naturalWidth, 'x', img.naturalHeight);
                } else {
                    img.addEventListener('load', () => {
                        console.log(`Slide ${index} image loaded:`, img.naturalWidth, 'x', img.naturalHeight);
                    });
                    img.addEventListener('error', () => {
                        console.error(`Slide ${index} image failed to load:`, img.src);
                    });
                }
            }
        });
        
        showSlide(0);
        startAutoPlay();
    } else {
        console.error('No hero cakes found for carousel initialization');
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
    console.log('Window loaded, checking if carousel is initialized...');
    const heroCakes = document.querySelectorAll('.hero-cake');
    if (heroCakes.length > 0 && !document.querySelector('.hero-cake.active')) {
        console.log('Carousel not initialized, initializing now...');
        initHeroCarousel();
    }
});

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing carousel...');
    // Small delay to ensure all elements are properly rendered
    setTimeout(() => {
        initHeroCarousel();
    }, 100);
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
            submitBtn.textContent = 'Processing Files...';
            submitBtn.disabled = true;

            try {
                // Collect all form data
                const formData = new FormData(orderForm);
                
                // Collect selected flavors and extras
                const flavors = Array.from(orderForm.querySelectorAll('input[name="flavors"]:checked'))
                    .map(cb => cb.value).join(', ');
                const extras = Array.from(orderForm.querySelectorAll('input[name="extras"]:checked'))
                    .map(cb => cb.value).join(', ');
                
                // Add flavors and extras to form data
                formData.append('flavors', flavors);
                formData.append('extras', extras);
                formData.append('formType', 'order');
                
                // Handle file uploads - convert files to base64 and send as text data
                const fileInput = orderForm.querySelector('input[type="file"]');
                let photoInfo = 'No photos uploaded';
                
                if (fileInput && fileInput.files.length > 0) {
                    const files = Array.from(fileInput.files);
                    
                    // Validate file sizes (Google Apps Script has limits)
                    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
                    const oversizedFiles = files.filter(file => file.size > maxFileSize);
                    
                    if (oversizedFiles.length > 0) {
                        const fileNames = oversizedFiles.map(f => f.name).join(', ');
                        showNotification(`Files too large (max 10MB each): ${fileNames}`, 'error');
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                        return;
                    }
                    
                    // Limit to 5 files
                    if (files.length > 5) {
                        showNotification('Please select no more than 5 photos.', 'error');
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                        return;
                    }
                    
                    photoInfo = files.map(file => `${file.name} (${(file.size / 1024).toFixed(1)}KB)`).join(', ');
                    
                    console.log('Files to upload:', files.length);
                    files.forEach((file, index) => {
                        console.log(`File ${index}:`, file.name, file.size, file.type);
                    });
                    
                    // Update button text to show progress
                    submitBtn.textContent = `Processing ${files.length} file(s)...`;
                    
                    // Convert each file to base64 and add to form data
                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        const reader = new FileReader();
                        
                        // Update progress
                        submitBtn.textContent = `Processing file ${i + 1} of ${files.length}...`;
                        
                        await new Promise((resolve, reject) => {
                            reader.onload = function(e) {
                                try {
                                    const base64 = e.target.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
                                    formData.append(`file_${i}_base64`, base64);
                                    formData.append(`file_${i}_name`, file.name);
                                    formData.append(`file_${i}_size`, file.size);
                                    formData.append(`file_${i}_type`, file.type);
                                    console.log(`Successfully processed file ${i}: ${file.name}`);
                                    resolve();
                                } catch (error) {
                                    console.error(`Error processing file ${i}:`, error);
                                    reject(error);
                                }
                            };
                            reader.onerror = function(error) {
                                console.error(`Error reading file ${i}:`, error);
                                reject(error);
                            };
                            reader.readAsDataURL(file);
                        });
                    }
                    
                    formData.append('file_count', files.length);
                }
                
                // Add photo info to form data
                formData.append('photos', photoInfo);

                console.log('Submitting order data with files:', photoInfo);

                // Update button text for submission
                submitBtn.textContent = 'Submitting Order...';

                // Submit to Google Apps Script with base64 encoded files
                const response = await fetch('https://script.google.com/macros/s/AKfycbwpN3ssjXz404mz9klZJN3W7TGHK55wgIqH1Nhh_KehJtlMDmSnm9HcEvDLiQ2aCHwF/exec', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams(formData)
                });

                console.log('Response status:', response.status);
                console.log('Response headers:', response.headers);
                
                const result = await response.json();
                console.log('Response result:', result);

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
    
    // File preview functionality
    const fileInput = document.getElementById('inspiration-photos');
    const filePreview = document.getElementById('file-preview');
    const fileList = document.getElementById('file-list');
    
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const files = Array.from(this.files);
            
            if (files.length > 0) {
                filePreview.style.display = 'block';
                fileList.innerHTML = '';
                
                files.forEach((file, index) => {
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item';
                    
                    const fileIcon = document.createElement('span');
                    fileIcon.innerHTML = '📷';
                    fileIcon.style.marginRight = '8px';
                    
                    const fileInfo = document.createElement('div');
                    fileInfo.style.flex = '1';
                    
                    const fileName = document.createElement('div');
                    fileName.textContent = file.name;
                    fileName.style.fontWeight = '600';
                    fileName.style.fontSize = '14px';
                    
                    const fileSize = document.createElement('div');
                    fileSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;
                    fileSize.style.fontSize = '12px';
                    fileSize.style.color = '#6c757d';
                    
                    fileInfo.appendChild(fileName);
                    fileInfo.appendChild(fileSize);
                    
                    const removeBtn = document.createElement('button');
                    removeBtn.textContent = '×';
                    removeBtn.type = 'button';
                    
                    removeBtn.addEventListener('click', function() {
                        // Create a new FileList without this file
                        const dt = new DataTransfer();
                        files.forEach((f, i) => {
                            if (i !== index) {
                                dt.items.add(f);
                            }
                        });
                        fileInput.files = dt.files;
                        
                        // Re-trigger the change event
                        fileInput.dispatchEvent(new Event('change'));
                    });
                    
                    fileItem.appendChild(fileIcon);
                    fileItem.appendChild(fileInfo);
                    fileItem.appendChild(removeBtn);
                    fileList.appendChild(fileItem);
                });
            } else {
                filePreview.style.display = 'none';
            }
        });
    }
});

// Contact Form Functionality
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
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
            
            const submitBtn = contactForm.querySelector('.submit-btn');
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
                const CONTACT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwpN3ssjXz404mz9klZJN3W7TGHK55wgIqH1Nhh_KehJtlMDmSnm9HcEvDLiQ2aCHwF/exec';

                // Add form type identifier
                contactData.formType = 'contact';

                console.log('Submitting contact data:', contactData);

                // Submit to Google Apps Script
                const response = await fetch(CONTACT_APPS_SCRIPT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams(contactData)
                });

                console.log('Contact response status:', response.status);
                
                const result = await response.json();
                console.log('Contact response result:', result);

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
                console.error('Contact form submission error:', error);
                showNotification('Sorry, there was an error sending your message. Please try again or contact us directly.', 'error');
            }
            
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    }
});