import { logger } from './Logger.js';
import { CONFIG } from '../config.js';

/**
 * Manages the game's data, persistence, and territory ownership.
 */
export class GameState {
    constructor() {
        this.STORAGE_KEY = 'riskuj_final_vFinalOfficial';
        this.teamCount = 0;
        this.activeTeamId = 1;
        this.teamData = [];
        this.usedCells = new Set(); 
        this.conqueredBy = {};      
        this.conqueredPoints = {}; // Klíčové pro ukládání Double Risk bodů
        this.doubleCells = new Set();
        this.goldCells = new Set();
        this.blacklistedCells = new Set();
        this.currentRound = 1;
        this.maxRounds = 0;
    }

        /**
         * Inicializuje nový stav hry pro nové týmy a marker pool.
         */
        initializeNewGame(teams, markerPool) {
            logger.info("Initializing new game state.", { teamsCount: teams.length, poolSize: markerPool.length });
            this.teamCount = teams.length;
            this.teamData = teams.map(t => ({
                name: t.name,
                score: 0,
                color: t.color
            }));
            this.activeTeamId = 1;
            this.usedCells.clear();
            this.conqueredBy = {};
            this.conqueredPoints = {};
            this.blacklistedCells.clear();
            // Výpočet kol: 50 / počet týmů + 3
            this.maxRounds = Math.floor(50 / this.teamCount) + 3;
            this.currentRound = 1;
            logger.info(`Rounds set: ${this.maxRounds} (50/${this.teamCount} + 3)`);
            this.initializeSpecialCells(markerPool);
            this.save();
        }
    save() {
        try {
            const data = {
                teamCount: this.teamCount,
                teamData: this.teamData,
                activeTeamId: this.activeTeamId,
                usedCells: Array.from(this.usedCells),
                conqueredBy: this.conqueredBy,
                conqueredPoints: this.conqueredPoints || {}, // Ukládáme objekt s body
                doubleIndexes: Array.from(this.doubleCells),
                goldIndexes: Array.from(this.goldCells),
                blacklistedCells: Array.from(this.blacklistedCells),
                currentRound: this.currentRound,
                maxRounds: this.maxRounds
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Chyba při ukládání:", e);
        }
    }

    load(totalMarkers, markerPool) {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (!saved) return false;

            const state = JSON.parse(saved);
            
            // Validace: pokud chybí teamData, uložená hra je neplatná
            if (!state.teamData || state.teamData.length === 0) {
                logger.warn("Load: Invalid save data - no teamData. Starting fresh.");
                localStorage.removeItem(this.STORAGE_KEY);
                return false;
            }
            
            this.teamCount = state.teamCount || 0;
            this.teamData = state.teamData || [];
            this.activeTeamId = state.activeTeamId || 1;
            this.usedCells = new Set(state.usedCells || []);
            
            // Načítáme objekty - pozor na názvy!
            this.conqueredBy = state.conqueredBy || {};
            this.conqueredPoints = state.conqueredPoints || {}; 
            
            this.doubleCells = new Set(state.doubleIndexes || []);
            this.goldCells = new Set(state.goldIndexes || []);
            this.blacklistedCells = new Set(state.blacklistedCells || []);
            // Starší save mohl mít jako blacklisted i obsazené pole po neúspěšném útoku.
            // Takové pole zůstává vlastníkovi, takže blacklist zahodíme.
            for (const idx of Array.from(this.blacklistedCells)) {
                if (this.conqueredBy[idx]) this.blacklistedCells.delete(idx);
            }
            this.currentRound = state.currentRound || 1;
            
            // Výpočet kol pokud nejsou uloženy (pro zpětnou kompatibilitu)
            if (!state.maxRounds && this.teamCount > 0) {
                this.maxRounds = Math.floor(50 / this.teamCount) + 3;
            } else {
                this.maxRounds = state.maxRounds || 0;
            }

            logger.info(`Game loaded: ${this.teamCount} teams, round ${this.currentRound}/${this.maxRounds}`);
            return true;
        } catch (e) {
            console.error("Chyba při načítání:", e);
            return false;
        }
    }

    initializeSpecialCells(markerPool) {
        this.doubleCells.clear();
        this.goldCells.clear();
        
        if (!markerPool || markerPool.length === 0) return;

        // Clone pool to manipulate
        let pool = [...markerPool];
        const regionCounts = {}; // Track specials per region


        // 2. Pick Double Risk (Balanced)
        const doubleCount = Math.min(CONFIG.DOUBLE_COUNT || 10, pool.length);
        for (let i = 0; i < doubleCount; i++) {
            // Priority: pool markers in regions with 0 or 1 special cells
            let candidates = pool.filter(m => (regionCounts[m.regionId] || 0) < 2);
            if (candidates.length === 0) candidates = pool; // Fallback to all if quota reached everywhere

            const idx = Math.floor(Math.random() * candidates.length);
            const selected = candidates.splice(idx, 1)[0];
            this.doubleCells.add(selected.index);

            // Remove from pool and track region
            pool = pool.filter(m => m.index !== selected.index);
            regionCounts[selected.regionId] = (regionCounts[selected.regionId] || 0) + 1;
        }

        logger.info(`Initialized special cells: ${this.goldCells.size} Gold, ${this.doubleCells.size} Double.`);
    }

