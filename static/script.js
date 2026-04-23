// ========== GLOBAL VARIABLES ==========
let isAdmin = false;
let preloadedImages = [];
let currentLightboxIndex = 0;
let userFavorites = [];

// ========== UTILITY FUNCTIONS ==========
function showFlash(message, type = 'success') {
    const flash = document.getElementById('flash-message');
    flash.textContent = message;
    flash.className = `flash-message ${type} show`;
    
    setTimeout(() => {
        flash.classList.remove('show');
    }, 3000);
}

function getUserName() {
    return localStorage.getItem('userName') || '';
}

// ========== INTRO SCREEN ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 800, once: true, offset: 100 });
    }

    const storedName = getUserName();
    
    if (storedName) {
        document.getElementById('display-name').textContent = storedName;
        document.getElementById('message-name').value = storedName;
        document.getElementById('future-name').value = storedName;
        document.getElementById('comment-name').value = storedName;
        
        document.getElementById('intro-screen').style.display = 'none';
        document.getElementById('main-website').style.display = 'block';
        
        loadAllData();
    }
    
    const introForm = document.getElementById('intro-form');
    if (introForm) {
        introForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nameInput = document.getElementById('user-name-input');
            const name = nameInput.value.trim();
            
            if (name) {
                localStorage.setItem('userName', name);
                
                fetch('/api/save-name', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name })
                }).catch(err => console.log('Save error:', err));
                
                const introScreen = document.getElementById('intro-screen');
                introScreen.classList.add('fade-out');
                
                setTimeout(() => {
                    introScreen.style.display = 'none';
                    document.getElementById('main-website').style.display = 'block';
                    document.getElementById('display-name').textContent = name;
                    document.getElementById('message-name').value = name;
                    document.getElementById('future-name').value = name;
                    document.getElementById('comment-name').value = name;
                    
                    loadAllData();
                }, 500);
            } else {
                alert('Vui lòng nhập tên của bạn!');
            }
        });
    }
    
    document.getElementById('change-name-btn').addEventListener('click', function() {
        const newName = prompt('Nhập tên mới của bạn:', getUserName());
        if (newName && newName.trim()) {
            localStorage.setItem('userName', newName.trim());
            document.getElementById('display-name').textContent = newName.trim();
            document.getElementById('message-name').value = newName.trim();
            document.getElementById('future-name').value = newName.trim();
            document.getElementById('comment-name').value = newName.trim();
            showFlash('Đã đổi tên thành công!');
        }
    });
});

// ========== MUSIC CONTROL ==========
const music = document.getElementById('background-music');
const musicToggle = document.getElementById('music-toggle');
const volumeSlider = document.getElementById('volume-slider');

let musicPlaying = false;

musicToggle.addEventListener('click', function() {
    if (musicPlaying) {
        music.pause();
        musicToggle.querySelector('.icon-sound').textContent = '🔇';
        musicPlaying = false;
    } else {
        music.play();
        musicToggle.querySelector('.icon-sound').textContent = '🔊';
        musicPlaying = true;
    }
});

volumeSlider.addEventListener('input', function() {
    music.volume = this.value / 100;
});

// ========== NAVIGATION ==========
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        
        const section = this.dataset.section;
        document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`${section}-section`).classList.add('active');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

// ========== NOTIFICATIONS ==========
const notifToggle = document.getElementById('notif-toggle');
const notifPanel = document.getElementById('notif-panel');
const notifClose = document.getElementById('notif-close');

notifToggle.addEventListener('click', function() {
    notifPanel.style.display = notifPanel.style.display === 'none' ? 'block' : 'none';
    loadNotifications();
});

notifClose.addEventListener('click', function() {
    notifPanel.style.display = 'none';
});

function loadNotifications() {
    fetch('/api/notifications')
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById('notif-list');
            const badge = document.getElementById('notif-badge');
            
            const unreadCount = data.filter(n => !n.read).length;
            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
            
            if (data.length === 0) {
                list.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">Chưa có thông báo nào</p>';
                return;
            }
            
            list.innerHTML = '';
            data.forEach(notif => {
                const item = document.createElement('div');
                item.className = `notif-item ${notif.read ? '' : 'unread'}`;
                item.innerHTML = `
                    <div class="notif-message">${notif.message}</div>
                    <div class="notif-time">${new Date(notif.timestamp).toLocaleString('vi-VN')}</div>
                `;
                list.appendChild(item);
            });
            
            fetch('/api/notifications/read', { method: 'POST' });
        });
}

// ========== ADMIN FUNCTIONS ==========
function checkAdminStatus() {
    fetch('/api/admin/status')
        .then(res => res.json())
        .then(data => {
            isAdmin = data.is_admin;
            updateAdminUI();
        });
}

