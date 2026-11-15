import { logger } from '../core/Logger.js';
import { CONFIG } from '../config.js';

/**
 * Orchestrates the game flow, rules, timers, and territory conquest.
 */
export class GameController {
    constructor(gameState, audioManager, uiManager, effectsManager, mapManager) {
        this.gameState = gameState;
        this.audioManager = audioManager;
        this.uiManager = uiManager;
        this.effectsManager = effectsManager;
        this.mapManager = mapManager;

        this.currentPoints = 0;
        this.activeCell = null;
        this.isRevealed = false;
        this.timeLeft = CONFIG.MAX_QUESTION_TIME;
        this.MAX_TIME = CONFIG.MAX_QUESTION_TIME;
        this.timerInterval = null;
        this.savedQuestion = { q: "", a: "", pts: 0, cat: "" };
        this.usedAttackQuestions = new Set(); // Sleduje použité attack otázky
    }

    async init(isNewGame = false) {
        logger.info("GameController.init started, isNewGame:", isNewGame);
        this.mapManager.gameState = this.gameState;
        
        // Reset použitých attack otázek při nové hře
        if (isNewGame) {
            this.usedAttackQuestions.clear();
            logger.info("Resetovány použité attack otázky");
        }
        
        logger.info("gameState attached to mapManager");

        // Render game UI (Teams, Leaderboard) immediately 
        // to ensure they are ready under the splash
        logger.info("Calling render()...");
        this.render();
        logger.info("render() completed");

        if (isNewGame) {
            logger.info("Showing world intro splash...");
            // Cinematic Grand Opening
            await this.mapManager.showWorldIntroSplash(
                (marker) => this.handleMarkerClick(marker),
                (region) => this.handleRegionClick(region)
            );
            logger.info("Intro splash completed");
        } else {
            logger.info("Calling renderMap()...");
            // Standard Load
            this.renderMap();
            logger.info("renderMap() completed");
        }

        this._setupSettingsListeners();
        this._setupKeyboardListeners();
        this._setupModalListeners();

        logger.info("GameController init completed.");
    }

    renderMap(isIntro = false) {
        this.mapManager.render(
            (marker) => this.handleMarkerClick(marker),
            (region) => this.handleRegionClick(region),
            isIntro
        );
        this.refreshUsedMarkers();
        this.updateMusic();

        // Ensure clouds are still on top
        if (this.mapManager.cloudManager) {
            this.mapManager.cloudManager.ensurePresent();
        }
    }

    handleRegionClick(region) {
        if (region) {
            logger.info(`Region entered: ${region.name}`);
            if (this.mapManager.cloudManager) this.mapManager.cloudManager.stop();
            // TRIGGER THE REGIONAL EFFECT
            if (window.app?.effectFactory) {
                window.app.effectFactory.createEffect(region.id);
            }
        } else {
            logger.info("Returned to world map.");
            if (this.mapManager.cloudManager) this.mapManager.cloudManager.start();

            // TOTAL PURGE: Hard reset all styles and elements
            if (window.app?.effectFactory) window.app.effectFactory.clear();

            const container = document.querySelector('.region-effects-container');
            if (container) {
                container.innerHTML = '';
                container.style.backgroundColor = 'transparent';
                container.style.filter = 'none';
            }

            // Reset global theme color just in case it was changed
            document.documentElement.style.setProperty('--accent-gold', '#c89b3c');
        }

        this.refreshUsedMarkers();
        this.updateMusic();

        // Ensure clouds are still on top
        if (this.mapManager.cloudManager) {
            this.mapManager.cloudManager.ensurePresent();
        }
    }

    updateMusic() {
        // No longer stopping all music here to avoid stutters; play methods handle the swap
        if (this.mapManager.currentView === 'world') {
            this.audioManager.playBackgroundMusic();
        } else if (this.mapManager.activeRegion) {
            this.audioManager.playRegionalTheme(this.mapManager.activeRegion.id);
        }
    }

