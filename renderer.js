const { ipcRenderer } = require("electron");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const si = require("systeminformation");
const Store = require('electron-store');
const store = new Store();

// Window Controls with animations
document.getElementById("minimize").addEventListener("click", () => {
  ipcRenderer.send("window-minimize");
});

document.getElementById("maximize").addEventListener("click", () => {
  ipcRenderer.send("window-toggle-maximize");
});

document.getElementById("close").addEventListener("click", () => {
  ipcRenderer.send("window-close");
});

// Handle window state changes
ipcRenderer.on("window-maximized", () => {
  document.getElementById("maximize").innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="5" y="5" width="14" height="14" rx="2" ry="2"></rect>
        </svg>
    `;
});

ipcRenderer.on("window-unmaximized", () => {
  document.getElementById("maximize").innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        </svg>
    `;
});

// Sidebar Navigation with smooth transitions
const sidebarItems = document.querySelectorAll(".sidebar-item");
const pages = document.querySelectorAll(".page");

sidebarItems.forEach((item) => {
  item.addEventListener("click", () => {
    const targetPage = item.dataset.page;
    
    // Masquer toutes les pages avec transition
    pages.forEach((p) => {
      if (p.classList.contains('active')) {
        p.style.opacity = '0';
        setTimeout(() => {
          p.classList.remove('active');
          p.style.display = 'none';
        }, 300);
      }
    });

    // Afficher la page cible
    const targetElement = document.getElementById(`${targetPage}-page`);
    if (targetElement) {
      targetElement.style.display = 'block';
      setTimeout(() => {
        targetElement.style.opacity = '1';
        targetElement.classList.add('active');
      }, 50);
    }

    // Mettre à jour l'état actif de la sidebar
    sidebarItems.forEach((i) => i.classList.remove('active'));
    item.classList.add('active');
  });
});

// Corriger l'initialisation des pages au chargement
document.addEventListener('DOMContentLoaded', () => {
  // Masquer toutes les pages sauf celle active
  pages.forEach(p => {
    if (!p.classList.contains('active')) {
      p.style.display = 'none';
      p.style.opacity = '0';
    }
  });
  
  // Réinitialiser les écouteurs d'événements des cartes
  document.querySelectorAll('.action-button').forEach(button => {
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent;
    }
  });

  // Forcer une nouvelle détection système
  detectSystemType();
});

// Windows Optimization Functions with improved feedback
async function executeCommand(command) {
  try {
    const { stdout, stderr } = await execPromise(command, { 
      shell: 'cmd.exe',
      timeout: 15000 
    });
    return { success: true, output: stdout };
  } catch (error) {
    console.error(`Erreur commande ${command}:`, error);
    return { 
      success: false,
      error: error.stderr || error.message 
    };
  }
}

// Hibernate Mode with animation
const toggleHibernate = document.getElementById("toggleHibernate");
let hibernateEnabled = false;

toggleHibernate.addEventListener("click", async (e) => {
  if (e.target.disabled) return;
  toggleHibernate.classList.add("processing");

  const command = hibernateEnabled
    ? "powercfg /hibernate off"
    : "powercfg /hibernate on";

  const success = await executeCommand(command);

  if (success) {
    hibernateEnabled = !hibernateEnabled;
    toggleHibernate.textContent = hibernateEnabled
      ? "Disable Hibernate"
      : "Enable Hibernate";
    toggleHibernate.classList.add("success");
  } else {
    toggleHibernate.classList.add("error");
  }

  toggleHibernate.classList.remove("processing");
  setTimeout(() => {
    toggleHibernate.classList.remove("success", "error");
  }, 2000);
});

// Performance Mode with animation
document
  .getElementById("enablePerformance")
  .addEventListener("click", async (e) => {
    if (e.target.disabled) return;
    const button = document.getElementById("enablePerformance");
    button.classList.add("processing");

    const commands = [
      "powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c",
      'reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" /v VisualFXSetting /t REG_DWORD /d 2 /f',
    ];

    let success = true;
    for (const command of commands) {
      if (!(await executeCommand(command))) {
        success = false;
        break;
      }
    }

    if (success) {
      button.classList.add("success");
    } else {
      button.classList.add("error");
    }

    button.classList.remove("processing");
    setTimeout(() => {
      button.classList.remove("success", "error");
    }, 2000);
  });

