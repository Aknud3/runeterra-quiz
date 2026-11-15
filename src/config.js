/**
 * Central configuration for the Runeterra Map Quiz.
 */
export const CONFIG = {
    // Game Rules
    MAX_QUESTION_TIME: 35,
    MAX_TEAMS: 7,
    DOUBLE_COUNT: 10,

    // UI Constants
    ONBOARDING_TRANSITION_MS: 1500,
    TIMER_FULL_CIRCLE: 283,

    // Asset Paths & Naming
    ASSETS: {
        IMAGE_DIR: 'assets/img/',
        AUDIO_DIR: 'assets/audio/',
        DEFAULT_MAP: 'assets/img/runeterra_map.jpg'
    },

    // Initial Region Data
    INITIAL_REGIONS: [
        { id: "freljord", name: "Freljord", color: "#aeeafc", img: "assets/img/freliord.jpg", splashAsset: "assets/splash/animated-freljord.webm", labelPos: { x: 30, y: 15 } },
        { id: "demacia", name: "Demacia", color: "#fefefe", img: "assets/img/demacia.jpg", splashAsset: "assets/splash/animated-demacia.webm", labelPos: { x: 15, y: 45 } },
        { id: "noxus", name: "Noxus", color: "#e24a4a", img: "assets/img/noxus.jpg", splashAsset: "assets/splash/c-o-animated-noxus.webm", labelPos: { x: 50, y: 40 } },
        { id: "ionia", name: "Ionia", color: "#c480ff", img: "assets/img/ionia.jpg", splashAsset: "assets/splash/animated-ionia.webm", labelPos: { x: 80, y: 25 } },
        { id: "shurima", name: "Shurima", color: "#e2b14a", img: "assets/img/shurima.jpg", splashAsset: "assets/splash/c-o-animated-shurima.webm", labelPos: { x: 50, y: 75 } },
        { id: "bilgewater", name: "Bilgewater", color: "#ff8c4a", img: "assets/img/bilgewater.jpg", splashAsset: "assets/splash/animated-bilgewater.webm", labelPos: { x: 75, y: 60 } },
        { id: "piltover_and_zaun", name: "Piltover & Zaun", color: "#c89b3c", color2: "#00cfbc", img: "assets/img/piltover_and_zaun.jpg", splashAsset: "assets/splash/c-o-animated-piltover.webm", labelPos: { x: 55, y: 53 }, labelPos2: { x: 55, y: 57 } },
        { id: "shadow_isles", name: "Shadow Isles", color: "#4ae2a8", img: "assets/img/shadow_isles.jpg", splashAsset: "assets/splash/c-o-animated-harrowing-2014.webm", labelPos: { x: 85, y: 75 } },
        { id: "targon", name: "Targon", color: "#8a9ad6", img: "assets/img/targon.jpg", splashAsset: "assets/splash/c-o-animated-mount-targon.webm", labelPos: { x: 40, y: 60 } },
        { id: "ixtal", name: "Ixtal", color: "#22ad4d", img: "assets/img/ixtal.jpg", splashAsset: "assets/splash/c-o-runeterra-ixtal-01.jpg", labelPos: { x: 65, y: 75 } },
        { id: "void", name: "The Void", color: "#9e3bb5", img: "assets/img/void.jpg", splashAsset: "assets/splash/animated-void.webm", labelPos: { x: 25, y: 80 } }
    ],

    // Regional Audio Mapping (special cases)
    REGION_AUDIO_OVERRIDE: {
        'freljord': 'frelijord.m4a',
        'ionia': 'ionia.m4a'
    },

    // Default Audio Settings
    AUDIO_DEFAULTS: {
        master: 1.0,
        bg: 0.4,
        milionar: 0.5,
        feedback: 0.6,
        countdown: 0.5,
        sfx: 0.4,
        reg_freljord: 0.3,
        reg_demacia: 0.3,
        reg_noxus: 0.3,
        reg_ionia: 0.3,
        reg_shurima: 0.3,
        reg_bilgewater: 0.3,
        reg_piltover_and_zaun: 0.3,
        reg_shadow_isles: 0.3,
        reg_targon: 0.3,
        reg_ixtal: 0.3,
        reg_void: 0.3
    }
};
