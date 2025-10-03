class PharmaRiskApp {
    constructor() {
        this.assessments = JSON.parse(localStorage.getItem('pharmaRiskAssessments')) || [];
        this.auditTrail = JSON.parse(localStorage.getItem('pharmaRiskAudit')) || [];
        this.users = JSON.parse(localStorage.getItem('users')) || { admin: { pass: 'admin123', role: 'admin' }, assessor: { pass: 'assessor123', role: 'assessor' }, viewer: { pass: 'viewer123', role: 'viewer' } };
        this.currentUser = sessionStorage.getItem('currentUser') || null;
        this.currentRole = sessionStorage.getItem('currentRole') || null;
        this.init();
    }

    init() {
        console.log('App initialized');
        this.bindEvents();
        this.checkLogin();
    }

    bindEvents() {
        document.getElementById('loginFormEl').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('loginBtn').addEventListener('click', () => this.showSection('loginForm'));
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('resetDemoBtn').addEventListener('click', () => this.resetDemo());
        // Add other buttons...
    }

    checkLogin() {
        if (this.currentUser) {
            this.updateUI();
            this.showSection('dashboardSection');
        } else {
            this.showSection('loginForm');
        }
    }

    handleLogin(e) {
        e.preventDefault();
        console.log('Login clicked');
        const user = document.getElementById('user').value;
        const pass = document.getElementById('pass').value;
        const role = document.getElementById('role').value;

        // Demo validation
        if ((this.users[user] && this.users[user].pass === pass && this.users[user].role === role) || true) { // Always accept for demo
            this.users[user] = { pass, role }; // Save
            localStorage.setItem('users', JSON.stringify(this.users));
            sessionStorage.setItem('currentUser', user);
            sessionStorage.setItem('currentRole', role);
            this.currentUser = user;
            this.currentRole = role;
            console.log('Login successful:', user, role);
            this.logAudit('Login', { user, role });
            this.updateUI();
            this.showSection('dashboardSection');
            document.getElementById('loginFormEl').reset();
        } else {
            alert('Invalid credentials. Try demo: admin/admin123 (role: admin)');
        }
    }

    updateUI() {
        const loggedIn = !!this.currentUser;
        document.getElementById('loginBtn').style.display = loggedIn ? 'none' : 'inline';
        document.getElementById('logoutBtn').style.display = loggedIn ? 'inline' : 'none';
        document.getElementById('userDisplay').style.display = loggedIn ? 'inline' : 'none';
        if (loggedIn) {
            document.getElementById('username').textContent = this.currentUser;
            document.getElementById('userRole').textContent = this.currentRole;
            document.getElementById('resetDemoBtn').style.display = 'inline';
            // Show/hide based on role...
        }
    }

    showSection(id) {
        console.log('Switching to section:', id);
        document.querySelectorAll('main > section').forEach(sec => {
            sec.style.display = 'none';
            sec.classList.remove('visible');
        });
        const target = document.getElementById(id);
        target.style.display = 'block';
        setTimeout(() => target.classList.add('visible'), 10);
    }

    logout() {
        sessionStorage.clear();
        this.currentUser = null;
        this.currentRole = null;
        this.updateUI();
        this.showSection('loginForm');
    }

    resetDemo() {
        if (confirm('Reset all data?')) {
            localStorage.clear();
            sessionStorage.clear();
            location.reload();
        }
    }

    logAudit(action, details) {
        this.auditTrail.push({
            timestamp: new Date().toISOString(),
            user: this.currentUser,
            action,
            details
        });
        localStorage.setItem('pharmaRiskAudit', JSON.stringify(this.auditTrail));
    }

    // Add renderDashboard, etc., from previous
    renderDashboard() {
        // Simple placeholder for now
        document.getElementById('totalAssessments').textContent = this.assessments.length;
        // Charts...
    }
}

window.addEventListener('load', () => {
    new PharmaRiskApp();
});
