document.addEventListener('DOMContentLoaded', function() {
    const statusSelect = document.getElementById('status');
    const template = document.getElementById('assigned-to-template');
    
    function toggleAssignedTo() {
        console.log('Status changed to:', statusSelect.value);
        const existing = document.getElementById('assigned-to-row');
        
        if (statusSelect.value === 'In-Use') {
            if (!existing) {
                console.log('Adding Assigned To field...');
                const clone = template.content.cloneNode(true);
                const statusRow = statusSelect.closest('.form-row');
                statusRow.insertAdjacentElement('afterend', clone.children[0]);
            }
        } else {
            if (existing) {
                console.log('Removing Assigned To field...');
                existing.remove();
            }
        }
    }
    
    if (statusSelect && template) {
        statusSelect.addEventListener('change', toggleAssignedTo);
        toggleAssignedTo(); // initial state
    } else {
        console.error('Status select or template not found!');
    }
});
