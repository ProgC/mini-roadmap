// 로드맵 데이터와 필터 상태
let roadmapData = null;
let filteredItems = [];

// DOM 요소들
const statusFilter = document.getElementById('status-filter');
const categoryFilter = document.getElementById('category-filter');
const priorityFilter = document.getElementById('priority-filter');

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async () => {
    await loadRoadmapData();
    setupFilters();
    renderRoadmap();
    setupGridColsSelect();
});

function setupGridColsSelect() {
    const gridColsSelect = document.getElementById('grid-cols-select');
    const itemsGrid = document.getElementById('items-grid');
    if (!gridColsSelect || !itemsGrid) return;
    function updateGridCols() {
        const cols = parseInt(gridColsSelect.value, 10);
        itemsGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    }
    gridColsSelect.addEventListener('change', updateGridCols);
    updateGridCols(); // 초기값 적용
}

// 로드맵 데이터 로드
async function loadRoadmapData() {
    try {
        const response = await fetch('/api/roadmap');
        roadmapData = await response.json();
        filteredItems = [...roadmapData.items];
        console.log('Loaded roadmap data:', roadmapData); // 디버깅용
        console.log('Items count:', roadmapData.items.length); // 디버깅용
    } catch (error) {
        console.error('Failed to load roadmap data:', error);
        showAlert('Failed to load data.', 'error');
    }
}

// 필터 설정
function setupFilters() {
    if (!roadmapData) return;

    // 상태 필터 옵션 추가
    roadmapData.filters.status.forEach(status => {
        if (status !== 'All') {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = getStatusText(status);
            statusFilter.appendChild(option);
        }
    });

    // 카테고리 필터 옵션 추가
    roadmapData.filters.category.forEach(category => {
        if (category !== 'All') {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        }
    });

    // 우선순위 필터 옵션 추가
    roadmapData.filters.priority.forEach(priority => {
        if (priority !== 'All') {
            const option = document.createElement('option');
            option.value = priority;
            option.textContent = getPriorityText(priority);
            priorityFilter.appendChild(option);
        }
    });

    // 필터 이벤트 리스너 추가
    statusFilter.addEventListener('change', filterItems);
    categoryFilter.addEventListener('change', filterItems);
    priorityFilter.addEventListener('change', filterItems);
}

// 아이템 필터링
function filterItems() {
    const statusValue = statusFilter.value;
    const categoryValue = categoryFilter.value;
    const priorityValue = priorityFilter.value;

    filteredItems = roadmapData.items.filter(item => {
        const statusMatch = statusValue === 'All' || item.status === statusValue;
        const categoryMatch = categoryValue === 'All' || item.category === categoryValue;
        const priorityMatch = priorityValue === 'All' || item.priority === priorityValue;

        return statusMatch && categoryMatch && priorityMatch;
    });

    renderRoadmap();
}

// 로드맵 렌더링
function renderRoadmap() {
    const itemsGrid = document.getElementById('items-grid');

    // 컨테이너 초기화
    itemsGrid.innerHTML = '';

    console.log('Filtered items:', filteredItems); // 디버깅용
    
    if (filteredItems.length === 0) {
        itemsGrid.innerHTML = '<div class="no-items">No items found.</div>';
        return;
    }

    // 모든 아이템을 그리드에 렌더링
    filteredItems.forEach(item => {
        console.log('Processing item:', item); // 디버깅용
        const itemElement = createRoadmapItem(item);
        itemsGrid.appendChild(itemElement);
    });
}