// Disk Cleanup with progress animation
document.getElementById("cleanDisk").addEventListener("click", async (e) => {
  if (e.target.disabled) return;
  const button = document.getElementById("cleanDisk");
  button.classList.add("processing");

  const commands = ["cleanmgr /sagerun:1", "del /s /f /q %temp%\\*.*"];

  let success = true;
  for (const command of commands) {
    if (!(await executeCommand(command))) {
      success = false;
      break;
    }
  }

  if (success) {
    button.classList.add("success");
  } else {
    button.classList.add("error");
  }

  button.classList.remove("processing");
  setTimeout(() => {
    button.classList.remove("success", "error");
  }, 2000);
});

// Power Plan with animation
document.getElementById("powerPlan").addEventListener("click", async (e) => {
  if (e.target.disabled) return;
  const button = document.getElementById("powerPlan");
  button.classList.add("processing");

  const commands = [
    "powercfg /setactive SCHEME_MIN",
    "powercfg /change standby-timeout-ac 0",
    "powercfg /change hibernate-timeout-ac 0",
  ];

  let success = true;
  for (const command of commands) {
    if (!(await executeCommand(command))) {
      success = false;
      break;
    }
  }

  if (success) {
    button.classList.add("success");
  } else {
    button.classList.add("error");
  }

  button.classList.remove("processing");
  setTimeout(() => {
    button.classList.remove("success", "error");
  }, 2000);
});

// Enhanced System Detection
async function detectSystemType() {
  try {
    const systemTypeElement = document.getElementById("systemType");
    if (!systemTypeElement) {
      console.error('System type element not found');
      return;
    }
    
    systemTypeElement.innerHTML = '<span class="loading">Detecting...</span>';

    // Utiliser Promise.all pour la détection parallèle
    const [battery, system, cpu, mem, graphics] = await Promise.all([
      si.battery().catch(() => ({ hasBattery: false })),
      si.system().catch(() => ({ manufacturer: 'Unknown', model: 'Unknown' })),
      si.cpu().catch(() => ({ manufacturer: 'Unknown', brand: 'Unknown' })),
      si.mem().catch(() => ({ total: 0 })),
      si.graphics().catch(() => ({ controllers: [] }))
    ]);

    // Détection plus précise du type de système
    const isLaptop = battery.hasBattery || 
                     (system.model && system.model.toLowerCase().match(/laptop|notebook|portable|thinkpad|macbook/i)) ||
                     await checkBatteryExists();

    // Formatage des informations
    const formattedCPU = `${cpu.manufacturer || ''} ${cpu.brand || 'Unknown CPU'}`.trim();
    const formattedRAM = `${Math.round((mem.total || 0) / (1024 * 1024 * 1024))}GB RAM`;
    
    // Amélioration de la détection GPU
    let formattedGPU = 'Unknown GPU';
    if (graphics.controllers && graphics.controllers.length > 0) {
      const gpus = graphics.controllers
        .filter(gpu => gpu.model || gpu.vendor || gpu.name)
        .map(gpu => {
          const model = gpu.model || gpu.name || '';
          const vendor = gpu.vendor || '';
          // Filtrer les informations redondantes
          return model.includes(vendor) ? model : `${vendor} ${model}`.trim();
        })
        .filter(gpu => gpu.length > 0);

      if (gpus.length === 1) {
        formattedGPU = gpus[0];
      } else if (gpus.length > 1) {
        // Trier pour mettre les GPU dédiés (NVIDIA, AMD) en premier
        gpus.sort((a, b) => {
          const dedicatedGPU = /(nvidia|rtx|gtx|radeon|amd)/i;
          const aIsDedicated = dedicatedGPU.test(a);
          const bIsDedicated = dedicatedGPU.test(b);
          return bIsDedicated - aIsDedicated;
        });
        formattedGPU = gpus.join(' + ');
      }
    }

    const systemModel = `${system.manufacturer || ''} ${system.model || 'Unknown'}`.trim();

    // Mise à jour de l'interface
    systemTypeElement.textContent = `${isLaptop ? "Laptop" : "Desktop"} • ${systemModel}`;
    
    const cpuElement = document.getElementById("cpuInfo");
    const memoryElement = document.getElementById("memoryInfo");
    const gpuElement = document.getElementById("gpuInfo");
    
    if (cpuElement) cpuElement.textContent = formattedCPU;
    if (memoryElement) memoryElement.textContent = formattedRAM;
    if (gpuElement) gpuElement.textContent = formattedGPU;

    // Sauvegarder le type de système
    store.set('systemType', isLaptop ? 'laptop' : 'desktop');
    updateCardRecommendations(isLaptop);
    initializeToggles(isLaptop);

  } catch (error) {
    console.error('Detection error:', error);
    fallbackSystemDetection();
  }
}

