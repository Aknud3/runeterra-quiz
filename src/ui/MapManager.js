import { logger } from '../core/Logger.js';
import { CONFIG } from '../config.js';

/**
 * Manages the interactive map, region zooming, markers, and data loading.
 */
export class MapManager {
    constructor(mapContainer) {
        this.container = mapContainer;
        this.mapImage = document.getElementById('runeterra-map');
        this.isEditMode = false;
        this.draggedElement = null;
        this.onDragUpdate = null;

        this.currentView = 'world';
        this.activeRegion = null;
        this.questions = [];
        this.attackQuestions = { easy: [], medium: [], hard: [] };
        this.gameState = null; 

        // Clone regions from config and ensure they have default points
        this.regions = JSON.parse(JSON.stringify(CONFIG.INITIAL_REGIONS)).map(region => ({
            ...region,
            points: region.points || this._generateDefaultPoints(10)
        }));

        window.addEventListener('mousemove', (e) => this.handleGlobalMouseMove(e));
        window.addEventListener('mouseup', () => this.handleGlobalMouseUp());
        logger.debug("MapManager initialized.");
    }

    async loadData() {
        logger.info("Loading map data...");
        try {
            const qResp = await fetch('src/data/questions.json');
            if (qResp.ok) {
                this.questions = await qResp.json();
                logger.info(`Successfully loaded ${this.questions.length} questions.`);
            } else {
                logger.error(`Failed to load questions.json: ${qResp.status}`);
            }

            const pResp = await fetch('src/data/positions.json');
            if (pResp.ok) {
                const savedRegions = await pResp.json();
                savedRegions.forEach(saved => {
                    const local = this.regions.find(r => r.id === saved.id);
                    if (local) {
                        if (saved.labelPos) local.labelPos = saved.labelPos;
                        if (saved.labelPos2) local.labelPos2 = saved.labelPos2;
                        if (saved.points) local.points = saved.points;
                        if (saved.img) local.img = saved.img;
                    }
                });
            }

            // Načtení attack questions
            const aResp = await fetch('src/data/attack_questions.json');
            if (aResp.ok) {
                this.attackQuestions = await aResp.json();
                logger.info(`Loaded attack questions: ${this.attackQuestions.easy.length} easy, ${this.attackQuestions.medium.length} medium, ${this.attackQuestions.hard.length} hard`);
            } else {
                logger.error(`Failed to load attack_questions.json: ${aResp.status}`);
            }
        } catch (e) { 
            logger.error("Data loading failed.", e); 
        }
    }

    _generateDefaultPoints(count) {
        return Array.from({length: count}, (_, i) => ({
            pts: (i + 1) * 100,
            x: 10 + (Math.random() * 80),
            y: 10 + (Math.random() * 80)
        }));
    }

    /**
     * Returns a flat list of all markers that have associated questions.
     * Used for balanced distribution of special game mechanics.
     */
    getMarkerPool() {
        const pool = [];
        this.regions.forEach((region, rIdx) => {
            const regionQuestions = this.questions.filter(q => q && q.region && q.region.toLowerCase() === region.id.toLowerCase());
            
            region.points.forEach((pt, pIdx) => {
                const qData = regionQuestions.find(q => q.points === pt.pts);
                if (qData || this.isEditMode) {
                    pool.push({
                        index: rIdx * 10 + pIdx,
                        points: pt.pts,
                        regionId: region.id
                    });
                }
            });
        });
        return pool;
    }

    render(onMarkerClick, onRegionClick) {
        // Clear previous elements
        this.container.querySelectorAll('.marker, .region-label, .back-btn, .region-topic-header').forEach(el => el.remove());

        if (this.currentView === 'world') {
            this._renderWorldView(onMarkerClick, onRegionClick);
        } else {
            this._renderRegionView(onMarkerClick, onRegionClick);
        }
    }

