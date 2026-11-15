import { logger } from '../../../core/Logger.js';

/**
 * Visual effect for Shurima (golden sand haze).
 */
export class ShurimaEffect {
    constructor(container) {
        this.container = container;
        this.overlay = null;
    }

    init() {
        logger.info("Initializing Shurima Effect...");

        this.overlay = document.createElement('div');
        this.overlay.className = 'region-effect shurima-haze';
        
        // Heat wave particles (non-SVG shimmer) - More aggressive count
        for (let i = 0; i < 60; i++) {
            const wave = document.createElement('div');
            wave.className = 'heat-wave';
            wave.style.left = `${Math.random() * 100}%`;
            wave.style.bottom = `${Math.random() * 120 - 20}%`;
            wave.style.width = `${150 + Math.random() * 250}px`;
            wave.style.height = `${80 + Math.random() * 150}px`;
            wave.style.animationDelay = `${Math.random() * -10}s`;
            wave.style.animationDuration = `${2 + Math.random() * 2}s`;
            this.overlay.appendChild(wave);
        }

        this.container.appendChild(this.overlay);
    }

    start() {
        if (this.overlay) this.overlay.classList.add('active');
    }

    stop() {
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
    }

    destroy() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }
}
