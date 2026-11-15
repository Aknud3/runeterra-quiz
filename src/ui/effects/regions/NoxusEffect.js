import { logger } from '../../../core/Logger.js';

/**
 * Visual effect for Noxus (embers, heat, fire).
 */
export class NoxusEffect {
    constructor(container) {
        this.container = container;
        this.overlay = null;
    }

    init() {
        logger.info("Initializing Noxus Effect...");
        this.overlay = document.createElement('div');
        this.overlay.className = 'region-effect noxus-embers';
        
        for (let i = 0; i < 10; i++) {
            const ember = document.createElement('div');
            ember.className = 'ember';
            ember.style.left = `${Math.random() * 100}%`;
            ember.style.animationDuration = `${3 + Math.random() * 3}s`;
            ember.style.animationDelay = `${Math.random() * 5}s`;
            ember.style.width = `${2 + Math.random() * 4}px`;
            ember.style.height = ember.style.width;
            this.overlay.appendChild(ember);
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
