document.addEventListener('DOMContentLoaded', () => {
    class PharmaRiskApp {
        constructor() {
            this.assessments = JSON.parse(localStorage.getItem('pharmaRiskAssessments')) || this.getInitialAssessments();
            this.auditTrail = JSON.parse(localStorage.getItem('pharmaRiskAudit')) || [];
            this.users = JSON.parse(localStorage.getItem('users')) || {
                admin: { pass: 'admin123', role: 'admin' },
                assessor: { pass: 'assessor123', role: 'assessor' },
                viewer: { pass: 'viewer123', role: 'viewer' }
            };
            this.currentUser = sessionStorage.getItem('currentUser') || null;
            this.currentRole = sessionStorage.getItem('currentRole') || null;
            this.currentAssessmentId = null;
            this.initEventListeners();
            this.updateUI();
            if (this.currentUser) this.showDashboard();
            console.log('App initialized at', new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }));
        }

        getInitialAssessments() {
            return [{
                id: 1,
                title: 'Demo Assessment - Air Transport (Cold Chain)',
                description: 'Sample FMEA for pharmaceutical transport compliance.',
                fmeaRows: [{
                    id: Date.now(),
                    processStep: 'Loading',
                    failureMode: 'Improper packaging',
                    effect: 'Product damage',
                    severity: 8,
                    occurrence: 3,
                    detection: 4,
                    rpn: 96,
                    currentControls: 'Inspection',
                    recommendedActions: 'Staff training',
                    responsibility: 'Logistics Team',
                    targetCompletion: '',
                    revisedSeverity: 6,
                    revisedOccurrence: 2,
                    revisedDetection: 3,
                    revisedRpn: 36
                }]
            }];
        }

        initEventListeners() {
            try {
                document.getElementById('loginFormEl').addEventListener('submit', (e) => this.handleLogin(e));
                document.getElementById('loginBtn').addEventListener('click', () => this.showSection('loginForm'));
                document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
                document.getElementById('resetDemoBtn').addEventListener('click', () => this.resetDemo());
                document.getElementById('dashboardBtn').addEventListener('click', () => this.showDashboard());
                document.getElementById('newAssessmentBtn').addEventListener('click', () => this.showNewAssessmentForm());
                document.getElementById('assessmentFormEl').addEventListener('submit', (e) => this.saveAssessment(e));
                document.getElementById('cancelBtn').addEventListener('click', () => this.hideForm());
                document.getElementById('templateWizardBtn').addEventListener('click', () => this.showWizard());
                document.getElementById('wizardForm').addEventListener('submit', (e) => this.generateTemplate(e));
                document.getElementById('cancelWizardBtn').addEventListener('click', () => this.hideWizard());
                document.getElementById('auditTrailBtn').addEventListener('click', () => this.showAuditTrail());
                document.getElementById('backFromAuditBtn').addEventListener('click', () => this.showDashboard());
                document.getElementById('regReferencesBtn').addEventListener('click', () => this.showRegReferences());
                document.getElementById('backFromRegBtn').addEventListener('click', () => this.showRegReferences());
                document.getElementById('exportBtn').addEventListener('click', () => this.exportAll());
                document.getElementById('addRowBtn').addEventListener('click', () => this.addFMEARow());
                document.getElementById('sortByRPNBtn').addEventListener('click', () => this.sortFMEATable());
                document.getElementById('exportFMEABtn').addEventListener('click', () => this.exportFMEA());
                document.getElementById('backToListBtn').addEventListener('click', () => this.showDashboard());
                document.getElementById('backFromDashboardBtn').addEventListener('click', () => this.showDashboard());
                document.addEventListener('click', (e) => {
                    if (e.target.id === 'editBtn') this.editAssessment(e.target.dataset.id);
                    if (e.target.id === 'deleteBtn') this.deleteAssessment(e.target.dataset.id);
                    if (e.target.id === 'removeRowBtn') this.removeFMEARow(e.target.dataset.rowId);
                });
                document.addEventListener('input', (e) => {
                    if (e.target.classList.contains('fmea-input')) {
                        const tr = e.target.closest('tr');
                        const rowId = tr.dataset.rowId;
                        const field = e.target.dataset.field;
                        this.updateRowField(rowId, field, e.target.value);
                    }
                });
                document.getElementById('regSearch').addEventListener('input', (e) => this.searchRegRefs(e.target.value
