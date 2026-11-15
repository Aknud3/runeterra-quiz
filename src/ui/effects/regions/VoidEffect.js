import { logger } from '../../../core/Logger.js';

/**
 * Visual effect for Void (void energy glitch).
 */
export class VoidEffect {
    constructor(container) {
        this.container = container;
        this.overlay = null;
    }

    init() {
        logger.info("Initializing Void Effect...");
        this.overlay = document.createElement('div');
        this.overlay.className = 'region-effect void-glitch';
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
