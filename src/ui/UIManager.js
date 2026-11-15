import { CONFIG } from '../config.js';

/**
 * Handles DOM updates and UI interactions.
 */
export class UIManager {
    constructor() {
        this.elements = {
            grid: document.getElementById('game-grid'),
            mapContainer: document.getElementById('map-container'),
            teamSection: document.getElementById('team-section'),
            teamCountDisplay: document.getElementById('team-count-display'),
            winnerScreen: document.getElementById('winner-screen'),
            winnerName: document.getElementById('winner-name'),
            modal: document.getElementById('modal'),
            timerContainer: document.getElementById('timer-container'),
            timerDisplay: document.getElementById('timer-display'),
            timerCircle: document.getElementById('timer-circle-prog'),
            questionText: document.getElementById('question-text'),
            answerDisplay: document.getElementById('answer-display'),
            judgmentButtons: document.getElementById('judgment-buttons'),
            doubleRiskButtons: document.getElementById('double-risk-buttons'),
            leaderboardSection: document.getElementById('leaderboard-section'),
            leaderboardToggle: document.getElementById('leaderboard-toggle'),
            leaderboardContent: document.getElementById('leaderboard-content'),
            settingsPanel: document.getElementById('settings-panel'),
            btnOpenSettings: document.getElementById('btn-open-settings'),
            btnCloseSettings: document.getElementById('btn-close-settings'),
            btnBackToMap: document.getElementById('btn-back-to-map'),
            btnResetSidebar: document.getElementById('btn-reset-sidebar')
        };
        
        this.FULL_CIRCLE = CONFIG.TIMER_FULL_CIRCLE;

        // Vytvoř toast container
        this._toastContainer = document.createElement('div');
        this._toastContainer.id = 'toast-container';
        this._toastContainer.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;pointer-events:none;';
        document.body.appendChild(this._toastContainer);

        this._setupSettingsListeners();

        if (this.elements.leaderboardToggle) {
            this.elements.leaderboardToggle.onclick = () => {
                this.elements.leaderboardSection.classList.toggle('collapsed');
            };
        }
    }

    _setupSettingsListeners() {
        if (this.elements.btnOpenSettings) {
            this.elements.btnOpenSettings.onclick = () => this.showSettings();
        }
        if (this.elements.btnCloseSettings) {
            this.elements.btnCloseSettings.onclick = () => this.hideSettings();
        }
        
        // Dynamic Slider Logic
        const sliderSelectors = [
            { id: 'vol-master', key: 'master', valId: 'val-master' },
            { id: 'vol-bg', key: 'bg', valId: 'val-bg' },
            { id: 'vol-milionar', key: 'milionar', valId: 'val-milionar' },
            { id: 'vol-feedback', key: 'feedback', valId: 'val-feedback' },
            { id: 'vol-countdown', key: 'countdown', valId: 'val-countdown' },
            { id: 'vol-sfx', key: 'sfx', valId: 'val-sfx' },
            // Regional sliders
            { id: 'vol-reg-freljord', key: 'reg_freljord', valId: 'val-reg-freljord' },
            { id: 'vol-reg-demacia', key: 'reg_demacia', valId: 'val-reg-demacia' },
            { id: 'vol-reg-noxus', key: 'reg_noxus', valId: 'val-reg-noxus' },
            { id: 'vol-reg-ionia', key: 'reg_ionia', valId: 'val-reg-ionia' },
            { id: 'vol-reg-shurima', key: 'reg_shurima', valId: 'val-reg-shurima' },
            { id: 'vol-reg-bilgewater', key: 'reg_bilgewater', valId: 'val-reg-bilgewater' },
            { id: 'vol-reg-piltover_and_zaun', key: 'reg_piltover_and_zaun', valId: 'val-reg-piltover_and_zaun' },
            { id: 'vol-reg-shadow_isles', key: 'reg_shadow_isles', valId: 'val-reg-shadow_isles' },
            { id: 'vol-reg-targon', key: 'reg_targon', valId: 'val-reg-targon' },
            { id: 'vol-reg-ixtal', key: 'reg_ixtal', valId: 'val-reg-ixtal' },
            { id: 'vol-reg-void', key: 'reg_void', valId: 'val-reg-void' }
        ];

        sliderSelectors.forEach(s => {
            const el = document.getElementById(s.id);
            const valEl = document.getElementById(s.valId);
            if (el) {
                el.oninput = (e) => {
                    const val = e.target.value;
                    if (valEl) valEl.innerText = `${Math.round(val * 100)}%`;
                    if (window.app?.audioManager) {
                        window.app.audioManager.updateVolume(s.key, val);
                    }
                };
            }
        });
    }

