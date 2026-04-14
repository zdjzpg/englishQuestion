const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createRectTarget,
  findTargetByPoint,
  normalizeInstructionQuestion,
  SAMPLE_INSTRUCTION_IMAGE
} = require('../src/shared/followInstruction');

test('createRectTarget stores rectangle coordinates as percentages of the image area', () => {
  const target = createRectTarget(
    { left: 120, top: 40, width: 240, height: 120 },
    { width: 600, height: 400 },
    2
  );

  assert.equal(target.id, 'target_2');
  assert.equal(target.x, 20);
  assert.equal(target.y, 10);
  assert.equal(target.width, 40);
  assert.equal(target.height, 30);
  assert.equal(target.label, 'region 2');
});

test('findTargetByPoint returns the matching target id for a point in percentage space', () => {
  const targets = [
    { id: 'eyes', x: 40, y: 18, width: 16, height: 10 },
    { id: 'mouth', x: 44, y: 36, width: 12, height: 8 }
  ];

  assert.equal(findTargetByPoint(targets, { x: 45, y: 22 }), 'eyes');
  assert.equal(findTargetByPoint(targets, { x: 49, y: 39 }), 'mouth');
  assert.equal(findTargetByPoint(targets, { x: 5, y: 5 }), '');
});

test('normalizeInstructionQuestion fills the demo image and parsed targets for the new type', () => {
  const question = normalizeInstructionQuestion({
    id: 'q_demo',
    type: 'listen_follow_instruction',
    prompt: '听一听，点击正确部位。',
    score: 10,
    instructionText: 'Touch your eyes',
    imageUrl: '',
    correctTargetId: 'eyes',
    targets: [
      { id: 'eyes', label: 'eyes', x: 40, y: 18, width: 16, height: 10 }
    ]
  });

  assert.equal(question.imageUrl, SAMPLE_INSTRUCTION_IMAGE);
  assert.equal(question.targets.length, 1);
  assert.equal(question.targets[0].label, 'eyes');
  assert.equal(question.correctTargetId, 'eyes');
});
