// 관리자 페이지 기능
let roadmapData = null;
let currentEditItem = null;

// 태그 관련 변수
let tagsData = [];

// DOM 요소들
const addItemForm = document.getElementById('add-item-form');
const addCategoryForm = document.getElementById('add-category-form');
const editItemForm = document.getElementById('edit-item-form');
const itemsList = document.getElementById('items-list');
const modal = document.getElementById('edit-modal');
const closeModal = document.querySelector('.close');
const deleteBtn = document.getElementById('delete-btn');
const thumbnailInput = document.getElementById('thumbnail');
const addThumbnailPreview = document.getElementById('add-thumbnail-preview');
const editThumbnailInput = document.getElementById('edit-thumbnail');
const editThumbnailPreview = document.getElementById('edit-thumbnail-preview');

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async () => {
    await loadRoadmapData();
    await loadTagsData();
    setupEventListeners();
    renderItemsList();
    populateCategorySelects();
    populateTagSelects();
    if (thumbnailInput) {
        thumbnailInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    addThumbnailPreview.src = e.target.result;
                    addThumbnailPreview.style.display = 'block';
                };
                reader.readAsDataURL(this.files[0]);
            } else {
                addThumbnailPreview.style.display = 'none';
            }
        });
    }
    if (editThumbnailInput) {
        editThumbnailInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    editThumbnailPreview.src = e.target.result;
                    editThumbnailPreview.style.display = 'block';
                };
                reader.readAsDataURL(this.files[0]);
            } else {
                editThumbnailPreview.style.display = 'none';
            }
        });
    }
    // Paste event for add thumbnail
    if (thumbnailInput) {
        thumbnailInput.addEventListener('paste', function(e) {
            const items = (e.clipboardData || window.clipboardData).items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    thumbnailInput.files = dataTransfer.files;
                    const reader = new FileReader();
                    reader.onload = function(ev) {
                        addThumbnailPreview.src = ev.target.result;
                        addThumbnailPreview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                    break;
                }
            }
        });
    }
    // Paste event for edit thumbnail
    if (editThumbnailInput) {
        editThumbnailInput.addEventListener('paste', function(e) {
            const items = (e.clipboardData || window.clipboardData).items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    editThumbnailInput.files = dataTransfer.files;
                    const reader = new FileReader();
                    reader.onload = function(ev) {
                        editThumbnailPreview.src = ev.target.result;
                        editThumbnailPreview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                    break;
                }
            }
        });
    }
});

// 로드맵 데이터 로드
async function loadRoadmapData() {
    try {
        const response = await fetch('/api/roadmap');
        roadmapData = await response.json();
        renderCategoryList();
    } catch (error) {
        console.error('Failed to load roadmap data:', error);
        showAlert('Failed to load data.', 'error');
    }
}

// 태그 데이터 로드
async function loadTagsData() {
    try {
        const response = await fetch('/api/roadmap/tags');
        tagsData = await response.json();
        renderTagsList();
    } catch (error) {
        console.error('Failed to load tags data:', error);
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 새 아이템 추가 폼
    addItemForm.addEventListener('submit', handleAddItem);
    
    // 새 카테고리 추가 폼
    addCategoryForm.addEventListener('submit', handleAddCategory);
    
    // 수정 폼
    editItemForm.addEventListener('submit', handleEditItem);
    
    // 모달 닫기
    closeModal.addEventListener('click', closeEditModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeEditModal();
        }
    });
    
    // 삭제 버튼
    deleteBtn.addEventListener('click', handleDeleteItem);
}

// 카테고리 선택 옵션 채우기
function populateCategorySelects() {
    if (!roadmapData) return;
    
    const categorySelects = [
        document.getElementById('category'),
        document.getElementById('edit-category')
    ];
    
    categorySelects.forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">Select category</option>';
            roadmapData.filters.category.forEach(category => {
                if (category !== 'All') {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    select.appendChild(option);
                }
            });
        }
    });
}

// 태그 선택 옵션 채우기
function populateTagSelects() {
    const tagSelect = document.getElementById('tag-selector');
    if (tagSelect) {
        tagSelect.innerHTML = '<option value="">Select a tag to add...</option>';
        tagsData.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag.id;
            let displayText = tag.name;
            if (tag.image) {
                displayText = `🖼️ ${tag.name}`;
            } else if (tag.icon) {
                displayText = `${tag.icon} ${tag.name}`;
            }
            option.textContent = displayText;
            tagSelect.appendChild(option);
        });
    }
}

