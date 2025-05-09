document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const overviewBtn = document.getElementById('overviewBtn');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const profileOverview = document.getElementById('profileOverview');
    const profileEditForm = document.getElementById('profileEditForm');
    const saveChangesBtn = document.getElementById('saveChangesBtn');

    const displayFields = {
        name: document.getElementById('userName'),
        email: document.getElementById('userEmail'),
        phone: document.getElementById('userPhone'),
        age: document.getElementById('userAge'),
        role: document.getElementById('userRole'),
        nationalID: document.getElementById('userNationalID'),
    };

    const inputFields = {
        name: document.getElementById('editName'),
        email: document.getElementById('editEmail'),
        phone: document.getElementById('editPhone'),
        age: document.getElementById('editAge'),
        role: document.getElementById('editRole'),
        nationalID: document.getElementById('editNationalID'),
    };

    if (!userId) {
        alert('User not logged in. Please log in.');
        return;
    }

    // Fetch user data
    fetch(`/users/${userId}`)
        .then(response => response.json())
        .then(user => {
            displayFields.name.textContent = user.username;
            displayFields.email.textContent = user.email;
            displayFields.phone.textContent = user.phone || 'User Phone';
            displayFields.age.textContent = user.age || 'User Age';
            displayFields.role.textContent = user.role || 'User Role';
            displayFields.nationalID.textContent = user.nationalID || 'User National ID';

            inputFields.name.value = user.username;
            inputFields.email.value = user.email;
            inputFields.phone.value = user.phone || '';
            inputFields.age.value = user.age || '';
            inputFields.role.value = user.role || '';
            inputFields.nationalID.value = user.nationalID || '';
        })
        .catch(error => {
            alert('Error fetching user data. Please try again later.');
            console.error(error);
        });

    // Toggle between Overview and Edit Profile sections
    overviewBtn.addEventListener('click', () => {
        profileOverview.style.display = 'block';
        profileEditForm.style.display = 'none';
        
        // Set active menu item
        overviewBtn.classList.add('active');
        editProfileBtn.classList.remove('active');
    });

    editProfileBtn.addEventListener('click', () => {
        profileOverview.style.display = 'none';
        profileEditForm.style.display = 'block';

        // Set active menu item
        editProfileBtn.classList.add('active');
        overviewBtn.classList.remove('active');
    });

    // Save changes in profile edit form
    saveChangesBtn.addEventListener('click', () => {
        const updatedUser = {
            username: inputFields.name.value.trim(),
            email: inputFields.email.value.trim(),
            phone: inputFields.phone.value.trim(),
            age: inputFields.age.value.trim(),
            role: inputFields.role.value.trim(),
            nationalID: inputFields.nationalID.value.trim(),
        };

        if (!updatedUser.username || !updatedUser.email) {
            alert('Name and Email are required.');
            return;
        }

        fetch('/users/updateProfile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updatedUser),
        })
            .then(response => response.json())
            .then(() => {
                // Update UI
                displayFields.name.textContent = updatedUser.username;
                displayFields.email.textContent = updatedUser.email;
                displayFields.phone.textContent = updatedUser.phone || 'User Phone';
                displayFields.age.textContent = updatedUser.age || 'User Age';
                displayFields.role.textContent = updatedUser.role || 'User Role';
                displayFields.nationalID.textContent = updatedUser.nationalID || 'User National ID';
                
                profileOverview.style.display = 'block';
                profileEditForm.style.display = 'none';
                
                // Set active menu item
                overviewBtn.classList.add('active');
                editProfileBtn.classList.remove('active');
            })
            .catch(error => {
                alert('Error updating profile. Please try again.');
                console.error(error);
            });
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        window.location.href = '/login'; // Redirect to login page
    });
});
