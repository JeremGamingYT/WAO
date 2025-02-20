const { ipcRenderer } = require('electron');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const si = require('systeminformation');

// Window Controls with animations
document.getElementById('minimize').addEventListener('click', () => {
    ipcRenderer.send('window-minimize');
});

document.getElementById('maximize').addEventListener('click', () => {
    ipcRenderer.send('window-toggle-maximize');
});

document.getElementById('close').addEventListener('click', () => {
    ipcRenderer.send('window-close');
});

// Handle window state changes
ipcRenderer.on('window-maximized', () => {
    document.getElementById('maximize').innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="5" y="5" width="14" height="14" rx="2" ry="2"></rect>
        </svg>
    `;
});

ipcRenderer.on('window-unmaximized', () => {
    document.getElementById('maximize').innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        </svg>
    `;
});

// Sidebar Navigation with smooth transitions
const sidebarItems = document.querySelectorAll('.sidebar-item');
const pages = document.querySelectorAll('.page');

sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetPage = item.dataset.page;
        
        // Update active states with animation
        sidebarItems.forEach(i => {
            i.classList.remove('active');
            i.style.transition = 'all 0.3s ease';
        });
        
        pages.forEach(p => {
            if (p.id === `${targetPage}-page`) {
                p.style.opacity = '0';
                p.classList.add('active');
                setTimeout(() => {
                    p.style.opacity = '1';
                }, 50);
            } else {
                p.classList.remove('active');
            }
        });
        
        item.classList.add('active');
    });
});

