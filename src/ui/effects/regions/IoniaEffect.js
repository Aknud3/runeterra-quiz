import { logger } from '../../../core/Logger.js';

/**
 * Visual effect for Ionia (falling cherry blossom petals).
 */
export class IoniaEffect {
    constructor(container) {
        this.container = container;
        this.overlay = null;
    }

    init() {
        logger.info("Initializing Ionia Effect...");
        this.overlay = document.createElement('div');
        this.overlay.className = 'region-effect ionia-petals';
        
        for (let i = 0; i < 12; i++) {
            const petal = document.createElement('div');
            petal.className = 'petal';
            petal.style.left = `${Math.random() * 100}%`;
            petal.style.animationDuration = `${5 + Math.random() * 5}s`;
            petal.style.animationDelay = `${Math.random() * 10}s`;
            this.overlay.appendChild(petal);
        }
        
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