// Amélioration de la vérification de batterie
async function checkBatteryExists() {
  try {
    // Utiliser l'API navigator.getBattery() en premier
    const battery = await navigator.getBattery();
    return battery !== null;
  } catch (error) {
    console.error('Battery API failed:', error);
    return false;
  }
}

function initializeToggles(isLaptop) {
  const hibernateToggle = document.getElementById("hibernateToggle");
  const performanceToggle = document.getElementById("performanceToggle");
  const optimizationCard = document.querySelector('[data-page="optimization"] .toggle-card:first-child');

  // Vérifier si les éléments existent
  if (!hibernateToggle || !performanceToggle) {
    console.error('Toggle elements not found');
    return;
  }

  // Charger les paramètres sauvegardés
  hibernateToggle.checked = store.get('hibernateEnabled', false);
  performanceToggle.checked = store.get('performanceEnabled', false);

  // Désactiver complètement le toggle hibernate pour les laptops
  if (isLaptop && optimizationCard) {
    hibernateToggle.disabled = true;
    hibernateToggle.checked = false;
    store.set('hibernateEnabled', false);
    optimizationCard.classList.add('not-recommended');
  }

  // Gestion des événements avec sauvegarde
  hibernateToggle.addEventListener("change", async (e) => {
    if (isLaptop) return; // Double vérification
    const command = e.target.checked ? "powercfg /hibernate on" : "powercfg /hibernate off";
    await executeCommand(command);
    store.set('hibernateEnabled', e.target.checked);
  });

  performanceToggle.addEventListener("change", async (e) => {
    if (e.target.checked) {
      await executeCommand("powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c");
      await executeCommand('reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" /v VisualFXSetting /t REG_DWORD /d 2 /f');
    } else {
      await executeCommand("powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e");
    }
    store.set('performanceEnabled', e.target.checked);
  });
}

// Nouvelle fonction de détection de secours
async function fallbackSystemDetection() {
  try {
    const systemTypeElement = document.getElementById("systemType");
    if (!systemTypeElement) {
      console.error('System type element not found');
      return;
    }

    systemTypeElement.textContent = "Using fallback detection...";

    // Utiliser systeminformation comme solution de secours
    const [cpu, mem, graphics] = await Promise.all([
      si.cpu().catch(() => ({ manufacturer: 'Unknown', brand: 'Unknown' })),
      si.mem().catch(() => ({ total: 0 })),
      si.graphics().catch(() => ({ controllers: [] }))
    ]);

    // Formater les informations
    const cpuInfo = `${cpu.manufacturer || ''} ${cpu.brand || 'Unknown CPU'}`.trim();
    const memoryGB = Math.round((mem.total || 0) / (1024 * 1024 * 1024));
    
    // Amélioration de la détection GPU en fallback
    let gpuInfo = 'Unknown GPU';
    if (graphics.controllers && graphics.controllers.length > 0) {
      const gpus = graphics.controllers
        .filter(gpu => gpu.model || gpu.vendor || gpu.name)
        .map(gpu => {
          const model = gpu.model || gpu.name || '';
          const vendor = gpu.vendor || '';
          return model.includes(vendor) ? model : `${vendor} ${model}`.trim();
        })
        .filter(gpu => gpu.length > 0);

      if (gpus.length > 0) {
        gpus.sort((a, b) => {
          const dedicatedGPU = /(nvidia|rtx|gtx|radeon|amd)/i;
          const aIsDedicated = dedicatedGPU.test(a);
          const bIsDedicated = dedicatedGPU.test(b);
          return bIsDedicated - aIsDedicated;
        });
        gpuInfo = gpus.join(' + ');
      }
    }

    // Vérifier si c'est un laptop avec l'API Battery
    const isLaptop = await checkBatteryExists();

    // Mettre à jour l'interface
    systemTypeElement.textContent = `${isLaptop ? "Laptop" : "Desktop"} • System`;
    
    const cpuElement = document.getElementById("cpuInfo");
    const memoryElement = document.getElementById("memoryInfo");
    const gpuElement = document.getElementById("gpuInfo");
    
    if (cpuElement) cpuElement.textContent = cpuInfo;
    if (memoryElement) memoryElement.textContent = `${memoryGB}GB RAM`;
    if (gpuElement) gpuElement.textContent = gpuInfo;

    // Sauvegarder et mettre à jour l'interface
    store.set('systemType', isLaptop ? 'laptop' : 'desktop');
    updateCardRecommendations(isLaptop);
    initializeToggles(isLaptop);

  } catch (error) {
    console.error('Fallback detection failed:', error);
    setDefaultValues();
  }
}

