
document.addEventListener('DOMContentLoaded', function() {
   
    initializeSearch();
    
  
    initializeFilters();
    
   
    initializeModal();
});


let selectedFilters = [];


function initializeSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', function() {
            performSearch();
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}


function initializeFilters() {
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const filterCheckboxes = document.querySelectorAll('.resource-filter');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            // Get selected filters
            selectedFilters = [];
            filterCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    selectedFilters.push(checkbox.value);
                }
            });
            
            performSearch();
        });
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            // Clear all checkboxes
            filterCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            
            selectedFilters = [];
            
            performSearch();
        });
    }
}


async function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput ? searchInput.value.trim() : '';
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (!resultsContainer) return;
    
      resultsContainer.innerHTML = '<p>Searching for resources...</p>';
    
    try {
    
        let url = '/api/resources/search';
        if (query) {
            url += `?query=${encodeURIComponent(query)}`;
        }
        
       
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                resourceTypes: selectedFilters
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (result.resources.length === 0) {
                resultsContainer.innerHTML = `
                    <p>No resources found matching your search criteria.</p>
                    <p>Try adjusting your search terms or filters.</p>
                `;
            } else {
               let resourcesHTML = '';
                
                result.resources.forEach(resource => {
                    resourcesHTML += `
                        <div class="result-card">
                            <h3>${resource.resourceName}</h3>
                            <p>Hospital: ${resource.hospitalName}</p>
                            <p>Quantity Available: ${resource.quantity}</p>
                            <p>Distance: ${formatDistance(resource.distance)}</p>
                            <button class="btn-primary request-btn" 
                                    data-id="${resource._id}" 
                                    data-name="${resource.resourceName}"
                                    data-hospital="${resource.hospitalName}"
                                    data-quantity="${resource.quantity}">
                                Request Resource
                            </button>
                        </div>
                    `;
                });
                
                resultsContainer.innerHTML = resourcesHTML;
                
                
                document.querySelectorAll('.request-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        openRequestModal(
                            this.getAttribute('data-id'),
                            this.getAttribute('data-name'),
                            this.getAttribute('data-hospital'),
                            parseInt(this.getAttribute('data-quantity'), 10)
                        );
                    });
                });
            }
        } else {
            resultsContainer.innerHTML = `<p>Error: ${result.error || 'An error occurred during search'}</p>`;
        }
    } catch (error) {
        console.error('Error searching resources:', error);
        resultsContainer.innerHTML = `<p>Error: Failed to connect to server</p>`;
    }
}


function initializeModal() {
    const modal = document.getElementById('requestModal');
    const closeBtn = modal ? modal.querySelector('.close-btn') : null;
    const cancelBtn = document.getElementById('cancelRequestBtn');
    const requestForm = document.getElementById('requestForm');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeModal();
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            closeModal();
        });
    }
    
   
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    if (requestForm) {
        requestForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(requestForm);
            const requestData = {
                resourceId: formData.get('resourceId'),
                requestingHospital: formData.get('requestingHospital'),
                quantity: parseInt(formData.get('requestQuantity'), 10)
            };
            
           
            localStorage.setItem('hospitalName', requestData.requestingHospital);
            
            
            submitRequest(requestData);
        });
    }
}


function openRequestModal(resourceId, resourceName, hospitalName, availableQuantity) {
    const modal = document.getElementById('requestModal');
    const modalTitle = modal ? modal.querySelector('h2') : null;
    const resourceIdInput = document.getElementById('resourceId');
    const requestingHospitalInput = document.getElementById('requestingHospital');
    const quantityInput = document.getElementById('requestQuantity');
    const availableQuantitySpan = modal ? modal.querySelector('#availableQuantity span') : null;
    
    if (modal && modalTitle && resourceIdInput && quantityInput && availableQuantitySpan) {
        
        modalTitle.textContent = `Request ${resourceName} from ${hospitalName}`;
        
       
        resourceIdInput.value = resourceId;
        quantityInput.max = availableQuantity;
        availableQuantitySpan.textContent = availableQuantity;
        
        
        const savedHospitalName = localStorage.getItem('hospitalName');
        if (savedHospitalName && requestingHospitalInput) {
            requestingHospitalInput.value = savedHospitalName;
        }
        
       
        modal.style.display = 'block';
    }
}


function closeModal() {
    const modal = document.getElementById('requestModal');
    if (modal) {
        modal.style.display = 'none';
    }
}


async function submitRequest(requestData) {
    try {
        const response = await fetch('/api/resources/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Resource requested successfully!', 'success');
            closeModal();
            
           
            performSearch();
        } else {
            showNotification('Error: ' + (result.error || 'Failed to request resource'), 'error');
        }
    } catch (error) {
        console.error('Error requesting resource:', error);
        showNotification('Error: Failed to connect to server', 'error');
    }
}


function formatDistance(distance) {
    if (typeof distance !== 'number') return 'Unknown';
    
    if (distance < 1) {
       
        return Math.round(distance * 1000) + ' m';
    } else {
       
        return distance.toFixed(1) + ' km';
    }
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
