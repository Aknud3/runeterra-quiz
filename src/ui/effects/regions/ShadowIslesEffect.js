import { logger } from '../../../core/Logger.js';

/**
 * Visual effect for Shadow Isles (misty, spectral).
 */
export class ShadowIslesEffect {
    constructor(container) {
        this.container = container;
        this.overlay = null;
    }

    init() {
        logger.info("Initializing Shadow Isles Effect...");
        
        this.overlay = document.createElement('div');
        this.overlay.className = 'region-effect shadow-isles-mist';
        
        // STOLEN CLOUD LOGIC - EXACTLY LIKE NORMAL CLOUDS BUT RTL
        const cloudCount = 50; 
        for (let i = 0; i < cloudCount; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'black-mist-cloud';
            
            const top = Math.random() * 100; 
            const width = 15 + Math.random() * 30; // 15vw to 45vw
            const height = 10 + Math.random() * 20; // 10vh to 30vh
            const duration = 15 + Math.random() * 30; // 15s to 45s (slightly faster)
            const delay = Math.random() * -100; // Start immediately

            cloud.style.top = `${top}%`;
            cloud.style.width = `${width}vw`;
            cloud.style.height = `${height}vh`;
            cloud.style.animation = `mist-roll-rtl ${duration}s linear ${delay}s infinite`;

            this.overlay.appendChild(cloud);
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
