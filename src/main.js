import { GameState } from './core/GameState.js?v=blacklisted-attack-v8';
console.log('--- DEBUG: MAIN.JS LOADED (VERSION: CLOUD-FORCE-v3) ---');
import { AudioManager } from './audio/AudioManager.js';
import { UIManager } from './ui/UIManager.js';
import { EffectsManager } from './ui/Effects.js';
import { MapManager } from './ui/MapManager.js';
import { CloudManager } from './ui/CloudManager.js';
import { GameController } from './game/GameController.js?v=blacklisted-attack-v8';
import { OnboardingManager } from './ui/OnboardingManager.js';
import { EffectFactory } from './ui/effects/EffectFactory.js';
import { logger } from './core/Logger.js';
import { CONFIG } from './config.js';

// Global Error Handler
window.addEventListener('error', (event) => {
    logger.error(`Uncaught Error: ${event.message}`, event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    logger.error(`Unhandled Promise Rejection: ${event.reason}`, event.reason);
});

/**
 * Entry point for the application.
 */
async function initApp() {
    // Emergency Reset via URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('reset')) {
        logger.warn("Emergency Reset triggered via URL parameter.");
        localStorage.clear();
        window.location.href = window.location.origin + window.location.pathname;
        return;
    }

    logger.info("Initializing application flow...");
    
    try {
        const gameState = new GameState();
        const audioManager = new AudioManager();
        const uiManager = new UIManager();
        const effectsManager = new EffectsManager();
        const mapManager = new MapManager(document.getElementById('map-container'));
        const cloudManager = new CloudManager(document.getElementById('map-container'));
        
        const effectContainer = document.getElementById('map-container');
        const effectFactory = new EffectFactory(effectContainer);
        
        // Setup Global App Object for cross-manager access
        window.app = {
            gameState,
            audioManager,
            uiManager,
            effectsManager,
            mapManager,
            cloudManager,
            effectFactory
        };

        mapManager.cloudManager = cloudManager; // Attach for persistence
        cloudManager.init();
        cloudManager.start();
        
        const gameController = new GameController(
            gameState, 
            audioManager, 
            uiManager, 
            effectsManager, 
            mapManager
        );

        // Pre-load data
        await mapManager.loadData();

        // Calculate total playable markers
        const totalMarkers = gameController.getTotalPlayableMarkers();
        logger.debug(`Total playable markers: ${totalMarkers}`);
        
        // Resume or Start Onboarding
        const hasSavedGame = gameState.load(totalMarkers, mapManager.getMarkerPool());
        logger.info(`Save check result: ${hasSavedGame ? 'LOADED' : 'NEW GAME'}`);

        // Background music start on first interaction
        const startBGM = () => {
            audioManager.playBackgroundMusic();
            document.removeEventListener('click', startBGM);
        };
        document.addEventListener('click', startBGM);

        if (hasSavedGame) {
            logger.info("Resuming saved game state.");
            try {
                const onboarding = new OnboardingManager(() => {});
                onboarding.hide(false);
            } catch(e) {
                logger.error("Failed to create onboarding for saved game:", e);
            }
            logger.info("Calling gameController.init(false)...");
            await gameController.init(false);
            logger.info("gameController.init completed");
        } else {
            logger.info("Starting new game setup.");
            try {
                logger.info("Creating OnboardingManager...");
                const onboarding = new OnboardingManager(async (teams) => {
                    logger.info("onStart callback triggered with teams:", teams);
                    const markerPool = mapManager.getMarkerPool();
                    gameState.initializeNewGame(teams, markerPool);
                    
                    logger.info("Calling gameController.init(true)...");
                    // The init(true) will manage the cinematic splash coverage
                    await gameController.init(true);
                    logger.info("gameController.init(true) completed");
                    
                    // Hide onboarding immediately while splash is covering
                    onboarding.hide(false);
                });
                logger.info("OnboardingManager created successfully");
            } catch(e) {
                logger.error("Failed to create onboarding for new game:", e);
                alert("Chyba při načítání: " + e.message);
            }
        }
    } catch (e) {
        logger.error("Failed to initialize application.", e);
    }
}

// Global initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
