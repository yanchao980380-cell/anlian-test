const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const enginePath = path.join(__dirname, '../history/data.js');

test('historical matching supports all eight profiles and rejects incomplete answers', () => {
  assert.ok(fs.existsSync(enginePath), 'historical matching engine must exist');
  const { questions, profiles, dimensions, match } = require(enginePath);
  assert.equal(questions.length, 18);
  assert.equal(profiles.length, 8);
  assert.throws(() => match([]));
  assert.throws(() => match(Array(18).fill(null)));
  assert.throws(() => match(Array(18).fill(5)));
  assert.throws(() => match(Array(18).fill('2')));
  for (const profile of profiles) {
    const answers = questions.map(q => q.reverse ? 4 - profile.vector[q.dim] : profile.vector[q.dim]);
    assert.equal(match(answers).primary.id, profile.id, `${profile.name} must be reachable`);
    assert.equal(profile.plan.length, 7);
    assert.equal(profile.scenarios.length, 3);
  }
  for (const dim of dimensions) assert.equal(questions.filter(q => q.dim === dim.id).length, 3);
  const neutral = match(Array(18).fill(2));
  assert.equal(neutral.flat, true);
  assert.deepEqual(neutral, match(Array(18).fill(2)), 'same answers yield stable results');
  for (let n = 0; n < 100; n++) {
    const result = match(Array.from({ length: 18 }, (_, i) => (n * 7 + i * 3 + Math.floor(n / (i + 1))) % 5));
    assert.ok(profiles.some(p => p.id === result.primary.id));
    assert.ok(Object.values(result.scores).every(v => v >= 0 && v <= 4));
  }
});
