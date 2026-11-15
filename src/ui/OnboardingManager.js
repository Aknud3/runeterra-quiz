import { logger } from '../core/Logger.js';
import { CONFIG } from '../config.js';

/**
 * Handles the onboarding screen and team setup.
 */
export class OnboardingManager {
    constructor(onStart) {
        this.elements = {
            screen: document.getElementById('onboarding-screen'),
            teamsContainer: document.getElementById('onboarding-teams'),
            btnAddTeam: document.getElementById('btn-add-team'),
            btnStartGame: document.getElementById('btn-start-game'),
            gameContainer: document.getElementById('game-container'),
            // New Starting Order Elements
            startingScreen: document.getElementById('starting-order-screen'),
            startingQText: document.getElementById('starting-q-text'),
            startingAText: document.getElementById('starting-a-text'),
            btnRevealStartingA: document.getElementById('btn-reveal-starting-a'),
            startingOrderList: document.getElementById('starting-order-list'),
            btnFinalizeStart: document.getElementById('btn-finalize-start')
        };

        this.onStart = onStart;
        this.teams = [
            { name: 'Tým 1', color: '#4a90e2' },
            { name: 'Tým 2', color: '#e24a4a' }
        ];
        this.allQuestions = [];

        this.init();
    }

    async init() {
        logger.info("OnboardingManager: init called");
        
        // Debug: check if elements exist
        if (!this.elements.btnAddTeam) {
            logger.error("OnboardingManager: btnAddTeam element not found!");
            alert("Chyba: Elementy onboarding obrazovky nebyly nalezeny. Zkuste obnovit stránku.");
            return;
        }
        if (!this.elements.btnStartGame) {
            logger.error("OnboardingManager: btnStartGame element not found!");
            return;
        }

        this.elements.btnAddTeam.addEventListener('click', (e) => {
            e.preventDefault();
            this.addTeam();
        });

        this.elements.btnStartGame.addEventListener('click', (e) => {
            e.preventDefault();
            this.showStartingOrder();
        });

        this.elements.btnRevealStartingA.onclick = () => {
            this.elements.startingAText.style.display = 'block';
            this.elements.btnRevealStartingA.style.display = 'none';
        };

        this.elements.btnFinalizeStart.onclick = () => {
            // Immediately hide all onboarding screens to prevent flickering
            this.hide(false);
            this.onStart(this.teams);
        };

        this.render();
        await this.loadQuestions();
    }

    addTeam() {
        if (this.teams.length >= (CONFIG.MAX_TEAMS || 6)) {
            alert(`Maximální počet týmů je ${CONFIG.MAX_TEAMS || 6}!`);
            return;
        }

        const teamColors = [
            '#4a90e2', // Blue
            '#e24a4a', // Red
            '#4ae24a', // Green
            '#e2e24a', // Yellow
            '#e24ae2', // Magenta
            '#4ae2e2'  // Cyan
        ];

        const nextColor = teamColors[this.teams.length] || '#ffffff';
        this.teams.push({
            name: `Tým ${this.teams.length + 1}`,
            color: nextColor
        });

        this.render();
    }

    removeTeam(index) {
        if (this.teams.length <= 2) {
            alert('Musí být alespoň 2 týmy!');
            return;
        }
        this.teams.splice(index, 1);
        this.render();
    }

    async loadQuestions() {
        try {
            const res = await fetch('src/data/questions.json');
            this.allQuestions = await res.json();
            logger.info(`OnboardingManager: Loaded ${this.allQuestions.length} questions.`);
        } catch (e) {
            logger.error("Failed to load questions for onboarding", e);
        }
    }