    handleMarkerClick(marker) {
        if (this.uiManager.elements.modal.style.display === 'flex') return;

        const type = marker.dataset.type;
        const pts = parseInt(marker.dataset.pts);
        const index = parseInt(marker.dataset.index);

        // POVOLIT dobývání i již dobytých políček
        // if (this.gameState.usedCells.has(index)) return;

        // --- ZJISTIT, ZDA JDE O ÚTOK NA CIZÍ POLE NEBO VLASTNÍ POLE ---
        const currentOwner = this.gameState.conqueredBy[index];
        const isOwnField = currentOwner === this.gameState.activeTeamId;
        const isAttack = currentOwner && currentOwner !== this.gameState.activeTeamId;
        const isBlacklisted = this.gameState.blacklistedCells.has(index);
        const isAttackAttempt = isAttack || isBlacklisted;

        // Blokovat kliknutí na vlastní již dobyté pole
        if (isOwnField) {
            logger.info("Vlastní pole - nelze znovu dobýt");
            return;
        }

        // Útoky na cizí pole a opakování černých polí jsou povolené od poloviny hry
        if (isAttack || isBlacklisted) {
            const halfRound = Math.ceil(this.gameState.maxRounds / 2);
            if (this.gameState.currentRound < halfRound) {
                logger.info(`Útok nebo opakování černého pole možné až od kola ${halfRound} (aktuální: ${this.gameState.currentRound})`);
                this.uiManager.showToast(`Útoky a opakování černých polí jsou možné až od kola ${halfRound}!`);
                return;
            }
        }

        let q = "";
        let a = "";
        let cat = "";

        // --- LOGIKA: ÚTOK vs NORMÁLNÍ DOBÝVÁNÍ ---
        if (isAttackAttempt) {
            // === ÚTOK NA CIZÍ NEBO ČERNÉ POLE - použij attack questions ===
            // Použij uložené body z conqueredPoints (včetně double), ne původní
            const storedPoints = this.gameState.conqueredPoints?.[index] || pts;
            logger.info(`Útok na pole ${index} s ${storedPoints} body (původně ${pts})`);

            // Urči obtížnost podle uložených bodů
            let difficulty = 'easy';
            if (storedPoints >= 400 && storedPoints <= 600) {
                difficulty = 'medium';
            } else if (storedPoints >= 700) {
                difficulty = 'hard';
            }

            // Získej pool nepoužitých otázek podle obtížnosti
            const allAttackQuestions = this.mapManager.attackQuestions[difficulty] || [];
            const availableQuestions = allAttackQuestions.filter((_, idx) => 
                !this.usedAttackQuestions.has(`${difficulty}-${idx}`)
            );

            if (availableQuestions.length > 0) {
                // Najdi originální index pro sledování
                const randomIdx = Math.floor(Math.random() * availableQuestions.length);
                const originalIndex = allAttackQuestions.indexOf(availableQuestions[randomIdx]);
                
                q = availableQuestions[randomIdx].question;
                a = availableQuestions[randomIdx].answer;
                cat = isBlacklisted ? "ÚTOK NA ČERNÉ POLE" : "ÚTOK NA CIZÍ POLE";
                this.usedAttackQuestions.add(`${difficulty}-${originalIndex}`);
                logger.info(`Vybrána attack otázka: ${difficulty}, použito ${this.usedAttackQuestions.size}`);
            } else {
                logger.warn(`Žádné attack questions pro obtížnost: ${difficulty}`);
                // Fallback na normální otázku
                q = marker.dataset.q || "Chybí attack otázka";
                a = marker.dataset.a || "---";
                cat = "FALLBACK";
            }
        } else {
            // === NORMÁLNÍ DOBÝVÁNÍ - vždy přesně otázka přiřazená markeru ===
            // Žádný náhodný výběr z okolních bodů: jinak se může znovu objevit
            // už zodpovězená otázka nebo otázka z jiné pozice.
            q = marker.dataset.q || "";
            a = marker.dataset.a || "";
            cat = marker.dataset.category || "";
        }

        // Při útoku použij uložené body (včetně double), jinak původní
        const finalPoints = isAttackAttempt ? (this.gameState.conqueredPoints?.[index] || pts) : pts;
        this.openQuestion(marker, q, a, finalPoints, cat, isAttackAttempt);
    }

