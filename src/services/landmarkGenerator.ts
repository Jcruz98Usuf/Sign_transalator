/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Landmark3D, SignFrame, SignRecording } from '../types/vrmSign';

/**
 * Procedurally generates standard MediaPipe 21 3D hand landmarks
 * given wrist position, orientation, and finger curl values (0 = flat/extended, 1 = curled into fist).
 */
export function generateHandLandmarks(
  wrist: { x: number; y: number; z: number },
  fingerCurls: [number, number, number, number, number], // [thumb, index, middle, ring, pinky]
  isRight: boolean = true,
  rotationZ: number = 0,
  spread: number = 0.2
): Landmark3D[] {
  const points: Landmark3D[] = [];
  const signX = isRight ? 1 : -1;

  // 0. Wrist
  points.push({ x: wrist.x, y: wrist.y, z: wrist.z });

  const cosR = Math.cos(rotationZ);
  const sinR = Math.sin(rotationZ);

  const rotate = (dx: number, dy: number, dz: number = 0) => ({
    x: wrist.x + (dx * cosR - dy * sinR),
    y: wrist.y + (dx * sinR + dy * cosR),
    z: wrist.z + dz,
  });

  // 1-4. Thumb
  const [thumbCurl, indexCurl, middleCurl, ringCurl, pinkyCurl] = fingerCurls;
  const tSpread = (1 - thumbCurl) * 0.05 * signX;
  const tLift = -0.04 - (1 - thumbCurl) * 0.04;
  points.push(rotate(-0.02 * signX, -0.02, -0.01)); // CMC
  points.push(rotate(-0.04 * signX, -0.04, -0.02)); // MCP
  points.push(rotate(-0.05 * signX - tSpread * 0.5, tLift * 0.7, -0.025)); // IP
  points.push(rotate(-0.06 * signX - tSpread, tLift, -0.03)); // Tip

  // 4 fingers definition: [mcpDx, baseLen, curlVal, spreadOffset]
  const fingers = [
    { dx: -0.025 * signX, len: 0.11, curl: indexCurl, spread: -0.02 * signX },
    { dx: 0.0, len: 0.12, curl: middleCurl, spread: 0 },
    { dx: 0.025 * signX, len: 0.11, curl: ringCurl, spread: 0.02 * signX },
    { dx: 0.045 * signX, len: 0.09, curl: pinkyCurl, spread: 0.035 * signX * (1 + spread) },
  ];

  for (const f of fingers) {
    const mcpY = -0.06;
    points.push(rotate(f.dx, mcpY, 0)); // MCP

    // If curled, joints fold in toward palm (positive Z or lower negative Y)
    const ext = 1 - f.curl;
    const pipLen = f.len * 0.4;
    const dipLen = f.len * 0.3;
    const tipLen = f.len * 0.3;

    if (f.curl > 0.5) {
      // Curled joint
      points.push(rotate(f.dx + f.spread * 0.3, mcpY - pipLen * 0.7, 0.02)); // PIP
      points.push(rotate(f.dx + f.spread * 0.6, mcpY - pipLen * 0.3, 0.035)); // DIP
      points.push(rotate(f.dx + f.spread * 0.8, mcpY + 0.01, 0.03)); // Tip
    } else {
      // Extended joint
      points.push(rotate(f.dx + f.spread * 0.4, mcpY - pipLen, 0.005)); // PIP
      points.push(rotate(f.dx + f.spread * 0.7, mcpY - pipLen - dipLen, 0.01)); // DIP
      points.push(rotate(f.dx + f.spread, mcpY - pipLen - dipLen - tipLen, 0.015)); // Tip
    }
  }

  return points;
}

export function generateRestHand(isRight: boolean = true): Landmark3D[] {
  return generateHandLandmarks(
    { x: isRight ? 0.25 : -0.25, y: 0.65, z: 0.1 },
    [0.7, 0.7, 0.7, 0.7, 0.7],
    isRight,
    isRight ? 0.2 : -0.2
  );
}

export function generatePoseLandmarks(
  leftWrist = { x: -0.25, y: 0.65, z: 0.1 },
  rightWrist = { x: 0.25, y: 0.65, z: 0.1 }
): Landmark3D[] {
  // 33 MediaPipe Pose landmarks
  const pose: Landmark3D[] = [];
  // 0: Nose
  pose.push({ x: 0, y: -0.4, z: 0 });
  // 1-10: Eyes, Ears, Mouth
  for (let i = 1; i <= 10; i++) pose.push({ x: (i % 2 === 0 ? 0.05 : -0.05), y: -0.42, z: 0 });
  // 11: Left Shoulder, 12: Right Shoulder
  pose[11] = { x: -0.22, y: -0.15, z: 0 };
  pose[12] = { x: 0.22, y: -0.15, z: 0 };
  // 13: Left Elbow, 14: Right Elbow
  pose[13] = { x: (pose[11].x + leftWrist.x) / 2 - 0.06, y: 0.15, z: 0.05 };
  pose[14] = { x: (pose[12].x + rightWrist.x) / 2 + 0.06, y: 0.15, z: 0.05 };
  // 15: Left Wrist, 16: Right Wrist
  pose[15] = leftWrist;
  pose[16] = rightWrist;

  // Fill remaining up to 33
  while (pose.length < 33) {
    pose.push({ x: 0, y: 0.8, z: 0 });
  }

  return pose;
}