    _renderWorldView(onMarkerClick, onRegionClick) {
        this.mapImage.style.opacity = '0.8';
        this.mapImage.style.transform = 'none';
        this.mapImage.src = CONFIG.ASSETS.DEFAULT_MAP;

        // Notify UI about back button
        if (window.app?.uiManager?.setBackToMapVisibility) {
            window.app.uiManager.setBackToMapVisibility(false);
        }

        const territoryData = this.gameState ? this.gameState.getTerritoryData(this) : [];

        this.regions.forEach((region) => {
            const regionQuestions = this.questions.filter(q => q && q.region && q.region.toLowerCase() === region.id.toLowerCase());
            if (regionQuestions.length === 0 && !this.isEditMode) return;

            const regionOwner = territoryData.find(d => d.regions.some(r => r.id === region.id));
            const isCompleted = !!regionOwner;
            const winnerColor = regionOwner ? regionOwner.color : null;

            if (region.id === 'piltover_and_zaun') {
                this._createLabel(region, region.labelPos, 'P', 'circle-p', isCompleted, winnerColor, onMarkerClick, onRegionClick, (x, y) => region.labelPos = { x, y }, region.color);
                this._createLabel(region, region.labelPos2, 'Z', 'circle-z', isCompleted, winnerColor, onMarkerClick, onRegionClick, (x, y) => region.labelPos2 = { x, y }, region.color2);
            } else {
                this._createLabel(region, region.labelPos, region.name, '', isCompleted, winnerColor, onMarkerClick, onRegionClick, (x, y) => region.labelPos = { x, y }, region.color);
            }
        });
    }

    _createLabel(region, pos, name, extraClass, isCompleted, winnerColor, onMarkerClick, onRegionClick, onDrag, color) {
        const label = document.createElement('div');
        label.className = `region-label world-view ${this.isEditMode ? 'edit-mode' : 'blank-mode'} ${extraClass}`;
        label.dataset.regionId = region.id;
        if (isCompleted) label.classList.add('completed');
        label.innerHTML = `<span>${name}</span>`;
        label.style.left = `${pos.x}%`;
        label.style.top = `${pos.y}%`;

        if (color) label.style.setProperty('--region-border-color', color);
        if (isCompleted && winnerColor) label.style.setProperty('--region-color', winnerColor);

        if (this.isEditMode) {
            label.onmousedown = (e) => {
                this.draggedElement = label;
                this.onDragUpdate = onDrag;
                e.stopPropagation();
            };
        } else {
            label.onclick = () => this.enterRegion(region, onMarkerClick, onRegionClick);
            label.onmouseenter = () => this.container.querySelectorAll(`.region-label[data-region-id="${region.id}"]`).forEach(el => el.classList.add('hover-linked'));
            label.onmouseleave = () => this.container.querySelectorAll(`.region-label[data-region-id="${region.id}"]`).forEach(el => el.classList.remove('hover-linked'));
        }
        this.container.appendChild(label);
    }

    _renderRegionView(onMarkerClick, onRegionClick) {
        const region = this.activeRegion;
        this.mapImage.style.opacity = '1';
        this.mapImage.style.transform = 'none';
        this.mapImage.src = region.img;

        // Notify UI about back button
        if (window.app?.uiManager?.setBackToMapVisibility) {
            window.app.uiManager.setBackToMapVisibility(true);
        }

        const regionQuestions = this.questions.filter(q => q && q.region && q.region.toLowerCase() === region.id.toLowerCase());
        
        // Markers
        const rIdx = this.regions.findIndex(r => r.id === region.id);
        if (region.points) {
            region.points.forEach((pt, pIdx) => {
                const qData = regionQuestions.find(q => q.points === pt.pts);
                if (!qData && !this.isEditMode) return;
                
                this._createMarker(pt, rIdx * 10 + pIdx, region, qData, onMarkerClick);
            });
        }
    }

