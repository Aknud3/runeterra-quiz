import { logger } from '../../../core/Logger.js';

/**
 * Visual effect for Bilgewater (rain).
 */
export class BilgewaterEffect {
    constructor(container) {
        this.container = container;
        this.overlay = null;
    }

    init() {
        logger.info("Initializing Bilgewater Effect...");
        this.overlay = document.createElement('div');
        this.overlay.className = 'region-effect bilgewater-rain';
        
        // 3 Layers of Rain for Depth
        const layers = [
            { count: 40, class: 'drop-back', speed: 0.8, delay: 5 },
            { count: 30, class: 'drop-mid', speed: 0.5, delay: 3 },
            { count: 15, class: 'drop-front', speed: 0.3, delay: 2 }
        ];

        layers.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                const drop = document.createElement('div');
                drop.className = `drop ${layer.class}`;
                drop.style.left = `${Math.random() * 100}%`;
                drop.style.animationDuration = `${layer.speed + Math.random() * 0.2}s`;
                // Negative delay ensures they are already mid-fall
                drop.style.animationDelay = `${Math.random() * -layer.delay}s`;
                this.overlay.appendChild(drop);
            }
        });
        
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