    showSettings() {
        if (!this.elements.settingsPanel) return;
        
        // Sync sliders with current settings before showing
        if (window.app?.audioManager) {
            const settings = window.app.audioManager.volumeSettings;
            Object.keys(settings).forEach(key => {
                // Key in settings is 'master', 'bg', or 'reg_freljord'
                // Element ID is 'vol-master', 'vol-bg', or 'vol-reg-freljord'
                const idSuffix = key.startsWith('reg_') ? `reg-${key.substring(4)}` : key;
                const el = document.getElementById(`vol-${idSuffix}`);
                const valEl = document.getElementById(`val-${idSuffix}`);
                
                if (el) {
                    el.value = settings[key];
                    if (valEl) valEl.innerText = `${Math.round(settings[key] * 100)}%`;
                }
            });
        }

        this.elements.settingsPanel.classList.add('active');
    }

    hideSettings() {
        if (this.elements.settingsPanel) {
            this.elements.settingsPanel.classList.remove('active');
        }
    }

    showToast(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            background: rgba(0,0,0,0.85);
            color: #fff;
            padding: 12px 24px;
            border-radius: 8px;
            margin-bottom: 10px;
            font-size: 16px;
            font-weight: bold;
            animation: toastFade 0.3s ease;
            white-space: nowrap;
        `;
        
        // Přidáme animaci pokud neexistuje
        if (!document.getElementById('toast-style')) {
            const style = document.createElement('style');
            style.id = 'toast-style';
            style.textContent = `
                @keyframes toastFade {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
        
        this._toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    setBackToMapVisibility(visible) {
        if (this.elements.btnBackToMap) {
            this.elements.btnBackToMap.style.display = visible ? 'block' : 'none';
        }
    }

    renderLeaderboard(territoryData) {
        if (!this.elements.leaderboardContent) return;
        this.elements.leaderboardContent.innerHTML = '';

        // SORTING: 1. Regions Count, 2. Total Points
        const sortedTeams = territoryData.sort((a, b) => {
            if (b.regions.length !== a.regions.length) return b.regions.length - a.regions.length;
            return b.score - a.score;
        });

        sortedTeams.forEach((team, index) => {
            const isLeader = index === 0 && (team.regions.length > 0 || team.score > 0);
            const div = document.createElement('div');
            div.className = 'leaderboard-item' + (isLeader ? ' leader' : '');
            
            // Apply team color to border if they have points/territory
            const hasActivity = team.regions.length > 0 || team.score > 0;
            div.style.borderColor = hasActivity ? team.color : 'rgba(255,255,255,0.05)';
            
            let regionsHtml = team.regions.length > 0 
                ? team.regions.map(r => `<div>• ${r.name}</div>`).join('')
                : `<div style="opacity:0.4; font-size:0.7em;">Žádné území</div>`;

            div.innerHTML = `
                <div class="leaderboard-item-header">
                    <span style="color: ${team.color}">
                        ${isLeader ? '👑 ' : ''}${team.name}
                    </span>
                    <span>${team.regions.length} <i style="font-size:0.7em;">území</i></span>
                </div>
                <div class="leaderboard-item-points" style="font-size: 0.8rem; margin-bottom: 5px; opacity: 0.8; color: ${team.color}">
                    Skóre: ${team.score}
                </div>
                <div class="leaderboard-item-regions">
                    ${regionsHtml}
                </div>
            `;
            this.elements.leaderboardContent.appendChild(div);
        });
    }

    renderTeams(gameState, onManualScore, onTeamSelect, onNameChange) {
        this.elements.teamSection.innerHTML = '';
        
        // Zobrazení info o kole
        const roundInfo = document.createElement('div');
        roundInfo.className = 'round-info';
        roundInfo.innerHTML = `<span class="round-label">KOLO</span> <span class="round-current">${gameState.currentRound}</span> / <span class="round-max">${gameState.maxRounds}</span>`;
        this.elements.teamSection.appendChild(roundInfo);
        
        for (let i = 0; i < gameState.teamCount; i++) {
            const teamId = i + 1;
            const div = document.createElement('div');
            div.className = 'team-box' + (teamId === gameState.activeTeamId ? ' active' : '');
            
            div.onclick = (e) => {
                if (e.target.className !== 'team-name') onTeamSelect(teamId);
            };

            div.innerHTML = `
                <div class="team-name" contenteditable="true" style="border-bottom: 2px solid ${gameState.teamData[i].color}">${gameState.teamData[i].name}</div>
                <span class="score" style="color: ${gameState.teamData[i].color}">${gameState.teamData[i].score}</span>
                <div style="margin-top:5px;">
                    <button class="score-btn" data-action="plus">+</button>
                    <button class="score-btn" data-action="minus">-</button>
                </div>
            `;

            const nameElement = div.querySelector('.team-name');
            nameElement.onblur = () => onNameChange(i, nameElement.innerText);

            div.querySelector('[data-action="plus"]').onclick = (e) => { e.stopPropagation(); onManualScore(teamId, true); };
            div.querySelector('[data-action="minus"]').onclick = (e) => { e.stopPropagation(); onManualScore(teamId, false); };

            this.elements.teamSection.appendChild(div);
        }

        if (this.elements.teamCountDisplay) {
            this.elements.teamCountDisplay.innerText = gameState.teamCount;
        }
        const activeTeam = gameState.teamData[gameState.activeTeamId - 1];
        if (activeTeam && this.elements.activeTeamDisplay) {
            this.elements.activeTeamDisplay.innerText = activeTeam.name;
            this.elements.activeTeamDisplay.style.color = activeTeam.color;
        }
    }

    showWinner(winnerName, winnerColor) {
        this.elements.winnerName.innerText = winnerName.toUpperCase();
        if (winnerColor) {
            this.elements.winnerName.style.color = winnerColor;
            this.elements.winnerName.style.textShadow = `0 0 30px ${winnerColor}`;
        }
        this.elements.winnerScreen.style.display = 'flex';
    }

    updateTimer(timeLeft, percent) {
        const displayTime = Math.max(0, Math.ceil(timeLeft));
        this.elements.timerDisplay.innerText = displayTime;
        
        const isLowTime = displayTime <= 10 && displayTime > 0;
        this.elements.timerDisplay.classList.toggle('low-time', isLowTime);

        const offset = this.FULL_CIRCLE * (1 - percent);
        this.elements.timerCircle.style.strokeDashoffset = offset;
        
        if (displayTime <= 5) {
            this.elements.timerCircle.style.stroke = '#ff4655'; // Red
        } else {
            this.elements.timerCircle.style.stroke = '#00cfbc'; // Hextech Blue
        }
    }

    showModal() {
        this.elements.modal.style.display = 'flex';
        this.elements.modal.animate([
            { opacity: 0, transform: 'scale(0.9) translateY(20px)' },
            { opacity: 1, transform: 'scale(1) translateY(0)' }
        ], {
            duration: 400,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'forwards'
        });
    }

    hideModal(immediate = false) {
        if (immediate) {
            this.elements.modal.style.display = 'none';
            return;
        }

        const animation = this.elements.modal.animate([
            { opacity: 1, transform: 'scale(1)' },
            { opacity: 0, transform: 'scale(1.05)' }
        ], {
            duration: 300,
            easing: 'ease-in',
            fill: 'forwards'
        });

        animation.onfinish = () => {
            this.elements.modal.style.display = 'none';
        };
    }

    setQuestion(text, category) {
        this.elements.questionText.innerHTML = `
            <div class="q-category">— ${category || 'QUESTION'} —</div>
            <div class="q-content">${text}</div>
        `;
    }

    resetModalUI() {
        this.elements.answerDisplay.style.display = 'none';
        this.elements.judgmentButtons.style.display = 'none';
        this.elements.questionText.classList.remove('gold-brick-active');
        this.elements.timerCircle.style.strokeDashoffset = 0;
        this.elements.timerCircle.style.stroke = '#00cfbc';
    }
}