// 새 아이템 추가 처리
async function handleAddItem(e) {
    e.preventDefault();
    
    const formData = new FormData(addItemForm);
    try {
        const response = await fetch('/api/roadmap/items', {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            const newItem = await response.json();
            roadmapData.items.push(newItem);
            addItemForm.reset();
            renderItemsList();
            showAlert('Content added successfully.', 'success');
        } else {
            const error = await response.json();
            showAlert(error.error || 'Failed to add content.', 'error');
        }
    } catch (error) {
        console.error('Error adding content:', error);
        showAlert('Failed to add content.', 'error');
    }
}

// 새 카테고리 추가 처리
async function handleAddCategory(e) {
    e.preventDefault();
    
    const formData = new FormData(addCategoryForm);
    const categoryData = {
        category: formData.get('category')
    };
    
    try {
        const response = await fetch('/api/roadmap/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoryData)
        });
        
        if (response.ok) {
            const result = await response.json();
            roadmapData.filters.category.push(result.category);
            addCategoryForm.reset();
            populateCategorySelects();
            showAlert('Category added successfully.', 'success');
        } else {
            const error = await response.json();
            showAlert(error.error || 'Failed to add category.', 'error');
        }
    } catch (error) {
        console.error('Error adding category:', error);
        showAlert('Failed to add category.', 'error');
    }
}

// 아이템 수정 처리
async function handleEditItem(e) {
    e.preventDefault();
    
    const formData = new FormData(editItemForm);
    const itemData = {
        title: formData.get('title'),
        description: formData.get('description'),
        status: formData.get('status'),
        category: formData.get('category'),
        priority: formData.get('priority'),
        progress: parseInt(formData.get('progress')) || 0
    };
    
    try {
        const response = await fetch(`/api/roadmap/items/${currentEditItem.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemData)
        });
        
        if (response.ok) {
            const updatedItem = await response.json();
            const index = roadmapData.items.findIndex(item => item.id === currentEditItem.id);
            if (index !== -1) {
                roadmapData.items[index] = updatedItem;
            }
            closeEditModal();
            renderItemsList();
            showAlert('Content updated successfully.', 'success');
        } else {
            const error = await response.json();
            showAlert(error.error || 'Failed to update content.', 'error');
        }
    } catch (error) {
        console.error('Error updating content:', error);
        showAlert('Failed to update content.', 'error');
    }
}

// 아이템 삭제 처리
async function handleDeleteItem() {
    if (!currentEditItem) return;
    
    if (!confirm('Are you sure you want to delete this content?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/roadmap/items/${currentEditItem.id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            const index = roadmapData.items.findIndex(item => item.id === currentEditItem.id);
            if (index !== -1) {
                roadmapData.items.splice(index, 1);
            }
            closeEditModal();
            renderItemsList();
            showAlert('Content deleted successfully.', 'success');
        } else {
            const error = await response.json();
            showAlert(error.error || 'Failed to delete content.', 'error');
        }
    } catch (error) {
        console.error('Error deleting content:', error);
        showAlert('Failed to delete content.', 'error');
    }
}

// 아이템 리스트 렌더링
function renderItemsList() {
    if (!roadmapData) return;
    
    itemsList.innerHTML = '';
    
    roadmapData.items.forEach(item => {
        const itemCard = createItemCard(item);
        itemsList.appendChild(itemCard);
    });
}

// 카테고리 리스트 렌더링
function renderCategoryList() {
    const list = document.getElementById('category-list');
    if (!list || !roadmapData) return;
    list.innerHTML = '';
    const categories = roadmapData.filters.category.filter(c => c !== 'All');
    categories.forEach(category => {
        const li = document.createElement('li');
        li.textContent = category;
        if (category !== 'Uncategorized') {
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-category-btn';
            delBtn.innerHTML = '&times;';
            delBtn.title = 'Delete category';
            delBtn.onclick = async () => {
                if (!confirm(`Delete category '${category}'? Items will be set to 'Uncategorized'.`)) return;
                await fetch(`/api/roadmap/categories/${encodeURIComponent(category)}`, { method: 'DELETE' });
                await loadRoadmapData();
                renderCategoryList();
                populateCategorySelects();
                renderItemsList();
            };
            li.appendChild(delBtn);
        }
        list.appendChild(li);
    });
}

// 태그 리스트 렌더링
function renderTagsList() {
    const list = document.getElementById('tags-list');
    if (!list) return;
    
    list.innerHTML = '';
    tagsData.forEach(tag => {
        const tagDiv = document.createElement('div');
        tagDiv.className = 'tag-item';
        
        let displayElement = '';
        if (tag.image) {
            displayElement = `<img src="${tag.image}" alt="${tag.name}" class="tag-image" />`;
        } else if (tag.icon) {
            displayElement = `<span class="tag-icon" style="color: ${tag.color}">${tag.icon}</span>`;
        }
        
        tagDiv.innerHTML = `
            ${displayElement}
            <span class="tag-name">${tag.name}</span>
            <button class="delete-tag-btn" data-id="${tag.id}">&times;</button>
        `;
        list.appendChild(tagDiv);
    });

    // 태그 삭제 버튼 이벤트
    list.querySelectorAll('.delete-tag-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const tagId = e.target.getAttribute('data-id');
            if (!confirm('Delete this tag?')) return;
            
            try {
                const response = await fetch(`/api/roadmap/tags/${tagId}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    await loadTagsData();
                    populateTagSelects();
                }
            } catch (error) {
                console.error('Error deleting tag:', error);
            }
        });
    });
}

