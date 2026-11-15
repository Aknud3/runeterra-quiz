import { logger } from '../core/Logger.js';

/**
 * Manages the animated cloud overlay on the map.
 */
export class CloudManager {
    constructor(container) {
        this.container = container;
        this.overlay = null;
        this.cloudCount = 45; // significantly more clouds
    }

    /**
     * Initializes the cloud overlay and generates cloud elements.
     */
    init() {
        if (!this.container) {
            logger.error("CloudManager: Target container not found!");
            return;
        }

        // Check if overlay already exists to avoid duplicates
        if (document.getElementById('cloud-overlay')) {
            this.overlay = document.getElementById('cloud-overlay');
            return;
        }

        logger.info("Initializing CloudManager on container:", this.container.id);
        
        this.overlay = document.createElement('div');
        this.overlay.id = 'cloud-overlay';
        this.container.appendChild(this.overlay);

        for (let i = 0; i < this.cloudCount; i++) {
            this._createCloud();
        }
        logger.debug(`CloudManager: Generated ${this.cloudCount} cloud elements.`);
    }

    /**
     * Ensures the cloud overlay is always on top and present in the DOM.
     */
    ensurePresent() {
        if (this.overlay && !this.container.contains(this.overlay)) {
            logger.warn("CloudManager: Overlay missing from container, re-appending...");
            this.container.appendChild(this.overlay);
        }
        // Always bring to front by moving it to the end of the children list
        if (this.overlay && this.container.lastElementChild !== this.overlay) {
            this.container.appendChild(this.overlay);
        }
    }

    /**
     * Starts the cloud animations and fades them in.
     */
    start() {
        if (!this.overlay) return;
        this.overlay.style.visibility = 'visible';
        this.overlay.style.display = 'block';
        // Use a small timeout to ensure transition works if it was display: none
        setTimeout(() => {
            this.overlay.classList.add('active');
        }, 10);
        logger.debug("Cloud animations started and fading in.");
    }

    /**
     * Fades out and stops the cloud animations.
     */
    stop(immediate = false) {
        if (!this.overlay) return;
        this.overlay.classList.remove('active');
        if (immediate) {
            this.overlay.style.display = 'none';
            this.overlay.style.visibility = 'hidden';
            logger.debug("Cloud animations stopped immediately.");
            return;
        }
        // Wait for CSS transition (3s) before hiding to avoid cut-off
        setTimeout(() => {
            if (!this.overlay.classList.contains('active')) {
                this.overlay.style.display = 'none';
                this.overlay.style.visibility = 'hidden';
            }
        }, 3000);
        logger.debug("Cloud animations fading out.");
    }

    /**
     * Adjusts the overall intensity/opacity of the clouds.
     * @param {number} value - Intensity from 0 to 1.
     */
    setIntensity(value) {
        if (this.overlay) {
            this.overlay.style.opacity = value;
        }
    }

    _createCloud() {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        
        // Randomize initial position and dimensions for a detailed "from space" look
        const top = Math.random() * 100; 
        const width = 10 + Math.random() * 25; // variety in width (10vw to 35vw)
        const height = 5 + Math.random() * 15; // variety in height (5vh to 20vh)
        const duration = 20 + Math.random() * 25; // faster (20s to 45s)
        const delay = Math.random() * -100; // Random offset

        cloud.style.top = `${top}%`;
        cloud.style.width = `${width}vw`;
        cloud.style.height = `${height}vh`;
        cloud.style.animation = `cloudMove ${duration}s linear ${delay}s infinite`;

        this.overlay.appendChild(cloud);
    }
}
