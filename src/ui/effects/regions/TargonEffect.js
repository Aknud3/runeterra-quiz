import { logger } from '../../../core/Logger.js';

/**
 * Visual effect for Targon (cosmic aurora).
 */
export class TargonEffect {
    constructor(container) {
        this.container = container;
        this.overlay = null;
    }

    init() {
        logger.info("Initializing Targon Effect...");
        this.overlay = document.createElement('div');
        this.overlay.className = 'region-effect targon-aurora';

        // Add mountain wind streaks - Subtle & Angled (top only)
        for (let i = 0; i < 12; i++) {
            const streak = document.createElement('div');
            streak.className = 'wind-streak';

            const top = Math.random() * 40; // Only top 40%
            const angle = -15 + Math.random() * 10; // Slight downward angle (-15 to -5 deg)

            streak.style.top = `${top}%`;
            streak.style.left = `${-20 + Math.random() * 100}%`;
            streak.style.width = `${100 + Math.random() * 200}px`;
            streak.style.height = `1px`; // Back to thin
            streak.style.transform = `rotate(${angle}deg)`;

            streak.style.animationDuration = `${1.5 + Math.random() * 2}s`; // Faster (1.5s to 3.5s)
            streak.style.animationDelay = `${Math.random() * -10}s`;
            this.overlay.appendChild(streak);
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
