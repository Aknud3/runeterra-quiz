import { logger } from '../core/Logger.js';
import { CONFIG } from '../config.js';

/**
 * Manages audio playback for the game.
 * REFACTORED: Now uses a SINGLE 'bgMusic' player to prevent overlapping.
 */
export class AudioManager {
    constructor() {
        this.sounds = {
            mainMusic: document.getElementById('snd-main-music'), // THE SINGLE TRACK PLAYER
            correct: document.getElementById('snd-correct'),
            wrong: document.getElementById('snd-wrong'),
            countdown: document.getElementById('snd-countdown'),
            gold: document.getElementById('snd-gold'),
            hover: document.getElementById('snd-hover')
        };

        this.currentMusicType = 'bg'; // 'bg', 'region', 'milionar'
        this.currentTrackId = null;
        this.playbackPositions = this.loadPlaybackPositions();
        this.volumeSettings = this.loadVolumeSettings();

        // Hover Audio Pool
        this.hoverPoolSize = 5;
        this.hoverPool = Array.from({ length: this.hoverPoolSize }, () => {
            return new Audio('assets/audio/button_hover.MP3');
        });
        this.hoverIndex = 0;

        this.applyAllVolumes();
        this.setupGlobalHoverListener();
        this.startPersistenceTimer();
    }

    startPersistenceTimer() {
        setInterval(() => {
            if (this.sounds.mainMusic && this.currentTrackId && !this.sounds.mainMusic.paused) {
                this.playbackPositions[this.currentTrackId] = this.sounds.mainMusic.currentTime;
                this.saveAllSettings();
                logger.debug(`Saved playback position for ${this.currentTrackId}: ${this.playbackPositions[this.currentTrackId]}`);
            }
        }, 10000);
    }

