/**
 * Hospital Resource Management System
 * Main JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling for anchor links
    addSmoothScrolling();
    
    // Save hospital info to localStorage if provided
    const hospitalName = localStorage.getItem('hospitalName');
    if (hospitalName) {
        console.log('Welcome back, ' + hospitalName);
    }
});

/**
 * Add smooth scrolling for anchor links
 */
function addSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Show notification
 * @param {string} message - The message to display
 * @param {string} type - The type of notification ('success' or 'error')
 */
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    const messageEl = notification.querySelector('.notification-message');
    if (messageEl) {
        messageEl.textContent = message;
    }
    
    // Set notification type
    notification.className = 'notification show';
    notification.classList.add(type);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

/**
 * Format distance
 * @param {number} distance - The distance in kilometers
 * @returns {string} - Formatted distance string
 */
function formatDistance(distance) {
    if (typeof distance !== 'number') return 'Unknown';
    
    if (distance < 1) {
        // If less than 1 km, show in meters
        return Math.round(distance * 1000) + ' m';
    } else {
        // Otherwise show in kilometers with 1 decimal place
        return distance.toFixed(1) + ' km';
    }
}

/**
 * Format date
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
    if (!date) return 'Unknown';
    
    try {
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString();
    } catch (e) {
        return 'Invalid date';
    }
} 