const fs = require('fs');
const path = require('path');

function generateHandLandmarks(wrist, fingerCurls, isRight = true, rotationZ = 0, spread = 0.2) {
  const points = [];
  const signX = isRight ? 1 : -1;

  points.push({ x: wrist.x, y: wrist.y, z: wrist.z });

  const cosR = Math.cos(rotationZ);
  const sinR = Math.sin(rotationZ);
  const rotate = (dx, dy, dz = 0) => ({
    x: Math.round((wrist.x + (dx * cosR - dy * sinR)) * 1000) / 1000,
    y: Math.round((wrist.y + (dx * sinR + dy * cosR)) * 1000) / 1000,
    z: Math.round((wrist.z + dz) * 1000) / 1000,
  });

  const [thumbCurl, indexCurl, middleCurl, ringCurl, pinkyCurl] = fingerCurls;
  const tSpread = (1 - thumbCurl) * 0.05 * signX;
  const tLift = -0.04 - (1 - thumbCurl) * 0.04;
  points.push(rotate(-0.02 * signX, -0.02, -0.01));
  points.push(rotate(-0.04 * signX, -0.04, -0.02));
  points.push(rotate(-0.05 * signX - tSpread * 0.5, tLift * 0.7, -0.025));
  points.push(rotate(-0.06 * signX - tSpread, tLift, -0.03));

  const fingers = [
    { dx: -0.025 * signX, len: 0.11, curl: indexCurl, spread: -0.02 * signX },
    { dx: 0.0, len: 0.12, curl: middleCurl, spread: 0 },
    { dx: 0.025 * signX, len: 0.11, curl: ringCurl, spread: 0.02 * signX },
    { dx: 0.045 * signX, len: 0.09, curl: pinkyCurl, spread: 0.035 * signX * (1 + spread) },
  ];

  for (const f of fingers) {
    const mcpY = -0.06;
    points.push(rotate(f.dx, mcpY, 0));
    const pipLen = f.len * 0.4;
    const dipLen = f.len * 0.3;
    const tipLen = f.len * 0.3;

    if (f.curl > 0.5) {
      points.push(rotate(f.dx + f.spread * 0.3, mcpY - pipLen * 0.7, 0.02));
      points.push(rotate(f.dx + f.spread * 0.6, mcpY - pipLen * 0.3, 0.035));
      points.push(rotate(f.dx + f.spread * 0.8, mcpY + 0.01, 0.03));
    } else {
      points.push(rotate(f.dx + f.spread * 0.4, mcpY - pipLen, 0.005));
      points.push(rotate(f.dx + f.spread * 0.7, mcpY - pipLen - dipLen, 0.01));
      points.push(rotate(f.dx + f.spread, mcpY - pipLen - dipLen - tipLen, 0.015));
    }
  }

  return points;
}

function generatePoseLandmarks(leftWrist, rightWrist) {
  const pose = [];
  pose.push({ x: 0, y: -0.4, z: 0 });
  for (let i = 1; i <= 10; i++) pose.push({ x: (i % 2 === 0 ? 0.05 : -0.05), y: -0.42, z: 0 });
  pose[11] = { x: -0.22, y: -0.15, z: 0 };
  pose[12] = { x: 0.22, y: -0.15, z: 0 };
  pose[13] = { x: Math.round(((pose[11].x + leftWrist.x) / 2 - 0.06) * 1000) / 1000, y: 0.15, z: 0.05 };
  pose[14] = { x: Math.round(((pose[12].x + rightWrist.x) / 2 + 0.06) * 1000) / 1000, y: 0.15, z: 0.05 };
  pose[15] = leftWrist;
  pose[16] = rightWrist;
  while (pose.length < 33) pose.push({ x: 0, y: 0.8, z: 0 });
  return pose;
}

