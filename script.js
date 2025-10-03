// script.js - Updated with Dashboard and Fixes
class PharmaRiskApp {
    constructor() {
        this.assessments = JSON.parse(localStorage.getItem('pharmaRiskAssessments')) || [];
        this.auditTrail = JSON.parse(localStorage.getItem('pharmaRiskAudit')) || [];
        this.users = JSON.parse(localStorage.getItem('users')) || { admin: 'admin123' };
        this.currentUser = sessionStorage.getItem('currentUser') || null;
        this.currentAssessmentId = null;
        this.initEventListeners();
        this.updateUI();
        this.renderAssessments();
    }

    initEventListeners() {
        document.getElementById('loginBtn').addEventListener('click', () => this.showLoginForm());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('loginFormEl').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('dashboardBtn').addEventListener('click', () => this.showDashboard());
        document.getElementById('backFromDashboardBtn').addEventListener('click', () => this.showAssessmentsList());
        document.getElementById('newAssessmentBtn').addEventListener('click', () => this.showNewAssessmentForm());
        document.getElementById('assessmentFormEl').addEventListener('submit', (e) => this.saveAssessment(e));
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideForm());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportAll());
        document.getElementById('backToListBtn').addEventListener('click', () => this.showAssessmentsList());
        document.getElementById('auditTrailBtn').addEventListener('click', () => this.showAuditTrail());
        document.getElementById('backFromAuditBtn').addEventListener('click', () => this.showAssessmentsList());
        document.getElementById('regReferencesBtn').addEventListener('click', () => this.showRegReferences());
        document.getElementById('backFromRegBtn').addEventListener('click', () => this.showAssessmentsList());
        document.getElementById('templateWizardBtn').addEventListener('click', () => this.showWizard());
        document.getElementById('cancelWizardBtn').addEventListener('click', () => this.hideWizard());
        document.getElementById('wizardForm').addEventListener('submit', (e) => this.generateTemplate(e));

        document.addEventListener('click', (e) => {
            if (e.target.id === 'editBtn') this.editAssessment(e.target.dataset.id);
            if (e.target.id === 'deleteBtn') this.deleteAssessment(e.target.dataset.id);
            if (e.target.id === 'addRowBtn') this.addFMEARow();
            if (e.target.id === 'sortByRPNBtn') this.sortByRPN();
            if (e.target.id === 'exportFMEABtn') this.exportCurrentFMEA();
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
        document.getElementById('dashboardBtn').style.display = loggedIn ? 'inline' : 'none';
        document.getElementById('newAssessmentBtn').style.display = loggedIn ? 'inline' : 'none';
        document.getElementById('templateWizardBtn').style.display = loggedIn ? 'inline' : 'none';
        document.getElementById('exportBtn').style.display = loggedIn ? 'inline' : 'none';
        document.getElementById('auditTrailBtn').style.display = loggedIn ? 'inline' : 'none';
        document.getElementById('assessmentsList').style.display = loggedIn ? 'block' : 'none';
        if (loggedIn) this.showDashboard();
    }

    showDashboard() {
        document.getElementById('assessmentsList').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        this.renderDashboard();
    }

    renderDashboard() {
        let totalRisks = 0;
        let totalRPN = 0;
        let highRPNCount = 0;
        const rpnLevels = { low: 0, medium: 0, high: 0 };
        const topRisks = [];

        this.assessments.forEach(ass => {
            ass.fmeaRows.forEach(row => {
                totalRisks++;
                totalRPN += row.rpn;
                if (row.rpn > 500) highRPNCount++;
                if (row.rpn < 100) rpnLevels.low++;
                else if (row.rpn < 500) rpnLevels.medium++;
                else rpnLevels.high++;
                topRisks.push({ failureMode: row.failureMode, rpn: row.rpn });
            });
        });

        topRisks.sort((a, b) => b.rpn - a.rpn);
        topRisks.splice(5); // Top 5

        document.getElementById('totalAssessments').textContent = this.assessments.length;
        document.getElementById('totalRisks').textContent = totalRisks;
        document.getElementById('avgRPN').textContent = totalRisks ? (totalRPN / totalRisks).toFixed(2) : 0;
        document.getElementById('highRPNCount').textContent = highRPNCount;

        // Pie Chart
        const pieCtx = document.getElementById('rpnPieChart').getContext('2d');
        new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: ['Low (<100)', 'Medium (100-500)', 'High (>500)'],
                datasets: [{
                    data: [rpnLevels.low, rpnLevels.medium, rpnLevels.high],
                    backgroundColor: ['#28a745', '#ffc107', '#dc3545']
                }]
            },
            options: { responsive: true }
        });

        // Bar Chart
        const barCtx = document.getElementById('topRisksBarChart').getContext('2d');
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: topRisks.map(r => r.failureMode.slice(0, 20) + '...'),
                datasets: [{
                    label: 'RPN',
                    data: topRisks.map(r => r.rpn),
                    backgroundColor: '#007bff'
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    showLoginForm() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('assessmentsList').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'none';
    }

    handleLogin(e) {
        e.preventDefault();
        const user = document.getElementById('user').value;
        const pass = document.getElementById('pass').value;
        this.users[user] = pass; // Demo
        localStorage.setItem('users', JSON.stringify(this.users));
        sessionStorage.setItem('currentUser', user);
        this.currentUser = user;
        this.logAudit('Login', { user });
        this.updateUI();
        document.getElementById('loginForm').style.display = 'none';
    }

    logout() {
        this.logAudit('Logout', { user: this.currentUser });
        sessionStorage.removeItem('currentUser');
        this.currentUser = null;
        this.updateUI();
    }

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
            <h3>Key Regulatory References</h3>
            <ul>
                <li><a href="https://www.who.int/publications/i/item/10665-249471">WHO Annex 5: Good Distribution Practices</a>: Ensure product integrity during transport (temperature, security).</li>
                <li><a href="https://www.fda.gov/regulatory-information/search-fda-guidance-documents/cpg-sec-400150-good-manufacturing-practice-pharmaceuticals">FDA GMP (21 CFR 211)</a>: Storage and transport controls to prevent contamination.</li>
                <li><a href="https://www.ich.org/page/quality-guidelines">ICH Q9(R1) Quality Risk Management</a>: FMEA for risk identification in supply chains.</li>
                <li><a href="https://www.who.int/docs/default-source/medicines/norms-and-standards/guidelines/distribution/trs961-annex9-modelguidanceforstoragetransport.pdf">WHO Annex 9</a>: Temperature-sensitive product transport requirements.</li>
                <li><a href="https://www.pharmoutsourcing.com/Featured-Articles/342562-Pharmaceutical-Supply-Chain-Security-Risk-Assessment-for-Shipping-Lanes/">Supply Chain Security</a>: Risk assessment for global shipping lanes.</li>
            </ul>
            <p><strong>Summary</strong>: These guidelines emphasize risk-based approaches (ICH Q9), temperature control (WHO Annex 9), and secure transport (GDP). FMEA is recommended for identifying failure modes like temperature excursions or customs delays.</p>
        `;
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
        this.showDashboard();
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
            fmeaRows: this.getTransportTemplateRows(transportMode, productType)
        };
        this.assessments.push(ass);
        this.saveData();
        this.logAudit('Generate FMEA Template', { title, transportMode, productType });
        this.hideWizard();
        this.showFMEA(ass);
    }

    getTransportTemplateRows(mode, type) {
        const templates = {
            air: [
                { processStep: 'Cargo Loading', failureMode: 'Improper handling', effect: 'Product damage', severity: 7, occurrence: 3, detection: 4, currentControls: 'Trained staff', recommendedActions: 'Enhanced training', responsibility: '', targetCompletion: '', revisedSeverity: 7, revisedOccurrence: 3, revisedDetection: 4 },
                { processStep: 'In-Flight', failureMode: 'Pressure change', effect: 'Packaging failure', severity: 8, occurrence: 2, detection: 5, currentControls: 'Pressure-tested packaging', recommendedActions: 'Improved materials', responsibility: '', targetCompletion: '', revisedSeverity: 8, revisedOccurrence: 2, revisedDetection: 5 },
                { processStep: 'Customs', failureMode: 'Delay', effect: 'Temperature excursion', severity: 9, occurrence: 4, detection: 3, currentControls: 'Expedited clearance', recommendedActions: 'Pre-clearance', responsibility: '', targetCompletion: '', revisedSeverity: 9, revisedOccurrence: 4, revisedDetection: 3 },
            ],
            sea: [
                { processStep: 'Container Loading', failureMode: 'Contamination', effect: 'Product recall', severity: 10, occurrence: 2, detection: 4, currentControls: 'Sealed containers', recommendedActions: 'Sterile protocols', responsibility: '', targetCompletion: '', revisedSeverity: 10, revisedOccurrence: 2, revisedDetection: 4 },
                { processStep: 'Transit', failureMode: 'Piracy', effect: 'Loss of shipment', severity: 9, occurrence: 1, detection: 6, currentControls: 'Secure routes', recommendedActions: 'Armed escorts', responsibility: '', targetCompletion: '', revisedSeverity: 9, revisedOccurrence: 1, revisedDetection: 6 },
                { processStep: 'Port Storage', failureMode: 'Temperature excursion', effect: 'Degradation', severity: 8, occurrence: 3, detection: 3, currentControls: 'Data loggers', recommendedActions: 'Real-time alerts', responsibility: '', targetCompletion: '', revisedSeverity: 8, revisedOccurrence: 3, revisedDetection: 3 },
            ],
            road: [
                { processStep: 'Truck Loading', failureMode: 'Improper stacking', effect: 'Product damage', severity: 7, occurrence: 4, detection: 4, currentControls: 'Load plans', recommendedActions: 'Automated stacking', responsibility: '', targetCompletion: '', revisedSeverity: 7, revisedOccurrence: 4, revisedDetection: 4 },
                { processStep: 'Transit', failureMode: 'Vehicle breakdown', effect: 'Delay', severity: 8, occurrence: 3, detection: 5, currentControls: 'Maintenance checks', recommendedActions: 'Backup vehicles', responsibility: '', targetCompletion: '', revisedSeverity: 8, revisedOccurrence: 3, revisedDetection: 5 },
                { processStep: 'Border Crossing', failureMode: 'Documentation error', effect: 'Customs delay', severity: 7, occurrence: 4, detection: 3, currentControls: 'Pre-submitted docs', recommendedActions: 'Digital tracking', responsibility: '', targetCompletion: '', revisedSeverity: 7, revisedOccurrence: 4, revisedDetection: 3 },
            ],
            multi: [
                { processStep: 'Mode Transition', failureMode: 'Mishandling', effect: 'Product damage', severity: 8, occurrence: 3, detection: 4, currentControls: 'Standardized procedures', recommendedActions: 'Cross-mode training', responsibility: '', targetCompletion: '', revisedSeverity: 8, revisedOccurrence: 3, revisedDetection: 4 },
                { processStep: 'Storage', failureMode: 'Temperature excursion', effect: 'Degradation', severity: 9, occurrence: 3, detection: 3, currentControls: 'Data loggers', recommendedActions: 'IoT monitoring', responsibility: '', targetCompletion: '', revisedSeverity: 9, revisedOccurrence: 3, revisedDetection: 3 },
            ]
        };

        const rows = templates[mode] || templates.multi;
        if (type === 'coldchain') {
            rows.push({ processStep: 'Refrigeration', failureMode: 'Cooling failure', effect: 'Spoilage', severity: 10, occurrence: 2, detection: 3, currentControls: 'Backup generators', recommendedActions: 'Redundant systems', responsibility: '', targetCompletion: '', revisedSeverity: 10, revisedOccurrence: 2, revisedDetection: 3 });
        } else if (type === 'hazardous') {
            rows.push({ processStep: 'Handling', failureMode: 'Spill', effect: 'Safety hazard', severity: 10, occurrence: 2, detection: 4, currentControls: 'Hazmat training', recommendedActions: 'Advanced containment', responsibility: '', targetCompletion: '', revisedSeverity: 10, revisedOccurrence: 2, revisedDetection: 4 });
        }
        return rows.map(row => ({ ...row, id: Date.now() + Math.random(), rpn: row.severity * row.occurrence * row.detection, revisedRpn: row.revisedSeverity * row.revisedOccurrence * row.revisedDetection }));
    }

    renderAssessments() {
        const ul = document.getElementById('assessmentsUl');
        ul.innerHTML = '';
        this.assessments.forEach(ass => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${ass.title}</span>
                <div>
                    <button id="editBtn" data-id="${ass.id}">View/Edit FMEA</button>
                    <button id="deleteBtn" data-id="${ass.id}">Delete</button>
                </div>
            `;
            ul.appendChild(li);
        });
    }

    showNewAssessmentForm() {
        document.getElementById('dashboardSection').style.display = 'none';
        document.getElementById('assessmentsList').style.display = 'none';
        document.getElementById('assessmentForm').style.display = 'block';
        document.getElementById('formTitle').textContent = 'New Risk Assessment';
        document.getElementById('title').value = '';
        document.getElementById('description').value = '';
        this.currentAssessmentId = null;
    }

    hideForm() {
        document.getElementById('assessmentForm').style.display = 'none';
        this.showDashboard();
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
        this.saveData();
        this.logAudit(this.currentAssessmentId ? 'Update Assessment' : 'Create Assessment', { id: ass.id, title });
        this.hideForm();
        this.showFMEA(ass);
    }

    editAssessment(id) {
        const ass = this.assessments.find(a => a.id == id);
        if (ass) this.showFMEA(ass);
    }

    deleteAssessment(id) {
        if (confirm('Delete this assessment?')) {
            this.assessments = this.assessments.filter(a => a.id != id);
            this.saveData();
            this.logAudit('Delete Assessment', { id });
            this.renderAssessments();
        }
    }

    showFMEA(ass) {
        document.getElementById('dashboardSection').style.display = 'none';
        document.getElementById('assessmentsList').style.display = 'none';
        document.getElementById('fmeaSection').style.display = 'block';
        document.getElementById('currentTitle').textContent = ass.title;
        this.currentAssessmentId = ass.id;
        this.renderFMEATable(ass.fmeaRows);
    }

    showAssessmentsList() {
        document.getElementById('fmeaSection').style.display = 'none';
        document.getElementById('auditTrailSection').style.display = 'none';
        document.getElementById('regReferencesSection').style.display = 'none';
        document.getElementById('wizardSection').style.display = 'none';
        document.getElementById('assessmentForm').style.display = 'none';
        document.getElementById('assessmentsList').style.display = 'block';
        this.renderAssessments();
    }

    addFMEARow() {
        const rows = this.getCurrentRows();
        const newRow = {
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
        };
        rows.push(newRow);
        this.updateCurrentRows(rows);
        this.logAudit('Add FMEA Row', { assessmentId: this.currentAssessmentId });
        this.renderFMEATable(rows);
    }

    removeFMEARow(rowId) {
        if (confirm('Remove this row?')) {
            let rows = this.getCurrentRows();
            rows = rows.filter(r => r.id != rowId);
            this.updateCurrentRows(rows);
            this.logAudit('Remove FMEA Row', { assessmentId: this.currentAssessmentId, rowId });
            this.renderFMEATable(rows);
        }
    }

    sortByRPN() {
        let rows = this.getCurrentRows();
        rows.sort((a, b) => b.rpn - a.rpn);
        this.renderFMEATable(rows);
    }

    updateRowField(rowId, field, value) {
        let rows = this.getCurrentRows();
        const row = rows.find(r => r.id == rowId);
        if (row) {
            row[field] = isNaN(value) ? value : parseInt(value);
            row.rpn = row.severity * row.occurrence * row.detection;
            row.revisedRpn = row.revisedSeverity * row.revisedOccurrence * row.revisedDetection;
            this.updateCurrentRows(rows);
            this.logAudit('Update FMEA Field', { assessmentId: this.currentAssessmentId, rowId, field, value });
            this.renderFMEATable(rows); // Re-render to update classes
        }
    }

    getCurrentRows() {
        const ass = this.assessments.find(a => a.id === this.currentAssessmentId);
        return ass ? ass.fmeaRows : [];
    }

    updateCurrentRows(rows) {
        const ass = this.assessments.find(a => a.id === this.currentAssessmentId);
        if (ass) {
            ass.fmeaRows = rows;
            this.saveData();
        }
    }

    renderFMEATable(rows) {
        const tbody = document.getElementById('fmeaTbody');
        tbody.innerHTML = '';
        rows.forEach(row => {
            const tr = document.createElement('tr');
            tr.dataset.rowId = row.id;
            const rpnClass = row.rpn < 100 ? 'rpn-low' : row.rpn < 500 ? 'rpn-medium' : 'rpn-high';
            const revisedRpnClass = row.revisedRpn < 100 ? 'rpn-low' : row.revisedRpn < 500 ? 'rpn-medium' : 'rpn-high';
            tr.innerHTML = `
                <td><input class="fmea-input" data-field="processStep" value="${row.processStep || ''}"></td>
                <td><input class="fmea-input" data-field="failureMode" value="${row.failureMode || ''}"></td>
                <td><input class="fmea-input" data-field="effect" value="${row.effect || ''}"></td>
                <td><input type="number" class="fmea-input" data-field="severity" min="1" max="10" value="${row.severity || 1}"></td>
                <td><input type="number" class="fmea-input" data-field="occurrence" min="1" max="10" value="${row.occurrence || 1}"></td>
                <td><input type="number" class="fmea-input" data-field="detection" min="1" max="10" value="${row.detection || 1}"></td>
                <td class="rpn ${rpnClass}">${row.rpn || 1}</td>
                <td><input class="fmea-input" data-field="currentControls" value="${row.currentControls || ''}"></td>
                <td><input class="fmea-input" data-field="recommendedActions" value="${row.recommendedActions || ''}"></td>
                <td><input class="fmea-input" data-field="responsibility" value="${row.responsibility || ''}"></td>
                <td><input type="date" class="fmea-input" data-field="targetCompletion" value="${row.targetCompletion || ''}"></td>
                <td><input type="number" class="fmea-input" data-field="revisedSeverity" min="1" max="10" value="${row.revisedSeverity || 1}"></td>
                <td><input type="number" class="fmea-input" data-field="revisedOccurrence" min="1" max="10" value="${row.revisedOccurrence || 1}"></td>
                <td><input type="number" class="fmea-input" data-field="revisedDetection" min="1" max="10" value="${row.revisedDetection || 1}"></td>
                <td class="rpn ${revisedRpnClass}">${row.revisedRpn || 1}</td>
                <td><button id="removeRowBtn" data-row-id="${row.id}"><i class="fas fa-trash"></i> Remove</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    calculateRPN(tr) {
        const s = parseInt(tr.querySelector('[data-field="severity"]').value) || 1;
        const o = parseInt(tr.querySelector('[data-field="occurrence"]').value) || 1;
        const d = parseInt(tr.querySelector('[data-field="detection"]').value) || 1;
        const rpnCell = tr.querySelectorAll('.rpn')[0];
        rpnCell.textContent = s * o * d;
        rpnCell.className = 'rpn ' + (rpnCell.textContent < 100 ? 'rpn-low' : rpnCell.textContent < 500 ? 'rpn-medium' : 'rpn-high');

        const rs = parseInt(tr.querySelector('[data-field="revisedSeverity"]').value) || 1;
        const ro = parseInt(tr.querySelector('[data-field="revisedOccurrence"]').value) || 1;
        const rd = parseInt(tr.querySelector('[data-field="revisedDetection"]').value) || 1;
        const revisedRpnCell = tr.querySelectorAll('.rpn')[1];
        revisedRpnCell.textContent = rs * ro * rd;
        revisedRpnCell.className = 'rpn ' + (revisedRpnCell.textContent < 100 ? 'rpn-low' : revisedRpnCell.textContent < 500 ? 'rpn-medium' : 'rpn-high');
    }

    exportCurrentFMEA() {
        const ass = this.assessments.find(a => a.id === this.currentAssessmentId);
        const dataStr = JSON.stringify(ass, null, 2);
        this.downloadFile(`${ass.title}_FMEA.json`, dataStr);
        this.logAudit('Export FMEA', { id: ass.id, title: ass.title });
    }

    exportAll() {
        const dataStr = JSON.stringify(this.assessments, null, 2);
        this.downloadFile('All_Assessments.json', dataStr);
        this.logAudit('Export All Assessments', {});
    }

    downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    saveData() {
        localStorage.setItem('pharmaRiskAssessments', JSON.stringify(this.assessments));
    }
}

const app = new PharmaRiskApp();
