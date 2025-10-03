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
                document.getElementById('regSearch').addEventListener('input', (e) => this.searchRegRefs(e.target.value));
                document.querySelectorAll('.nextStep').forEach(btn => btn.addEventListener('click', () => this.nextWizardStep()));
                document.querySelectorAll('.prevStep').forEach(btn => btn.addEventListener('click', () => this.prevWizardStep()));
            } catch (error) {
                console.error('Error initializing event listeners:', error);
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
                document.getElementById('newAssessmentBtn').style.display = loggedIn && this.currentRole !== 'viewer' ? 'inline' : 'none';
                document.getElementById('templateWizardBtn').style.display = loggedIn && this.currentRole !== 'viewer' ? 'inline' : 'none';
                document.getElementById('templateEditorBtn').style.display = loggedIn && this.currentRole === 'admin' ? 'inline' : 'none';
                document.getElementById('exportBtn').style.display = loggedIn ? 'inline' : 'none';
                document.getElementById('auditTrailBtn').style.display = loggedIn ? 'inline' : 'none';
                document.getElementById('loginForm').style.display = loggedIn ? 'none' : 'block';
                if (loggedIn) {
                    document.getElementById('dashboardSection').style.display = 'block';
                    document.getElementById('assessmentsList').style.display = 'block';
                    this.renderDashboard();
                    this.renderAssessments();
                }
            } catch (error) {
                console.error('Error updating UI:', error);
            }
        }

        handleLogin(e) {
            try {
                e.preventDefault();
                const user = document.getElementById('user').value;
                const pass = document.getElementById('pass').value;
                const role = document.getElementById('role').value;
                if ((this.users[user] && this.users[user].pass === pass && this.users[user].role === role) || true) { // Demo mode
                    this.users[user] = { pass, role };
                    localStorage.setItem('users', JSON.stringify(this.users));
                    sessionStorage.setItem('currentUser', user);
                    sessionStorage.setItem('currentRole', role);
                    this.currentUser = user;
                    this.currentRole = role;
                    this.logAudit('Login', { user, role });
                    this.updateUI();
                } else {
                    alert('Invalid credentials. Try demo: admin/admin123 (admin)');
                }
                document.getElementById('loginFormEl').reset();
            } catch (error) {
                console.error('Error in handleLogin:', error);
            }
        }

        showSection(id) {
            try {
                document.querySelectorAll('section').forEach(sec => {
                    sec.style.display = 'none';
                    sec.classList.remove('visible');
                });
                const target = document.getElementById(id);
                if (target) {
                    target.style.display = 'block';
                    setTimeout(() => target.classList.add('visible'), 10);
                }
            } catch (error) {
                console.error('Error showing section:', error);
            }
        }

        showDashboard() {
            this.showSection('dashboardSection');
            this.renderDashboard();
            this.renderAssessments();
        }

        renderDashboard() {
            try {
                const totalAssessments = this.assessments.length;
                const totalRisks = this.assessments.reduce((sum, a) => sum + a.fmeaRows.length, 0);
                const avgRPN = totalRisks ? this.assessments.reduce((sum, a) => sum + a.fmeaRows.reduce((rSum, r) => rSum + r.rpn, 0), 0) / totalRisks : 0;
                const highRPNCount = this.assessments.reduce((sum, a) => sum + a.fmeaRows.filter(r => r.rpn > 500).length, 0);

                document.getElementById('totalAssessments').textContent = totalAssessments;
                document.getElementById('totalRisks').textContent = totalRisks;
                document.getElementById('avgRPN').textContent = avgRPN.toFixed(2);
                document.getElementById('highRPNCount').textContent = highRPNCount;

                // Simple pie chart for RPN breakdown (low/medium/high)
                const rpnPieChart = new Chart(document.getElementById('rpnPieChart'), {
                    type: 'pie',
                    data: {
                        labels: ['Low (<100)', 'Medium (100-500)', 'High (>500)'],
                        datasets: [{
                            data: [
                                this.assessments.reduce((sum, a) => sum + a.fmeaRows.filter(r => r.rpn < 100).length, 0),
                                this.assessments.reduce((sum, a) => sum + a.fmeaRows.filter(r => r.rpn >= 100 && r.rpn <= 500).length, 0),
                                this.assessments.reduce((sum, a) => sum + a.fmeaRows.filter(r => r.rpn > 500).length, 0)
                            ],
                            backgroundColor: ['#28a745', '#ffc107', '#dc3545']
                        }]
                    }
                });

                // Simple bar chart for top risks
                const topRisks = this.assessments.reduce((all, a) => [...all, ...a.fmeaRows], []).sort((a, b) => b.rpn - a.rpn).slice(0, 5);
                const topRisksBarChart = new Chart(document.getElementById('topRisksBarChart'), {
                    type: 'bar',
                    data: {
                        labels: topRisks.map(r => r.failureMode.slice(0, 10)),
                        datasets: [{
                            label: 'RPN',
                            data: topRisks.map(r => r.rpn),
                            backgroundColor: '#007bff'
                        }]
                    }
                });

                // Heatmap (simple grid)
                const heatmap = document.getElementById('riskHeatmap');
                heatmap.innerHTML = '';
                topRisks.slice(0, 9).forEach((row, i) => {
                    const cell = document.createElement('div');
                    cell.className = `heatmap-cell rpn-${row.rpn < 100 ? 'low' : row.rpn < 500 ? 'medium' : 'high'}`;
                    cell.textContent = `${row.failureMode.slice(0, 10)} (${row.rpn})`;
                    heatmap.appendChild(cell);
                });
            } catch (error) {
                console.error('Error rendering dashboard:', error);
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
                            <button id="editBtn" data-id="${ass.id}"><i class="fas fa-edit"></i> Edit</button>
                            <button id="deleteBtn" data-id="${ass.id}"><i class="fas fa-trash"></i> Delete</button>
                        </div>
                    `;
                    ul.appendChild(li);
                });
            } catch (error) {
                console.error('Error rendering assessments:', error);
            }
        }

        showNewAssessmentForm() {
            this.showSection('assessmentForm');
            document.getElementById('title').value = '';
            document.getElementById('description').value = '';
            this.currentAssessmentId = null;
        }

        hideForm() {
            this.showSection('assessmentsList');
            this.renderAssessments();
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
            if (index > -1) this.assessments[index] = ass;
            else this.assessments.push(ass);
            localStorage.setItem('pharmaRiskAssessments', JSON.stringify(this.assessments));
            this.logAudit('Save Assessment', { id: ass.id });
            this.hideForm();
        }

        editAssessment(id) {
            const ass = this.assessments.find(a => a.id == id);
            if (ass) {
                this.currentAssessmentId = id;
                document.getElementById('currentTitle').textContent = ass.title;
                this.showSection('fmeaSection');
                this.renderFMEATable(ass.fmeaRows);
            }
        }

        deleteAssessment(id) {
            if (confirm('Delete this assessment?')) {
                this.assessments = this.assessments.filter(a => a.id != id);
                localStorage.setItem('pharmaRiskAssessments', JSON.stringify(this.assessments));
                this.logAudit('Delete Assessment', { id });
                this.renderAssessments();
            }
        }

        addFMEARow() {
            const ass = this.assessments.find(a => a.id === this.currentAssessmentId);
            ass.fmeaRows.push({
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
            localStorage.setItem('pharmaRiskAssessments', JSON.stringify(this.assessments));
            this.logAudit('Add FMEA Row', { assessmentId: this.currentAssessmentId });
            this.renderFMEATable(ass.fmeaRows);
        }

        removeFMEARow(rowId) {
            if (confirm('Remove this row?')) {
                const ass = this.assessments.find(a => a.id === this.currentAssessmentId);
                ass.fmeaRows = ass.fmeaRows.filter(r => r.id != rowId);
                localStorage.setItem('pharmaRiskAssessments', JSON.stringify(this.assessments));
                this.logAudit('Remove FMEA Row', { assessmentId: this.currentAssessmentId, rowId });
                this.renderFMEATable(ass.fmeaRows);
            }
        }

        updateRowField(rowId, field, value) {
            const ass = this.assessments.find(a => a.id === this.currentAssessmentId);
            const row = ass.fmeaRows.find(r => r.id == rowId);
            row[field] = value;
            row.rpn = (row.severity || 1) * (row.occurrence || 1) * (row.detection || 1);
            row.revisedRpn = (row.revisedSeverity || 1) * (row.revisedOccurrence || 1) * (row.revisedDetection || 1);
            localStorage.setItem('pharmaRiskAssessments', JSON.stringify(this.assessments));
            this.logAudit('Update FMEA Field', { assessmentId: this.currentAssessmentId, rowId, field, value });
            this.renderFMEATable(ass.fmeaRows);
        }

        renderFMEATable(rows) {
            try {
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
                        <td><button id="removeRowBtn" data-row-id="${row.id}"><i class="fas fa-trash"></i> Remove</button></td>
                    `;
                    tbody.appendChild(tr);
                });
            } catch (error) {
                console.error('Error rendering FMEA table:', error);
            }
        }

        sortFMEATable() {
            const ass = this.assessments.find(a => a.id === this.currentAssessmentId);
            ass.fmeaRows.sort((a, b) => b.rpn - a.rpn);
            localStorage.setItem('pharmaRiskAssessments', JSON.stringify(this.assessments));
            this.logAudit('Sort FMEA by RPN', { assessmentId: this.currentAssessmentId });
            this.renderFMEATable(ass.fmeaRows);
        }

        exportFMEA() {
            try {
                const ass = this.assessments.find(a => a.id === this.currentAssessmentId);
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                doc.text(ass.title, 10, 10);
                doc.autoTable({
                    head: [['Process Step', 'Failure Mode', 'Effect', 'Severity', 'Occurrence', 'Detection', 'RPN']],
                    body: ass.fmeaRows.map(r => [r.processStep, r.failureMode, r.effect, r.severity, r.occurrence, r.detection, r.rpn])
                });
                doc.save(`${ass.title}.pdf`);

                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(ass.fmeaRows);
                XLSX.utils.book_append_sheet(wb, ws, 'FMEA');
                XLSX.writeFile(wb, `${ass.title}.xlsx`);
                this.logAudit('Export FMEA', { assessmentId: this.currentAssessmentId, format: 'PDF/Excel' });
            } catch (error) {
                console.error('Error exporting FMEA:', error);
            }
        }

        showWizard() {
            this.showSection('wizardSection');
            document.getElementById('step1').style.display = 'block';
            document.getElementById('step2').style.display = 'none';
            document.getElementById('step3').style.display = 'none';
        }

        hideWizard() {
            this.showSection('assessmentsList');
            this.renderAssessments();
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
                fmeaRows: [{
                    id: Date.now() + 1,
                    processStep: 'Sample Step',
                    failureMode: 'Sample Failure',
                    effect: 'Sample Effect',
                    severity: 5,
                    occurrence: 3,
                    detection: 4,
                    rpn: 60,
                    currentControls: 'Sample Control',
                    recommendedActions: 'Sample Action',
                    responsibility: 'Sample Team',
                    targetCompletion: '',
                    revisedSeverity: 4,
                    revisedOccurrence: 2,
                    revisedDetection: 3,
                    revisedRpn: 24
                }]
            };
            this.assessments.push(ass);
            localStorage.setItem('pharmaRiskAssessments', JSON.stringify(this.assessments));
            this.logAudit('Generate Template', { title });
            this.hideWizard();
            this.editAssessment(ass.id);
        }

        showAuditTrail() {
            this.showSection('auditTrailSection');
            const ul = document.getElementById('auditUl');
            ul.innerHTML = '';
            this.auditTrail.forEach(log => {
                const li = document.createElement('li');
                li.textContent = `[${new Date(log.timestamp).toLocaleString('en-GB', { timeZone: 'Europe/London' })}] ${log.user} (${log.action}): ${JSON.stringify(log.details)}`;
                ul.appendChild(li);
            });
        }

        showRegReferences() {
            this.showSection('regReferencesSection');
            this.searchRegRefs(document.getElementById('regSearch').value || '');
        }

        searchRegRefs(query) {
            const refs = [
                { title: 'WHO Annex 5: GDP', desc: 'Good Distribution Practices for transport integrity.', searchable: 'who gdp transport' },
                { title: 'FDA GMP 21 CFR 211', desc: 'Storage and transport controls.', searchable: 'fda gmp storage' }
            ];
            const filtered = query ? refs.filter(r => r.searchable.includes(query.toLowerCase())) : refs;
            document.getElementById('regContent').innerHTML = filtered.map(r => `<li><strong>${r.title}</strong>: ${r.desc}</li>`).join('') || '<p>No matches.</p>';
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
            this.logAudit('Export All', {});
        }

        logAudit(action, details) {
            const log = {
                timestamp: new Date().toISOString(),
                user: this.currentUser || 'Guest',
                action,
                details
            };
            this.auditTrail.push(log);
            localStorage.setItem('pharmaRiskAudit', JSON.stringify(this.auditTrail));
        }

        resetDemo() {
            if (confirm('Reset all demo data?')) {
                localStorage.clear();
                sessionStorage.clear();
                location.reload();
            }
        }

        logout() {
            sessionStorage.clear();
            this.currentUser = null;
            this.currentRole = null;
            this.updateUI();
            this.showSection('loginForm');
        }
    }

    new PharmaRiskApp();
});