    _createMarker(pt, index, region, qData, onMarkerClick) {
        const isUsed = this.gameState.usedCells.has(index);
        const teamId = this.gameState.conqueredBy[index];

        // --- DIAGNOSTIKA (uvidíš v konzoli F12) ---
        console.log(`Vykresluji marker ${index}:`, {
            v_pameti: this.gameState.conqueredPoints ? this.gameState.conqueredPoints[index] : "není v paměti",
            puvodni: pt.pts
        });

        // LOGIKA PRO BODY:
        // 1. Podíváme se do conqueredPoints v gameState
        // 2. Pokud tam nic není, vezmeme body přímo z objektu bodu (pt.pts)
        let displayPoints = pt.pts; 
        if (this.gameState.conqueredPoints && this.gameState.conqueredPoints[index] !== undefined) {
            displayPoints = this.gameState.conqueredPoints[index];
        }

        const marker = document.createElement('div');
        marker.className = 'marker';
        if (isUsed) marker.classList.add('used');
        if (teamId) {
            marker.classList.add('conquered');
            marker.style.setProperty('--team-color', this.gameState.teamData[teamId - 1].color);
            marker.style.color = "#ffffff";
        }

        marker.dataset.pts = pt.pts;
        marker.dataset.type = pt.type || (qData?.type || 'question');
        marker.dataset.index = index;
        marker.dataset.q = qData?.question || `Missing question for ${region.name} ${pt.pts}`;
        marker.dataset.a = qData?.answer || "Missing answer";
        marker.dataset.category = qData?.category || "Unknown";

        let hintText = marker.dataset.category.toUpperCase();
        if (hintText.length > 5) hintText = hintText.substring(0, 4) + '.';

        marker.innerHTML = `
            <div class="marker-category-hint">${hintText}</div>
            <div class="marker-points">${displayPoints}</div>
        `;

        marker.style.left = `${pt.x}%`;
        marker.style.top = `${pt.y}%`;

        if (this.isEditMode) {
            marker.onmousedown = (e) => {
                this.draggedElement = marker;
                this.onDragUpdate = (x, y) => { pt.x = x; pt.y = y; };
                e.stopPropagation();
            };
        } else {
            marker.onclick = () => onMarkerClick(marker);
        }
        this.container.appendChild(marker);
    }

    async enterRegion(region, onMarkerClick, onRegionClick) {
        logger.info(`Initiating cinematic entrance for: ${region.id}`);
        
        // 1. Update state FIRST
        this.currentView = 'region';
        this.activeRegion = region;

        // 2. Immediately start regional audio
        if (window.app?.audioManager) {
            window.app.audioManager.playRegionalTheme(region.id);
        }

        // 3. Prepare & Show Splash (waits for preloading + handles render/effects)
        await this.showRegionSplash(region, onMarkerClick, onRegionClick);
    }

    async showRegionSplash(region, onMarkerClick, onRegionClick) {
        const splash = document.getElementById('region-splash');
        const splashBg = document.getElementById('region-splash-bg');
        const splashVid = document.getElementById('region-splash-video');

        if (!splash) return;

        // --- STEP A: INSTANT BLACK COVER ---
        splash.style.transition = 'none';
        splash.style.opacity = '1';
        splash.style.visibility = 'visible';
        splash.classList.add('active'); 
        if (window.app?.cloudManager) window.app.cloudManager.stop(true);

        // Reset elements
        splashVid.classList.remove('active');
        splashBg.style.display = 'block';
        splashBg.style.opacity = '0'; 
        splashVid.pause();

        // --- STEP B: PARALLEL PRELOADING ---
        const asset = region.splashAsset || region.img;
        const isVideo = asset.toLowerCase().endsWith('.webm') || asset.toLowerCase().endsWith('.mp4');

        // Safety Timeout (5s) for the whole preloading phase
        let timeoutFired = false;
        const safetyTimeout = new Promise(resolve => setTimeout(() => {
            timeoutFired = true;
            resolve();
        }, 5000));

        // Create a min-duration timer
        const minTimer = new Promise(resolve => setTimeout(resolve, 1500));
        
        // Preload Region Map
        const mapPreload = this._preloadImage(region.img);

        // Preload Splash Asset
        let assetPreload;
        if (isVideo) {
            assetPreload = new Promise((resolve) => {
                const onReady = () => {
                    splashVid.oncanplaythrough = null;
                    splashVid.onloadeddata = null;
                    resolve();
                };
                
                if (splashVid.readyState >= 3 && splashVid.src.includes(asset)) {
                    return onReady();
                }

                splashVid.oncanplaythrough = onReady;
                splashVid.onloadeddata = onReady; 
                splashVid.onerror = () => {
                    logger.error("Video load failed");
                    resolve();
                };
                splashVid.src = asset;
                splashVid.load();
            });
        } else {
            assetPreload = this._preloadImage(asset);
        }

        // --- STEP C: WAIT FOR ASSET OR TIMEOUT ---
        await Promise.race([assetPreload, safetyTimeout]);
        
        if (isVideo && !timeoutFired) {
            splashVid.classList.add('active');
            splashBg.style.display = 'none';
            splashVid.play().catch(e => logger.warn("Autoplay blocked", e));
        } else if (!isVideo) {
            splashBg.style.backgroundImage = `url('${asset}')`;
            splashBg.style.opacity = '1';
        }

        // --- STEP D: WAIT FOR BACKGROUND MAP & MIN TIMER ---
        await Promise.all([mapPreload, minTimer, Promise.race([assetPreload, safetyTimeout])]);

        // --- STEP E: SWAP MAP, EFFECTS & MARKERS UNDERNEATH ---
        this.render(onMarkerClick, onRegionClick);
        
        if (window.app?.effectFactory) window.app.effectFactory.createEffect(region.id);
        
        if (onRegionClick) onRegionClick(region);

        return new Promise(resolve => {
            setTimeout(() => {
                splash.style.transition = 'opacity 1s ease-in-out';
                splash.classList.remove('active');
                splash.style.opacity = '0';
                
                setTimeout(() => {
                    splash.style.visibility = 'hidden';
                    resolve();
                }, 1000);
            }, 800); 
        });
    }

