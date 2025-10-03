// script.js - Enhanced
class PharmaRiskApp {
    constructor() {
        this.assessments = JSON.parse(localStorage.getItem('pharmaRiskAssessments')) || [];
        this.auditTrail = JSON.parse(localStorage.getItem('pharmaRiskAudit')) || [];
        this.currentUser = sessionStorage.getItem('currentUser') || null;
        this.users = JSON.parse(localStorage.getItem('users')) || { admin: 'password' }; // Demo users
        this.currentAssessmentId = null;
        this.initEventListeners();
        this.updateUIForAuth();
        this.renderAssessments();
    }

    initEventListeners() {
        // Auth
        document.getElementById('loginBtn').addEventListener('click', () => this.showLoginForm());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('loginFormEl').addEventListener('submit', (e) => this.handleLogin(e));

        // Existing
        document.getElementById('newAssessmentBtn').addEventListener('click', () => this.showNewAssessmentForm());
        document.getElementById('assessmentFormEl').addEventListener('submit', (e) => this.saveAssessment(e));
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideForm());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportAll());
        document.getElementById('backToListBtn').addEventListener('click', () => this.showAssessmentsList());

        // Delegate
        document.addEventListener('click', (e) => {
            if (e.target.id === 'editBtn') this.editAssessment(e.target.dataset.id);
            if (e.target.id === 'deleteBtn') this.deleteAssessment(e.target.dataset.id);
            if (e.target.id === 'addRowBtn') this.addFMEARow();
            if (e.target.id === 'exportFMEABtn') this.exportCurrentFMEA();
            if (e.target.id === 'removeRowBtn') this.removeFMEARow(e.target.dataset.rowId);
            if (e.target.id === 'auditTrailBtn') this.showAuditTrail();
            if (e.target.id === 'backFromAuditBtn') this.showAssessmentsList();
            if (e.target.id === 'regReferencesBtn') this.showRegReferences();
            if (e.target.id === 'backFromRegBtn') this.showAssessmentsList();
            if (e.target.id === 'templateWizardBtn') this.showWizard();
            if (e.target.id === 'cancelWizardBtn') this.hideWizard();
            if (e.target.classList.contains('nextStep')) this.nextWizardStep();
            if (e.target.classList.contains('prevStep')) this.prevWizardStep();
        });
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('fmea-input')) {
                this.calculateRPN(e.target.closest('tr'));
            }
        });
        document.getElementById('wizardForm').addEventListener('submit', (e) => this.generateTemplate(e));
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('fmea-input')) {
                const rowId = e.target.closest('tr').dataset.rowId;
                const field = e.target.dataset.field;
                this.updateRowField(rowId, field, e.target.value);
            }
        });
    }

    updateUIForAuth() {
        if (this.currentUser) {
            document.getElementById('loginBtn').style.display = 'none';
            document.getElementById('logoutBtn').style.display = 'inline';
            document.getElementById('userDisplay').style.display = 'inline';
            document.getElementById('username').textContent = this.currentUser;
            document.getElementById('newAssessmentBtn').style.display = 'inline';
            document.getElementById('templateWizardBtn').style.display = 'inline';
            document.getElementById('exportBtn').style.display = 'inline';
            document.getElementById('auditTrailBtn').style.display = 'inline';
            document.getElementById('assessmentsList').style.display = 'block';
        } else {
            document.getElementById('loginBtn').style.display = 'inline';
            document.getElementById('logoutBtn').style.display = 'none';
            document.getElementById('userDisplay').style.display = 'none';
            document.getElementById('newAssessmentBtn').style.display = 'none';
            document.getElementById('templateWizardBtn').style.display = 'none';
            document.getElementById('exportBtn').style.display = 'none';
            document.getElementById('auditTrailBtn').style.display = 'none';
            document.getElementById('assessmentsList').style.display = 'none';
        }
    }

    showLoginForm() {
        document.getElementById('loginForm').style.display = 'block';
    }

    handleLogin(e) {
        e.preventDefault();
        const user = document.getElementById('user').value;
        const pass = document.getElementById('pass').value;
        if (this.users[user] === pass || true) { // Demo: always allow, store new
            this.users[user] = pass;
            localStorage.setItem('users', JSON.stringify(this.users));
            sessionStorage.setItem('currentUser', user);
            this.currentUser = user;
            this.updateUIForAuth();
            document.getElementById('loginForm').style.display = 'none';
        } else {
            alert('Invalid credentials');
        }
    }

    logout() {
        sessionStorage.removeItem('currentUser');
        this.currentUser = null;
        this.updateUIForAuth();
    }

    logAudit(action, details) {
        const log = {
            id: Date.now(),
            user: this.currentUser,
            timestamp: new Date().toISOString(),
            action,
            details
        };
        this.auditTrail.push(log);
        localStorage.setItem('pharmaRiskAudit', JSON.stringify(this.auditTrail));
    }

    showAuditTrail() {
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

    showRegReferences() {
        document.getElementById('assessmentsList').style.display = 'none';
        document.getElementById('regReferencesSection').style.display = 'block';
        const content = document.getElementById('regContent');
        content.innerHTML = `
            <h3>Key Regulatory References</h3>
            <ul>
                <li><a href="https://www.who.int/docs/default-source/medicines/norms-and-standards/guidelines/production/trs981-annex2-who-quality-risk-management.pdf">WHO Quality Risk Management</a>: Principles for QRM in supply chain, tools like FMEA for transportation risks.</li>
                <li><a href="https://www.fda.gov/media/167721/download">ICH Q9(R1)</a>: Systematic approach to risk management, FMEA for distribution.</li>
                <li><a href="https://www.fda.gov.ph/wp-content/uploads/2021/03/World-Health-Organization-Good-Distribution-Practices.pdf">WHO GDP</a>: Guidelines for transportation to maintain product integrity.</li>
                <li><a href="https://www.who.int/docs/default-source/medicines/norms-and-standards/guidelines/distribution/trs961-annex9-modelguidanceforstoragetransport.pdf">WHO Annex 9</a>: Storage and transport of temperature-sensitive products.</li>
                <li><a href="https://www.pharmoutsourcing.com/Featured-Articles/342562-Pharmaceutical-Supply-Chain-Security-Risk-Assessment-for-Shipping-Lanes/">Supply Chain Security Risk Assessment</a>: Model for shipping lanes, criteria like mode, security incidents.</li>
            </ul>
            <p>Summaries: [Insert summaries from research here, e.g., from ICH Q9: Evaluation based on science, commensurate effort...]</p>
        `; // Add more summaries as needed
    }

    showWizard() {
        document.getElementById('assessmentsList').style.display = 'none';
        document.getElementById('wizardSection').style.display = 'block';
        document.getElementById('step1').style.display = 'block';
        document.getElementById('step2').style.display = 'none';
        document.getElementById('step3').style.display = 'none';
    }

    hideWizard() {
        document.getElementById('wizardSection').style.display = 'none';
        document.getElementById('assessmentsList').style.display = 'block';
    }

    nextWizardStep() {
        const current = document.querySelector('.step[style="display: block;"]');
        const nextId = 'step' + (parseInt(current.id.replace('step', '')) + 1);
        if (document.getElementById(nextId)) {
            current.style.display = 'none';
            document.getElementById(nextId).style.display = 'block';
        }
    }

    prevWizardStep() {
        const current = document.querySelector('.step[style="display: block;"]');
        const prevId = 'step' + (parseInt(current.id.replace('step', '')) - 1);
        if (document.getElementById(prevId)) {
            current.style.display = 'none';
            document.getElementById(prevId).style.display = 'block';
        }
    }

    generateTemplate(e) {
        e.preventDefault();
        const fmeaType = document.getElementById('fmeaType').value;
        const domain = document.getElementById('domain').value;
        const transportMode = document.getElementById('transportMode').value || '';
        const productType = document.getElementById('productType').value || '';
        const routeDetails = document.getElementById('routeDetails').value;

        if (domain !== 'transportation') {
            alert('Only transportation templates available in demo.');
            return;
        }

        // Generate new assessment
        const title = `${fmeaType} for ${transportMode} Transportation - ${productType}`;
        const ass = {
            id: Date.now(),
            title,
            description: `Generated via wizard for global ${routeDetails}`,
            fmeaRows: this.getTemplateRows(transportMode, productType)
        };
        this.assessments.push(ass);
        this.saveData();
        this.logAudit('Generate Template', { title });
        this.hideWizard();
        this.showFMEA(ass);
    }

    getTemplateRows(mode, type) {
        // Predefined rows for transportation FMEA
        const baseRows = [
            { processStep: 'Loading', failureMode: 'Improper packaging', effect: 'Product damage', severity: 8, occurrence: 3, detection: 4, currentControls: 'Visual inspection', recommendedActions: 'Training', responsibility: '', targetCompletion: '', revisedSeverity: 8, revisedOccurrence: 3, revisedDetection: 4, actions: '' },
            { processStep: 'Transit', failureMode: 'Temperature excursion', effect: 'Product degradation', severity: 9, occurrence: 4, detection: 2, currentControls: 'Data loggers', recommendedActions: 'Real-time monitoring', responsibility: '', targetCompletion: '', revisedSeverity: 9, revisedOccurrence: 4, revisedDetection: 2, actions: '' },
            { processStep: 'Customs', failureMode: 'Delay', effect: 'Expiration risk', severity: 7, occurrence: 5, detection: 3, currentControls: 'Expedited clearance', recommendedActions: 'Backup routes', responsibility: '', targetCompletion: '', revisedSeverity: 7, revisedOccurrence: 5, revisedDetection: 3, actions: '' },
            { processStep: 'Unloading', failureMode: 'Contamination', effect: 'Product recall', severity: 10, occurrence: 2, detection: 5, currentControls: 'Sealed containers', recommendedActions: 'Sterile handling', responsibility: '', targetCompletion: '', revisedSeverity: 10, revisedOccurrence: 2, revisedDetection: 5, actions: '' },
            // Add more based on mode/type, e.g., for sea: Piracy, for air: Pressure changes, for coldchain: Freezer failure
        ];
        baseRows.forEach(row => { row.id = Date.now() + Math.random(); row.rpn = row.severity * row.occurrence * row.detection; row.revisedRpn = row.revisedSeverity * row.revisedOccurrence * row.revisedDetection; });
        if (mode === 'sea') baseRows.push({ /* sea specific */ });
        // Expand as needed
        return baseRows;
    }

    // Existing methods updated for audit
    saveAssessment(e) {
        // ... existing
        this.saveData();
        this.logAudit(this.currentAssessmentId ? 'Update Assessment' : 'Create Assessment', { id: ass.id, title: ass.title });
        // ... show FMEA
    }

    deleteAssessment(id) {
        // ... existing
        this.logAudit('Delete Assessment', { id });
    }

    addFMEARow() {
        // ... existing
        this.logAudit('Add Row', { assessmentId: this.currentAssessmentId });
    }

    removeFMEARow(rowId) {
        // ... existing
        this.logAudit('Remove Row', { assessmentId: this.currentAssessmentId, rowId });
    }

    updateRowField(rowId, field, value) {
        // ... existing
        this.logAudit('Update Row Field', { assessmentId: this.currentAssessmentId, rowId, field, value });
    }

    saveData() {
        localStorage.setItem('pharmaRiskAssessments', JSON.stringify(this.assessments));
    }

    // Render FMEA updated for revised fields
    renderFMEATable(rows) {
        const tbody = document.getElementById('fmeaTbody');
        tbody.innerHTML = '';
        rows.forEach(row => {
            const tr = document.createElement('tr');
            tr.dataset.rowId = row.id;
            tr.innerHTML = `
                <td><input type="text" class="fmea-input" data-field="processStep" value="${row.processStep || ''}"></td>
                <td><input type="text" class="fmea-input" data-field="failureMode" value="${row.failureMode || ''}"></td>
                <td><input type="text" class="fmea-input" data-field="effect" value="${row.effect || ''}"></td>
                <td><input type="number" class="fmea-input" data-field="severity" min="1" max="10" value="${row.severity || 1}"></td>
                <td><input type="number" class="fmea-input" data-field="occurrence" min="1" max="10" value="${row.occurrence || 1}"></td>
                <td><input type="number" class="fmea-input" data-field="detection" min="1" max="10" value="${row.detection || 1}"></td>
                <td class="rpn">${row.rpn || 1}</td>
                <td><input type="text" class="fmea-input" data-field="currentControls" value="${row.currentControls || ''}"></td>
                <td><input type="text" class="fmea-input" data-field="recommendedActions" value="${row.recommendedActions || ''}"></td>
                <td><input type="text" class="fmea-input" data-field="responsibility" value="${row.responsibility || ''}"></td>
                <td><input type="date" class="fmea-input" data-field="targetCompletion" value="${row.targetCompletion || ''}"></td>
                <td><input type="number" class="fmea-input" data-field="revisedSeverity" min="1" max="10" value="${row.revisedSeverity || 1}"></td>
                <td><input type="number" class="fmea-input" data-field="revisedOccurrence" min="1" max="10" value="${row.revisedOccurrence || 1}"></td>
                <td><input type="number" class="fmea-input" data-field="revisedDetection" min="1" max="10" value="${row.revisedDetection || 1}"></td>
                <td class="rpn">${row.revisedRpn || 1}</td>
                <td><input type="text" class="fmea-input" data-field="actions" value="${row.actions || ''}"></td>
                <td><button id="removeRowBtn" data-row-id="${row.id}">Remove</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    calculateRPN(tr) {
        const s = parseInt(tr.querySelector('[data-field="severity"]').value) || 1;
        const o = parseInt(tr.querySelector('[data-field="occurrence"]').value) || 1;
        const d = parseInt(tr.querySelector('[data-field="detection"]').value) || 1;
        tr.querySelectorAll('.rpn')[0].textContent = s * o * d;

        const rs = parseInt(tr.querySelector('[data-field="revisedSeverity"]').value) || 1;
        const ro = parseInt(tr.querySelector('[data-field="revisedOccurrence"]').value) || 1;
        const rd = parseInt(tr.querySelector('[data-field="revisedDetection"]').value) || 1;
        tr.querySelectorAll('.rpn')[1].textContent = rs * ro * rd;
    }

    // ... other methods as before
}

const app = new PharmaRiskApp();