function updateAdminUI() {
    const adminIcon = document.getElementById('admin-icon');
    const adminText = document.getElementById('admin-text');
    const teacherForm = document.getElementById('admin-teacher-form');
    const timelineForm = document.getElementById('admin-timeline-form');
    const pollForm = document.getElementById('admin-poll-form');
    const achievementForm = document.getElementById('admin-achievement-form');
    
    if (isAdmin) {
        adminIcon.textContent = '🔓';
        adminText.textContent = 'Logout';
        if (teacherForm) teacherForm.style.display = 'block';
        if (timelineForm) timelineForm.style.display = 'block';
        if (pollForm) pollForm.style.display = 'block';
        if (achievementForm) achievementForm.style.display = 'block';
        
        document.querySelectorAll('.message-delete, .wish-delete').forEach(btn => {
            btn.style.display = 'flex';
            btn.style.opacity = '1';
        });
        
        const editBtn = document.getElementById('edit-desc-btn');
        if (editBtn) editBtn.style.display = 'inline-block';
        
        loadMessages();
        loadFutureWishes();
    } else {
        adminIcon.textContent = '🔒';
        adminText.textContent = 'Admin';
        if (teacherForm) teacherForm.style.display = 'none';
        if (timelineForm) timelineForm.style.display = 'none';
        if (pollForm) pollForm.style.display = 'none';
        if (achievementForm) achievementForm.style.display = 'none';
        
        document.querySelectorAll('.message-delete, .wish-delete').forEach(btn => {
            btn.style.display = 'none';
        });
        
        const editBtn = document.getElementById('edit-desc-btn');
        if (editBtn) editBtn.style.display = 'none';
    }
}

document.getElementById('admin-toggle').addEventListener('click', function() {
    if (isAdmin) {
        fetch('/api/admin/logout', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                isAdmin = false;
                updateAdminUI();
                showFlash('Đã đăng xuất!');
            });
    } else {
        document.getElementById('admin-modal').style.display = 'flex';
    }
});

const adminModal = document.getElementById('admin-modal');
const adminModalClose = adminModal.querySelector('.modal-close');

adminModalClose.addEventListener('click', function() {
    adminModal.style.display = 'none';
});

document.getElementById('admin-login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    
    fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            isAdmin = true;
            updateAdminUI();
            adminModal.style.display = 'none';
            showFlash('Đăng nhập thành công!');
            document.getElementById('admin-password').value = '';
        } else {
            showFlash('Mật khẩu không đúng!', 'error');
        }
    })
    .catch(() => showFlash('Lỗi đăng nhập!', 'error'));
});

// ========== LOAD DATA ==========
function loadAllData() {
    checkAdminStatus();
    loadPreloadedImages();
    loadMessages();
    loadFutureWishes();
    loadTeacherMessages();
    loadTimeline();
    loadPolls();
    loadAchievements();
    loadFavorites();
    loadNotifications();
}

function loadPreloadedImages() {
    fetch('/api/preloaded-images')
        .then(res => res.json())
        .then(data => {
            preloadedImages = data;
            const gallery = document.getElementById('preloaded-gallery');
            gallery.innerHTML = '';
            
            data.forEach((img, index) => {
                const item = document.createElement('div');
                item.className = 'gallery-item';
                item.setAttribute('data-aos', 'fade-up');
                item.setAttribute('data-aos-delay', index * 100);
                item.innerHTML = `
                    <img src="${img.url}" alt="${img.description}">
                    <div class="gallery-caption">
                        <p>${img.description}</p>
                    </div>
                `;
                item.addEventListener('click', () => openLightbox(index));
                gallery.appendChild(item);
            });
        });
}

function loadMessages() {
    fetch('/api/messages')
        .then(res => res.json())
        .then(data => {
            const grid = document.getElementById('messages-grid');
            grid.innerHTML = '';
            
            data.forEach((msg, index) => {
                const card = document.createElement('div');
                card.className = 'message-card';
                card.setAttribute('data-aos', 'zoom-in');
                card.setAttribute('data-aos-delay', index * 50);
                
                const firstLetter = msg.name.charAt(0).toUpperCase();
                
                let deleteBtn = '';
                if (isAdmin) {
                    deleteBtn = `<button class="message-delete" data-id="${msg.id}" style="display: flex; opacity: 1;">×</button>`;
                }
                
                let favoriteBtn = `<button class="favorite-btn" data-type="message" data-id="${msg.id}">⭐</button>`;
                
                let reactionsHtml = '';
                if (msg.reactions && Object.keys(msg.reactions).length > 0) {
                    reactionsHtml = '<div class="message-reactions">';
                    for (let [emoji, users] of Object.entries(msg.reactions)) {
                        const active = users.includes(getUserName()) ? 'active' : '';
                        reactionsHtml += `
                            <button class="reaction-btn ${active}" data-emoji="${emoji}" data-msg-id="${msg.id}">
                                ${emoji} <span class="reaction-count">${users.length}</span>
                            </button>
                        `;
                    }
                    reactionsHtml += `<button class="reaction-btn add-reaction" data-msg-id="${msg.id}">➕</button></div>`;
                } else {
                    reactionsHtml = `<div class="message-reactions"><button class="reaction-btn add-reaction" data-msg-id="${msg.id}">➕ React</button></div>`;
                }
                
                card.innerHTML = `
                    ${favoriteBtn}
                    <div class="message-header">
                        <div class="message-avatar">${firstLetter}</div>
                        <div class="message-name">${msg.name}</div>
                    </div>
                    ${msg.image ? `<img src="${msg.image}" class="message-image" alt="${msg.name}">` : ''}
                    <div class="message-content">${msg.content}</div>
                    ${reactionsHtml}
                    ${deleteBtn}
                `;
                
                grid.appendChild(card);
            });
            
            attachReactionListeners();
            attachFavoriteListeners();
            
            if (isAdmin) {
                document.querySelectorAll('.message-delete').forEach(btn => {
                    btn.addEventListener('click', function() {
                        deleteMessage(this.dataset.id);
                    });
                });
            }
        });
}

