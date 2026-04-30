const assetSelect = document.getElementById('assetId');
const userSelect = document.getElementById('assignedTo');
const selectedAssetDiv = document.getElementById('selectedAsset');
const selectedUserDiv = document.getElementById('selectedUser');
const checkoutForm = document.getElementById('checkout-form');

function updateAssetPreview() {
  const option = assetSelect?.selectedOptions?.[0];
  const itemId = option?.dataset.assetId;

  if (!itemId) {
    selectedAssetDiv.style.display = 'none';
    return;
  }

  document.getElementById('selectedAssetName').textContent = itemId;
  document.getElementById('selectedAssetDetails').textContent = `${option.dataset.brand} ${option.dataset.model} — SN: ${option.dataset.serialNumber}`;
  document.getElementById('selectedAssetStatus').textContent = option.dataset.status;
  selectedAssetDiv.style.display = 'block';
}

function updateUserPreview() {
  const option = userSelect?.selectedOptions?.[0];
  const name = option?.dataset.name;

  if (!name) {
    selectedUserDiv.style.display = 'none';
    return;
  }

  document.getElementById('selectedUserName').textContent = name;
  document.getElementById('selectedUserEmail').textContent = option.dataset.email;
  document.getElementById('selectedUserRole').textContent = option.dataset.role;
  selectedUserDiv.style.display = 'block';
}

function clearAssetSelection() {
  assetSelect.value = '';
  updateAssetPreview();
}

function clearUserSelection() {
  userSelect.value = '';
  updateUserPreview();
}

assetSelect?.addEventListener('change', updateAssetPreview);
userSelect?.addEventListener('change', updateUserPreview);

checkoutForm?.addEventListener('submit', async function (e) {
  e.preventDefault();

  if (!assetSelect.value) { showToast('Please select an asset', 'error'); return; }
  if (!userSelect.value) { showToast('Please select a user', 'error'); return; }

  const btn = this.querySelector('[type="submit"]');
  setButtonLoading(btn, true);

  const formData = new FormData(this);

  try {
    const response = await fetch('/api/transactions/checkout', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Checkout failed');
    showToast('Asset checked out successfully', 'success');
    setTimeout(() => window.location.href = '/assignments', 1000);
  } catch (err) {
    showToast(err.message || 'Checkout failed', 'error');
    setButtonLoading(btn, false);
  }
});

updateAssetPreview();
updateUserPreview();

// File upload handling
const fileArea = document.getElementById('fileUploadArea');
const fileInput = document.getElementById('document');

fileArea?.addEventListener('click', () => fileInput.click());

fileInput?.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const fileName = this.files[0].name;
        document.querySelector('.upload-placeholder').style.display = 'none';
        document.querySelector('.upload-preview').style.display = 'flex';
        document.querySelector('.file-name').textContent = fileName;
    }
});

function clearFile() {
    const fileInput = document.getElementById('document');
    if (fileInput) fileInput.value = '';
    document.querySelector('.upload-placeholder').style.display = 'block';
    document.querySelector('.upload-preview').style.display = 'none';
}

// Global exposure for the clear button
window.clearFile = clearFile;
