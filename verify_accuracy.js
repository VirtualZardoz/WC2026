const exactScores = 3;
const correctResults = 4;
const matchesWithResults = 10;

const accuracy = matchesWithResults > 0
    ? Math.round(((exactScores + correctResults) / matchesWithResults) * 100)
    : 0;

console.log(`Accuracy for 3 exact and 4 correct out of 10: ${accuracy}%`);
if (accuracy === 70) {
    console.log('Accuracy calculation matches requirement.');
} else {
    console.error('Accuracy calculation does NOT match requirement.');
    process.exit(1);
}
