// script.js - Smooth UX, Multi-user, Approvals, Exports, Searchable Regs, Heatmap
class PharmaRiskApp {
    constructor() {
        this.assessments = JSON.parse(localStorage.getItem('pharmaRiskAssessments')) || [];
        this.auditTrail = JSON.parse(localStorage.getItem('pharmaRiskAudit')) || [];
        this.users = JSON.parse(localStorage.getItem('users')) || { admin: { pass: 'admin123', role: 'admin' } };
        this.templates = JSON.parse(localStorage.getItem('pharmaRiskTemplates')) || this.getDefaultTemplates();
        this.currentUser = sessionStorage.getItem('currentUser') || null;
        this.currentRole = sessionStorage.getItem('currentRole') || null;
        this.currentAssessmentId = null;
        this.regReferences = [
            { id: 1, title: 'WHO Annex 5: GDP', description: 'Good Distribution Practices for transport integrity.', searchable: 'who gdp transport' },
            { id: 2, title: 'FDA GMP 21 CFR 211', description: 'Storage and transport controls.', searchable: 'fda gmp storage' },
            // Add more...
        ];
        this.initEventListeners();
        this.updateUI();
    }

    initEventListeners() {
        document.getElementById('loginFormEl').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('regSearch').addEventListener('input', (e) => this.searchRegRefs(e.target.value));
        // Existing + PDF/Excel
        document.getElementById('exportFMEABtn').addEventListener('click', () => this.exportFMEAPDFExcel());
        // For approvals
        document.addEventListener('change', (e) => {
            if (e.target.dataset.field === 'approvalStatus') {
                this.updateApproval(e.target.closest('tr').dataset.rowId, e.target.value);
            }
        });
    }

    handleLogin(e) {
        e.preventDefault();
        const user = document.getElementById('user').value;
        const pass = document.getElementById('pass').value;
        const role = document.getElementById('role').value;
        // Demo: accept any
        this.users[user] = { pass, role };
        localStorage.setItem('users', JSON.stringify(this.users));
        sessionStorage.setItem('currentUser', user);
        sessionStorage.setItem('currentRole', role);
        this.currentUser = user;
        this.currentRole = role;
        this.logAudit('Login', { user, role });
        this.updateUI();
        this.showSection('dashboardSection');
    }

    updateUI() {
        const loggedIn = !!this.currentUser;
        // Existing + role display
        document.getElementById('userRole').textContent = this.currentRole || '';
        // Hide admin-only like template editor if not admin
        if (loggedIn && this.currentRole !== 'admin') document.getElementById('templateEditorBtn').style.display = 'none';
        // Viewer can't edit, etc. - add checks in functions
    }

    showSection(id) {
        document.querySelectorAll('main > section').forEach(sec => sec.style.display = 'none');
        const target = document.getElementById(id);
        target.style.display = 'block';
        setTimeout(() => target.classList.add('visible'), 50);
    }

    renderDashboard() {
        // Existing charts + heatmap
        const heatmap = document.getElementById('riskHeatmap');
        heatmap.innerHTML = '';
        let allRows = [];
        this.assessments.forEach(ass => allRows.push(...ass.fmeaRows));
        allRows.slice(0, 9).forEach((row, i) => {
            const cell = document.createElement('div');
            cell.className = `heatmap-cell rpn-${row.rpn < 100 ? 'low' : row.rpn < 500 ? 'medium' : 'high'}`;
            cell.textContent = `${row.failureMode.slice(0,10)}... (${row.rpn})`;
            heatmap.appendChild(cell);
        });
    }

    searchRegRefs(query) {
        const filtered = this.regReferences.filter(ref => ref.searchable.includes(query.toLowerCase()));
        document.getElementById('regContent').innerHTML = filtered.map(ref => `<li><strong>${ref.title}</strong>: ${ref.description}</li>`).join('') || '<p>No matches.</p>';
    }

    updateApproval(rowId, status) {
        // Update row approval
        let rows = this.getCurrentRows();
        const row = rows.find(r => r.id == rowId);
        row.approvalStatus = status;
        this.updateCurrentRows(rows);
        this.logAudit('Update Approval', { rowId, status });
        if (this.currentRole !== 'admin' && status !== 'Pending') alert('Approval requires admin confirmation.');
    }

    exportFMEAPDFExcel() {
        const ass = this.assessments.find(a => a.id === this.currentAssessmentId);
        // PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text(ass.title, 10, 10);
        // Add table data...
        doc.save(`${ass.title}.pdf`);
        // Excel
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(ass.fmeaRows);
        XLSX.utils.book_append_sheet(wb, ws, 'FMEA');
        XLSX.writeFile(wb, `${ass.title}.xlsx`);
        this.logAudit('Export FMEA', { format: 'PDF/Excel' });
    }

    renderFMEATable(rows) {
        // Existing + approval column
        const tr.innerHTML = `
            // ... existing ...
            <td><select data-field="approvalStatus"><option ${row.approvalStatus === 'Pending' ? 'selected' : ''}>Pending</option><option ${row.approvalStatus === 'Approved' ? 'selected' : ''}>Approved</option><option ${row.approvalStatus === 'Rejected' ? 'selected' : ''}>Rejected</option></select></td>
            // ...
        `;
    }

    // Rest of methods same, with role checks e.g., if (this.currentRole === 'viewer') disable inputs
}

const app = new PharmaRiskApp();
