

document.addEventListener('DOMContentLoaded', function() {
    
    addSmoothScrolling();
    
   
    const hospitalName = localStorage.getItem('hospitalName');
    if (hospitalName) {
        console.log('Welcome back, ' + hospitalName);
    }
});


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


function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    const messageEl = notification.querySelector('.notification-message');
    if (messageEl) {
        messageEl.textContent = message;
    }
    
    
    notification.className = 'notification show';
    notification.classList.add(type);
    
   
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}


function formatDistance(distance) {
    if (typeof distance !== 'number') return 'Unknown';
    
    if (distance < 1) {
        
        return Math.round(distance * 1000) + ' m';
    } else {
        
        return distance.toFixed(1) + ' km';
    }
}


function formatDate(date) {
    if (!date) return 'Unknown';
    
    try {
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString();
    } catch (e) {
        return 'Invalid date';
    }
} 