// 모달 생성
function createModal(item) {
    // 모달 엘리먼트 생성
    let modal = document.getElementById('roadmap-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'roadmap-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <div class="modal-thumb">${item.thumbnail ? `<img src="${item.thumbnail}" alt="thumbnail" />` : ''}</div>
            <h2>${item.title}</h2>
            <div class="modal-description">${item.description}</div>
            <div class="modal-meta">
                <span class="item-category">${item.category}</span>
                <span class="item-priority priority-${item.priority.toLowerCase()}">${getPriorityText(item.priority)}</span>
                <span class="modal-heart"><button id="heart-btn">&#10084;</button> <span id="heart-count">${item.heartCount || 0}</span></span>
            </div>
            <div class="modal-progress">
                <div class="progress-bar"><div class="progress-fill" style="width: ${item.progress}%"></div></div>
                <div class="progress-text">${item.progress}% complete</div>
            </div>
            <div class="modal-comments-section">
                <h3>Comments</h3>
                <div id="comments-list" class="comments-list"></div>
                <form id="comment-form" class="comment-form">
                    <input type="text" id="comment-author" placeholder="Your name (optional)" maxlength="20" />
                    <textarea id="comment-content" placeholder="Write a comment..." required></textarea>
                    <button type="submit">Add Comment</button>
                </form>
            </div>
        </div>
    `;
    modal.style.display = 'block';
    // 닫기 이벤트
    modal.querySelector('.close').onclick = () => { modal.style.display = 'none'; };
    // window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    // 하트 버튼 이벤트
    modal.querySelector('#heart-btn').onclick = async () => {
        const res = await fetch(`/api/roadmap/items/${item.id}/heart`, { method: 'POST' });
        const data = await res.json();
        modal.querySelector('#heart-count').textContent = data.heartCount;
        // 카드의 하트 개수도 동기화
        const card = document.querySelectorAll('.roadmap-item');
        card.forEach(c => {
            if (c.querySelector('.item-title').textContent === item.title) {
                const hc = c.querySelector('.heart-count');
                if (hc) hc.textContent = data.heartCount;
            }
        });
        item.heartCount = data.heartCount;
    };
    // 댓글 불러오기
    loadComments(item.id);
    // 댓글 작성 이벤트
    modal.querySelector('#comment-form').onsubmit = async (e) => {
        e.preventDefault();
        const author = modal.querySelector('#comment-author').value;
        const content = modal.querySelector('#comment-content').value;
        if (!content.trim()) return;
        try {
            await fetch(`/api/roadmap/items/${item.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author, content })
            });
            modal.querySelector('#comment-content').value = '';
            await loadComments(item.id);
        } catch (err) {
            alert('Failed to save comment.');
        }
    };
}
// 댓글 불러오기
async function loadComments(itemId) {
    const res = await fetch(`/api/roadmap/items/${itemId}/comments`);
    const comments = await res.json();
    const list = document.getElementById('comments-list');
    list.innerHTML = '';
    comments.forEach(c => {
        const div = document.createElement('div');
        div.className = 'comment';
        div.innerHTML = `<div class="comment-meta"><b>${c.author || 'Anonymous'}</b> <span class="comment-date">${new Date(c.createdAt).toLocaleString()}</span></div><div class="comment-content">${c.content}</div>`;
        list.appendChild(div);
    });
    list.scrollTop = list.scrollHeight;
}
// 카드 생성 함수 수정
function createRoadmapItem(item) {
    const itemElement = document.createElement('div');
    itemElement.className = 'roadmap-item';
    let thumbHtml = '';
    if (item.thumbnail) {
        thumbHtml = `<div class="roadmap-thumb"><img src="${item.thumbnail}" alt="thumbnail" /></div>`;
    }
    // 설명 2줄만 보이게 자르기
    let shortDesc = item.description.length > 80 ? item.description.slice(0, 80) + '...' : item.description;
    itemElement.innerHTML = `
        <div class="roadmap-card-main">
            ${thumbHtml}
            <div class="item-title">${item.title}</div>
            <div class="item-description">${shortDesc}</div>
            <div class="item-meta">
                <span class="item-status status-${item.status.toLowerCase().replace(' ', '-')}">${getStatusText(item.status)}</span>
                <span class="item-category">${item.category}</span>
                <span class="item-priority priority-${item.priority.toLowerCase()}">${getPriorityText(item.priority)}</span>
            </div>
            ${item.tags && item.tags.length > 0 ? `
            <div class="item-tags-display">
                ${item.tags.map(tag => {
                    if (tag.image) {
                        return `<img src="${tag.image}" alt="${tag.name}" class="card-tag-image" title="${tag.name}" />`;
                    } else if (tag.icon) {
                        return `<span class="card-tag" style="color: ${tag.color}" title="${tag.name}">${tag.icon}</span>`;
                    }
                    return '';
                }).join('')}
            </div>
            ` : ''}
        </div>
        <div class="roadmap-card-footer">
            <div class="item-heart"><button class="heart-btn">&#10084;</button> <span class="heart-count">${typeof item.heartCount === 'number' ? item.heartCount : 0}</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width: ${item.progress}%"></div></div>
            <div class="progress-text">${item.progress}% complete</div>
        </div>
    `;
    // 하트 버튼 이벤트
    const heartBtn = itemElement.querySelector('.heart-btn');
    const heartCountSpan = itemElement.querySelector('.heart-count');
    heartBtn.onclick = async (e) => {
        e.stopPropagation();
        const res = await fetch(`/api/roadmap/items/${item.id}/heart`, { method: 'POST' });
        const data = await res.json();
        heartCountSpan.textContent = typeof data.heartCount === 'number' ? data.heartCount : 0;
        item.heartCount = data.heartCount;
    };
    // 클릭 시 상세 모달
    itemElement.onclick = () => createModal(item);
    return itemElement;
}

// 빈 상태 메시지 표시
function showEmptyState(container, status) {
    if (container.children.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-state';
        emptyMessage.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #999;">
                <p>No ${getStatusText(status)} items.</p>
            </div>
        `;
        container.appendChild(emptyMessage);
    }
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