document.addEventListener('DOMContentLoaded', () => {
    class PharmaRiskApp {
        constructor() {
            this.assessments = JSON.parse(localStorage.getItem('pharmaRiskAssessments')) || this.getInitialAssessments();
            this.auditTrail = JSON.parse(localStorage.getItem('pharmaRiskAudit')) || [];
            this.users = JSON.parse(localStorage.getItem('users')) || { admin: { pass: 'admin123', role: 'admin' }, assessor: { pass: 'assessor123', role: 'assessor' }, viewer: { pass: 'viewer123', role: 'viewer' } };
            this.currentUser = sessionStorage.getItem('currentUser') || null;
            this.currentRole = sessionStorage.getItem('currentRole') || null;
            this.currentAssessmentId = null;
            this.initEventListeners();
            this.updateUI();
            if (this.currentUser) this.showDashboard();
        }

        getInitialAssessments() {
            return [{
                id: 1,
                title: 'Demo Assessment - Air Transport (Cold Chain)',
                description: 'Sample FMEA for demo',
                fmeaRows: [{
                    id: 1,
                    processStep: 'Loading',
                    failureMode: 'Improper packaging',
                    effect: 'Damage',
                    severity: 8,
                    occurrence: 3,
                    detection: 4,
                    rpn: 96,
                    currentControls: 'Inspection',
                    recommendedActions: 'Training',
                    responsibility: 'Team',
                    targetCompletion: '',
                    revisedSeverity: 8,
                    revisedOccurrence: 3,
                    revisedDetection: 4,
                    revisedRpn: 96
                }]
            }];
        }

        initEventListeners() {
            try {
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
            } catch (error) {
                console.error('Error binding events:', error);
            }
        }

        updateUI() {
            try {
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
                if (loggedIn) {
                    document.getElementById('dashboardSection').style.display = 'block';
                    document.getElementById('assessmentsList').style.display = 'block';
                    this.renderAssessments();
                }
            } catch (error) {
                console.error('Error in updateUI:', error);
            }
        }

        handleLogin(e) {
            try {
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
            } catch (error) {
                console.error('Error in handleLogin:', error);
            }
        }

        renderAssessments() {
            try {
                const ul = document.getElementById('assessmentsUl');
                ul.innerHTML = '';
                this.assessments.forEach(ass => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${ass.title}</span>
                        <div>
                            <button id="editBtn" data-id="${ass.id}">Edit</button>
                            <button id="deleteBtn" data-id="${ass.id}">Delete</button>
                        </div>
                    `;
                    ul.appendChild(li);
                });
            } catch (error) {
                console.error('Error in renderAssessments:', error);
            }
        }

        // Add other methods: showNewAssessmentForm, saveAssessment, editAssessment, deleteAssessment, addFMEARow, removeFMEARow, updateRowField, calculateRPN, showWizard, generateTemplate, hideWizard, nextWizardStep, prevWizardStep, showAuditTrail, showRegReferences, exportAll, logAudit, resetDemo, logout

        showNewAssessmentForm() {
            document.getElementById('dashboardSection').style.display = 'none';
            document.getElementById('assessmentsList').style.display = 'none';
            document.getElementById('assessmentForm').style.display = 'block';
            document.getElementById('title').value = '';
            document.getElementById('description').value = '';
            this.currentAssessmentId = null;
        }

        hideForm() {
            document.getElementById('assessmentForm').style.display = 'none';
            this.updateUI();
        }

        saveAssessment(e) {
            e.preventDefault();
            const title = document.getElementById('title').value;
            const description = document.getElementById('description').value;
            const ass = {
                id: this.currentAssessmentId || Date.now(),
                title,
                description,
                fmeaRows: this.currentAssessmentId ? this.assessments.find(a => a.id === this.currentAssessmentId).fmeaRows : []
            };
            const index = this.assessments.findIndex(a => a.id === ass.id);
            if (index > -1) {
                this.assessments[index] = ass;
            } else {
                this.assessments.push(ass);
            }
            localStorage.setItem('pharmaRiskAssessments', JSON.stringify(this.assessments));
            this.logAudit('Save Assessment', { id: ass.id });
            this.hideForm();
            this.renderAssessments();
        }

        editAssessment(id) {
            const ass = this.assessments.find(a => a.id == id);
            if (ass) {
                document.getElementById('dashboardSection').style.display = 'none';
                document.getElementById('assessmentsList').style.display = 'none';
                document.getElementById('fmeaSection').style.display = 'block';
                document.getElementById('currentTitle').textContent = ass.title;
                this.currentAssessmentId = id;
                this.renderFMEATable(ass.fmeaRows);
            }
        }

        deleteAssessment(id) {
            if (confirm('Delete?')) {
                this.assessments = this.assessments.filter(a => a.id != id);
                localStorage.setItem('pharmaRiskAssessments', JSON.stringify(this.assessments));
                this.logAudit('Delete Assessment', { id });
                this.renderAssessments();
            }
        }

        addFMEARow() {
            const rows = this.assessments.find(a => a.id === this.currentAssessmentId).fmeaRows;
            rows.push({
                id: Date.now(),
                processStep: '',
                failureMode: '',
                effect: '',
                severity: 1,
                occurrence: 1,
                detection: 1,
                rpn: 1,
                currentControls: '',
                recommendedActions: '',
                responsibility: '',
                targetCompletion: '',
                revisedSeverity: 1,
                revisedOccurrence: 1,
                revisedDetection: 1,
                revisedRpn: 1
            });
            this.logAudit('Add Row', { assessmentId: this.currentAssessmentId });
            this.renderFMEATable(rows);
            localStorage.setItem('pharmaRiskAssessments', JSON.stringify(this.assessments));
        }

        removeFMEARow(rowId) {
            if (confirm('Remove?')) {
                const ass = this.assessments.find(a => a.id === this.currentAssessmentId);
                ass.fmeaRows = ass.fmeaRows.filter(r => r.id != rowId);
                this.logAudit('Remove Row', { assessmentId: this.currentAssessmentId, rowId });
                this.renderFMEATable(ass.fmeaRows);
                localStorage.setItem('pharmaRiskAssessments', JSON.stringify(this.assessments));
            }
        }

        updateRowField(rowId, field, value) {
            const ass = this.assessments.find(a => a.id === this.currentAssessmentId);
            const row = ass.fmeaRows.find(r => r.id == rowId);
            row[field] = value;
            row.rpn = row.severity * row.occurrence * row.detection;
            row.revisedRpn = row.revisedSeverity * row.revisedOccurrence * row.revisedDetection;
            this.logAudit('Update Field', { assessmentId: this.currentAssessmentId, rowId, field, value });
            this.renderFMEATable(ass.fmeaRows);
            localStorage.setItem('pharmaRiskAssessments', JSON.stringify(this.assessments));
        }

        calculateRPN(tr) {
            const s = parseInt(tr.querySelector('[data-field="severity"]').value) || 1;
            const o = parseInt(tr.querySelector('[data-field="occurrence"]').value) || 1;
            const d = parseInt(tr.querySelector('[data-field="detection"]').value) || 1;
            tr.querySelector('.rpn').textContent = s * o * d;

            const rs = parseInt(tr.querySelector('[data-field="revisedSeverity"]').value) || 1;
            const ro = parseInt(tr.querySelector('[data-field="revisedOccurrence"]').value) || 1;
            const rd = parseInt(tr.querySelector('[data-field="revisedDetection"]').value) || 1;
            tr.querySelectorAll('.rpn')[1].textContent = rs * ro * rd;
        }

        renderFMEATable(rows) {
            const tbody = document.getElementById('fmeaTbody');
            tbody.innerHTML = '';
            rows.forEach(row => {
                const tr = document.createElement('tr');
                tr.dataset.rowId = row.id;
                tr.innerHTML = `
                    <td><input class="fmea-input" data-field="processStep" value="${row.processStep || ''}"></td>
                    <td><input class="fmea-input" data-field="failureMode" value="${row.failureMode || ''}"></td>
                    <td><input class="fmea-input" data-field="effect" value="${row.effect || ''}"></td>
                    <td><input type="number" class="fmea-input" data-field="severity" min="1" max="10" value="${row.severity || 1}"></td>
                    <td><input type="number" class="fmea-input" data-field="occurrence" min="1" max="10" value="${row.occurrence || 1}"></td>
                    <td><input type="number" class="fmea-input" data-field="detection" min="1" max="10" value="${row.detection || 1}"></td>
                    <td class="rpn">${row.rpn || 1}</td>
                    <td><input class="fmea-input" data-field="currentControls" value="${row.currentControls || ''}"></td>
                    <td><input class="fmea-input" data-field="recommendedActions" value="${row.recommendedActions || ''}"></td>
                    <td><input class="fmea-input" data-field="responsibility" value="${row.responsibility || ''}"></td>
                    <td><input type="date" class="fmea-input" data-field="targetCompletion" value="${row.targetCompletion || ''}"></td>
                    <td><input type="number" class="fmea-input" data-field="revisedSeverity" min="1" max="10" value="${row.revisedSeverity || 1}"></td>
                    <td><input type="number" class="fmea-input" data-field="revisedOccurrence" min="1" max="10" value="${row.revisedOccurrence || 1}"></td>
                    <td><input type="number" class="fmea-input" data-field="revisedDetection" min="1" max="10" value="${row.revisedDetection || 1}"></td>
                    <td class="rpn">${row.revisedRpn || 1}</td>
                    <td><button id="removeRowBtn" data-row-id="${row.id}">Remove</button></td>
                `;
                tbody.appendChild(tr);
            });
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

        showRegReferences() {
            document.getElementById('dashboardSection').style.display = 'none';
            document.getElementById('assessmentsList').style.display = 'none';
            document.getElementById('regReferencesSection').style.display = 'block';
            document.getElementById('regContent').innerHTML = `
                <ul>
                    <li>WHO Annex 5: GDP - Good Distribution Practices for transport integrity.</li>
                    <li>FDA GMP 21 CFR 211 - Storage and transport controls.</li>
                </ul>
            `;
        }

        exportAll() {
            const dataStr = JSON.stringify(this.assessments, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'All_Assessments.json';
            a.click();
            URL.revokeObjectURL(url);
        }

        showWizard() {
            document.getElementById('dashboardSection').style.display = 'none';
            document.getElementById('assessmentsList').style.display = 'none';
            document.getElementById('wizardSection').style.display = 'block';
            document.getElementById('step1').style.display = 'block';
            document.getElementById('step2').style.display = 'none';
            document.getElementById('step3').style.display = 'none';
        }

        hideWizard() {
            document.getElementById('wizardSection').style.display = 'none';
            this.updateUI();
        }

        nextWizardStep() {
            const current = document.querySelector('.step:not([style*="display: none"])');
            const nextId = 'step' + (parseInt(current.id.replace('step', '')) + 1);
            if (document.getElementById(nextId)) {
                current.style.display = 'none';
                document.getElementById(nextId).style.display = 'block';
            }
        }

        prevWizardStep() {
            const current = document.querySelector('.step:not([style*="display: none"])');
            const prevId = 'step' + (parseInt(current.id.replace('step', '')) - 1);
            if (document.getElementById(prevId)) {
                current.style.display = 'none';
                document.getElementById(prevId).style.display = 'block';
            }
        }

        generateTemplate(e) {
            e.preventDefault();
            const fmeaType = document.getElementById('fmeaType').value;
            const transportMode = document.getElementById('transportMode').value;
            const productType = document.getElementById('productType').value;
            const routeDetails = document.getElementById('routeDetails').value;
            const title = `${fmeaType} - ${transportMode} Transport (${productType})`;
            const ass = {
                id: Date.now(),
                title,
                description: `FMEA for ${transportMode} transport of ${productType} products. Route: ${routeDetails || 'N/A'}`,
                fmeaRows: [] // Add rows logic from previous
            };
            this.assessments.push(ass);
            localStorage.setItem('pharmaRiskAssessments', JSON.stringify(this.assessments));
            this.logAudit('Generate Template', { title });
            this.hideWizard();
            this.editAssessment(ass.id);
        }
    }

    new PharmaRiskApp();
});
