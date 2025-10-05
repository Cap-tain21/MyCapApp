// Web App Maker - Main JavaScript File
class WebAppMaker {
    constructor() {
        this.currentProject = null;
        this.savedProjects = JSON.parse(localStorage.getItem('webAppMakerProjects')) || [];
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        
        this.initializeApp();
        this.setupEventListeners();
        this.loadDefaultTemplate();
        this.renderProjects();
    }

    // Initialize the application
    initializeApp() {
        console.log('🚀 Web App Maker Initialized');
        
        // Set dark mode if enabled
        if (this.isDarkMode) {
            this.toggleDarkMode();
        }
        
        // Show first tab
        this.showTab('editor');
    }

    // Setup all event listeners
    setupEventListeners() {
        // Navigation tabs
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.getAttribute('data-tab');
                this.showTab(tab);
            });
        });

        // Editor tabs
        document.querySelectorAll('.editor-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const editor = e.target.getAttribute('data-editor');
                this.showEditor(editor);
            });
        });

        // Action buttons
        document.getElementById('runBtn').addEventListener('click', () => this.runPreview());
        document.getElementById('saveBtn').addEventListener('click', () => this.showSaveModal());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetEditors());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportAPK());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleDarkMode());
        document.getElementById('formatCode').addEventListener('click', () => this.formatCode());
        document.getElementById('refreshPreview').addEventListener('click', () => this.runPreview());
        document.getElementById('newProject').addEventListener('click', () => this.newProject());
        
        // Device size selector
        document.getElementById('deviceSize').addEventListener('change', (e) => {
            this.adjustPreviewSize(e.target.value);
        });

        // Modal events
        this.setupModalEvents();
        
        // Real-time code updates
        this.setupRealTimeUpdates();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    // Show/hide tabs
    showTab(tabName) {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');

        if (tabName === 'preview') setTimeout(() => this.runPreview(), 100);
    }

    // Switch between code editors
    showEditor(editorName) {
        document.querySelectorAll('.editor-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`[data-editor="${editorName}"]`).classList.add('active');

        document.querySelectorAll('.code-editor').forEach(editor => editor.classList.remove('active'));
        document.getElementById(`${editorName}-editor`).classList.add('active');
    }
runPreview() {
    const html = document.getElementById('htmlCode').value;
    const css = document.getElementById('cssCode').value;
    const js = document.getElementById('jsCode').value;

    const previewFrame = document.getElementById('preview');
    const previewDocument = previewFrame.contentDocument || previewFrame.contentWindow.document;

    const previewHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${css}</style>
        </head>
        <body>
            ${html}
            <script>
                window.addEventListener('DOMContentLoaded', function() {
                    ${js}
                });
            <\/script>
        </body>
        </html>
    `;

    previewDocument.open();
    previewDocument.write(previewHTML);
    previewDocument.close();

    this.showToast('Preview updated successfully!', 'success');
}
    // Adjust preview frame size
    adjustPreviewSize(size) {
        const deviceFrame = document.getElementById('deviceFrame');
        const iframe = document.getElementById('preview');

        switch(size) {
            case 'mobile':
                deviceFrame.style.maxWidth = '360px';
                iframe.style.height = '600px';
                break;
            case 'tablet':
                deviceFrame.style.maxWidth = '768px';
                iframe.style.height = '1024px';
                break;
            case 'desktop':
                deviceFrame.style.maxWidth = '100%';
                iframe.style.height = '500px';
                break;
        }
    }

    // Save modal and projects
    showSaveModal() {
        const modal = document.getElementById('saveModal');
        document.getElementById('projectName').value = `Project-${Date.now()}`;
        document.getElementById('projectDescription').value = '';
        modal.style.display = 'block';
        setTimeout(() => document.getElementById('projectName').focus(), 100);
    }

    saveProject() {
        const name = document.getElementById('projectName').value.trim();
        const description = document.getElementById('projectDescription').value.trim();

        if (!name) return this.showToast('Please enter a project name', 'error');

        const project = {
            id: Date.now().toString(),
            name,
            description,
            html: document.getElementById('htmlCode').value,
            css: document.getElementById('cssCode').value,
            js: document.getElementById('jsCode').value,
            timestamp: new Date().toISOString(),
            size: this.calculateProjectSize()
        };

        const existingIndex = this.savedProjects.findIndex(p => p.name === name);
        if (existingIndex !== -1) this.savedProjects[existingIndex] = project;
        else this.savedProjects.unshift(project);

        localStorage.setItem('webAppMakerProjects', JSON.stringify(this.savedProjects));
        this.closeModal('saveModal');
        this.renderProjects();
        this.showToast(`Project "${name}" saved successfully!`, 'success');
    }

    loadProject(projectId) {
        const project = this.savedProjects.find(p => p.id === projectId);
        if (!project) return;

        document.getElementById('htmlCode').value = project.html;
        document.getElementById('cssCode').value = project.css;
        document.getElementById('jsCode').value = project.js;

        this.currentProject = project;
        this.showTab('editor');
        this.updateLineCounts();
        this.showToast(`Project "${project.name}" loaded!`, 'success');
    }

    deleteProject(projectId) {
        if (!confirm('Are you sure you want to delete this project?')) return;

        this.savedProjects = this.savedProjects.filter(p => p.id !== projectId);
        localStorage.setItem('webAppMakerProjects', JSON.stringify(this.savedProjects));
        this.renderProjects();
        this.showToast('Project deleted successfully!', 'success');
    }

    renderProjects() {
        const projectsGrid = document.getElementById('projectsGrid');
        const emptyState = document.getElementById('emptyState');

        if (this.savedProjects.length === 0) {
            projectsGrid.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        projectsGrid.innerHTML = this.savedProjects.map(project => `
            <div class="project-card">
                <div class="project-header">
                    <h3 class="project-name">${this.escapeHtml(project.name)}</h3>
                    <div class="project-actions">
                        <button class="project-btn load-btn" onclick="app.loadProject('${project.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="project-btn delete-btn" onclick="app.deleteProject('${project.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="project-preview">
                    <div class="preview-thumbnail">
                        <small>${project.description || 'No description'}</small>
                    </div>
                </div>
                <div class="project-info">
                    <span class="project-date">${new Date(project.timestamp).toLocaleDateString()}</span>
                    <span class="project-size">${project.size}</span>
                </div>
            </div>
        `).join('');
    }

    resetEditors() {
        if (!confirm('Are you sure you want to reset all editors?')) return;
        this.loadDefaultTemplate();
        this.showToast('Editors reset to default template', 'info');
    }

    newProject() {
        if (!confirm('Start a new project?')) return;
        this.currentProject = null;
        this.loadDefaultTemplate();
        this.showTab('editor');
        this.showToast('New project started!', 'success');
    }

    loadDefaultTemplate() {
        document.getElementById('htmlCode').value = `<!DOCTYPE html>
<html>
<head>
    <title>My Awesome App</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <div class="container">
        <h1>Welcome to My App! 🚀</h1>
        <p>This is your mobile app created with Web App Maker.</p>
        <button onclick="showWelcome()">Click Me!</button>
        <div id="output" style="margin-top: 20px; padding: 10px; background: #f0f0f0; border-radius: 5px;"></div>
    </div>
</body>
</html>`;

        document.getElementById('cssCode').value = `body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 20px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    min-height: 100vh;
    color: white;
}
.container { max-width: 400px; margin: 0 auto; text-align: center; }
h1 { font-size: 24px; margin-bottom: 15px; }
p { font-size: 16px; margin-bottom: 25px; opacity: 0.9; }
button { background: #00b894; color: white; border: none; padding: 12px 30px; font-size: 16px; border-radius: 25px; cursor: pointer; transition: all 0.3s ease; }
button:hover { background: #00a085; transform: translateY(-2px); }`;

        document.getElementById('jsCode').value = `function showWelcome() {
    const output = document.getElementById('output');
    const messages = ['Hello! 👋', 'Your app is working! 🎉', 'Built with Web App Maker 📱', 'Ready for the next step! 🚀'];
    let index = 0;
    output.innerHTML = '';
    const interval = setInterval(() => {
        if (index < messages.length) { output.innerHTML += '<p>' + messages[index] + '</p>'; index++; } 
        else clearInterval(interval);
    }, 800);
}
console.log('App loaded successfully!');`;

        this.updateLineCounts();
    }

    exportAPK() { this.showToast('APK export coming soon!', 'info'); }
    toggleDarkMode() { /* same as before */ }
    formatCode() { this.showToast('Code formatting coming soon!', 'info'); }

    setupModalEvents() { /* same as before */ }
    setupRealTimeUpdates() { /* same as before */ }
    setupKeyboardShortcuts() { /* same as before */ }
    updateLineCounts() { /* same as before */ }
    showLoading(show) { /* same as before */ }
    showToast(message, type = 'info') { /* same as before */ }
    closeModal(modalId) { /* same as before */ }
    calculateProjectSize() { /* same as before */ }
    downloadFile(filename, content) { /* same as before */ }
    escapeHtml(unsafe) { /* same as before */ }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WebAppMaker();
});