// 태그 추가 폼 이벤트
document.getElementById('add-tag-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('/api/roadmap/tags', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            e.target.reset();
            document.getElementById('tag-image-preview').style.display = 'none';
            await loadTagsData();
            populateTagSelects();
            showAlert('Tag added successfully.', 'success');
        } else {
            const error = await response.json();
            showAlert(error.error || 'Failed to add tag.', 'error');
        }
    } catch (error) {
        console.error('Error adding tag:', error);
        showAlert('Failed to add tag.', 'error');
    }
});

// 태그 이미지 미리보기
document.getElementById('new-tag-image').addEventListener('change', function() {
    const preview = document.getElementById('tag-image-preview');
    const previewImg = preview.querySelector('img');
    
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(this.files[0]);
    } else {
        preview.style.display = 'none';
    }
});

// 아이템 카드 생성
function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    let thumbHtml = '';
    if (item.thumbnail) {
        thumbHtml = `<div class="admin-thumb"><img src="${item.thumbnail}" alt="thumbnail" /></div>`;
    }
    card.innerHTML = `
        ${thumbHtml}
        <div class="item-header">
            <div>
                <div class="item-title">${item.title}</div>
                <div class="item-description">${item.description}</div>
            </div>
        </div>
        <div class="item-meta">
            <span><strong>Status:</strong> ${getStatusText(item.status)}</span>
            <span><strong>Category:</strong> ${item.category}</span>
            <span><strong>Priority:</strong> ${getPriorityText(item.priority)}</span>
            <span><strong>Progress:</strong> ${item.progress}%</span>
        </div>
        <div class="item-actions">
            <button class="btn-history" onclick="showItemHistory(${item.id})">View History</button>
            <button class="btn-edit" onclick="openEditModal(${item.id})">Edit</button>
        </div>
    `;
    return card;
}

// 수정 모달 열기
function openEditModal(itemId) {
    const item = roadmapData.items.find(item => item.id === itemId);
    if (!item) return;
    
    currentEditItem = item;
    
    // 폼 필드 채우기
    document.getElementById('edit-id').value = item.id;
    document.getElementById('edit-title').value = item.title;
    document.getElementById('edit-description').value = item.description;
    document.getElementById('edit-status').value = item.status;
    document.getElementById('edit-category').value = item.category;
    document.getElementById('edit-priority').value = item.priority;
    document.getElementById('edit-progress').value = item.progress;
    if (item.thumbnail) {
        editThumbnailPreview.src = item.thumbnail;
        editThumbnailPreview.style.display = 'block';
    } else {
        editThumbnailPreview.style.display = 'none';
    }
    
    // 아이템 태그 렌더링
    renderItemTags(itemId);
    
    modal.style.display = 'block';
}

// 수정 모달 닫기
function closeEditModal() {
    modal.style.display = 'none';
    currentEditItem = null;
    editItemForm.reset();
}

// Status text conversion
function getStatusText(status) {
    const statusMap = {
        'Planning': 'Planning',
        'In Progress': 'In Progress',
        'Completed': 'Completed'
    };
    return statusMap[status] || status;
}

// Priority text conversion
function getPriorityText(priority) {
    const priorityMap = {
        'High': 'High',
        'Medium': 'Medium',
        'Low': 'Low'
    };
    return priorityMap[priority] || priority;
}

