import { logger } from '../../../core/Logger.js';

/**
 * Visual effect for Ixtal (falling jungle leaves).
 */
export class IxtalEffect {
    constructor(container) {
        this.container = container;
        this.overlay = null;
    }

    init() {
        logger.info("Initializing Ixtal Effect...");
        this.overlay = document.createElement('div');
        this.overlay.className = 'region-effect ixtal-leaves';
        
        // More leaves for a denser jungle feel
        for (let i = 0; i < 45; i++) {
            const leaf = document.createElement('div');
            leaf.className = 'leaf';
            leaf.style.left = `${Math.random() * 100}%`;
            leaf.style.animationDuration = `${3 + Math.random() * 5}s`;
            leaf.style.animationDelay = `${Math.random() * -10}s`; // Start immediately
            this.overlay.appendChild(leaf);
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
