// script.js
class PharmaRiskApp {
    constructor() {
        this.assessments = JSON.parse(localStorage.getItem('pharmaRiskAssessments')) || [];
        this.currentAssessmentId = null;
        this.initEventListeners();
        this.renderAssessments();
    }

    initEventListeners() {
        document.getElementById('newAssessmentBtn').addEventListener('click', () => this.showNewAssessmentForm());
        document.getElementById('assessmentFormEl').addEventListener('submit', (e) => this.saveAssessment(e));
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideForm());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportAll());
        document.getElementById('backToListBtn').addEventListener('click', () => this.showAssessmentsList());
        // Delegate for dynamic elements
        document.addEventListener('click', (e) => {
            if (e.target.id === 'editBtn') this.editAssessment(e.target.dataset.id);
            if (e.target.id === 'deleteBtn') this.deleteAssessment(e.target.dataset.id);
            if (e.target.id === 'addRowBtn') this.addFMEARow();
            if (e.target.id === 'exportFMEABtn') this.exportCurrentFMEA();
            if (e.target.id === 'removeRowBtn') this.removeFMEARow(e.target.dataset.rowId);
            if (e.target.id === 'updateRowBtn') this.updateFMEARow(e.target.dataset.rowId);
        });
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('fmea-input')) {
                this.calculateRPN(e.target.closest('tr'));
            }
        });
    }

    renderAssessments() {
        const ul = document.getElementById('assessmentsUl');
        ul.innerHTML = '';
        this.assessments.forEach(ass => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${ass.title} - ${ass.description || 'No description'}</span>
                <div>
                    <button id="editBtn" data-id="${ass.id}">Edit</button>
                    <button id="deleteBtn" data-id="${ass.id}">Delete</button>
                </div>
            `;
            ul.appendChild(li);
        });
    }

    showNewAssessmentForm() {
        document.getElementById('assessmentsList').style.display = 'none';
        document.getElementById('assessmentForm').style.display = 'block';
        document.getElementById('formTitle').textContent = 'New Risk Assessment';
        document.getElementById('title').value = '';
        document.getElementById('description').value = '';
        this.currentAssessmentId = null;
    }

    hideForm() {
        document.getElementById('assessmentForm').style.display = 'none';
        document.getElementById('assessmentsList').style.display = 'block';
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
        this.renderAssessments();
        this.hideForm();
    }

    editAssessment(id) {
        const ass = this.assessments.find(a => a.id == id);
        if (!ass) return;
        document.getElementById('assessmentsList').style.display = 'none';
        document.getElementById('assessmentForm').style.display = 'block';
        document.getElementById('formTitle').textContent = 'Edit Risk Assessment';
        document.getElementById('title').value = ass.title;
        document.getElementById('description').value = ass.description;
        this.currentAssessmentId = id;
        // After save, we'll show FMEA if new, but for edit, save then show FMEA
    }

    deleteAssessment(id) {
        if (confirm('Delete this assessment?')) {
            this.assessments = this.assessments.filter(a => a.id != id);
            localStorage.setItem('pharmaRiskAssessments', JSON.stringify(this.assessments));
            this.renderAssessments();
        }
    }

    showAssessmentsList() {
        document.getElementById('assessmentsList').style.display = 'block';
        document.getElementById('assessmentForm').style.display = 'none';
        document.getElementById('fmeaSection').style.display = 'none';
        this.renderAssessments();
    }

    showFMEA(ass) {
        document.getElementById('assessmentForm').style.display = 'none';
        document.getElementById('fmeaSection').style.display = 'block';
        document.getElementById('currentTitle').textContent = ass.title;
        this.currentAssessmentId = ass.id;
        this.renderFMEATable(ass.fmeaRows);
    }

    // Auto-show FMEA after new save
    // In saveAssessment, after save:
    // if (!this.currentAssessmentId) { this.showFMEA(ass); } else { this.showFMEA(ass); }
    // Adjust saveAssessment accordingly
    saveAssessment(e) {
        // ... existing code ...
        localStorage.setItem('pharmaRiskAssessments', JSON.stringify(this.assessments));
        this.renderAssessments();
        this.hideForm();
        if (this.currentAssessmentId === null) { // New one
            this.currentAssessmentId = ass.id;
            this.showFMEA(ass);
        } else {
            this.showFMEA(ass);
        }
    }

    // In editAssessment, after setting form, but actually, to directly edit FMEA, perhaps add a "View FMEA" button
    // For simplicity, after edit save, show FMEA

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
            revisedRpn: 1,
            actions: ''
        };
        rows.push(newRow);
        this.updateCurrentRows(rows);
        this.renderFMEATable(rows);
    }

    removeFMEARow(rowId) {
        if (confirm('Remove this row?')) {
            let rows = this.getCurrentRows();
            rows = rows.filter(r => r.id != rowId);
            this.updateCurrentRows(rows);
            this.renderFMEATable(rows);
        }
    }

    updateFMEARow(rowId) {
        // Actually, since inputs are live, we can save on blur or something, but for simplicity, use inputs directly
        // No separate update button; changes are captured on export or via input events for RPN
    }

    getCurrentRows() {
        const ass = this.assessments.find(a => a.id === this.currentAssessmentId);
        return ass ? ass.fmeaRows : [];
    }

    updateCurrentRows(rows) {
        const ass = this.assessments.find(a => a.id === this.currentAssessmentId);
        if (ass) {
            ass.fmeaRows = rows;
            localStorage.setItem('pharmaRiskAssessments', JSON.stringify(this.assessments));
        }
    }

    renderFMEATable(rows) {
        const tbody = document.getElementById('fmeaTbody');
        tbody.innerHTML = '';
        rows.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="text" class="fmea-input" value="${row.processStep}" onchange="app.updateRowField('${row.id}', 'processStep', this.value)"></td>
                <td><input type="text" class="fmea-input" value="${row.failureMode}" onchange="app.updateRowField('${row.id}', 'failureMode', this.value)"></td>
                <td><input type="text" class="fmea-input" value="${row.effect}" onchange="app.updateRowField('${row.id}', 'effect', this.value)"></td>
                <td><input type="number" class="fmea-input" min="1" max="10" value="${row.severity}" onchange="app.updateRowField('${row.id}', 'severity', this.value)"></td>
                <td><input type="number" class="fmea-input" min="1" max="10" value="${row.occurrence}" onchange="app.updateRowField('${row.id}', 'occurrence', this.value)"></td>
                <td><input type="number" class="fmea-input" min="1" max="10" value="${row.detection}" onchange="app.updateRowField('${row.id}', 'detection', this.value)"></td>
                <td class="rpn">${row.rpn}</td>
                <td><input type="text" class="fmea-input" value="${row.currentControls}" onchange="app.updateRowField('${row.id}', 'currentControls', this.value)"></td>
                <td><input type="text" class="fmea-input" value="${row.recommendedActions}" onchange="app.updateRowField('${row.id}', 'recommendedActions', this.value)"></td>
                <td><input type="text" class="fmea-input" value="${row.responsibility}" onchange="app.updateRowField('${row.id}', 'responsibility', this.value)"></td>
                <td><input type="date" class="fmea-input" value="${row.targetCompletion}" onchange="app.updateRowField('${row.id}', 'targetCompletion', this.value)"></td>
                <td><input type="number" class="fmea-input" min="1" max="10" value="${row.revisedSeverity}" onchange="app.updateRowField('${row.id}', 'revisedSeverity', this.value)"> / <input type="number" min="1" max="10" value="${row.revisedOccurrence}" onchange="app.updateRowField('${row.id}', 'revisedOccurrence', this.value)"> / <input type="number" min="1" max="10" value="${row.revisedDetection}" onchange="app.updateRowField('${row.id}', 'revisedDetection', this.value)"></td>
                <td class="rpn">${row.revisedRpn}</td>
                <td><input type="text" class="fmea-input" value="${row.actions}" onchange="app.updateRowField('${row.id}', 'actions', this.value)"></td>
                <td><button id="removeRowBtn" data-row-id="${row.id}">Remove</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    updateRowField(rowId, field, value) {
        let rows = this.getCurrentRows();
        const row = rows.find(r => r.id == rowId);
        if (row) {
            row[field] = value;
            if (['severity', 'occurrence', 'detection'].includes(field)) {
                row.rpn = row.severity * row.occurrence * row.detection;
            }
            if (['revisedSeverity', 'revisedOccurrence', 'revisedDetection'].includes(field)) {
                row.revisedRpn = row.revisedSeverity * row.revisedOccurrence * row.revisedDetection;
            }
            this.updateCurrentRows(rows);
            this.renderFMEATable(rows); // Re-render to update RPN display
        }
    }

    calculateRPN(tr) {
        // Called on input change
        const inputs = tr.querySelectorAll('input[type="number"]');
        const s = parseInt(inputs[0].value) || 1;
        const o = parseInt(inputs[1].value) || 1;
        const d = parseInt(inputs[2].value) || 1;
        const rpnCell = tr.cells[6];
        rpnCell.textContent = s * o * d;
        // Similar for revised
        const revisedInputs = tr.cells[11].querySelectorAll('input[type="number"]');
        const rs = parseInt(revisedInputs[0].value) || 1;
        const ro = parseInt(revisedInputs[1].value) || 1;
        const rd = parseInt(revisedInputs[2].value) || 1;
        tr.cells[12].textContent = rs * ro * rd;
    }

    exportCurrentFMEA() {
        const ass = this.assessments.find(a => a.id === this.currentAssessmentId);
        const dataStr = JSON.stringify(ass, null, 2);
        this.downloadFile(`${ass.title}_FMEA.json`, dataStr);
    }

    exportAll() {
        const dataStr = JSON.stringify(this.assessments, null, 2);
        this.downloadFile('All_Assessments.json', dataStr);
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
}

// Global app for onchange handlers
const app = new PharmaRiskApp();

// Adjust editAssessment to show FMEA directly for better UX
// Override editAssessment
PharmaRiskApp.prototype.editAssessment = function(id) {
    const ass = this.assessments.find(a => a.id == id);
    if (!ass) return;
    this.showFMEA(ass);
    // Optionally, add edit title/desc via a separate form in FMEA section, but keep simple
};