    async showStartingOrder() {
        logger.info("OnboardingManager: showStartingOrder called.");
        if (this.teams.some(t => !t.name.trim())) {
            alert('Všechny týmy musí mít vyplněné jméno!');
            logger.warn('Onboarding validation failed: missing team names.');
            return;
        }

        logger.info(`OnboardingManager: Searching for onboarding question among ${this.allQuestions.length} loaded questions...`);
        
        // Najdi všechny onboarding otázky a vyber náhodnou
        const onboardingQuestions = this.allQuestions.filter(q => q.region === 'onboarding');
        let q = null;
        
        if (onboardingQuestions.length > 0) {
            q = onboardingQuestions[Math.floor(Math.random() * onboardingQuestions.length)];
            logger.info(`OnboardingManager: Vybrána náhodná z ${onboardingQuestions.length} onboarding otázek`);
        } else if (this.allQuestions.length > 0) {
            logger.warn("OnboardingManager: Dedicated 'onboarding' question not found, picking a random fallback.");
            q = this.allQuestions[Math.floor(Math.random() * this.allQuestions.length)];
        }

        if (q) {
            logger.info(`OnboardingManager: Decision question found: ${q.question.substring(0, 30)}...`);
            this.elements.startingQText.innerText = q.question;
            this.elements.startingAText.innerText = q.answer;
            this.elements.startingAText.style.display = 'none';
            this.elements.btnRevealStartingA.style.display = 'block';
        } else {
            logger.error("OnboardingManager: No decision question loaded at all!");
        }

        // Hide main onboarding, show starting order
        logger.info("OnboardingManager: Hiding main screen, showing starting order screen.");
        this.elements.screen.style.display = 'none';
        this.elements.startingScreen.style.display = 'flex';
        this.renderStartingOrder();
    }

    renderStartingOrder() {
        this.elements.startingOrderList.innerHTML = '';
        this.teams.forEach((team, index) => {
            const row = document.createElement('div');
            row.className = 'starting-team-row';
            row.style.borderLeft = `5px solid ${team.color}`;
            row.innerHTML = `
                <span>${team.name}</span>
                <div class="reorder-btns">
                    <button class="reorder-btn move-up" title="Move Up">▲</button>
                    <button class="reorder-btn move-down" title="Move Down">▼</button>
                </div>
            `;

            row.querySelector('.move-up').onclick = () => this.reorderTeam(index, -1);
            row.querySelector('.move-down').onclick = () => this.reorderTeam(index, 1);

            this.elements.startingOrderList.appendChild(row);
        });
    }

    reorderTeam(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.teams.length) return;

        const team = this.teams.splice(index, 1)[0];
        this.teams.splice(newIndex, 0, team);
        this.renderStartingOrder();
    }

    render() {
        this.elements.teamsContainer.innerHTML = '';
        this.teams.forEach((team, index) => {
            const row = document.createElement('div');
            row.className = 'onboarding-team-row';
            row.innerHTML = `
                <input type="text" value="${team.name}" placeholder="Team Name">
                <input type="color" value="${team.color}">
                ${this.teams.length > 2 ? '<button class="settings-btn remove-team" style="border-color: var(--red); color: var(--red);">×</button>' : ''}
            `;

            const nameInput = row.querySelector('input[type="text"]');
            const colorInput = row.querySelector('input[type="color"]');
            const removeBtn = row.querySelector('.remove-team');

            nameInput.oninput = () => { this.teams[index].name = nameInput.value; };
            colorInput.oninput = () => {
                if (colorInput.value === '#000000') {
                    logger.warn('Black color is not allowed for teams.');
                    colorInput.value = this.teams[index].color;
                    return;
                }
                this.teams[index].color = colorInput.value;
            };

            if (removeBtn) {
                removeBtn.onclick = () => this.removeTeam(index);
            }

            this.elements.teamsContainer.appendChild(row);
        });
    }

    hide(transition = true) {
        const target = this.elements.startingScreen.style.display === 'flex' ? this.elements.startingScreen : this.elements.screen;

        if (transition) {
            target.classList.add('fade-out');
            this.elements.gameContainer.classList.add('game-visible');
            setTimeout(() => {
                target.style.display = 'none';
            }, CONFIG.ONBOARDING_TRANSITION_MS);
        } else {
            this.elements.startingScreen.style.display = 'none';
            this.elements.screen.style.display = 'none';
            this.elements.gameContainer.classList.add('game-visible');
            this.elements.gameContainer.style.transition = 'none';
        }
    }
}