    loadVolumeSettings() {
        const saved = localStorage.getItem('runeterra_volume');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return { ...CONFIG.AUDIO_DEFAULTS, ...parsed };
            } catch (e) { logger.error("Failed to parse volume settings", e); }
        }
        return { ...CONFIG.AUDIO_DEFAULTS };
    }

    loadPlaybackPositions() {
        const saved = localStorage.getItem('runeterra_playback');
        if (saved) {
            try { return JSON.parse(saved); }
            catch (e) { logger.error("Failed to parse playback positions", e); }
        }
        return {};
    }

    saveAllSettings() {
        localStorage.setItem('runeterra_volume', JSON.stringify(this.volumeSettings));
        localStorage.setItem('runeterra_playback', JSON.stringify(this.playbackPositions));
    }

    updateVolume(category, value) {
        if (category in this.volumeSettings) {
            this.volumeSettings[category] = parseFloat(value);
            this.saveAllSettings();
            this.applyAllVolumes();
        }
    }

    applyAllVolumes() {
        const m = this.volumeSettings.master;

        // Apply current music volume
        this._applyCurrentMusicVolume();

        // Timer volume
        if (this.sounds.countdown) {
            this.sounds.countdown.volume = (this.volumeSettings.countdown || 0.5) * m;
        }

        // SFX category
        const sfxVol = this.volumeSettings.sfx * m;
        if (this.sounds.gold) this.sounds.gold.volume = sfxVol;
        if (this.sounds.hover) this.sounds.hover.volume = sfxVol;
        this.hoverPool.forEach(h => h.volume = sfxVol);

        // Feedback category
        const feedVol = this.volumeSettings.feedback * m;
        if (this.sounds.correct) this.sounds.correct.volume = feedVol;
        if (this.sounds.wrong) this.sounds.wrong.volume = feedVol;
    }

    _applyCurrentMusicVolume() {
        if (!this.sounds.mainMusic) return;
        const m = this.volumeSettings.master;

        let vol = 0.4;
        if (this.currentMusicType === 'bg') vol = this.volumeSettings.bg;
        else if (this.currentMusicType === 'milionar') vol = this.volumeSettings.milionar;
        else if (this.currentMusicType === 'region') {
            const regionId = window.app?.mapManager?.activeRegion?.id;
            if (regionId) {
                vol = this.volumeSettings[`reg_${regionId}`] || 0.3;
            } else {
                vol = 0.3;
            }
        }

        this.sounds.mainMusic.volume = vol * m;
    }

    setupGlobalHoverListener() {
        document.addEventListener('mouseover', (e) => {
            const target = e.target.closest('.marker, .region-label, button, .settings-btn');
            if (target && target !== e.relatedTarget?.closest('.marker, .region-label, button, .settings-btn')) {
                this.playHover();
            }
        });
        logger.debug("Global hover sound listener initialized.");
    }

    stopAllBackgroundMusic() {
        if (this.sounds.mainMusic) {
            this.sounds.mainMusic.pause();
            this.sounds.mainMusic.src = "";
            this.sounds.mainMusic.load();
        }
    }

    playBackgroundMusic(volume = 0.4) {
        const version = new URL(import.meta.url).searchParams.get('v') || '20261115';
        const path = `${CONFIG.ASSETS.AUDIO_DIR}background_music.m4a?v=${version}`;
        this._switchMusic(path, 'bg', 'world');
    }

    playRegionalTheme(regionId) {
        const fileName = CONFIG.REGION_AUDIO_OVERRIDE[regionId] || `${regionId}.m4a`;
        // CACHE BUSTING FOR AUDIO
        const version = new URL(import.meta.url).searchParams.get('v') || '20261115';
        const path = `${CONFIG.ASSETS.AUDIO_DIR}${fileName}?v=${version}`;
        this._switchMusic(path, 'region', regionId);
    }

    playMilionar() {
        const path = 'assets/audio/milionar.mp3';
        this._switchMusic(path, 'milionar', 'question');
    }

    stopMilionar() {
        // If we are playing milionar, stop it (it will be switched by updateMusic calls later)
        if (this.currentMusicType === 'milionar') {
            this.stopAllBackgroundMusic();
        }
    }

    _switchMusic(src, type, trackId) {
        if (!this.sounds.mainMusic) return;

        // Save current position of the TRACK WE ARE LEAVING
        if (this.currentTrackId && this.currentTrackId !== trackId) {
            this.playbackPositions[this.currentTrackId] = this.sounds.mainMusic.currentTime;
            this.saveAllSettings();
        }

        // Check if we are ALREADY playing this EXACT track (file + state)
        const currentCleanSrc = this.sounds.mainMusic.src.split('?')[0];
        const newCleanSrc = new URL(src, window.location.href).href.split('?')[0];
        const isSameFile = currentCleanSrc === newCleanSrc;

        if (isSameFile && this.currentTrackId === trackId && !this.sounds.mainMusic.paused) {
            return;
        }

        logger.info(`Switching music to: ${src} (Type: ${type}, ID: ${trackId})`);

        this.currentMusicType = type;
        this.currentTrackId = trackId;

        // Only pause and re-load if the source is actually different
        if (!isSameFile || this.sounds.mainMusic.paused) {
            this.sounds.mainMusic.pause();
            
            if (this.sounds.mainMusic.src !== new URL(src, window.location.href).href) {
                this.sounds.mainMusic.src = src;
                this.sounds.mainMusic.load();
            }

            const onMetadata = () => {
                const savedPos = this.playbackPositions[trackId] || 0;
                if (savedPos < this.sounds.mainMusic.duration) {
                    this.sounds.mainMusic.currentTime = savedPos;
                } else {
                    this.sounds.mainMusic.currentTime = 0;
                }
                logger.debug(`Resume ${trackId} at ${this.sounds.mainMusic.currentTime}`);
                this.sounds.mainMusic.removeEventListener('loadedmetadata', onMetadata);
            };

            this.sounds.mainMusic.addEventListener('loadedmetadata', onMetadata);
            
            // Re-call load if we changed src or need to trigger metadata
            if (this.sounds.mainMusic.readyState < 1) {
                this.sounds.mainMusic.load();
            } else {
                // If already loaded, trigger seek manually
                onMetadata();
            }
        }

        this._applyCurrentMusicVolume();

        const p = this.sounds.mainMusic.play();
        if (p !== undefined) p.catch((e) => {
            if (e.name !== 'AbortError') logger.error(`BGM Play Failed: ${src}`, e);
        });
    }

    playHover() {
        const snd = this.hoverPool[this.hoverIndex];
        snd.currentTime = 0;
        const p = snd.play();
        if (p !== undefined) p.catch(() => { });
        this.hoverIndex = (this.hoverIndex + 1) % this.hoverPoolSize;
    }

    playCorrect() {
        if (this.sounds.correct) {
            this.sounds.correct.currentTime = 0;
            const p = this.sounds.correct.play();
            if (p !== undefined) p.catch(() => { });
        }
    }

    playWrong() {
        if (this.sounds.wrong) {
            this.sounds.wrong.currentTime = 0;
            const p = this.sounds.wrong.play();
            if (p !== undefined) p.catch(() => { });
        }
    }

    playCountdown() {
        if (this.sounds.countdown) {
            this.sounds.countdown.currentTime = 0;
            const p = this.sounds.countdown.play();
            if (p !== undefined) p.catch(() => { });
        }
    }

    playGold() {
        if (this.sounds.gold) {
            this.sounds.gold.currentTime = 0;
            const p = this.sounds.gold.play();
            if (p !== undefined) p.catch(() => { });
        }
    }
}
