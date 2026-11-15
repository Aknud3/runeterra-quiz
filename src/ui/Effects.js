/**
 * Handles visual feedback effects like confetti, shakes, and flashes.
 */
export class EffectsManager {
    constructor() {
        this.body = document.body;
        this.grid = document.getElementById('game-grid') || document.getElementById('map-container');
    }

    /**
     * Triggers the victory effect (confetti + gold flash).
     */
    triggerCorrect() {
        // Confetti
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#c89b3c', '#f0e6d2', '#00cfbc']
        });

        // Flash
        this.flash('gold');
    }

    /**
     * Triggers the failure effect (shake + red flash).
     */
    triggerWrong() {
        // Shake
        this.grid.classList.add('shake');
        setTimeout(() => this.grid.classList.remove('shake'), 500);

        // Flash
        this.flash('red');
    }

    /**
     * Triggers a temporary color flash on the screen.
     * @param {string} type - 'gold' or 'red'
     */
    flash(type) {
        const className = `flash-${type}`;
        this.body.classList.add(className);
        setTimeout(() => this.body.classList.remove(className), 600);
    }

    /**
     * Triggers an enhanced sparkle for Gold Brick.
     */
    triggerGoldBrickEffect() {
        const duration = 3 * 1000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#c89b3c', '#f0e6d2']
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#c89b3c', '#f0e6d2']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }
}