function attachReactionListeners() {
    document.querySelectorAll('.reaction-btn:not(.add-reaction)').forEach(btn => {
        btn.addEventListener('click', function() {
            const emoji = this.dataset.emoji;
            const msgId = this.dataset.msgId;
            reactToMessage(msgId, emoji);
        });
    });
    
    document.querySelectorAll('.add-reaction').forEach(btn => {
        btn.addEventListener('click', function() {
            const msgId = this.dataset.msgId;
            const emoji = prompt('Chọn emoji reaction:', '❤️');
            if (emoji) {
                reactToMessage(msgId, emoji.trim());
            }
        });
    });
}

function reactToMessage(msgId, emoji) {
    fetch(`/api/messages/${msgId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji: emoji, user: getUserName() })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loadMessages();
        }
    });
}

// ========== FAVORITES ==========
function attachFavoriteListeners() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const type = this.dataset.type;
            const id = parseInt(this.dataset.id);
            toggleFavorite(type, id);
        });
    });
    
    updateFavoriteButtons();
}

function toggleFavorite(type, id) {
    fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: type, id: id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            userFavorites = data.favorites;
            updateFavoriteButtons();
            showFlash('Đã cập nhật yêu thích!');
        }
    });
}

function loadFavorites() {
    fetch('/api/favorites')
        .then(res => res.json())
        .then(data => {
            userFavorites = data;
            updateFavoriteButtons();
            displayFavorites();
        });
}

function updateFavoriteButtons() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const type = btn.dataset.type;
        const id = parseInt(btn.dataset.id);
        const isFav = userFavorites.some(f => f.type === type && f.id === id);
        btn.classList.toggle('active', isFav);
    });
}

function displayFavorites() {
    const container = document.getElementById('favorites-container');
    
    if (userFavorites.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">Chưa có mục yêu thích nào</p>';
        return;
    }
    
    container.innerHTML = '';
    
    Promise.all([
        fetch('/api/messages').then(r => r.json()),
        fetch('/api/timeline').then(r => r.json())
    ]).then(([messages, timeline]) => {
        userFavorites.forEach(fav => {
            if (fav.type === 'message') {
                const msg = messages.find(m => m.id === fav.id);
                if (msg) {
                    const card = document.createElement('div');
                    card.className = 'message-card';
                    card.innerHTML = `
                        <div class="message-header">
                            <div class="message-avatar">${msg.name.charAt(0).toUpperCase()}</div>
                            <div class="message-name">${msg.name}</div>
                        </div>
                        ${msg.image ? `<img src="${msg.image}" class="message-image">` : ''}
                        <div class="message-content">${msg.content}</div>
                    `;
                    container.appendChild(card);
                }
            }
        });
    });
}

// ========== MESSAGE FORM ==========
document.getElementById('message-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    
    fetch('/api/messages', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showFlash('Đã gửi lời chúc thành công! 💕');
            this.reset();
            document.getElementById('file-name').textContent = '';
            document.getElementById('message-name').value = getUserName();
            loadMessages();
        } else {
            showFlash(data.message || 'Có lỗi xảy ra!', 'error');
        }
    })
    .catch(() => showFlash('Lỗi kết nối!', 'error'));
});

document.getElementById('image-input').addEventListener('change', function() {
    const fileName = this.files[0] ? this.files[0].name : '';
    document.getElementById('file-name').textContent = fileName;
});
// ========== FUTURE FORM ==========
document.getElementById('future-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('future-name').value.trim();
    const wish = document.getElementById('future-wish').value.trim();
    
    fetch('/api/future-wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, wish })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showFlash('Đã gửi điều ước thành công! ✨');
            document.getElementById('future-wish').value = '';
            loadFutureWishes();
        } else {
            showFlash(data.message || 'Có lỗi xảy ra!', 'error');
        }
    })
    .catch(() => showFlash('Lỗi kết nối!', 'error'));
});

function loadFutureWishes() {
    fetch('/api/future-wishes')
        .then(res => res.json())
        .then(data => {
            const grid = document.getElementById('wishes-grid');
            grid.innerHTML = '';
            
            data.forEach((wish, index) => {
                const card = document.createElement('div');
                card.className = 'wish-card';
                card.setAttribute('data-aos', 'fade-up');
                card.setAttribute('data-aos-delay', index * 50);
                
                let deleteBtn = '';
                if (isAdmin) {
                    deleteBtn = `<button class="wish-delete" data-id="${wish.id}" style="display: flex; opacity: 1;">×</button>`;
                }
                
                card.innerHTML = `
                    <div class="wish-header">
                        <span class="wish-name">🌟 ${wish.name}</span>
                        ${deleteBtn}
                    </div>
                    <div class="wish-content">${wish.wish}</div>
                `;
                
                grid.appendChild(card);
            });
            
            if (isAdmin) {
                document.querySelectorAll('.wish-delete').forEach(btn => {
                    btn.addEventListener('click', function() {
                        deleteWish(this.dataset.id);
                    });
                });
            }
        });
}

// ========== TEACHER FORM ==========
document.getElementById('teacher-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('teacher-name').value.trim();
    const content = document.getElementById('teacher-content').value.trim();
    
    fetch('/api/teacher-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showFlash('Đã thêm lời nhắn thầy cô!');
            this.reset();
            loadTeacherMessages();
        } else {
            showFlash(data.message || 'Có lỗi xảy ra!', 'error');
        }
    })
    .catch(() => showFlash('Lỗi kết nối!', 'error'));
});

function loadTeacherMessages() {
    fetch('/api/teacher-messages')
        .then(res => res.json())
        .then(data => {
            const grid = document.getElementById('teacher-grid');
            grid.innerHTML = '';
            
            data.forEach((msg, index) => {
                const card = document.createElement('div');
                card.className = 'teacher-card';
                card.setAttribute('data-aos', 'fade-up');
                card.setAttribute('data-aos-delay', index * 100);
                
                card.innerHTML = `
                    <div class="teacher-name">${msg.name}</div>
                    <div class="teacher-content">${msg.content}</div>
                `;
                
                grid.appendChild(card);
            });
        });
}

// ========== TIMELINE ==========
document.getElementById('timeline-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', document.getElementById('timeline-title').value);
    formData.append('date', document.getElementById('timeline-date').value);
    formData.append('description', document.getElementById('timeline-desc').value);
    
    const files = document.getElementById('timeline-images').files;
    for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
    }
    
    fetch('/api/timeline', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showFlash('Đã thêm sự kiện!');
            this.reset();
            loadTimeline();
        } else {
            showFlash(data.message || 'Có lỗi xảy ra!', 'error');
        }
    })
    .catch(() => showFlash('Lỗi kết nối!', 'error'));
});

function loadTimeline() {
    fetch('/api/timeline')
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('timeline-container');
            container.innerHTML = '';
            
            if (data.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #999;">Chưa có sự kiện nào</p>';
                return;
            }
            
            data.forEach((event, index) => {
                const item = document.createElement('div');
                item.className = 'timeline-item';
                item.setAttribute('data-aos', 'fade-right');
                item.setAttribute('data-aos-delay', index * 100);
                
                let imagesHtml = '';
                if (event.images && event.images.length > 0) {
                    imagesHtml = '<div class="timeline-images">';
                    event.images.forEach(img => {
                        imagesHtml += `<img src="${img}" class="timeline-image" alt="${event.title}">`;
                    });
                    imagesHtml += '</div>';
                }
                
                let deleteBtn = '';
                if (isAdmin) {
                    deleteBtn = `<button class="timeline-delete" data-id="${event.id}">Xóa</button>`;
                }
                
                let favoriteBtn = `<button class="favorite-btn" data-type="timeline" data-id="${event.id}">⭐</button>`;
                
                item.innerHTML = `
                    <div class="timeline-dot">📌</div>
                    <div class="timeline-content">
                        ${favoriteBtn}
                        <div class="timeline-date">${new Date(event.date).toLocaleDateString('vi-VN')}</div>
                        <div class="timeline-title">${event.title}</div>
                        <div class="timeline-description">${event.description || ''}</div>
                        ${imagesHtml}
                        ${deleteBtn}
                        <div class="timeline-comments" id="timeline-comments-${event.id}">
                            <h4>💬 Bình luận</h4>
                            <div class="comments-list" id="tl-comments-list-${event.id}"></div>
                            <form class="timeline-comment-form" data-event-id="${event.id}">
                                <input type="text" placeholder="Tên..." required>
                                <textarea placeholder="Bình luận..." required></textarea>
                                <button type="submit" class="btn-primary btn-sm">Gửi</button>
                            </form>
                        </div>
                    </div>
                `;
                
                container.appendChild(item);
                loadTimelineComments(event.id);
            });
            
            attachFavoriteListeners();
            
            if (isAdmin) {
                document.querySelectorAll('.timeline-delete').forEach(btn => {
                    btn.addEventListener('click', function() {
                        if (confirm('Xóa sự kiện này?')) {
                            deleteTimelineEvent(this.dataset.id);
                        }
                    });
                });
            }
            
            document.querySelectorAll('.timeline-comment-form').forEach(form => {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    const eventId = this.dataset.eventId;
                    const name = this.querySelector('input').value;
                    const comment = this.querySelector('textarea').value;
                    
                    fetch(`/api/timeline/${eventId}/comments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, comment })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            showFlash('Đã gửi bình luận!');
                            this.reset();
                            loadTimelineComments(eventId);
                        }
                    });
                });
            });
        });
}