// 알림 메시지 표시
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// 아이템 이력 조회
async function showItemHistory(itemId) {
    try {
        const response = await fetch(`/api/roadmap/items/${itemId}/history`);
        const history = await response.json();
        
        const historyContainer = document.getElementById('history-container');
        const item = roadmapData.items.find(i => i.id == itemId);
        
        historyContainer.innerHTML = `
            <div class="history-header">
                <h3>History for: ${item.title}</h3>
                <button class="btn btn-small btn-secondary" onclick="clearHistory()">Close</button>
            </div>
            <div class="history-list">
                ${history.length === 0 ? '<p class="no-history">No history available.</p>' : ''}
                ${history.map(h => `
                    <div class="history-item">
                        <div class="history-info">
                            <span class="history-type ${h.backupType.toLowerCase()}">${h.backupType}</span>
                            <span class="history-date">${new Date(h.backupAt).toLocaleString()}</span>
                        </div>
                        <div class="history-content">
                            <strong>${h.title}</strong>
                            <p>${h.description}</p>
                            <div class="history-meta">
                                <span class="status ${h.status.toLowerCase().replace(' ', '-')}">${h.status}</span>
                                <span class="category">${h.category}</span>
                                <span class="priority priority-${h.priority.toLowerCase()}">${h.priority}</span>
                                <span class="progress">${h.progress}%</span>
                            </div>
                        </div>
                        <button class="btn btn-small btn-primary restore-btn" data-item-id="${itemId}" data-history-id="${h.id}">Restore</button>
                    </div>
                `).join('')}
            </div>
        `;
        
        // 복구 버튼 이벤트
        historyContainer.querySelectorAll('.restore-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const itemId = e.target.getAttribute('data-item-id');
                const historyId = e.target.getAttribute('data-history-id');
                
                if (confirm('Are you sure you want to restore this version?')) {
                    try {
                        const response = await fetch(`/api/roadmap/items/${itemId}/restore/${historyId}`, {
                            method: 'POST'
                        });
                        
                        if (response.ok) {
                            showAlert('Content restored successfully!', 'success');
                            await loadRoadmapData();
                            renderItemsList();
                            clearHistory();
                        } else {
                            showAlert('Failed to restore content.', 'error');
                        }
                    } catch (error) {
                        console.error('Error restoring content:', error);
                        showAlert('Error restoring content.', 'error');
                    }
                }
            });
        });
        
    } catch (error) {
        console.error('Error loading history:', error);
        showAlert('Error loading history.', 'error');
    }
}

// 이력 컨테이너 초기화
function clearHistory() {
    document.getElementById('history-container').innerHTML = '';
} 

// 아이템 태그 관리
function renderItemTags(itemId) {
    const itemTagsContainer = document.getElementById('item-tags');
    if (!itemTagsContainer) return;
    
    // 현재 아이템의 태그들 가져오기
    fetch(`/api/roadmap/items/${itemId}/tags`)
        .then(response => response.json())
        .then(tags => {
            itemTagsContainer.innerHTML = '';
            tags.forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'item-tag';
                
                let displayElement = '';
                if (tag.image) {
                    displayElement = `<img src="${tag.image}" alt="${tag.name}" class="tag-image" />`;
                } else if (tag.icon) {
                    displayElement = `<span class="tag-icon" style="color: ${tag.color}">${tag.icon}</span>`;
                }
                
                tagSpan.innerHTML = `
                    ${displayElement}
                    <span class="tag-name">${tag.name}</span>
                    <button class="remove-tag-btn" data-tag-id="${tag.id}">&times;</button>
                `;
                itemTagsContainer.appendChild(tagSpan);
            });

            // 태그 제거 버튼 이벤트
            itemTagsContainer.querySelectorAll('.remove-tag-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const tagId = e.target.getAttribute('data-tag-id');
                    try {
                        const response = await fetch(`/api/roadmap/items/${itemId}/tags/${tagId}`, {
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            renderItemTags(itemId);
                        }
                    } catch (error) {
                        console.error('Error removing tag:', error);
                    }
                });
            });
        });
}

// 태그 추가 버튼 이벤트
document.getElementById('add-tag-btn').addEventListener('click', async () => {
    const tagSelector = document.getElementById('tag-selector');
    const selectedTagId = tagSelector.value;
    
    if (!selectedTagId || !currentEditItem) return;
    
    try {
        const response = await fetch(`/api/roadmap/items/${currentEditItem.id}/tags`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tagId: selectedTagId })
        });
        
        if (response.ok) {
            tagSelector.value = '';
            renderItemTags(currentEditItem.id);
            showAlert('Tag added to item successfully.', 'success');
        } else {
            showAlert('Failed to add tag to item.', 'error');
        }
    } catch (error) {
        console.error('Error adding tag to item:', error);
        showAlert('Failed to add tag to item.', 'error');
    }
}); 