// Fonction pour définir des valeurs par défaut en cas d'échec total
function setDefaultValues() {
  const systemTypeElement = document.getElementById("systemType");
  systemTypeElement.textContent = "Detection Failed - Using Default Settings";
  
  document.getElementById("cpuInfo").textContent = "CPU Information Unavailable";
  document.getElementById("memoryInfo").textContent = "Memory Information Unavailable";
  document.getElementById("gpuInfo").textContent = "GPU Information Unavailable";
  
  // Utiliser des paramètres par défaut sécurisés
  store.set('systemType', 'desktop');
  updateCardRecommendations(false);
  initializeToggles(false);
}

async function analyzeSystem(isLaptop) {
  let optimizations = [];
  const infoText = document.querySelector(".system-info-details p");
  const autoRecommendButton = document.getElementById('autoRecommend');

  try {
    infoText.innerHTML =
      '<span class="loading">Analyzing system configuration...</span>';

    if (isLaptop) {
      document.getElementById("hibernateCheck").checked = false;
    } else {
      // Vérifier hibernate seulement sur desktop
      const { stdout } = await execPromise("powercfg /availablesleepstates");
      if (stdout.includes("Hibernate")) {
        optimizations.push("hibernate");
        document.getElementById("hibernateCheck").checked = true;
      }
    }

    // Check power plan
    const { stdout: powerPlan } = await execPromise(
      "powercfg /getactivescheme",
    );
    if (!powerPlan.includes("8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c")) {
      optimizations.push("power");
      document.getElementById("powerCheck").checked = true;
    }

    // Check performance settings
    const { stdout: perfSettings } = await execPromise(
      'reg query "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" /v VisualFXSetting',
    );
    if (!perfSettings.includes("0x2")) {
      optimizations.push("performance");
      document.getElementById("performanceCheck").checked = true;
    }

    // Always suggest disk cleanup
    optimizations.push("cleanup");
    document.getElementById("cleanupCheck").checked = true;

    // Update system info text with animation
    setTimeout(() => {
      if (optimizations.length > 0) {
        infoText.innerHTML = `<span class="highlight">${optimizations.length}</span> optimizations recommended`;
      } else {
        infoText.textContent = "System is already optimized";
      }
      infoText.classList.add("analyzed");
    }, 1500);

    // Stocker les optimisations recommandées
    autoRecommendButton.dataset.recommendations = optimizations.join(',');
    autoRecommendButton.disabled = optimizations.length === 0;
    
  } catch (error) {
    console.error("Analysis error:", error);
    infoText.textContent = "Ready for optimization";
    autoRecommendButton.disabled = true;
  }
}