function loadTimelineComments(eventId) {
    fetch(`/api/timeline/${eventId}/comments`)
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById(`tl-comments-list-${eventId}`);
            if (!list) return;
            
            list.innerHTML = '';
            
            if (data.length === 0) {
                list.innerHTML = '<p style="color: #999; font-size: 0.9rem;">Chưa có bình luận</p>';
                return;
            }
            
            data.forEach(comment => {
                const item = document.createElement('div');
                item.className = 'comment-item';
                item.innerHTML = `
                    <div class="comment-name">${comment.name}</div>
                    <div class="comment-text">${comment.comment}</div>
                `;
                list.appendChild(item);
            });
        });
}

function deleteTimelineEvent(id) {
    fetch(`/api/timeline/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showFlash('Đã xóa sự kiện!');
                loadTimeline();
            }
        });
}

// ========== POLLS ==========
// Toggle input method
let pollInputToggle = document.getElementById('toggle-input-method');
if (pollInputToggle) {
    pollInputToggle.addEventListener('click', function() {
        const manualInput = document.getElementById('manual-input');
        const bulkInput = document.getElementById('bulk-input');
        
        if (manualInput.style.display === 'none') {
            manualInput.style.display = 'block';
            bulkInput.style.display = 'none';
            this.textContent = '📋 Chuyển sang nhập nhanh';
        } else {
            manualInput.style.display = 'none';
            bulkInput.style.display = 'block';
            this.textContent = '✏️ Chuyển sang nhập thủ công';
        }
    });
}

document.getElementById('add-poll-option').addEventListener('click', function() {
    const container = document.getElementById('poll-options');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'poll-option-input';
    input.placeholder = `Lựa chọn ${container.children.length + 1}...`;
    container.appendChild(input);
});

document.getElementById('poll-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const question = document.getElementById('poll-question').value.trim();
    if (!question) {
        showFlash('Vui lòng nhập câu hỏi!', 'error');
        return;
    }
    
    let options = [];
    
    // Check which input method is active
    const bulkInputTextarea = document.getElementById('bulk-options-input');
    
    // Check if bulk input has content
    if (bulkInputTextarea && bulkInputTextarea.value.trim().length > 0) {
        // Bulk input method - user typed in textarea
        const bulkText = bulkInputTextarea.value;
        options = bulkText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        console.log('Bulk options:', options);
    } else {
        // Manual input method - use input fields
        const optionInputs = document.querySelectorAll('.poll-option-input');
        options = Array.from(optionInputs).map(input => input.value.trim()).filter(v => v);
        console.log('Manual options:', options);
    }
    
    if (options.length < 2) {
        showFlash('Cần ít nhất 2 lựa chọn!', 'error');
        return;
    }
    
    // Remove duplicates
    options = [...new Set(options)];
    
    console.log('Sending poll:', { question, options });
    
    fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, options })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showFlash(`Đã tạo poll với ${options.length} lựa chọn! 🎉`);
            document.getElementById('poll-question').value = '';
            document.getElementById('poll-options').innerHTML = `
                <input type="text" class="poll-option-input" placeholder="Lựa chọn 1...">
                <input type="text" class="poll-option-input" placeholder="Lựa chọn 2...">
            `;
            if (document.getElementById('bulk-options-input')) {
                document.getElementById('bulk-options-input').value = '';
            }
            loadPolls();
        } else {
            showFlash(data.message || 'Có lỗi xảy ra!', 'error');
        }
    })
    .catch(err => {
        console.error('Poll error:', err);
        showFlash('Lỗi kết nối!', 'error');
    });
});

function loadPolls() {
    fetch('/api/polls')
        .then(res => res.json())
        .then(data => {
            const grid = document.getElementById('polls-grid');
            grid.innerHTML = '';
            
            if (data.length === 0) {
                grid.innerHTML = '<p style="text-align: center; color: #999;">Chưa có bình chọn nào</p>';
                return;
            }
            
            data.forEach((poll, index) => {
                const card = document.createElement('div');
                card.className = 'poll-card';
                card.setAttribute('data-aos', 'fade-up');
                card.setAttribute('data-aos-delay', index * 50);
                
                const totalVotes = Object.values(poll.votes).reduce((sum, users) => sum + users.length, 0);
                const userVoted = Object.values(poll.votes).some(users => users.includes(getUserName()));
                
                let deleteBtn = '';
                if (isAdmin) {
                    deleteBtn = `<button class="poll-delete" data-id="${poll.id}">×</button>`;
                }
                
                let optionsHtml = '<div class="poll-options">';
                poll.options.forEach(option => {
                    const votes = poll.votes[option] || [];
                    const percentage = totalVotes > 0 ? (votes.length / totalVotes * 100).toFixed(1) : 0;
                    const voted = votes.includes(getUserName());
                    
                    optionsHtml += `
                        <div class="poll-option ${voted ? 'voted' : ''}" data-poll-id="${poll.id}" data-option="${option}">
                            <div class="poll-option-bg" style="width: ${percentage}%"></div>
                            <div class="poll-option-content">
                                <span class="poll-option-text">${option}</span>
                                <span class="poll-option-count">${votes.length} (${percentage}%)</span>
                            </div>
                        </div>
                    `;
                });
                optionsHtml += '</div>';
                
                card.innerHTML = `
                    ${deleteBtn}
                    <div class="poll-question">${poll.question}</div>
                    ${optionsHtml}
                    <div class="poll-total">Tổng: ${totalVotes} phiếu</div>
                `;
                
                grid.appendChild(card);
            });
            
            // Attach vote listeners
            document.querySelectorAll('.poll-option').forEach(option => {
                option.addEventListener('click', function() {
                    const pollId = this.dataset.pollId;
                    const optionText = this.dataset.option;
                    votePoll(pollId, optionText);
                });
            });
            
            // Attach delete listeners
            if (isAdmin) {
                document.querySelectorAll('.poll-delete').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        if (confirm('Xóa poll này?')) {
                            deletePoll(this.dataset.id);
                        }
                    });
                });
            }
        });
}

function deletePoll(id) {
    fetch(`/api/polls/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showFlash('Đã xóa poll!');
                loadPolls();
            }
        })
        .catch(() => showFlash('Lỗi khi xóa!', 'error'));
}

