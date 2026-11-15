import { logger } from '../../../core/Logger.js';

/** Template for Regional Effects */
export class DemaciaEffect {
    constructor(container) {
        this.container = container;
        this.overlay = null;
    }

    init() {
        logger.info("Initializing Demacia Effect...");
        this.overlay = document.createElement('div');
        this.overlay.className = 'region-effect demacia-rays';
        
        const sunFlare = document.createElement('div');
        sunFlare.className = 'sun-flare';
        this.overlay.appendChild(sunFlare);
        
        this.container.appendChild(this.overlay);
    }

    start() {
        if (this.overlay) this.overlay.classList.add('active');
    }

    stop() {
        if (this.overlay) this.overlay.classList.remove('active');
    }

    destroy() {
        if (this.overlay) this.overlay.remove();
    }
}