// Optimize All Function with loading animation
document.getElementById("optimizeAll").addEventListener("click", async () => {
  const checkboxes = {
    hibernate: document.getElementById("hibernateCheck"),
    performance: document.getElementById("performanceCheck"),
    cleanup: document.getElementById("cleanupCheck"),
    power: document.getElementById("powerCheck"),
  };

  const optimizeButton = document.getElementById("optimizeAll");
  optimizeButton.disabled = true;
  optimizeButton.classList.add("optimizing");
  optimizeButton.innerHTML = `
        <svg class="spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
        </svg>
        Optimizing...
    `;

  for (const [key, checkbox] of Object.entries(checkboxes)) {
    if (checkbox.checked) {
      switch (key) {
        case "hibernate":
          await executeCommand("powercfg /hibernate on");
          break;
        case "performance":
          await executeCommand(
            "powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c",
          );
          await executeCommand(
            'reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" /v VisualFXSetting /t REG_DWORD /d 2 /f',
          );
          break;
        case "cleanup":
          await executeCommand("cleanmgr /sagerun:1");
          await executeCommand("del /s /f /q %temp%\\*.*");
          break;
        case "power":
          await executeCommand("powercfg /setactive SCHEME_MIN");
          await executeCommand("powercfg /change standby-timeout-ac 0");
          await executeCommand("powercfg /change hibernate-timeout-ac 0");
          break;
      }
    }
  }

  optimizeButton.classList.remove("optimizing");
  optimizeButton.classList.add("success");
  optimizeButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"></path>
        </svg>
        Optimization Complete!
    `;

  setTimeout(() => {
    optimizeButton.disabled = false;
    optimizeButton.classList.remove("success");
    optimizeButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
            </svg>
            Optimize Recommended
        `;
  }, 3000);
});

// Nouvelle fonction pour Auto Recommend
document.getElementById('autoRecommend').addEventListener('click', async function() {
  const button = this;
  const recommendations = button.dataset.recommendations?.split(',') || [];
  
  button.classList.add('loading');
  button.innerHTML = `
    <svg class="spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
    Applying...
  `;

  try {
    // Exécuter les optimisations recommandées
    for (const optimization of recommendations) {
      switch(optimization) {
        case 'hibernate':
          await executeCommand("powercfg /hibernate on");
          break;
        case 'performance':
          await executeCommand("powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c");
          await executeCommand('reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" /v VisualFXSetting /t REG_DWORD /d 2 /f');
          break;
        case 'cleanup':
          await executeCommand("cleanmgr /sagerun:1");
          await executeCommand("del /s /f /q %temp%\\*.*");
          break;
        case 'power':
          await executeCommand("powercfg /setactive SCHEME_MIN");
          await executeCommand("powercfg /change standby-timeout-ac 0");
          await executeCommand("powercfg /change hibernate-timeout-ac 0");
          break;
      }
    }

    // Feedback visuel
    button.classList.remove('loading');
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
      Recommendations Applied!
    `;
  } catch (error) {
    console.error('Auto recommend failed:', error);
    button.innerHTML = `⚠️ Error - Retry`;
  } finally {
    setTimeout(() => {
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8h-3"/>
          <path d="M15 4V2m0 2v2m2-2h-2m2 2h2m-8 4h6m-3-3v6"/>
        </svg>
        Auto Recommend
      `;
      button.classList.remove('loading');
    }, 2000);
  }
});

// Initialize system detection
detectSystemType();

// Ajouter cette fonction après detectSystemType
function updateCardRecommendations(isLaptop) {
  const hibernateCard = document.querySelector('.toggle-card:first-child');
  
  if (isLaptop) {
    hibernateCard.classList.add('not-recommended');
    const toggle = hibernateCard.querySelector('.toggle-switch__input');
    toggle.checked = false;
    toggle.disabled = true;
    store.set('hibernateEnabled', false);
  } else {
    hibernateCard.classList.remove('not-recommended');
    hibernateCard.querySelector('.toggle-switch__input').disabled = false;
  }
}

ipcRenderer.on('load-settings', () => {
  const isLaptop = store.get('systemType', 'desktop') === 'laptop';
  updateCardRecommendations(isLaptop);
  initializeToggles(isLaptop);
});