function votePoll(pollId, option) {
    fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option, user: getUserName() })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showFlash('Đã bình chọn!');
            loadPolls();
        }
    });
}

// ========== ACHIEVEMENTS ==========
document.getElementById('achievement-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const icon = document.getElementById('achievement-icon').value;
    const title = document.getElementById('achievement-title').value;
    const description = document.getElementById('achievement-desc').value;
    
    fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icon, title, description })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showFlash('Đã thêm thành tích!');
            this.reset();
            document.getElementById('achievement-icon').value = '🏆';
            loadAchievements();
        } else {
            showFlash(data.message || 'Có lỗi xảy ra!', 'error');
        }
    })
    .catch(() => showFlash('Lỗi kết nối!', 'error'));
});

function loadAchievements() {
    fetch('/api/achievements')
        .then(res => res.json())
        .then(data => {
            const grid = document.getElementById('achievements-grid');
            grid.innerHTML = '';
            
            if (data.length === 0) {
                grid.innerHTML = '<p style="text-align: center; color: #999;">Chưa có thành tích nào</p>';
                return;
            }
            
            data.forEach((achievement, index) => {
                const card = document.createElement('div');
                card.className = 'achievement-card';
                card.setAttribute('data-aos', 'zoom-in');
                card.setAttribute('data-aos-delay', index * 50);
                
                let deleteBtn = '';
                if (isAdmin) {
                    deleteBtn = `<button class="achievement-delete" data-id="${achievement.id}">×</button>`;
                }
                
                card.innerHTML = `
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-description">${achievement.description || ''}</div>
                    ${deleteBtn}
                `;
                
                grid.appendChild(card);
            });
            
            if (isAdmin) {
                document.querySelectorAll('.achievement-delete').forEach(btn => {
                    btn.addEventListener('click', function() {
                        if (confirm('Xóa thành tích này?')) {
                            deleteAchievement(this.dataset.id);
                        }
                    });
                });
            }
        });
}

