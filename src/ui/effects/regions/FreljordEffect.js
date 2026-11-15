import { logger } from '../../../core/Logger.js';

/**
 * Visual effect for Freljord (e.g., snowing, blizzards).
 */
export class FreljordEffect {
    constructor(container) {
        this.container = container;
        this.overlay = null;
    }

    init() {
        logger.info("Initializing Freljord Effect...");
        this.overlay = document.createElement('div');
        this.overlay.className = 'region-effect freljord-snow';
        
        for (let i = 0; i < 15; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.style.left = `${Math.random() * 100}%`;
            snowflake.style.animationDuration = `${5 + Math.random() * 5}s`;
            snowflake.style.animationDelay = `${Math.random() * 5}s`;
            this.overlay.appendChild(snowflake);
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
