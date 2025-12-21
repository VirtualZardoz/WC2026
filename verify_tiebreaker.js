const teams = [
  { name: 'Team A', pts: 6, gf: 5, ga: 2 }, // GD 3
  { name: 'Team B', pts: 6, gf: 4, ga: 1 }, // GD 3
  { name: 'Team C', pts: 6, gf: 6, ga: 4 }, // GD 2
];

const standings = teams.map(team => ({
    ...team,
    gd: team.gf - team.ga
}));

standings.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.name.localeCompare(b.name);
});

console.log('Standings:');
standings.forEach((t, i) => console.log(`${i+1}. ${t.name} Pts:${t.pts} GD:${t.gd} GF:${t.gf}`));

if (standings[0].name === 'Team A' && standings[1].name === 'Team B' && standings[2].name === 'Team C') {
    // Team A and B both have 6 pts and GD 3. Team A has GF 5, Team B has GF 4. So A > B.
    // Team C has 6 pts but GD 2. So A, B > C.
    console.log('Tiebreaker logic verified!');
} else {
    console.error('Tiebreaker logic FAILED!');
    process.exit(1);
}
