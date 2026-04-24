// ==================== FIREBASE CONFIG ====================
const firebaseConfig = {
    apiKey: "AIzaSyD2rNS7HSJyek3OCrRquudFgqQSWXZJYrY",
    authDomain: "madrassa-online-b851c.firebaseapp.com",
    databaseURL: "https://madrassa-online-b851c-default-rtdb.firebaseio.com",
    projectId: "madrassa-online-b851c",
    storageBucket: "madrassa-online-b851c.firebasestorage.app",
    messagingSenderId: "360782668012",
    appId: "1:360782668012:web:d501ef187911db632445c9",
    measurementId: "G-RV9GD4S22T"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ==================== APPROVED USERS FROM IMAGE ====================
const APPROVED_USERS = {
    "258849235361": { name: "Zacarias João", level: 2, receipt: null, date: null, contrib: true },
    "258864133620": { name: "Mudarissu Ar-Razi", level: 2, receipt: null, date: null, contrib: true },
    "258844030404": { name: "Uzaifa Suaiba", level: 2, receipt: "1015", date: "16-03-2026", contrib: true },
    "258847859222": { name: "Dulce Ferreira", level: 2, receipt: "1013", date: "13/03/2026", contrib: true },
    "258844906524": { name: "Amisse Jorge Juma", level: 2, receipt: "1011", date: "12/06/2026", contrib: true },
    "258846152522": { name: "José Félix", level: 1, receipt: "1019", date: "20/03/2026", contrib: true },
    "258876563032": { name: "Fátima salihina", level: 1, receipt: "1015", date: "16/03/2026", contrib: true },
    "258864388571": { name: "Muaziza Ruquia Assane", level: 1, receipt: "1012", date: "13/04/2026", contrib: true },
    "258853386491": { name: "Suely Buque", level: 1, receipt: "1018", date: "18/03/2026", contrib: true },
    "258867947389": { name: "Abdullah Kharim", level: 1, receipt: "1020", date: "20/03/2026", contrib: true },
    "258842957997": { name: "Jamila Ibraimo Hassane", level: 1, receipt: "1121", date: "06/04/2026", contrib: true },
    "258849118097": { name: "Ayanda Momade", level: 1, receipt: "1122", date: "14/03/2026", contrib: true },
    "258820618540": { name: "Bhavita Ali", level: 1, receipt: "1123", date: "06/04/2026", contrib: true },
    "258844117209": { name: "Chahide Nordine Zacarias", level: 1, receipt: "1124", date: "10/04/2026", contrib: true },
    "258841253788": { name: "Luisa Ussene", level: 1, receipt: "1125", date: "10/04/2026", contrib: true },
    "258823033144": { name: "Nordino Uanzo", level: 1, receipt: "1126", date: "06/04/2026", contrib: true },
    "258843989406": { name: "Neyma Tamimo", level: 1, receipt: "1127", date: "08/04/2026", contrib: true },
    "244949310616": { name: "sashin", level: 1, receipt: "1128", date: "06/04/2026", contrib: false },
    "258866186976": { name: "Agira Muquila", level: 1, receipt: "1129", date: "06/04/2026", contrib: false }
};

// Admin config
const ADMIN_PHONE = "860407269";
const ADMIN_NAME = "ANACLETO BEBANE";
const ADMIN_PIN = "0000"; // ALTERE ESTE PIN!

// GitHub Pages base URL (substitua pelo seu)
const GITHUB_BASE_URL = "https://seu-usuario.github.io/madrassa-online";

// ==================== STATE ====================
let currentUser = null;
let isAdmin = false;

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
    }, 2000);
    
    checkSession();
    setupListeners();
    loadAds();
    loadVideos();
    updateTotalUsers();
});

// ==================== AUTH TABS ====================
function showTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tab === 'login' ? 'login-form' : 'register-form').classList.add('active');
}

// ==================== LOGIN ====================
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = document.getElementById('login-phone').value.trim();
    const pin = document.getElementById('login-pin').value;
    
    // Check admin
    if (phone === ADMIN_PHONE && pin === ADMIN_PIN) {
        currentUser = { name: ADMIN_NAME, phone: ADMIN_PHONE, approved: true };
        isAdmin = true;
        saveSession();
        showMainApp();
        showToast('success', `Bem-vindo, ${ADMIN_NAME}!`);
        return;
    }
    
    // Check pre-approved users
    if (APPROVED_USERS[phone]) {
        const userData = APPROVED_USERS[phone];
        const snapshot = await db.ref('users/' + phone).once('value');
        const dbUser = snapshot.val();
        
        if (dbUser && dbUser.pin === pin) {
            currentUser = { ...userData, phone, approved: true };
            saveSession();
            showMainApp();
            showToast('success', `Bem-vindo, ${userData.name}!`);
            return;
        }
    }
    
    // Check database users
    const snapshot = await db.ref('users/' + phone).once('value');
    const user = snapshot.val();
    
    if (!user) {
        showToast('error', 'Utilizador não encontrado!');
        return;
    }
    
    if (user.pin !== pin) {
        showToast('error', 'PIN incorreto!');
        return;
    }
    
    if (!user.approved) {
        showPendingModal();
        return;
    }
    
    currentUser = { ...user, phone };
    isAdmin = false;
    saveSession();
    showMainApp();
    showToast('success', `Bem-vindo, ${user.name}!`);
});