function deleteAchievement(id) {
    fetch(`/api/achievements/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showFlash('Đã xóa thành tích!');
                loadAchievements();
            }
        });
}

// ========== DELETE FUNCTIONS ==========
function deleteMessage(id) {
    if (!confirm('Bạn có chắc muốn xóa lời chúc này?')) return;
    
    fetch(`/api/messages/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showFlash('Đã xóa lời chúc!');
                loadMessages();
            }
        })
        .catch(() => showFlash('Lỗi khi xóa!', 'error'));
}

function deleteWish(id) {
    if (!confirm('Bạn có chắc muốn xóa điều ước này?')) return;
    
    fetch(`/api/future-wishes/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showFlash('Đã xóa điều ước!');
                loadFutureWishes();
            }
        })
        .catch(() => showFlash('Lỗi khi xóa!', 'error'));
}

function deleteComment(imageId, commentId) {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    
    fetch(`/api/comments/${imageId}/${commentId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showFlash('Đã xóa bình luận!');
                loadComments(imageId);
            } else {
                showFlash(data.message || 'Lỗi khi xóa!', 'error');
            }
        })
        .catch(() => showFlash('Lỗi kết nối!', 'error'));
}

// ========== LIGHTBOX ==========
function openLightbox(index) {
    currentLightboxIndex = index;
    const lightbox = document.getElementById('custom-lightbox');
    const img = document.getElementById('lightbox-image');
    const desc = document.getElementById('lightbox-description');
    const editBtn = document.getElementById('edit-desc-btn');
    
    const currentImg = preloadedImages[index];
    img.src = currentImg.url;
    desc.textContent = currentImg.description;
    
    if (editBtn) {
        editBtn.style.display = isAdmin ? 'inline-block' : 'none';
    }
    
    lightbox.style.display = 'flex';
    loadComments(currentImg.id);
}

function closeLightbox() {
    document.getElementById('custom-lightbox').style.display = 'none';
}

function navigateLightbox(direction) {
    currentLightboxIndex += direction;
    
    if (currentLightboxIndex < 0) {
        currentLightboxIndex = preloadedImages.length - 1;
    } else if (currentLightboxIndex >= preloadedImages.length) {
        currentLightboxIndex = 0;
    }
    
    openLightbox(currentLightboxIndex);
}

document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
document.querySelector('.lightbox-prev').addEventListener('click', () => navigateLightbox(-1));
document.querySelector('.lightbox-next').addEventListener('click', () => navigateLightbox(1));

document.getElementById('custom-lightbox').addEventListener('click', function(e) {
    if (e.target === this) {
        closeLightbox();
    }
});