    async showWorldIntroSplash(onMarkerClick, onRegionClick) {
        const splash = document.getElementById('region-splash');
        const splashBg = document.getElementById('region-splash-bg');
        const splashVid = document.getElementById('region-splash-video');

        if (!splash) return;

        // --- STEP A: INSTANT COVER ---
        splash.style.transition = 'none';
        splash.style.opacity = '1';
        splash.style.visibility = 'visible';
        splash.classList.add('active'); 

        // Reset elements
        splashVid.classList.remove('active');
        splashBg.style.display = 'block';
        splashBg.style.opacity = '1'; 
        splashBg.style.backgroundImage = "url('assets/img/onboarding.jpg')";
        splashVid.pause();

        // Start Music
        if (window.app?.audioManager) {
            window.app.audioManager.playBackgroundMusic();
        }

        // --- STEP B: INITIALIZE MAP IN BACKGROUND ---
        // Render all elements immediately
        this.render(onMarkerClick, onRegionClick);

        // --- STEP C: CINEMATIC DELAY ---
        await new Promise(resolve => setTimeout(resolve, 1500));

        // --- STEP D: FADE OUT ---
        return new Promise(resolve => {
            splash.style.transition = 'opacity 1.5s ease-in-out';
            splash.classList.remove('active');
            splash.style.opacity = '0';
            
            setTimeout(() => {
                splash.style.visibility = 'hidden';
                resolve();
            }, 1500);
        });
    }

    _preloadImage(url) {
        return new Promise((resolve) => {
            if (!url) return resolve();
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => {
                logger.error(`Failed to preload image: ${url}`);
                resolve(); 
            };
            img.src = url;
            // If already cached
            if (img.complete) resolve();
        });
    }

    handleGlobalMouseMove(e) {
        if (!this.draggedElement) return;
        const rect = this.container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const boundedX = Math.max(0, Math.min(100, x));
        const boundedY = Math.max(0, Math.min(100, y));
        this.draggedElement.style.left = `${boundedX.toFixed(2)}%`;
        this.draggedElement.style.top = `${boundedY.toFixed(2)}%`;
        if (this.onDragUpdate) this.onDragUpdate(parseFloat(boundedX.toFixed(2)), parseFloat(boundedY.toFixed(2)));
    }

    handleGlobalMouseUp() { 
        this.draggedElement = null; 
        this.onDragUpdate = null; 
    }

    toggleEditMode() { 
        this.isEditMode = !this.isEditMode; 
        return this.isEditMode; 
    }

    exportPositions() {
        try {
            const data = JSON.stringify(this.regions, null, 4);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'positions.json';
            a.click();
        } catch (e) {
            logger.error("Failed to export positions.", e);
        }
    }
}
