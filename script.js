class PharmaRiskApp {
    constructor() {
        this.assessments = JSON.parse(localStorage.getItem('pharmaRiskAssessments')) || [];
        this.auditTrail = JSON.parse(localStorage.getItem('pharmaRiskAudit')) || [];
        this.users = JSON.parse(localStorage.getItem('users')) || { admin: { pass: 'admin123', role: 'admin' }, assessor: { pass: 'assessor123', role: 'assessor' }, viewer: { pass: 'viewer123', role: 'viewer' } };
        this.currentUser = sessionStorage.getItem('currentUser') || null;
        this.currentRole = sessionStorage.getItem('currentRole') || null;
        this.currentAssessmentId = null;
        this.initEventListeners();
        this.updateUI();
        if (this.currentUser) this.showDashboard();
    }

    initEventListeners() {
        document.getElementById('loginFormEl').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('resetDemoBtn').addEventListener('click', () => this.resetDemo());
        document.getElementById('newAssessmentBtn').addEventListener('click', () => this.showNewAssessmentForm());
        document.getElementById('assessmentFormEl').addEventListener('submit', (e) => this.saveAssessment(e));
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideForm());
        document.getElementById('templateWizardBtn').addEventListener('click', () => this.showWizard());
        document.getElementById('wizardForm').addEventListener('submit', (e) => this.generateTemplate(e));
        document.getElementById('cancelWizardBtn').addEventListener('click', () => this.hideWizard());
        document.getElementById('auditTrailBtn').addEventListener('click', () => this.showAuditTrail());
        document.getElementById('backFromAuditBtn').addEventListener('click', () => this.showDashboard());
        document.getElementById('regReferencesBtn').addEventListener('click', () => this.showRegReferences());
        document.getElementById('backFromRegBtn').addEventListener('click', () => this.showDashboard());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportAll());
        document.addEventListener('click', (e) => {
            if (e.target.id === 'editBtn') this.editAssessment(e.target.dataset.id);
            if (e.target.id === 'deleteBtn') this.deleteAssessment(e.target.dataset.id);
            if (e.target.id === 'addRowBtn') this.addFMEARow();
            if (e.target.id === 'removeRowBtn') this.removeFMEARow(e.target.dataset.rowId);
            if (e.target.classList.contains('nextStep')) this.nextWizardStep();
            if (e.target.classList.contains('prevStep')) this.prevWizardStep();
        });
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('fmea-input')) {
                const tr = e.target.closest('tr');
                const rowId = tr.dataset.rowId;
                const field = e.target.dataset.field;
                this.updateRowField(rowId, field, e.target.value);
                this.calculateRPN(tr);
            }
        });
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
        document.getElementById('newAssessmentBtn').style.display = loggedIn ? 'inline' : 'none';
        document.getElementById('templateWizardBtn').style.display = loggedIn ? 'inline' : 'none';
        document.getElementById('exportBtn').style.display = loggedIn ? 'inline' : 'none';
        document.getElementById('auditTrailBtn').style.display = loggedIn ? 'inline' : 'none';
        document.getElementById('regReferencesBtn').style.display = 'inline';
        document.getElementById('loginForm').style.display = loggedIn ? 'none' : 'block';
        document.getElementById('dashboardSection').style.display = loggedIn ? 'block' : 'none';
        document.getElementById('assessmentsList').style.display = loggedIn ? 'block' : 'none';
        this.renderAssessments();
    }

    handleLogin(e) {
        e.preventDefault();
        const user = document.getElementById('user').value;
        const pass = document.getElementById('pass').value;
        const role = document.getElementById('role').value;
        this.users[user] = { pass, role };
        localStorage.setItem('users', JSON.stringify(this.users));
        sessionStorage.setItem('currentUser', user);
        sessionStorage.setItem('currentRole', role);
        this.currentUser = user;
        this.currentRole = role;
        this.logAudit('Login', { user, role });
        this.updateUI();
        this.showDashboard();
    }

    showDashboard() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        document.getElementById('assessmentsList').style.display = 'block';
        this.renderDashboard();
    }

    renderDashboard() {
        // Placeholder - add charts if needed
        document.getElementById('totalAssessments').textContent = this.assessments.length;
        // ...
    }

    // Other methods from previous responses - add as needed for full functionality

    logAudit(action, details) {
        const log = {
            id: Date.now(),
            user: this.currentUser || 'Guest',
            timestamp: new Date().toISOString(),
            action,
            details
        };
        this.auditTrail.push(log);
        localStorage.setItem('pharmaRiskAudit', JSON.stringify(this.auditTrail));
    }

    resetDemo() {
        if (confirm('Reset demo?')) {
            localStorage.clear();
            sessionStorage.clear();
            location.reload();
        }
    }

    logout() {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentRole');
        this.currentUser = null;
        this.currentRole = null;
        this.updateUI();
    }

    showAuditTrail() {
        document.getElementById('dashboardSection').style.display = 'none';
        document.getElementById('assessmentsList').style.display = 'none';
        document.getElementById('auditTrailSection').style.display = 'block';
        const ul = document.getElementById('auditUl');
        ul.innerHTML = '';
        this.auditTrail.forEach(log => {
            const li = document.createElement('li');
            li.textContent = `[${log.timestamp}] ${log.user}: ${log.action} - ${JSON.stringify(log.details)}`;
            ul.appendChild(li);
        });
    }

    // Add showRegReferences, showWizard, generateTemplate, etc.
}

new PharmaRiskApp();
