// ============================================
// COMPUTER INVENTORY SYSTEM - CLIENT-SIDE JS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all modules
  initUserMenu();
  initSidebar();
  initAlerts();
  initToast();
  initModals();
  initFormValidation();
});

// ============================================
// USER MENU DROPDOWN
// ============================================
function initUserMenu() {
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown');
  
  if (!userMenuBtn || !userDropdown) return;
  
  userMenuBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    userDropdown.classList.toggle('show');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
      userDropdown.classList.remove('show');
    }
  });
}

// ============================================
// SIDEBAR TOGGLE
// ============================================
function initSidebar() {
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  const contentArea = document.querySelector('.content-area');
  const overlay = document.getElementById('sidebar-overlay');

  if (!sidebar) return;

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('collapsed');
      contentArea.classList.toggle('sidebar-collapsed');

      const icon = this.querySelector('i');
      if (sidebar.classList.contains('collapsed')) {
        icon.classList.remove('fa-chevron-left');
        icon.classList.add('fa-chevron-right');
      } else {
        icon.classList.remove('fa-chevron-right');
        icon.classList.add('fa-chevron-left');
      }

      localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    });

    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
      sidebar.classList.add('collapsed');
      contentArea.classList.add('sidebar-collapsed');
      sidebarToggle.querySelector('i').classList.replace('fa-chevron-left', 'fa-chevron-right');
    }
  }

  function openMobileSidebar() {
    sidebar.classList.add('show');
    if (overlay) overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileSidebar() {
    sidebar.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  const menuToggle = document.getElementById('mobile-menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', function() {
      sidebar.classList.contains('show') ? closeMobileSidebar() : openMobileSidebar();
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeMobileSidebar);
  }

  // Close sidebar when a nav link is tapped on mobile
  sidebar.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', function() {
      if (window.innerWidth <= 768) closeMobileSidebar();
    });
  });
}

// ============================================
// ALERT MESSAGES
// ============================================
function initAlerts() {
  // Auto-dismiss alerts after 5 seconds
  const alerts = document.querySelectorAll('.alert:not(.alert-static)');
  alerts.forEach(alert => {
    setTimeout(() => {
      dismissAlert(alert);
    }, 5000);
  });
  
  // Close button functionality
  const closeButtons = document.querySelectorAll('.alert-close');
  closeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const alert = this.closest('.alert');
      dismissAlert(alert);
    });
  });
}

function dismissAlert(alert) {
  alert.style.animation = 'slideOutUp 0.3s ease-out';
  setTimeout(() => {
    alert.remove();
  }, 300);
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
let toastContainer = null;

function initToast() {
  // Create toast container if it doesn't exist
  if (!document.getElementById('toast-container')) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: calc(var(--navbar-height) + 1rem);
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 400px;
    `;
    document.body.appendChild(toastContainer);
  }
}

function showToast(message, type = 'info', duration = 3000) {
  if (!toastContainer) initToast();
  
  const toast = document.createElement('div');
  toast.className = `alert alert-${type}`;
  toast.style.cssText = `
    margin: 0;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  `;
  
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };
  
  toast.innerHTML = `
    <i class="fas ${icons[type]}"></i>
    <div class="alert-content">
      <p>${message}</p>
    </div>
    <button class="alert-close" aria-label="Close">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  toastContainer.appendChild(toast);
  
  // Close button
  const closeBtn = toast.querySelector('.alert-close');
  closeBtn.addEventListener('click', () => {
    dismissToast(toast);
  });
  
  // Auto dismiss
  setTimeout(() => {
    dismissToast(toast);
  }, duration);
}

function dismissToast(toast) {
  toast.style.animation = 'slideOutRight 0.3s ease-out';
  setTimeout(() => {
    toast.remove();
  }, 300);
}

// Add animations to CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOutUp {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-20px);
    }
  }
  
  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }
`;
document.head.appendChild(style);

// ============================================
// MODAL DIALOGS
// ============================================
function initModals() {
  window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  };
  
  window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  };
  
  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) {
        closeModal(this.id);
      }
    });
  });
  
  // Close modal on ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal-overlay.show');
      if (activeModal) {
        closeModal(activeModal.id);
      }
    }
  });
}

// ============================================
// FORM VALIDATION
// ============================================
function initFormValidation() {
  const forms = document.querySelectorAll('form[novalidate]');
  
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      if (!validateForm(this)) {
        e.preventDefault();
        
        // Scroll to first error
        const firstError = this.querySelector('.invalid');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstError.focus();
        }
      }
    });
    
    // Real-time validation on blur
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', function() {
        validateField(this);
      });
      
      // Clear error on input
      input.addEventListener('input', function() {
        clearFieldError(this);
      });
    });
  });
}

function validateForm(form) {
  let isValid = true;
  const inputs = form.querySelectorAll('[required], [type="email"], [pattern]');
  
  inputs.forEach(input => {
    if (!validateField(input)) {
      isValid = false;
    }
  });
  
  return isValid;
}

function validateField(field) {
  clearFieldError(field);
  
  // Required validation
  if (field.hasAttribute('required')) {
    if (!field.value.trim()) {
      showFieldError(field, 'This field is required');
      return false;
    }
  }
  
  // Email validation
  if (field.type === 'email' && field.value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(field.value)) {
      showFieldError(field, 'Please enter a valid email address');
      return false;
    }
  }
  
  // Pattern validation
  if (field.hasAttribute('pattern') && field.value) {
    const pattern = new RegExp(field.getAttribute('pattern'));
    if (!pattern.test(field.value)) {
      const message = field.getAttribute('data-pattern-message') || 'Invalid format';
      showFieldError(field, message);
      return false;
    }
  }
  
  // Min/Max validation for numbers
  if (field.type === 'number' && field.value) {
    const min = parseFloat(field.getAttribute('min'));
    const max = parseFloat(field.getAttribute('max'));
    const value = parseFloat(field.value);
    
    if (!isNaN(min) && value < min) {
      showFieldError(field, `Value must be at least ${min}`);
      return false;
    }
    
    if (!isNaN(max) && value > max) {
      showFieldError(field, `Value must be at most ${max}`);
      return false;
    }
  }
  
  // Date validation
  if (field.type === 'date' && field.value) {
    const min = field.getAttribute('min');
    const max = field.getAttribute('max');
    const value = field.value;
    
    if (min && value < min) {
      showFieldError(field, 'Date is too early');
      return false;
    }
    
    if (max && value > max) {
      showFieldError(field, 'Date is too late');
      return false;
    }
  }
  
  return true;
}

function showFieldError(field, message) {
  field.classList.add('invalid');
  
  const errorElement = field.parentElement.querySelector('.form-error');
  if (errorElement) {
    errorElement.textContent = message;
  }
}

function clearFieldError(field) {
  field.classList.remove('invalid');
  
  const errorElement = field.parentElement.querySelector('.form-error');
  if (errorElement) {
    errorElement.textContent = '';
  }
}

// ============================================
// GLOBAL SEARCH
// ============================================
const globalSearch = document.getElementById('global-search');
if (globalSearch) {
  let searchTimeout;
  
  globalSearch.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    const query = this.value.trim();
    
    if (query.length < 2) return;
    
    searchTimeout = setTimeout(() => {
      performGlobalSearch(query);
    }, 300);
  });
}

function performGlobalSearch(query) {
  // This would typically call an API endpoint
  console.log('Searching for:', query);
  
  // Example: Redirect to search results page
  // window.location.href = `/search?q=${encodeURIComponent(query)}`;
}

// ============================================
// TABLE UTILITIES
// ============================================

// Select All Checkbox
document.querySelectorAll('[id="select-all"]').forEach(checkbox => {
  checkbox.addEventListener('change', function() {
    const table = this.closest('table');
    const rowCheckboxes = table.querySelectorAll('.row-select');
    rowCheckboxes.forEach(cb => {
      cb.checked = this.checked;
    });
  });
});

// Copy to Clipboard
window.copyToClipboard = function(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!', 'success', 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
    showToast('Failed to copy', 'error', 2000);
  });
};

// ============================================
// FILE UPLOAD HANDLING
// ============================================
document.querySelectorAll('.file-upload-area').forEach(area => {
  const input = area.querySelector('input[type="file"]');
  const placeholder = area.querySelector('.upload-placeholder');
  const preview = area.querySelector('.upload-preview');
  
  if (!input) return;
  
  // Click to upload
  area.addEventListener('click', function(e) {
    if (e.target.closest('.btn-icon-sm')) return; // Don't trigger on clear button
    input.click();
  });
  
  // Drag and drop
  area.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.classList.add('dragover');
  });
  
  area.addEventListener('dragleave', function() {
    this.classList.remove('dragover');
  });
  
  area.addEventListener('drop', function(e) {
    e.preventDefault();
    this.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      input.files = files;
      handleFileSelect(input, placeholder, preview);
    }
  });
  
  // File selection
  input.addEventListener('change', function() {
    handleFileSelect(this, placeholder, preview);
  });
});

function handleFileSelect(input, placeholder, preview) {
  if (input.files.length === 0) return;
  
  const file = input.files[0];
  const fileName = file.name;
  const fileSize = (file.size / 1024 / 1024).toFixed(2); // MB
  
  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    showToast('File size must be less than 5MB', 'error');
    input.value = '';
    return;
  }
  
  // Show preview
  placeholder.style.display = 'none';
  preview.style.display = 'flex';
  preview.querySelector('.file-name').textContent = `${fileName} (${fileSize}MB)`;
}

window.clearFile = function() {
  const fileInput = event.target.closest('.file-upload-area').querySelector('input[type="file"]');
  const placeholder = event.target.closest('.file-upload-area').querySelector('.upload-placeholder');
  const preview = event.target.closest('.file-upload-area').querySelector('.upload-preview');
  
  fileInput.value = '';
  preview.style.display = 'none';
  placeholder.style.display = 'block';
};

// ============================================
// CONFIRMATION DIALOGS
// ============================================
window.confirmAction = function(message, callback) {
  if (confirm(message)) {
    callback();
  }
};

// ============================================
// LOADING STATES
// ============================================
window.setButtonLoading = function(button, loading = true) {
  if (loading) {
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText;
  }
};

// ============================================
// API HELPERS
// ============================================
window.api = {
  async get(url) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  async post(url, data) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  async put(url, data) {
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  async patch(url, data) {
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async delete(url) {
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      const error = new Error(data.message || 'An error occurred');
      if (data.errors) error.details = data.errors;
      throw error;
    }
    
    return data;
  }
};

// ============================================
// DATE FORMATTING
// ============================================
window.formatDate = function(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

window.formatDateTime = function(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ============================================
// DEBOUNCE UTILITY
// ============================================
window.debounce = function(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// ============================================
// EXPORT TO CSV
// ============================================
window.exportToCSV = function(data, filename) {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => 
      JSON.stringify(row[header] || '')
    ).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

// ============================================
// CONSOLE WELCOME MESSAGE
// ============================================
console.log('%c Computer Inventory System ', 'background: #4F46E5; color: white; font-size: 16px; padding: 10px;');
console.log('%c Built for IT Department ', 'font-size: 12px; color: #6B7280;');