// ==================== REGISTER ====================
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const pin = document.getElementById('reg-pin').value;
    const pinConfirm = document.getElementById('reg-pin-confirm').value;
    
    if (pin !== pinConfirm) {
        showToast('error', 'Os PINs não coincidem!');
        return;
    }
    
    if (pin.length !== 4) {
        showToast('error', 'O PIN deve ter 4 dígitos!');
        return;
    }
    
    // Check if phone exists
    const snapshot = await db.ref('users/' + phone).once('value');
    if (snapshot.exists()) {
        showToast('error', 'Este número já está registado!');
        return;
    }
    
    // Check if pre-approved
    const isPreApproved = APPROVED_USERS[phone] !== undefined;
    
    const userData = {
        name,
        phone,
        pin,
        approved: isPreApproved,
        createdAt: Date.now(),
        lastLogin: Date.now()
    };
    
    if (isPreApproved) {
        const preData = APPROVED_USERS[phone];
        userData.receipt = preData.receipt;
        userData.level = preData.level;
        userData.date = preData.date;
        userData.contrib = preData.contrib;
    }
    
    await db.ref('users/' + phone).set(userData);
    
    if (isPreApproved) {
        currentUser = { ...userData, phone };
        saveSession();
        showMainApp();
        showToast('success', 'Registo aprovado automaticamente!');
    } else {
        showPendingModal();
        showToast('warning', 'Aguarde aprovação do administrador.');
    }
});

// ==================== VIEW NAVIGATION ====================
function showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
    
    // Show selected view
    const viewMap = {
        'dashboard': 'dashboard-view',
        'video': 'video-view',
        'exercicios': 'exercicios-view',
        'exame': 'exame-view',
        'admin': 'admin-view'
    };
    
    const viewId = viewMap[viewName];
    if (viewId) {
        document.getElementById(viewId).classList.remove('hidden');
    }
    
    // Update iframe URLs if needed
    if (viewName === 'exercicios') {
        document.getElementById('exercicios-frame').src = `${GITHUB_BASE_URL}/exercicios11/`;
    } else if (viewName === 'exame') {
        document.getElementById('exame-frame').src = `${GITHUB_BASE_URL}/exame11/`;
    }
    
    // Load admin data if admin view
    if (viewName === 'admin') {
        loadAdminData();
    }
    
    // Update active nav
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
}

