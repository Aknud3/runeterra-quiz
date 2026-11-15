import { logger } from '../../../core/Logger.js';

/**
 * Visual effect for Piltover and Zaun (hextech sparks).
 */
export class PiltoverAndZaunEffect {
    constructor(container) {
        this.container = container;
        this.overlay = null;
    }

    init() {
        logger.info("Initializing Piltover and Zaun Effect...");
        this.overlay = document.createElement('div');
        this.overlay.className = 'region-effect pilt-zaun-combined';
        
        // Zaun Toxic Fog (Bottom) - Restricted to the very bottom
        for (let i = 0; i < 25; i++) {
            const fog = document.createElement('div');
            fog.className = 'zaun-fog-particle';
            fog.style.left = `${Math.random() * 105 - 2}%`;
            fog.style.bottom = `${Math.random() * 10}%`; // Limited bottom reach
            fog.style.width = `${40 + Math.random() * 120}px`;
            fog.style.height = `${40 + Math.random() * 80}px`;
            fog.style.animationDelay = `${Math.random() * 5}s`;
            fog.style.animationDuration = `${7 + Math.random() * 5}s`;
            this.overlay.appendChild(fog);
        }

        // Piltover Hextech Orbs (Top)
        for (let i = 0; i < 8; i++) {
            const orb = document.createElement('div');
            orb.className = 'pilt-hextech-orb';
            orb.style.left = `${Math.random() * 100}%`;
            orb.style.top = `${Math.random() * 25}%`; // Restricted to top section
            orb.style.animationDelay = `${Math.random() * 8}s`;
            const size = 8 + Math.random() * 12;
            orb.style.width = `${size}px`;
            orb.style.height = `${size}px`;
            this.overlay.appendChild(orb);
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
