
export async function showConfetti() {
    try {
        // Fick tips av Gemini att lägga url från npm direkt här istället för i index.html
        const { default: JSConfetti } = await import('https://cdn.skypack.dev/js-confetti');

        const jsConfetti = new JSConfetti();

        jsConfetti.addConfetti({
            emojis: ['🎉', '🌈', '🦄', '🏆'],
            confettiNumber: 100,
        });

        console.log("Konfetti avfyrad via Skypack!");
    } catch (err) {
        console.error("Kunde inte ladda konfetti-biblioteket:", err);
    }
}