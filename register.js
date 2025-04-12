/**
 * Hospital Resource Management System
 * Register Resources JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize form handlers
    initializeForm();
    
    // Initialize hospital search
    initializeHospitalSearch();
    
    // Load saved hospital name if available
    const savedHospitalName = localStorage.getItem('hospitalName');
    if (savedHospitalName) {
        document.getElementById('hospitalName').value = savedHospitalName;
        
        // Also load hospital resources if hospital name is available
        const hospitalSearchInput = document.getElementById('hospitalSearch');
        if (hospitalSearchInput) {
            hospitalSearchInput.value = savedHospitalName;
            searchHospitalResources(savedHospitalName);
        }
    }
});

/**
 * Initialize the resource registration form
 */
function initializeForm() {
    const resourceForm = document.getElementById('resourceForm');
    const resetBtn = document.getElementById('resetBtn');
    
    if (resourceForm) {
        resourceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(resourceForm);
            const resourceData = {
                hospitalName: formData.get('hospitalName'),
                hospitalAddress: formData.get('hospitalAddress'),
                resourceType: formData.get('resourceType'),
                quantity: parseInt(formData.get('quantity'), 10)
            };
            
            // Save hospital name to localStorage for future use
            localStorage.setItem('hospitalName', resourceData.hospitalName);
            
            // Submit data to API
            registerResource(resourceData);
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            resourceForm.reset();
        });
    }
}

/**
 * Register a resource via API
 * @param {Object} resourceData - The resource data to register
 */
async function registerResource(resourceData) {
    try {
        const response = await fetch('/api/resources', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(resourceData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Resource registered successfully!', 'success');
            document.getElementById('resourceForm').reset();
            
            // Reload hospital resources if the hospital name input is filled
            const hospitalSearch = document.getElementById('hospitalSearch');
            if (hospitalSearch && hospitalSearch.value) {
                searchHospitalResources(hospitalSearch.value);
            } else if (resourceData.hospitalName) {
                // Set the hospital search input to the registered hospital name
                if (hospitalSearch) {
                    hospitalSearch.value = resourceData.hospitalName;
                    searchHospitalResources(resourceData.hospitalName);
                }
            }
        } else {
            showNotification('Error: ' + (result.error || 'Failed to register resource'), 'error');
        }
    } catch (error) {
        console.error('Error registering resource:', error);
        showNotification('Error: Failed to connect to server', 'error');
    }
}

/**
 * Initialize hospital search functionality
 */
function initializeHospitalSearch() {
    const searchHospitalBtn = document.getElementById('searchHospitalBtn');
    const hospitalSearch = document.getElementById('hospitalSearch');
    
    if (searchHospitalBtn && hospitalSearch) {
        searchHospitalBtn.addEventListener('click', function() {
            const hospitalName = hospitalSearch.value.trim();
            if (hospitalName) {
                searchHospitalResources(hospitalName);
            } else {
                showNotification('Please enter a hospital name', 'error');
            }
        });
        
        // Also trigger search on Enter key
        hospitalSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const hospitalName = hospitalSearch.value.trim();
                if (hospitalName) {
                    searchHospitalResources(hospitalName);
                } else {
                    showNotification('Please enter a hospital name', 'error');
                }
            }
        });
    }
}

/**
 * Search for resources registered by a hospital
 * @param {string} hospitalName - The name of the hospital to search for
 */
async function searchHospitalResources(hospitalName) {
    try {
        const response = await fetch(`/api/hospitals/resources?hospitalName=${encodeURIComponent(hospitalName)}`);
        const result = await response.json();
        
        const resourcesResult = document.getElementById('resourcesResult');
        
        if (result.success) {
            if (result.resources.length === 0) {
                resourcesResult.innerHTML = `<p>No resources found for hospital: ${hospitalName}</p>`;
            } else {
                // Build resources HTML
                let resourcesHTML = `
                    <h3>Resources for ${hospitalName}</h3>
                    <p>Total resources: ${result.total}</p>
                    <div class="results-list">
                `;
                
                result.resources.forEach(resource => {
                    resourcesHTML += `
                        <div class="result-card">
                            <h3>${resource.resourceName}</h3>
                            <p>Quantity: ${resource.quantity}</p>
                            <p>Registered: ${resource.formattedDate || formatDate(resource.createdAt)}</p>
                            <button class="btn-primary btn-secondary delete-btn" data-id="${resource._id}">Delete</button>
                        </div>
                    `;
                });
                
                resourcesHTML += `</div>`;
                resourcesResult.innerHTML = resourcesHTML;
                
                // Add event listeners to delete buttons
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const resourceId = this.getAttribute('data-id');
                        if (confirm('Are you sure you want to delete this resource?')) {
                            deleteResource(resourceId);
                        }
                    });
                });
            }
        } else {
            resourcesResult.innerHTML = `<p>Error: ${result.error || 'Failed to retrieve resources'}</p>`;
        }
    } catch (error) {
        console.error('Error searching hospital resources:', error);
        const resourcesResult = document.getElementById('resourcesResult');
        resourcesResult.innerHTML = `<p>Error: Failed to connect to server</p>`;
    }
}

/**
 * Delete a resource
 * @param {string} resourceId - The ID of the resource to delete
 */
async function deleteResource(resourceId) {
    try {
        const response = await fetch(`/api/resources/${resourceId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Resource deleted successfully!', 'success');
            
            // Reload hospital resources
            const hospitalSearch = document.getElementById('hospitalSearch');
            if (hospitalSearch && hospitalSearch.value) {
                searchHospitalResources(hospitalSearch.value);
            }
        } else {
            showNotification('Error: ' + (result.error || 'Failed to delete resource'), 'error');
        }
    } catch (error) {
        console.error('Error deleting resource:', error);
        showNotification('Error: Failed to connect to server', 'error');
    }
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