// ==================== UI FUNCTIONS ====================
function showMainApp() {
    document.getElementById('auth-modal').classList.remove('active');
    document.getElementById('pending-modal').classList.remove('active');
    document.getElementById('main-app').classList.remove('hidden');
    
    // Update UI
    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('welcome-name').textContent = currentUser.name;
    document.getElementById('user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
    
    // Show admin link if admin
    if (isAdmin) {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    }
    
    updateTotalUsers();
    loadLiveUsers();
}

function showPendingModal() {
    document.getElementById('auth-modal').classList.remove('active');
    document.getElementById('pending-modal').classList.add('active');
    
    // Auto-check for approval every 5 seconds
    const checkInterval = setInterval(async () => {
        const phone = document.getElementById('reg-phone').value.trim() || 
                      document.getElementById('login-phone').value.trim();
        const snapshot = await db.ref('users/' + phone).once('value');
        const user = snapshot.val();
        
        if (user && user.approved) {
            clearInterval(checkInterval);
            currentUser = { ...user, phone };
            saveSession();
            showMainApp();
            showToast('success', 'Aprovado! Bem-vindo!');
        }
    }, 5000);
}

function logout() {
    currentUser = null;
    isAdmin = false;
    localStorage.removeItem('madrassa_session');
    location.reload();
}

function saveSession() {
    localStorage.setItem('madrassa_session', JSON.stringify({
        phone: currentUser.phone,
        isAdmin
    }));
}

function checkSession() {
    const session = localStorage.getItem('madrassa_session');
    if (!session) return;
    
    try {
        const { phone, isAdmin: adminFlag } = JSON.parse(session);
        
        // Verify in database
        db.ref('users/' + phone).once('value').then(snapshot => {
            const user = snapshot.val();
            if (user && user.approved) {
                currentUser = { ...user, phone };
                isAdmin = adminFlag;
                showMainApp();
            }
        });
    } catch (e) {
        localStorage.removeItem('madrassa_session');
    }
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
}

// ==================== ADMIN PANEL ====================
function loadAdminData() {
    db.ref('users').once('value').then(snapshot => {
        const users = snapshot.val() || {};
        const allUsers = Object.entries(users);
        
        const pending = allUsers.filter(([_, u]) => !u.approved);
        const approved = allUsers.filter(([_, u]) => u.approved);
        
        document.getElementById('admin-total').textContent = allUsers.length;
        document.getElementById('admin-pending').textContent = pending.length;
        document.getElementById('admin-approved').textContent = approved.length;
        
        // Render pending list
        const list = document.getElementById('pending-list');
        list.innerHTML = '';
        
        if (pending.length === 0) {
            list.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">Nenhum pedido pendente</p>';
            return;
        }
        
        pending.forEach(([phone, user]) => {
            const item = document.createElement('div');
            item.className = 'pending-item';
            item.innerHTML = `
                <div class="pending-info">
                    <h4>${user.name}</h4>
                    <p>${phone} • Registado em ${new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div class="pending-actions">
                    <button class="btn-approve" onclick="approveUser('${phone}')">
                        <i class="fas fa-check"></i> Aprovar
                    </button>
                    <button class="btn-reject" onclick="rejectUser('${phone}')">
                        <i class="fas fa-times"></i> Rejeitar
                    </button>
                </div>
            `;
            list.appendChild(item);
        });
    });
}

function approveUser(phone) {
    db.ref('users/' + phone).update({ approved: true }).then(() => {
        showToast('success', 'Utilizador aprovado!');
        loadAdminData();
        updateTotalUsers();
    });
}

function rejectUser(phone) {
    db.ref('users/' + phone).remove().then(() => {
        showToast('success', 'Utilizador rejeitado e removido.');
        loadAdminData();
        updateTotalUsers();
    });
}

// ==================== DATA FUNCTIONS ====================
function updateTotalUsers() {
    db.ref('users').once('value').then(snapshot => {
        const count = Object.keys(snapshot.val() || {}).length;
        document.getElementById('total-users').textContent = count;
    });
}

function loadLiveUsers() {
    db.ref('users').limitToLast(10).once('value').then(snapshot => {
        const container = document.getElementById('live-avatars');
        container.innerHTML = '';
        
        Object.values(snapshot.val() || {}).forEach(user => {
            const avatar = document.createElement('div');
            avatar.className = 'user-avatar-small';
            avatar.textContent = user.name ? user.name.charAt(0).toUpperCase() : '?';
            avatar.title = user.name;
            container.appendChild(avatar);
        });
    });
}

// ==================== ADS ====================
function loadAds() {
    const ads = [
        { icon: 'fa-book', title: 'Livros Islâmicos', desc: 'Coleção completa de livros de estudo islâmico.', color: 'linear-gradient(135deg, #1a5f3c, #2d8a5e)' },
        { icon: 'fa-laptop', title: 'Cursos Online', desc: 'Aprenda árabe e estudos islâmicos online.', color: 'linear-gradient(135deg, #d4af37, #f0d878)' },
        { icon: 'fa-pray', title: 'Tapetes de Oração', desc: 'Tapetes artesanais de alta qualidade.', color: 'linear-gradient(135deg, #4a148c, #7c43bd)' }
    ];
    
    const container = document.getElementById('ads-container');
    ads.forEach(ad => {
        const card = document.createElement('div');
        card.className = 'ad-card';
        card.innerHTML = `
            <div class="ad-image" style="background: ${ad.color}">
                <i class="fas ${ad.icon}"></i>
            </div>
            <div class="ad-content">
                <h4>${ad.title}</h4>
                <p>${ad.desc}</p>
                <a href="#" class="ad-btn">Saiba Mais</a>
            </div>
        `;
        container.appendChild(card);
    });
}

// ==================== VIDEOS ====================
function loadVideos() {
    const videos = [
        { title: 'Aula 1: Introdução ao Alcorão', duration: '45:30', level: 1 },
        { title: 'Aula 2: Fundamentos do Tauhid', duration: '52:15', level: 1 },
        { title: 'Aula 3: Fiqh da Oração', duration: '38:45', level: 2 },
        { title: 'Aula 4: História dos Profetas', duration: '61:20', level: 2 }
    ];
    
    const grid = document.getElementById('video-grid');
    videos.forEach(v => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <div class="video-thumbnail">
                <div class="play-btn"><i class="fas fa-play"></i></div>
            </div>
            <div class="video-info">
                <h4>${v.title}</h4>
                <p><i class="fas fa-clock"></i> ${v.duration} • Nível ${v.level}</p>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ==================== UTILITIES ====================
function showToast(type, message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-circle' };
    
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function toggleTheme() {
    document.body.classList.toggle('dark');
    const icon = document.querySelector('.icon-btn i.fa-moon, .icon-btn i.fa-sun');
    if (icon) {
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
    }
}

function setupListeners() {
    // Real-time updates
    db.ref('users').on('value', () => {
        updateTotalUsers();
        if (isAdmin && !document.getElementById('admin-view').classList.contains('hidden')) {
            loadAdminData();
        }
    });
}