const signDefs = [
  {
    filename: 'damu.json',
    word: 'blood',
    description: 'Damu / Blood: Flat left forearm held horizontal while dominant right index finger traces downward indicating bleeding or blood flow.',
    durationMs: 1400,
    animate: (t) => {
      // t is 0..1
      const progress = Math.sin(t * Math.PI);
      const lWrist = { x: -0.15, y: 0.38, z: 0.24 };
      const rY = 0.25 + t * 0.25;
      const rWrist = { x: -0.12, y: rY, z: 0.26 };
      return {
        lWrist,
        rWrist,
        lCurls: [0.2, 0.1, 0.1, 0.1, 0.1], // open flat arm
        rCurls: [0.8, 0.0, 0.9, 0.9, 0.9], // index pointing down
      };
    }
  },
  {
    filename: 'tumbo.json',
    word: 'stomach',
    description: 'Tumbo / Stomach: Both open palms gently pat and circulate over the lower abdomen indicating stomach pain or nausea.',
    durationMs: 1400,
    animate: (t) => {
      const angle = t * Math.PI * 4;
      const lWrist = { x: -0.12 + Math.cos(angle) * 0.03, y: 0.48 + Math.sin(angle) * 0.03, z: 0.25 };
      const rWrist = { x: 0.12 - Math.cos(angle) * 0.03, y: 0.48 + Math.sin(angle) * 0.03, z: 0.25 };
      return {
        lWrist,
        rWrist,
        lCurls: [0.3, 0.2, 0.2, 0.2, 0.3],
        rCurls: [0.3, 0.2, 0.2, 0.2, 0.3],
      };
    }
  },
  {
    filename: 'kupumua.json',
    word: 'breathing',
    description: 'Kupumua / Breathing: Both open hands placed in front of chest rise and expand outward, then sink inward with respiration rhythm.',
    durationMs: 1500,
    animate: (t) => {
      const breath = Math.sin(t * Math.PI * 2);
      const lWrist = { x: -0.16 - breath * 0.05, y: 0.28 - breath * 0.04, z: 0.24 + breath * 0.03 };
      const rWrist = { x: 0.16 + breath * 0.05, y: 0.28 - breath * 0.04, z: 0.24 + breath * 0.03 };
      return {
        lWrist,
        rWrist,
        lCurls: [0.1, 0.1, 0.1, 0.1, 0.1],
        rCurls: [0.1, 0.1, 0.1, 0.1, 0.1],
      };
    }
  },
  {
    filename: 'chunguza.json',
    word: 'examine',
    description: 'Chunguza / Examine & Test: "C" or pinch handshape moves forward methodically as clinician checks or tests patient.',
    durationMs: 1300,
    animate: (t) => {
      const scan = Math.sin(t * Math.PI);
      const lWrist = { x: -0.22, y: 0.55, z: 0.18 };
      const rWrist = { x: 0.05 + scan * 0.12, y: 0.25, z: 0.28 + scan * 0.06 };
      return {
        lWrist,
        rWrist,
        lCurls: [0.6, 0.6, 0.6, 0.6, 0.6],
        rCurls: [0.2, 0.2, 0.7, 0.7, 0.8], // C/pinch handshape
      };
    }
  },
  {
    filename: 'chakula.json',
    word: 'food',
    description: 'Chakula / Food & Nutrition: Right hand flattened-O handshape taps toward mouth twice signifying eating or meal schedule.',
    durationMs: 1300,
    animate: (t) => {
      const tap = Math.abs(Math.sin(t * Math.PI * 2));
      const lWrist = { x: -0.22, y: 0.55, z: 0.18 };
      const rWrist = { x: 0.06, y: 0.12 + tap * 0.08, z: 0.24 - tap * 0.05 };
      return {
        lWrist,
        rWrist,
        lCurls: [0.7, 0.7, 0.7, 0.7, 0.7],
        rCurls: [0.4, 0.5, 0.5, 0.6, 0.6],
      };
    }
  },
  {
    filename: 'usingizi.json',
    word: 'sleep',
    description: 'Usingizi / Sleep & Rest: Right palm tilts gently toward right ear with slight head tilt denoting rest or sleeping state.',
    durationMs: 1400,
    animate: (t) => {
      const rest = Math.sin(t * Math.PI);
      const lWrist = { x: -0.22, y: 0.55, z: 0.18 };
      const rWrist = { x: 0.18, y: 0.10 + (1 - rest) * 0.08, z: 0.22 };
      return {
        lWrist,
        rWrist,
        lCurls: [0.7, 0.7, 0.7, 0.7, 0.7],
        rCurls: [0.1, 0.1, 0.1, 0.1, 0.1], // open flat palm near head
      };
    }
  }
];

const FRAME_COUNT = 15;
for (const def of signDefs) {
  const frames = [];
  for (let i = 0; i < FRAME_COUNT; i++) {
    const t = i / (FRAME_COUNT - 1);
    const timestamp = Math.round(t * def.durationMs);
    const state = def.animate(t);
    const leftHandLandmarks = generateHandLandmarks(state.lWrist, state.lCurls, false);
    const rightHandLandmarks = generateHandLandmarks(state.rWrist, state.rCurls, true);
    const poseLandmarks = generatePoseLandmarks(state.lWrist, state.rWrist);
    frames.push({
      timestamp,
      leftHandLandmarks,
      rightHandLandmarks,
      poseLandmarks,
    });
  }

  const out = {
    word: def.word,
    durationMs: def.durationMs,
    description: def.description,
    frames,
  };

  const targetPath = path.join(__dirname, '..', 'src', 'signs', def.filename);
  fs.writeFileSync(targetPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Generated KSL dataset sign: ${def.filename}`);
}