    refreshUsedMarkers() {
        const markers = document.querySelectorAll('.marker');
        markers.forEach(marker => {
            const idx = parseInt(marker.dataset.index);
            if (this.gameState.usedCells.has(idx)) {
                marker.classList.add('used');
                const teamId = this.gameState.conqueredBy[idx];
                const isBlacklisted = this.gameState.blacklistedCells.has(idx);
                const halfRound = Math.ceil(this.gameState.maxRounds / 2);
                marker.classList.toggle('blacklisted', isBlacklisted);
                marker.classList.toggle('reclaimable', isBlacklisted && this.gameState.currentRound >= halfRound);
                if (teamId) {
                    const color = this.gameState.teamData[teamId - 1].color;
                    marker.classList.add('conquered');
                    marker.style.setProperty('--team-color', color);
                    marker.style.backgroundColor = color;
                } else if (isBlacklisted) {
                    marker.style.backgroundColor = '#000000';
                    marker.style.color = '#ffffff';
                    marker.style.borderColor = '#333333';
                    marker.style.opacity = '1';
                }
            }
        });
    }

    _setupSettingsListeners() {
        const resetBtn = document.getElementById('btn-reset-sidebar');
        if (resetBtn) resetBtn.onclick = () => this.gameState.reset();

        const backToMapBtn = document.getElementById('btn-back-to-map');
        if (backToMapBtn) {
            backToMapBtn.onclick = () => {
                this.mapManager.currentView = 'world';
                this.mapManager.activeRegion = null;

                if (window.app?.effectFactory) window.app.effectFactory.clear();
                if (window.app?.cloudManager) window.app.cloudManager.start();

                this.renderMap();
                this.handleRegionClick(null);
            };
        }
    }

    _setupKeyboardListeners() {
        window.addEventListener('keydown', (e) => {
            // Edit Mode Toggle
            if (e.key.toLowerCase() === 'e' && this.uiManager.elements.modal.style.display !== 'flex') {
                const active = this.mapManager.toggleEditMode();
                this.renderMap();
                if (!active) this.mapManager.exportPositions();
                return;
            }

            // Modal Interactions
            if (this.uiManager.elements.modal.style.display === 'flex') {
                if (e.key === "Escape") {
                    this.closeModalManually();
                    return;
                }
                if (e.code === "Space" && !this.isRevealed) {
                    e.preventDefault();
                    this.revealAnswer();
                    return;
                }
                if (this.isRevealed) {
                    if (e.key.toLowerCase() === "v") this.judge(true);
                    if (e.key.toLowerCase() === "n") this.judge(false);
                }
            } else if (e.key === "Escape" && this.mapManager.currentView === 'region') {
                // Return to world map
                this.mapManager.currentView = 'world';
                this.mapManager.activeRegion = null;
                this.renderMap();
                this.handleRegionClick(null);
            }
        });
    }

    closeModalManually() {
        if (this.uiManager.elements.questionText.classList.contains('gold-brick-active')) return;
        clearInterval(this.timerInterval);
        this.audioManager.stopMilionar();
        this.uiManager.hideModal();
        this.isRevealed = false;
        this.activeCell = null;
        this.updateMusic();
    }

    _setupModalListeners() {
        document.getElementById('btn-double-yes').onclick = () => this.confirmDouble(true);
        document.getElementById('btn-double-no').onclick = () => this.confirmDouble(false);
        document.getElementById('btn-judge-correct').onclick = () => this.judge(true);
        document.getElementById('btn-judge-wrong').onclick = () => this.judge(false);
        document.getElementById('btn-restart').onclick = () => this.gameState.reset();
        
        const reviewBtn = document.getElementById('btn-review-map');
        if (reviewBtn) {
            reviewBtn.onclick = () => {
                this.uiManager.elements.winnerScreen.style.display = 'none';
            };
        }
    }