// Windows Optimization Functions with improved feedback
async function executeCommand(command) {
    try {
        const { stdout, stderr } = await execPromise(command, { shell: true });
        console.log('Output:', stdout);
        if (stderr) console.error('Error:', stderr);
        return true;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}

// Hibernate Mode with animation
const toggleHibernate = document.getElementById('toggleHibernate');
let hibernateEnabled = false;

toggleHibernate.addEventListener('click', async (e) => {
    if (e.target.disabled) return;
    toggleHibernate.classList.add('processing');
    
    const command = hibernateEnabled
        ? 'powercfg /hibernate off'
        : 'powercfg /hibernate on';

    const success = await executeCommand(command);
    
    if (success) {
        hibernateEnabled = !hibernateEnabled;
        toggleHibernate.textContent = hibernateEnabled ? 'Disable Hibernate' : 'Enable Hibernate';
        toggleHibernate.classList.add('success');
    } else {
        toggleHibernate.classList.add('error');
    }
    
    toggleHibernate.classList.remove('processing');
    setTimeout(() => {
        toggleHibernate.classList.remove('success', 'error');
    }, 2000);
});

// Performance Mode with animation
document.getElementById('enablePerformance').addEventListener('click', async (e) => {
    if (e.target.disabled) return;
    const button = document.getElementById('enablePerformance');
    button.classList.add('processing');
    
    const commands = [
        'powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c',
        'reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" /v VisualFXSetting /t REG_DWORD /d 2 /f',
    ];

    let success = true;
    for (const command of commands) {
        if (!await executeCommand(command)) {
            success = false;
            break;
        }
    }

    if (success) {
        button.classList.add('success');
    } else {
        button.classList.add('error');
    }
    
    button.classList.remove('processing');
    setTimeout(() => {
        button.classList.remove('success', 'error');
    }, 2000);
});

// Disk Cleanup with progress animation
document.getElementById('cleanDisk').addEventListener('click', async (e) => {
    if (e.target.disabled) return;
    const button = document.getElementById('cleanDisk');
    button.classList.add('processing');
    
    const commands = [
        'cleanmgr /sagerun:1',
        'del /s /f /q %temp%\\*.*',
    ];

    let success = true;
    for (const command of commands) {
        if (!await executeCommand(command)) {
            success = false;
            break;
        }
    }

    if (success) {
        button.classList.add('success');
    } else {
        button.classList.add('error');
    }
    
    button.classList.remove('processing');
    setTimeout(() => {
        button.classList.remove('success', 'error');
    }, 2000);
});

// Power Plan with animation
document.getElementById('powerPlan').addEventListener('click', async (e) => {
    if (e.target.disabled) return;
    const button = document.getElementById('powerPlan');
    button.classList.add('processing');
    
    const commands = [
        'powercfg /setactive SCHEME_MIN',
        'powercfg /change standby-timeout-ac 0',
        'powercfg /change hibernate-timeout-ac 0',
    ];

    let success = true;
    for (const command of commands) {
        if (!await executeCommand(command)) {
            success = false;
            break;
        }
    }

    if (success) {
        button.classList.add('success');
    } else {
        button.classList.add('error');
    }
    
    button.classList.remove('processing');
    setTimeout(() => {
        button.classList.remove('success', 'error');
    }, 2000);
});

// System Detection with loading animation
async function detectSystemType() {
    try {
        const systemTypeElement = document.getElementById('systemType');
        systemTypeElement.innerHTML = '<span class="loading">Detecting...</span>';
        
        // Utilisation de systeminformation pour une détection cross-platform
        const [battery, chassis] = await Promise.all([
            si.battery(),
            si.chassis()
        ]);
        
        const isLaptop = battery.hasBattery || 
                        chassis.type.toLowerCase().includes('laptop') ||
                        chassis.type.toLowerCase().includes('notebook');
        
        systemTypeElement.textContent = isLaptop ? 
            `Laptop ⚡ (${chassis.manufacturer} ${chassis.type})` : 
            `Desktop 🖥️ (${chassis.manufacturer} ${chassis.type})`;
        
        updateCardRecommendations(isLaptop);
    } catch (error) {
        console.error('Detection error:', error);
        document.getElementById('systemType').textContent = 'Desktop 🖥️ (Fallback)';
        updateCardRecommendations(false);
    }
}

// Nouvelle vérification de batterie plus fiable
async function checkBatteryExists() {
    try {
        const { stdout } = await execPromise('wmic path Win32_Battery get Status');
        return stdout.includes('OK') || stdout.includes('Charging');
    } catch {
        return false;
    }
}

async function analyzeSystem(isLaptop) {
    let optimizations = [];
    const infoText = document.querySelector('.system-info-details p');
    
    try {
        infoText.innerHTML = '<span class="loading">Analyzing system configuration...</span>';
        
        if(isLaptop) {
            document.getElementById('hibernateCheck').checked = false;
        } else {
            // Vérifier hibernate seulement sur desktop
            const { stdout } = await execPromise('powercfg /availablesleepstates');
            if(stdout.includes('Hibernate')) {
                optimizations.push('hibernate');
                document.getElementById('hibernateCheck').checked = true;
            }
        }
        
        // Check power plan
        const { stdout: powerPlan } = await execPromise('powercfg /getactivescheme');
        if (!powerPlan.includes('8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c')) {
            optimizations.push('power');
            document.getElementById('powerCheck').checked = true;
        }
        
        // Check performance settings
        const { stdout: perfSettings } = await execPromise('reg query "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" /v VisualFXSetting');
        if (!perfSettings.includes('0x2')) {
            optimizations.push('performance');
            document.getElementById('performanceCheck').checked = true;
        }
        
        // Always suggest disk cleanup
        optimizations.push('cleanup');
        document.getElementById('cleanupCheck').checked = true;
        
        // Update system info text with animation
        setTimeout(() => {
            if (optimizations.length > 0) {
                infoText.innerHTML = `<span class="highlight">${optimizations.length}</span> optimizations recommended`;
            } else {
                infoText.textContent = 'System is already optimized';
            }
            infoText.classList.add('analyzed');
        }, 1500);
    } catch (error) {
        console.error('Analysis error:', error);
        infoText.textContent = 'Ready for optimization';
    }
}

// Optimize All Function with loading animation
document.getElementById('optimizeAll').addEventListener('click', async () => {
    const checkboxes = {
        hibernate: document.getElementById('hibernateCheck'),
        performance: document.getElementById('performanceCheck'),
        cleanup: document.getElementById('cleanupCheck'),
        power: document.getElementById('powerCheck')
    };
    
    const optimizeButton = document.getElementById('optimizeAll');
    optimizeButton.disabled = true;
    optimizeButton.classList.add('optimizing');
    optimizeButton.innerHTML = `
        <svg class="spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
        </svg>
        Optimizing...
    `;
    
    for (const [key, checkbox] of Object.entries(checkboxes)) {
        if (checkbox.checked) {
            switch (key) {
                case 'hibernate':
                    await executeCommand('powercfg /hibernate on');
                    break;
                case 'performance':
                    await executeCommand('powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c');
                    await executeCommand('reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" /v VisualFXSetting /t REG_DWORD /d 2 /f');
                    break;
                case 'cleanup':
                    await executeCommand('cleanmgr /sagerun:1');
                    await executeCommand('del /s /f /q %temp%\\*.*');
                    break;
                case 'power':
                    await executeCommand('powercfg /setactive SCHEME_MIN');
                    await executeCommand('powercfg /change standby-timeout-ac 0');
                    await executeCommand('powercfg /change hibernate-timeout-ac 0');
                    break;
            }
        }
    }
    
    optimizeButton.classList.remove('optimizing');
    optimizeButton.classList.add('success');
    optimizeButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"></path>
        </svg>
        Optimization Complete!
    `;
    
    setTimeout(() => {
        optimizeButton.disabled = false;
        optimizeButton.classList.remove('success');
        optimizeButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
            </svg>
            Optimize Recommended
        `;
    }, 3000);
});

// Initialize system detection
detectSystemType();

// Ajouter cette fonction après detectSystemType
function updateCardRecommendations(isLaptop) {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        const recommendation = card.dataset.recommended;
        const isRecommended = recommendation === 'all' || 
                            (isLaptop && recommendation === 'laptop') ||
                            (!isLaptop && recommendation === 'desktop');

        card.classList.toggle('not-recommended', !isRecommended);
        
        const button = card.querySelector('.action-button');
        if (button) {
            button.disabled = !isRecommended;
            button.title = !isRecommended ? 
                'This optimization is not recommended for your system' : 
                '';
        }
    });
} 