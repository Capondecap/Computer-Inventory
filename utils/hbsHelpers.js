// ============================================
// HANDLEBARS HELPERS
// Custom helpers for template rendering
// ============================================

module.exports = {
  // Comparison Helpers
  ifEquals: function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
  },

  eq: function(arg1, arg2) {
    return arg1 === arg2;
  },
  
  ifNotEquals: function(arg1, arg2, options) {
    return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
  },
  
  ifGreaterThan: function(arg1, arg2, options) {
    return (arg1 > arg2) ? options.fn(this) : options.inverse(this);
  },
  
  ifLessThan: function(arg1, arg2, options) {
    return (arg1 < arg2) ? options.fn(this) : options.inverse(this);
  },
  
  // Role-based Helpers
  isAdmin: function(role, options) {
    return (role === 'Admin') ? options.fn(this) : options.inverse(this);
  },
  
  isTechnician: function(role, options) {
    return (role === 'Technician') ? options.fn(this) : options.inverse(this);
  },
  
  // Date Formatting
  formatDate: function(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },
  
  formatDateTime: function(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  formatDateInput: function(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  },
  
  getCurrentDate: function() {
    return new Date().toISOString().split('T')[0];
  },
  
  // Time Helpers
  getDuration: function(startDate) {
    if (!startDate) return '';
    const start = new Date(startDate);
    const now = new Date();
    const diff = now - start;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    if (days < 365) {
      const months = Math.floor(days / 30);
      return months === 1 ? '1 month' : `${months} months`;
    }
    const years = Math.floor(days / 365);
    return years === 1 ? '1 year' : `${years} years`;
  },
  
  isExpired: function(date) {
    if (!date) return false;
    return new Date(date) < new Date();
  },
  
  // Asset Status Helpers
  getStatusClass: function(status) {
    const statusMap = {
      'Available': 'success',
      'In-Use': 'warning',
      'Maintenance': 'danger',
      'Retired': 'info'
    };
    return statusMap[status] || 'info';
  },
  
  canCheckout: function(status) {
    return status === 'Available';
  },
  
  getCategoryIcon: function(category) {
    const iconMap = {
      'Laptop': 'fa-laptop',
      'Desktop': 'fa-desktop',
      'Server': 'fa-server',
      'Monitor': 'fa-tv',
      'Keyboard': 'fa-keyboard',
      'Mouse': 'fa-mouse',
      'Printer': 'fa-print',
      'Headset': 'fa-headphones',
      'Webcam': 'fa-video',
      'Other': 'fa-box'
    };
    return iconMap[category] || 'fa-box';
  },
  
  // Number Formatting
  formatNumber: function(number) {
    if (!number) return '0';
    return number.toLocaleString();
  },
  
  formatCurrency: function(amount) {
    if (!amount) return '$0.00';
    return '$' + parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  },
  
  // Math Helpers
  add: function(a, b) {
    return a + b;
  },
  
  subtract: function(a, b) {
    return a - b;
  },
  
  multiply: function(a, b) {
    return a * b;
  },
  
  divide: function(a, b) {
    return b !== 0 ? a / b : 0;
  },
  
  percentage: function(value, total) {
    if (total === 0) return '0';
    return ((value / total) * 100).toFixed(1);
  },
  
  // Array Helpers
  length: function(array) {
    return Array.isArray(array) ? array.length : 0;
  },
  
  isEmpty: function(array) {
    return !Array.isArray(array) || array.length === 0;
  },
  
  isNotEmpty: function(array) {
    return Array.isArray(array) && array.length > 0;
  },
  
  // String Helpers
  truncate: function(str, len) {
    if (!str) return '';
    if (str.length <= len) return str;
    return str.substring(0, len) + '...';
  },
  
  uppercase: function(str) {
    return str ? str.toUpperCase() : '';
  },
  
  lowercase: function(str) {
    return str ? str.toLowerCase() : '';
  },
  
  capitalize: function(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },
  
  // JSON Helper
  json: function(context) {
    return JSON.stringify(context);
  },
  
  // Logical Helpers
  and: function() {
    return Array.prototype.slice.call(arguments, 0, -1).every(Boolean);
  },
  
  or: function() {
    return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
  },
  
  not: function(value) {
    return !value;
  },
  
  // Loop Helpers
  times: function(n, block) {
    let result = '';
    for (let i = 0; i < n; i++) {
      result += block.fn(i);
    }
    return result;
  },
  
  range: function(start, end, block) {
    let result = '';
    for (let i = start; i < end; i++) {
      result += block.fn(i);
    }
    return result;
  },
  
  // Conditional Rendering
  ifCond: function(v1, operator, v2, options) {
    switch (operator) {
      case '==':
        return (v1 == v2) ? options.fn(this) : options.inverse(this);
      case '===':
        return (v1 === v2) ? options.fn(this) : options.inverse(this);
      case '!=':
        return (v1 != v2) ? options.fn(this) : options.inverse(this);
      case '!==':
        return (v1 !== v2) ? options.fn(this) : options.inverse(this);
      case '<':
        return (v1 < v2) ? options.fn(this) : options.inverse(this);
      case '<=':
        return (v1 <= v2) ? options.fn(this) : options.inverse(this);
      case '>':
        return (v1 > v2) ? options.fn(this) : options.inverse(this);
      case '>=':
        return (v1 >= v2) ? options.fn(this) : options.inverse(this);
      case '&&':
        return (v1 && v2) ? options.fn(this) : options.inverse(this);
      case '||':
        return (v1 || v2) ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
    }
  },
  
  // Debugging Helper
  debug: function(value) {
    console.log('Current Context:', this);
    console.log('Value:', value);
    return '';
  }
};