    changeTeamCount(delta) {
        this.gameState.teamCount = Math.max(1, Math.min(6, this.gameState.teamCount + delta));
        this.render();
    }

    handleManualScore(teamId, isPlus) {
        const points = isPlus ? 100 : -100;
        this.gameState.addScoreToTeam(teamId, points);
        this.render();
    }

    handleTeamSelect(teamId) {
        this.gameState.activeTeamId = teamId;
        this.render();
    }

    handleNameChange(index, newName) {
        this.gameState.setTeamName(index, newName);
        this.render();
    }

    render() {
        const territoryData = this.gameState.getTerritoryData(this.mapManager);
        this.uiManager.renderTeams(
            this.gameState,
            (tid, pos) => this.handleManualScore(tid, pos),
            (tid) => this.handleTeamSelect(tid),
            (idx, name) => this.handleNameChange(idx, name)
        );
        this.uiManager.renderLeaderboard(territoryData);
        this.checkGameOver(territoryData);
    }

    getTotalPlayableMarkers() {
        let count = 0;
        this.mapManager.regions.forEach(region => {
            const regionQuestions = this.mapManager.questions.filter(q => q.region.toLowerCase() === region.id.toLowerCase());
            if (region.points) {
                region.points.forEach(pt => {
                    if (regionQuestions.find(q => q.points === pt.pts)) count++;
                });
            }
        });
        return count;
    }

    checkGameOver(territoryData) {
        const totalMarkers = this.getTotalPlayableMarkers();
        if (this.gameState.isGameOver(totalMarkers)) {
            const winner = this.gameState.getWinner(territoryData);
            this.uiManager.showWinner(winner.name, winner.color);
            this.effectsManager.triggerGoldBrickEffect();
        }
    }

    openQuestion(marker, q, a, pts, cat, isAttack = false) {
        const index = parseInt(marker.dataset.index);
        this.activeCell = marker;
        this.savedQuestion = { q, a, pts, cat, isAttack, index };
        this.isRevealed = false;
        this.uiManager.resetModalUI();
        this.uiManager.showModal();
        this.uiManager.elements.doubleRiskButtons.style.display = 'none';

        // 1. Check for Gold Brick (Hidden Reward)
        if (this.gameState.goldCells.has(index)) {
            this.triggerGoldBrick(marker, pts);
            return;
        }

        // 2. Double Risk: i pro černé (neobsazené) pole, ne pro obsazená cizí pole.
        // Obsazené pole se přebírá útokem za uložené body, tam se double znovu nepočítá.
        if (!this.gameState.conqueredBy[index] && this.gameState.doubleCells.has(index)) {
            this.uiManager.elements.questionText.innerHTML = `
                <div class="q-category">DOUBLE RISK</div>
                <div class="q-content">Chceš hrát o ${pts * 2} bodů?</div>
            `;
            this.uiManager.elements.doubleRiskButtons.style.display = 'flex';
            if (isAttack) this._renderAttackWarning(index, pts);
        } else {
            this.confirmDouble(false);
        }
    }

    _renderAttackWarning(index, pts) {
        const attackWarning = document.createElement('div');
        attackWarning.className = 'attack-warning';

        const ownerId = this.gameState.conqueredBy[index];
        if (ownerId) {
            const ownerName = this.gameState.teamData[ownerId - 1]?.name || `č. ${ownerId}`;
            attackWarning.textContent = `Dobýváš pole týmu ${ownerName}`;
        } else {
            attackWarning.textContent = `Dobýváš černé pole za ${pts} bodů`;
        }

        const questionText = this.uiManager.elements.questionText;
        if (questionText) {
            questionText.insertBefore(attackWarning, questionText.firstChild);
        }
    }

