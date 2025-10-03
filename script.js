// script.js - Enhanced Interactivity
class PharmaRiskApp {
    constructor() {
        // Existing
    }

    initEventListeners() {
        // Existing
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('tr')) e.target.closest('tr').style.background = '#e9ecef';
        });
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('tr')) e.target.closest('tr').style.background = '';
        });
    }

    showSection(id) {
        document.querySelectorAll('section').forEach(sec => {
            sec.style.display = 'none';
            sec.classList.remove('visible');
        });
        const target = document.getElementById(id);
        target.style.display = 'block';
        setTimeout(() => target.classList.add('visible'), 10); // For animation
    }

    showDashboard() {
        this.showSection('dashboardSection');
        this.renderDashboard();
    }

    showAssessmentsList() {
        this.showSection('assessmentsList');
        this.renderAssessments();
    }

    showFMEA(ass) {
        this.showSection('fmeaSection');
        // Existing
    }

    // Update other show functions to use showSection for smooth transitions

    // Rest same
}

const app = new PharmaRiskApp();
