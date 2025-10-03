// script.js - Fixed Login and Debugging
class PharmaRiskApp {
    constructor() {
        this.assessments = JSON.parse(localStorage.getItem('pharmaRiskAssessments')) || [];
        this.auditTrail = JSON.parse(localStorage.getItem('pharmaRiskAudit')) || [];
        this.users = JSON.parse(localStorage.getItem('users')) || {
            admin: { pass: 'admin123', role: 'admin' },
            assessor: { pass: 'assessor123', role: 'assessor' },
            viewer: { pass: 'viewer123', role: 'viewer' }
        };
        this.templates = JSON.parse(localStorage.getItem('pharmaRiskTemplates')) || this.getDefaultTemplates();
        this.currentUser = sessionStorage.getItem('currentUser') || null;
        this.currentRole = sessionStorage.getItem('currentRole') || null;
        this.currentAssessmentId = null;
        this.regReferences = [
            { id: 1, title: 'WHO Annex 5: GDP', description: 'Good Distribution Practices for transport integrity.', searchable: 'who gdp transport' },
            { id: 2, title: 'FDA GMP 21 CFR 211', description: 'Storage and transport controls.', searchable: 'fda gmp storage' },
        ];
        this.initEventListeners();
        this.checkInitialState();
    }

    initEventListeners() {
        document.getElementById('loginFormEl').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('loginBtn').addEventListener('click', () => this.showSection('loginForm'));
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('resetDemoBtn').addEventListener('click', () => this.resetDemo());
        // Other listeners...
    }

    checkInitialState() {
        console.log('Checking initial state at', new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }));
        if (this.currentUser) {
            console.log('User already logged in:', this.currentUser, this.currentRole);
            this.updateUI();
            this.showSection('dashboardSection');
        } else {
            this.showSection('loginForm');
        }
    }

    handleLogin(e) {
        e.preventDefault();
        console.log('Login attempt started');
        const user = document.getElementById('user').value;
        const pass = document.getElementById('pass').value;
        const role = document.getElementById('role').value;
        console.log('Credentials:', { user, pass, role });

        // Demo: Accept any with role
        if (this.users[user] && this.users[user].pass === pass) {
            console.log('Valid credentials found');
            sessionStorage.setItem('currentUser', user);
            sessionStorage.setItem('currentRole', role);
            this.currentUser = user;
            this.currentRole = role;
            this.logAudit('Login', { user, role });
            this.updateUI();
            this.showSection('dashboardSection');
        } else {
            console.log('Invalid credentials');
            alert('Invalid username, password, or role mismatch. Try demo creds: admin/admin123, assessor/assessor123, viewer/viewer123.');
        }
        document.getElementById('loginFormEl').reset();
    }

    updateUI() {
        const loggedIn = !!this.currentUser;
        document.getElementById('loginBtn').style.display = loggedIn ? 'none' : 'inline';
        document.getElementById('logoutBtn').style.display = loggedIn ? 'inline' : 'none';
        document.getElementById('userDisplay').style.display = loggedIn ? 'inline' : 'none';
        document.getElementById('username').textContent = this.currentUser || '';
        document.getElementById('userRole').textContent = this.currentRole || '';
        document.getElementById('resetDemoBtn').style.display = loggedIn ? 'inline' : 'none';
        document.getElementById('dashboardBtn').style.display = loggedIn ? 'inline' : 'none';
        document.getElementById('newAssessmentBtn').style.display = loggedIn && this.currentRole !== 'viewer' ? 'inline' : 'none';
        document.getElementById('templateWizardBtn').style.display = loggedIn && this.currentRole !== 'viewer' ? 'inline' : 'none';
        document.getElementById('templateEditorBtn').style.display = loggedIn && this.currentRole === 'admin' ? 'inline' : 'none';
        document.getElementById('exportBtn').style.display = loggedIn ? 'inline' : 'none';
        document.getElementById('auditTrailBtn').style.display = loggedIn ? 'inline' : 'none';
    }

    showSection(id) {
        console.log('Showing section:', id);
        document.querySelectorAll('main > section').forEach(sec => {
            sec.style.display = 'none';
            sec.classList.remove('visible');
        });
        const target = document.getElementById(id);
        target.style.display = 'block';
        setTimeout(() => target.classList.add('visible'), 50);
    }

    logout() {
        console.log('Logging out:', this.currentUser);
        this.logAudit('Logout', { user: this.currentUser });
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentRole');
        this.currentUser = null;
        this.currentRole = null;
        this.updateUI();
        this.showSection('loginForm');
    }

    resetDemo() {
        if (confirm('Reset demo data? This will clear all local changes.')) {
            localStorage.clear();
            sessionStorage.clear();
            location.reload();
        }
    }

    logAudit(action, details) {
        const log = {
            id: Date.now(),
            user: this.currentUser || 'Guest',
            role: this.currentRole || 'Guest',
            timestamp: new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }),
            action,
            details
        };
        this.auditTrail.push(log);
        localStorage.setItem('pharmaRiskAudit', JSON.stringify(this.auditTrail));
    }

    // Other methods (renderDashboard, renderFMEATable, etc.) remain similar, ensure they check role
}

const app = new PharmaRiskApp();