    confirmDouble(isDouble) {
        this.currentPoints = isDouble ? this.savedQuestion.pts * 2 : this.savedQuestion.pts;
        this.uiManager.elements.doubleRiskButtons.style.display = 'none';
        this.uiManager.setQuestion(this.savedQuestion.q, this.savedQuestion.cat);
        if (this.savedQuestion.isAttack) {
            this._renderAttackWarning(this.savedQuestion.index, this.savedQuestion.pts);
        }
        if (isDouble) {
            const content = this.uiManager.elements.questionText.querySelector('.q-content');
            content.innerHTML = "DOUBLE: " + content.innerHTML;
        }
        this.uiManager.elements.answerDisplay.innerHTML = this.savedQuestion.a;
        this.audioManager.playMilionar();
        this.startTimer();
    }

    startTimer() {
        this.timeLeft = this.MAX_TIME;
        this.uiManager.updateTimer(this.timeLeft, 1);
        clearInterval(this.timerInterval);
        
        const updateFrequency = 50; // ms
        this.timerInterval = setInterval(() => {
            this.timeLeft -= (updateFrequency / 1000);
            
            const displayTime = Math.max(0, this.timeLeft);
            const percent = Math.max(0, this.timeLeft / this.MAX_TIME);
            
            this.uiManager.updateTimer(displayTime, percent);
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.timeLeft = 0;
            }
            
            // Still play countdown sound on whole seconds
            const currentSec = Math.ceil(this.timeLeft);
            if (currentSec <= 3 && currentSec > 0 && Math.abs(this.timeLeft - currentSec) < 0.05) {
                this.audioManager.playCountdown();
            }
        }, updateFrequency);
    }

    triggerGoldBrick(marker, pts) {
        this.activeCell = marker;
        this.currentPoints = pts;
        this.uiManager.resetModalUI();
        const activeTeam = this.gameState.teamData[this.gameState.activeTeamId - 1];

        this.uiManager.elements.questionText.innerHTML = `
            ZLATÁ LOKACE<br><br>
            +${pts} BODŮ PRO TÝM ${activeTeam.name.toUpperCase()}
        `;
        this.uiManager.elements.questionText.classList.add('gold-brick-active');
        this.uiManager.showModal();

        this.audioManager.playGold();
        this.effectsManager.triggerGoldBrickEffect();

        setTimeout(() => {
            if (this.uiManager.elements.modal.style.display === 'none') return;
            this.gameState.addScoreToActiveTeam(pts);
            this.conquerCurrentMarker();
            this.gameState.nextTeam();
            this.uiManager.hideModal();
            this.isRevealed = false;
            this.render();
            this.updateMusic();
        }, 3500);
    }

    revealAnswer() {
        if (this.uiManager.elements.doubleRiskButtons.style.display === 'flex') return;
        this.isRevealed = true;
        this.uiManager.elements.answerDisplay.style.display = 'block';
        this.uiManager.elements.judgmentButtons.style.display = 'flex';
        clearInterval(this.timerInterval);
    }

    judge(correct) {
        const index = parseInt(this.activeCell.dataset.index);
        this.audioManager.stopMilionar();

        if (correct) {
            this.audioManager.playCorrect();
            this.effectsManager.triggerCorrect();
            this.gameState.addScoreToActiveTeam(this.currentPoints);
            this.conquerCurrentMarker();
            this.uiManager.hideModal();
        } else {
            this.audioManager.playWrong();
            this.effectsManager.triggerWrong();
            this.gameState.addScoreToActiveTeam(-this.currentPoints);
            this.gameState.blacklist(index);
            this.uiManager.hideModal(true);
        }

        this.gameState.nextTeam();
        this.refreshUsedMarkers();
        this.activeCell = null;
        this.render();
        this.updateMusic();
    }

    conquerCurrentMarker() {
        if (this.activeCell) {
            const index = parseInt(this.activeCell.dataset.index);
            
            // Zásadní oprava: přidán druhý parametr this.currentPoints
            this.gameState.conquer(index, this.currentPoints);

            const pointsDisplay = this.activeCell.querySelector('.marker-points');
            if (pointsDisplay) {
                pointsDisplay.innerText = this.currentPoints;
            }
        }
    }
}