    reset() {
        logger.warn("Performing HARD RESET of game state and settings.");
        localStorage.removeItem(this.STORAGE_KEY);
        // Do not wipe sound settings on general reset
        // localStorage.removeItem('runeterra_volume');
        localStorage.removeItem('runeterra_playback');
        location.reload();
    }

    setTeamName(index, newName) {
        if (this.teamData[index]) {
            this.teamData[index].name = newName;
            this.save();
        }
    }

    addScoreToTeam(teamId, points) {
        if (this.teamData[teamId - 1]) {
            this.teamData[teamId - 1].score += points;
            this.save();
        }
    }

    addScoreToActiveTeam(points) {
        this.addScoreToTeam(this.activeTeamId, points);
    }

    conquer(markerIndex, points) {
        const previousOwner = this.conqueredBy[markerIndex];
        
        // Pokud pole již mělo vlastníka, odeber mu body
        if (previousOwner && previousOwner !== this.activeTeamId) {
            const oldPoints = this.conqueredPoints?.[markerIndex] || points;
            this.addScoreToTeam(previousOwner, -oldPoints);
            logger.info(`Tým ${previousOwner} ztratil ${oldPoints} bodů ve prospěch týmu ${this.activeTeamId}`);
        }
        
        this.conqueredBy[markerIndex] = this.activeTeamId;
        this.usedCells.add(markerIndex);
        this.blacklistedCells.delete(markerIndex);
        
        if (points !== undefined) {
            if (!this.conqueredPoints) this.conqueredPoints = {};
            this.conqueredPoints[markerIndex] = points;
        }
        
        this.save();
    }

    blacklist(markerIndex) {
        this.usedCells.add(markerIndex);
        // Neúspěšný útok nesmí obarvit cizí pole jako černé.
        // Pokud pole vlastníka má, zůstává mu i s body; jen se znovu zpřístupní útok.
        if (this.conqueredBy[markerIndex]) {
            this.blacklistedCells.delete(markerIndex);
        } else {
            this.blacklistedCells.add(markerIndex);
        }
        this.save();
    }

    nextTeam() {
        const wasLastTeam = this.activeTeamId === this.teamCount;
        this.activeTeamId = (this.activeTeamId % this.teamCount) + 1;
        
        // Přechod na kolo když se vracíme k prvnímu týmu
        if (wasLastTeam) {
            this.currentRound++;
            logger.info(`Round changed: ${this.currentRound}/${this.maxRounds}`);
        }
        
        this.save();
    }

    /**
     * Calculates which team owns which region and returns data for leaderboard.
     */
    getTerritoryData(mapManager) {
        const teamRegions = {};
        for (let i = 1; i <= this.teamCount; i++) teamRegions[i] = [];

        mapManager.regions.forEach((region, rIdx) => {
            const regionQuestions = mapManager.questions.filter(q => q && q.region && q.region.toLowerCase() === region.id.toLowerCase());
            if (regionQuestions.length === 0) return;

            let totalQs = 0;
            let answeredQs = 0;
            let teamScores = {};

            region.points.forEach((pt, pIdx) => {
                const qData = regionQuestions.find(q => q.points === pt.pts);
                if (qData) {
                    totalQs++;
                    const index = rIdx * 10 + pIdx;
                    if (this.usedCells.has(index)) {
                        answeredQs++;
                        const teamId = this.conqueredBy[index];
                        if (teamId) teamScores[teamId] = (teamScores[teamId] || 0) + pt.pts;
                    }
                }
            });

            if (totalQs > 0 && answeredQs === totalQs) {
                let maxScore = -1;
                let winningTeamId = null;
                for (const [tId, score] of Object.entries(teamScores)) {
                    if (score > maxScore) { maxScore = score; winningTeamId = parseInt(tId); }
                }
                if (winningTeamId) teamRegions[winningTeamId].push(region);
            }
        });

        return Object.keys(teamRegions).map(tId => ({
            id: parseInt(tId),
            name: this.teamData[tId - 1].name,
            color: this.teamData[tId - 1].color,
            score: this.teamData[tId - 1].score,
            regions: teamRegions[tId]
        }));
    }

    isGameOver(totalCells) {
        // Konec hry když jsou všechny buňky použity NEBO když jsou vyčerpána kola
        const cellsDone = totalCells > 0 && this.usedCells.size >= totalCells;
        const roundsDone = this.currentRound > this.maxRounds;
        return cellsDone || roundsDone;
    }
    
    nextRound() {
        this.currentRound++;
        this.activeTeamId = 1; // Reset na první tým v novém kole
        this.save();
        logger.info(`Round ${this.currentRound}/${this.maxRounds} started`);
    }

    getWinner(territoryData) {
        return territoryData.sort((a, b) => {
            if (b.regions.length !== a.regions.length) return b.regions.length - a.regions.length;
            return b.score - a.score;
        })[0];
    }
}