document.getElementById('edit-desc-btn').addEventListener('click', function() {
    const newDesc = prompt('Nhập mô tả mới:', preloadedImages[currentLightboxIndex].description);
    
    if (newDesc !== null && newDesc.trim()) {
        const imgId = preloadedImages[currentLightboxIndex].id;
        
        fetch(`/api/preloaded-images/${imgId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: newDesc.trim() })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showFlash('Đã cập nhật mô tả!');
                preloadedImages[currentLightboxIndex].description = newDesc.trim();
                document.getElementById('lightbox-description').textContent = newDesc.trim();
                loadPreloadedImages();
            }
        })
        .catch(() => showFlash('Lỗi cập nhật!', 'error'));
    }
});

// ========== COMMENTS ==========
function loadComments(imageId) {
    fetch('/api/comments')
        .then(res => res.json())
        .then(allComments => {
            const commentsList = document.getElementById('comments-list');
            const imageComments = allComments[imageId] || [];
            
            commentsList.innerHTML = '';
            
            if (imageComments.length === 0) {
                commentsList.innerHTML = '<p style="color: #999;">Chưa có bình luận nào. Hãy là người đầu tiên!</p>';
            } else {
                imageComments.forEach(comment => {
                    const item = document.createElement('div');
                    item.className = 'comment-item';
                    
                    let deleteBtn = '';
                    if (isAdmin) {
                        deleteBtn = `<button class="comment-delete" data-image-id="${imageId}" data-comment-id="${comment.id}" style="display: block;">×</button>`;
                    }
                    
                    item.innerHTML = `
                        <div class="comment-name">${comment.name}</div>
                        <div class="comment-text">${comment.comment}</div>
                        ${deleteBtn}
                    `;
                    commentsList.appendChild(item);
                });
                
                if (isAdmin) {
                    document.querySelectorAll('.comment-delete').forEach(btn => {
                        btn.addEventListener('click', function() {
                            deleteComment(this.dataset.imageId, this.dataset.commentId);
                        });
                    });
                }
            }
            
            document.getElementById('comment-form').dataset.imageId = imageId;
        });
}

document.getElementById('comment-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const imageId = this.dataset.imageId;
    const name = document.getElementById('comment-name').value.trim();
    const comment = document.getElementById('comment-text').value.trim();
    
    fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_id: imageId, name, comment })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showFlash('Đã gửi bình luận!');
            document.getElementById('comment-text').value = '';
            loadComments(imageId);
        } else {
            showFlash(data.message || 'Có lỗi xảy ra!', 'error');
        }
    })
    .catch(() => showFlash('Lỗi kết nối!', 'error'));
});

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    const lightbox = document.getElementById('custom-lightbox');
    if (lightbox.style.display === 'flex') {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    }
});
// ========== TIME-BASED GREETING ==========
function showTimeGreeting() {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour >= 0 && hour < 6) {
        greeting = "🌙 Thức khuya quá rồi! Nghỉ ngơi đi nhé! 😴";
    } else if (hour >= 6 && hour < 12) {
        greeting = "☀️ Chào buổi sáng! Chúc một ngày tốt lành! 🌅";
    } else if (hour === 12) {
        greeting = "🍜 Đã ăn trưa chưa? Ăn ngon nhé! 🍱";
    } else if (hour > 12 && hour < 18) {
        greeting = "🌤️ Chào buổi chiều! Làm việc vui vẻ! 💪";
    } else if (hour >= 18 && hour < 22) {
        greeting = "🌆 Chào buổi tối! Thư giãn sau ngày dài nhé! 🎵";
    } else {
        greeting = "🌃 Đêm muộn rồi! Sắp ngủ thôi! 💤";
    }
    
    const greetingEl = document.getElementById('time-greeting');
    greetingEl.textContent = greeting;
    greetingEl.classList.add('show');
    
    setTimeout(() => {
        greetingEl.classList.remove('show');
    }, 5000);
}

// Show greeting on load
setTimeout(showTimeGreeting, 1000);

// ========== BIRTHDAY SURPRISE ==========
function checkBirthday() {
    fetch('/api/check-birthday')
        .then(res => res.json())
        .then(data => {
            if (data.birthday_people && data.birthday_people.length > 0) {
                showBirthdayModal(data.birthday_people);
            }
        });
}

function showBirthdayModal(people) {
    const modal = document.getElementById('birthday-modal');
    const nameEl = document.getElementById('birthday-name');
    
    const names = people.map(p => p.name).join(', ');
    nameEl.textContent = names;
    
    modal.style.display = 'flex';
    
    // Confetti animation
    startBirthdayConfetti();
    
    // Play birthday sound
    const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
    audio.play().catch(() => {});
}

document.getElementById('close-birthday').addEventListener('click', function() {
    document.getElementById('birthday-modal').style.display = 'none';
});

function startBirthdayConfetti() {
    const canvas = document.getElementById('birthday-confetti');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const confetti = [];
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#ff9ff3'];
    
    for (let i = 0; i < 150; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 5 + 5,
            speed: Math.random() * 3 + 2,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        confetti.forEach(c => {
            ctx.fillStyle = c.color;
            ctx.fillRect(c.x, c.y, c.size, c.size);
            c.y += c.speed;
            
            if (c.y > canvas.height) {
                c.y = -c.size;
                c.x = Math.random() * canvas.width;
            }
        });
        
        if (document.getElementById('birthday-modal').style.display === 'flex') {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

// Check birthday on load
checkBirthday();

// ========== SNAKE GAME ==========
let snakeGame = null;

// Show snake button after 10 logo clicks
let logoClickCount = 0;
document.querySelector('.logo').addEventListener('click', function() {
    logoClickCount++;
    if (logoClickCount === 10) {
        document.getElementById('snake-game-btn').style.display = 'inline-block';
        showFlash('🐍 Bạn đã mở khóa Snake Game!', 'success');
    }
});

document.getElementById('snake-game-btn').addEventListener('click', function() {
    document.getElementById('snake-modal').style.display = 'flex';
});

document.getElementById('snake-close').addEventListener('click', function() {
    document.getElementById('snake-modal').style.display = 'none';
    if (snakeGame) snakeGame.stop();
});

document.getElementById('snake-start').addEventListener('click', function() {
    if (snakeGame) snakeGame.stop();
    snakeGame = new SnakeGame();
    snakeGame.start();
});

class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('snake-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        this.snake = [{x: 10, y: 10}];
        this.dx = 0;
        this.dy = 0;
        this.food = this.randomFood();
        this.score = 0;
        this.gameLoop = null;
        this.isRunning = false;
        
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        document.getElementById('snake-high-score').textContent = this.highScore;
        
        this.setupControls();
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;
            
            if (e.key === 'ArrowUp' && this.dy === 0) {
                this.dx = 0;
                this.dy = -1;
            } else if (e.key === 'ArrowDown' && this.dy === 0) {
                this.dx = 0;
                this.dy = 1;
            } else if (e.key === 'ArrowLeft' && this.dx === 0) {
                this.dx = -1;
                this.dy = 0;
            } else if (e.key === 'ArrowRight' && this.dx === 0) {
                this.dx = 1;
                this.dy = 0;
            }
        });
    }
    
    randomFood() {
        return {
            x: Math.floor(Math.random() * this.tileCount),
            y: Math.floor(Math.random() * this.tileCount)
        };
    }
    
    start() {
        this.isRunning = true;
        this.dx = 1;
        this.dy = 0;
        this.gameLoop = setInterval(() => this.update(), 100);
    }
    
    stop() {
        this.isRunning = false;
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
    }
    
    update() {
        const head = {
            x: this.snake[0].x + this.dx,
            y: this.snake[0].y + this.dy
        };
        
        // Check collision with walls
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        // Check collision with self
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            document.getElementById('snake-score').textContent = this.score;
            this.food = this.randomFood();
        } else {
            this.snake.pop();
        }
        
        this.draw();
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw snake
        this.ctx.fillStyle = '#4CAF50';
        this.snake.forEach((segment, index) => {
            if (index === 0) this.ctx.fillStyle = '#2E7D32'; // Head darker
            else this.ctx.fillStyle = '#4CAF50';
            
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });
        
        // Draw food
        this.ctx.fillStyle = '#ff4757';
        this.ctx.fillRect(
            this.food.x * this.gridSize,
            this.food.y * this.gridSize,
            this.gridSize - 2,
            this.gridSize - 2
        );
    }
    
    gameOver() {
        this.stop();
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            document.getElementById('snake-high-score').textContent = this.highScore;
            showFlash(`🎉 Kỷ lục mới: ${this.score} điểm!`);
        } else {
            showFlash(`Game Over! Điểm: ${this.score}`);
        }
    }
}

// ========== HIDDEN PROFILE STATS ==========
let profileClickCount = 0;

document.getElementById('profile-stats-btn').addEventListener('click', function() {
    profileClickCount++;
    
    if (profileClickCount === 3) {
        showUserStats();
        profileClickCount = 0; // Reset
    } else {
        showFlash(`Click thêm ${3 - profileClickCount} lần để xem stats bí mật! 👀`);
    }
});

function showUserStats() {
    const username = getUserName();
    
    fetch(`/api/user-stats/${username}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('stat-messages').textContent = data.messages;
            document.getElementById('stat-comments').textContent = data.comments;
            document.getElementById('stat-wishes').textContent = data.wishes;
            document.getElementById('stat-reactions').textContent = data.reactions_received;
            document.getElementById('stat-points').textContent = data.total_points;
            
            const badgesContainer = document.getElementById('user-badges');
            badgesContainer.innerHTML = '';
            
            if (data.badges.length === 0) {
                badgesContainer.innerHTML = '<p style="color: #999;">Chưa có huy hiệu nào. Hãy tham gia nhiều hơn! 💪</p>';
            } else {
                data.badges.forEach(badge => {
                    const badgeEl = document.createElement('div');
                    badgeEl.className = 'badge-item';
                    badgeEl.innerHTML = `
                        <span class="badge-icon">${badge.icon}</span>
                        <div>
                            <div class="badge-name">${badge.name}</div>
                            <div class="badge-desc">${badge.desc}</div>
                        </div>
                    `;
                    badgesContainer.appendChild(badgeEl);
                });
            }
            
            document.getElementById('stats-modal').style.display = 'flex';
        });
}

document.getElementById('stats-close').addEventListener('click', function() {
    document.getElementById('stats-modal').style.display = 'none';
});

// ========== VOICE MESSAGES ==========
let mediaRecorder;
let audioChunks = [];
let recordingTimeout;

document.getElementById('voice-name').value = getUserName();

document.getElementById('record-btn').addEventListener('click', function() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                uploadVoiceMessage(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            
            document.getElementById('record-btn').style.display = 'none';
            document.getElementById('stop-btn').style.display = 'inline-block';
            
            showFlash('🎙️ Đang ghi âm... (tối đa 30s)');
            
            // Auto stop after 30 seconds
            recordingTimeout = setTimeout(() => {
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                    document.getElementById('record-btn').style.display = 'inline-block';
                    document.getElementById('stop-btn').style.display = 'none';
                }
            }, 30000);
        })
        .catch(err => {
            showFlash('Không thể truy cập microphone!', 'error');
        });
});

