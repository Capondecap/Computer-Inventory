function getApiErrorMessage(error, fallback) {
  return error?.details?.[0]?.msg || error?.message || fallback;
}

document.addEventListener('DOMContentLoaded', () => {
  const addUserBtn = document.getElementById('addUserBtn');
  const roleFilter = document.getElementById('roleFilter');
  const newUserForm = document.getElementById('newUserForm');
  const editUserForm = document.getElementById('editUserForm');
  const changeRoleForm = document.getElementById('changeRoleForm');
  const actionButtons = document.querySelector('.data-table tbody');

  addUserBtn?.addEventListener('click', () => openModal('newUserModal'));

  document.querySelectorAll('[data-close-modal]').forEach((button) => {
    button.addEventListener('click', () => closeModal(button.dataset.closeModal));
  });

  document.querySelectorAll('.password-toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const group = toggle.closest('.password-input-group');
      const input = group?.querySelector('input');
      const icon = toggle.querySelector('i');
      if (!input || !icon) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      icon.classList.toggle('fa-eye', !isPassword);
      icon.classList.toggle('fa-eye-slash', isPassword);
    });
  });

  roleFilter?.addEventListener('change', function () {
    const role = this.value;
    document.querySelectorAll('.data-table tbody tr').forEach((row) => {
      if (!role) {
        row.style.display = '';
        return;
      }

      const userRole = row.querySelector('.user-role')?.textContent || '';
      row.style.display = userRole === role ? '' : 'none';
    });
  });

  actionButtons?.addEventListener('click', async (event) => {
    const button = event.target.closest('.user-action-btn');
    if (!button) return;

    const { action, userId, userRole, enable } = button.dataset;

    if (action === 'edit') {
      await editUser(userId);
      return;
    }

    if (action === 'change-role') {
      changeRole(userId, userRole);
      return;
    }

    if (action === 'toggle-status') {
      await toggleUserStatus(userId, enable === 'true');
    }
  });

  newUserForm?.addEventListener('submit', createUser);
  editUserForm?.addEventListener('submit', updateUser);
  changeRoleForm?.addEventListener('submit', updateUserRole);
});

async function createUser(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  try {
    await api.post('/api/users', data);
    showToast('User created successfully', 'success');
    closeModal('newUserModal');
    form.reset();
    setTimeout(() => window.location.reload(), 1000);
  } catch (error) {
    showToast(getApiErrorMessage(error, 'Failed to create user'), 'error');
  }
}

async function editUser(userId) {
  try {
    const response = await api.get(`/api/users/${userId}`);
    document.getElementById('editUserId').value = response.user._id;
    document.getElementById('editUserName').value = response.user.name;
    document.getElementById('editUserEmail').value = response.user.email;
    const passwordField = document.getElementById('editUserPassword');
    if (passwordField) passwordField.value = '';
    const editPasswordToggle = document.querySelector('#editUserModal .password-toggle i');
    if (editPasswordToggle) {
      editPasswordToggle.classList.add('fa-eye');
      editPasswordToggle.classList.remove('fa-eye-slash');
    }
    openModal('editUserModal');
  } catch (error) {
    showToast(getApiErrorMessage(error, 'Failed to load user data'), 'error');
  }
}

async function updateUser(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const userId = document.getElementById('editUserId').value;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  if (!data.password?.trim()) delete data.password;
  delete data.userId;

  try {
    await api.put(`/api/users/${userId}`, data);
    showToast('User updated successfully', 'success');
    closeModal('editUserModal');
    setTimeout(() => window.location.reload(), 1000);
  } catch (error) {
    showToast(getApiErrorMessage(error, 'Failed to update user'), 'error');
  }
}

function changeRole(userId, currentRole) {
  document.getElementById('roleUserId').value = userId;
  document.getElementById('newRole').value = currentRole || 'Technician';
  openModal('changeRoleModal');
}

async function updateUserRole(event) {
  event.preventDefault();
  const userId = document.getElementById('roleUserId').value;
  const role = document.getElementById('newRole').value;

  try {
    await api.patch(`/api/users/${userId}/role`, { role });
    showToast('User role updated successfully', 'success');
    closeModal('changeRoleModal');
    setTimeout(() => window.location.reload(), 1000);
  } catch (error) {
    showToast(getApiErrorMessage(error, 'Failed to update role'), 'error');
  }
}

async function toggleUserStatus(userId, enable) {
  const action = enable ? 'enable' : 'disable';
  if (!confirm(`Are you sure you want to ${action} this user?`)) return;

  try {
    await api.patch(`/api/users/${userId}/status`, { isActive: enable });
    showToast(`User ${action}d successfully`, 'success');
    setTimeout(() => window.location.reload(), 1000);
  } catch (error) {
    showToast(getApiErrorMessage(error, `Failed to ${action} user`), 'error');
  }
}
