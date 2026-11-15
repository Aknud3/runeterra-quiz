import { logger } from '../../core/Logger.js';

export class EffectFactory {
    constructor(container) {
        this.container = container;
        this.effectContainer = document.createElement('div');
        this.effectContainer.className = 'region-effects-container';
        this.container.appendChild(this.effectContainer);
        this.currentEffect = null;
    }

    async createEffect(regionId) {
        if (this.currentEffect) {
            this.currentEffect.destroy();
        }
        
        logger.info(`Creating effect for: ${regionId}`);
        
        try {
            const className = regionId.split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join('') + 'Effect';
            
            // CACHE BUSTING FOR DYNAMIC IMPORTS
            const version = new URL(import.meta.url).searchParams.get('v') || Date.now();
            const module = await import(`./regions/${className}.js?v=${version}`);
            const EffectClass = module[className];
            
            this.currentEffect = new EffectClass(this.effectContainer);
            this.currentEffect.init();
            
            // Start immediately to avoid race conditions with clear()
            if (this.currentEffect) {
                this.currentEffect.start();
            }
            
            return this.currentEffect;
        } catch (e) {
            logger.error(`Failed to load effect for ${regionId}`, e);
            return null;
        }
    }

    clear() {
        if (this.currentEffect) {
            this.currentEffect.stop();
            this.currentEffect.destroy();
            this.currentEffect = null;
        }
        // Force wipe the container to ensure no ghost elements (like Shurima glare) remain
        this.effectContainer.innerHTML = '';
        logger.info("Regional effects fully purged.");
    }
}