document.getElementById('stop-btn').addEventListener('click', function() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        clearTimeout(recordingTimeout);
        
        document.getElementById('record-btn').style.display = 'inline-block';
        document.getElementById('stop-btn').style.display = 'none';
    }
});

function uploadVoiceMessage(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice.webm');
    formData.append('name', document.getElementById('voice-name').value || getUserName());
    
    fetch('/api/voice-messages', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showFlash('✅ Đã gửi lời chúc bằng giọng nói!');
            loadVoiceMessages();
        } else {
            showFlash('Lỗi khi gửi!', 'error');
        }
    });
}

function loadVoiceMessages() {
    fetch('/api/voice-messages')
        .then(res => res.json())
        .then(data => {
            const grid = document.getElementById('voice-messages-grid');
            grid.innerHTML = '';
            
            if (data.length === 0) {
                grid.innerHTML = '<p style="text-align: center; color: #999;">Chưa có lời chúc bằng giọng nói</p>';
                return;
            }
            
            data.forEach((voice, index) => {
                const card = document.createElement('div');
                card.className = 'voice-card';
                card.setAttribute('data-aos', 'fade-up');
                card.setAttribute('data-aos-delay', index * 50);
                
                card.innerHTML = `
                    <div class="voice-header">
                        <span class="voice-icon">🎤</span>
                        <span class="voice-name">${voice.name}</span>
                    </div>
                    <audio controls class="voice-audio">
                        <source src="${voice.audio_url}" type="audio/webm">
                    </audio>
                    <div class="voice-time">${new Date(voice.timestamp).toLocaleString('vi-VN')}</div>
                `;
                
                grid.appendChild(card);
            });
        });
}

// Load voice messages on init
loadVoiceMessages();

// Update loadAllData to include voice messages
const originalLoadAllData = loadAllData;
loadAllData = function() {
    originalLoadAllData();
    loadVoiceMessages();
};
