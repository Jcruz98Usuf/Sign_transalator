/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import { Landmark3D, SignFrame, SignRecording } from '../types/vrmSign';

export interface InterpolatedSignPose {
  timestamp: number;
  leftHand: Landmark3D[];
  rightHand: Landmark3D[];
  body?: Landmark3D[];
  // Calculated analytics for UI and telemetry
  leftCurls: [number, number, number, number, number]; // [thumb, index, middle, ring, pinky] 0=open, 1=fist
  rightCurls: [number, number, number, number, number];
  leftWristPos: { x: number; y: number; z: number };
  rightWristPos: { x: number; y: number; z: number };
}

export interface SmoothedBoneRotations {
  // Rotations stored as quaternions or eulers for smooth dampening
  rightUpperArm: THREE.Euler;
  rightLowerArm: THREE.Euler;
  rightHand: THREE.Euler;
  leftUpperArm: THREE.Euler;
  leftLowerArm: THREE.Euler;
  leftHand: THREE.Euler;
  chest: THREE.Euler;
  head: THREE.Euler;

  // Finger flex rotations (local radians per joint)
  rightFingers: {
    thumb: [number, number, number];
    index: [number, number, number];
    middle: [number, number, number];
    ring: [number, number, number];
    little: [number, number, number];
  };
  leftFingers: {
    thumb: [number, number, number];
    index: [number, number, number];
    middle: [number, number, number];
    ring: [number, number, number];
    little: [number, number, number];
  };
}

export function createInitialSmoothedState(): SmoothedBoneRotations {
  return {
    rightUpperArm: new THREE.Euler(0.08, 0.45, 0.88), // Rest forward in front of chest
    rightLowerArm: new THREE.Euler(0.15, 1.15, 0),    // Elbow bent forward/inward
    rightHand: new THREE.Euler(0.1, 0.1, 0),
    leftUpperArm: new THREE.Euler(0.08, -0.45, -0.88),
    leftLowerArm: new THREE.Euler(0.15, -1.15, 0),
    leftHand: new THREE.Euler(0.1, -0.1, 0),
    chest: new THREE.Euler(0, 0, 0),
    head: new THREE.Euler(0, 0, 0),
    rightFingers: {
      thumb: [0.15, 0.15, 0.15],
      index: [0.15, 0.15, 0.15],
      middle: [0.15, 0.15, 0.15],
      ring: [0.15, 0.15, 0.15],
      little: [0.15, 0.15, 0.15],
    },
    leftFingers: {
      thumb: [0.15, 0.15, 0.15],
      index: [0.15, 0.15, 0.15],
      middle: [0.15, 0.15, 0.15],
      ring: [0.15, 0.15, 0.15],
      little: [0.15, 0.15, 0.15],
    },
  };
}

/**
 * Calculates finger curl (0 = extended, 1 = curled) from 4 landmarks [mcp, pip, dip, tip]
 */
function calculateJointCurl(
  wrist: Landmark3D,
  mcp: Landmark3D,
  pip: Landmark3D,
  dip: Landmark3D,
  tip: Landmark3D
): { curl: number; joints: [number, number, number] } {
  // Distance from MCP to TIP
  const directDist = Math.hypot(tip.x - mcp.x, tip.y - mcp.y, tip.z - mcp.z);
  // Sum of segment lengths
  const len0 = Math.hypot(pip.x - mcp.x, pip.y - mcp.y, pip.z - mcp.z);
  const len1 = Math.hypot(dip.x - pip.x, dip.y - pip.y, dip.z - pip.z);
  const len2 = Math.hypot(tip.x - dip.x, tip.y - dip.y, tip.z - dip.z);
  const totalLength = Math.max(0.001, len0 + len1 + len2);

  // Ratio: straight is ~0.95 - 1.0, fist is ~0.35 - 0.45
  const ratio = directDist / totalLength;
  const curl = THREE.MathUtils.clamp((0.95 - ratio) / 0.55, 0, 1);

  // Joint flexion angles in radians
  const mcpFlex = curl * 1.25;
  const pipFlex = curl * 1.45;
  const dipFlex = curl * 0.95;

  return {
    curl,
    joints: [mcpFlex, pipFlex, dipFlex],
  };
}

/**
 * Calculates thumb curl and opposition
 */
function calculateThumbCurl(
  wrist: Landmark3D,
  cmc: Landmark3D,
  mcp: Landmark3D,
  ip: Landmark3D,
  tip: Landmark3D
): { curl: number; joints: [number, number, number] } {
  // Distance from tip to base of index (cmc/mcp)
  const directDist = Math.hypot(tip.x - cmc.x, tip.y - cmc.y, tip.z - cmc.z);
  const totalLength =
    Math.hypot(mcp.x - cmc.x, mcp.y - cmc.y, mcp.z - cmc.z) +
    Math.hypot(ip.x - mcp.x, ip.y - mcp.y, ip.z - mcp.z) +
    Math.hypot(tip.x - ip.x, tip.y - ip.y, tip.z - ip.z);

  const ratio = directDist / Math.max(0.001, totalLength);
  const curl = THREE.MathUtils.clamp((0.92 - ratio) / 0.45, 0, 1);

  return {
    curl,
    joints: [curl * 0.55, curl * 0.85, curl * 0.95],
  };
}

/**
 * Interpolates between frames of a recorded sign at arbitrary playback timestamp.
 */
export function sampleSignSequence(
  recording: SignRecording,
  timeMs: number
): InterpolatedSignPose {
  const frames = recording.frames;
  if (!frames || frames.length === 0) {
    const emptyHand: Landmark3D[] = Array(21).fill({ x: 0, y: 0, z: 0 });
    return {
      timestamp: timeMs,
      leftHand: emptyHand,
      rightHand: emptyHand,
      leftCurls: [0, 0, 0, 0, 0],
      rightCurls: [0, 0, 0, 0, 0],
      leftWristPos: { x: -0.25, y: 0.65, z: 0.1 },
      rightWristPos: { x: 0.25, y: 0.65, z: 0.1 },
    };
  }

  // Clamped normalized time
  const maxTime = recording.durationMs || frames[frames.length - 1].timestamp;
  const clampedTime = THREE.MathUtils.clamp(timeMs, 0, maxTime);

  // Find surrounding frames
  let prevFrame = frames[0];
  let nextFrame = frames[frames.length - 1];

  for (let i = 0; i < frames.length; i++) {
    if (frames[i].timestamp <= clampedTime) {
      prevFrame = frames[i];
    }
    if (frames[i].timestamp >= clampedTime) {
      nextFrame = frames[i];
      break;
    }
  }

  // Interpolation factor with smooth cosine easing
  let alpha = 0;
  const dt = nextFrame.timestamp - prevFrame.timestamp;
  if (dt > 0) {
    const linearAlpha = (clampedTime - prevFrame.timestamp) / dt;
    // Cubic smoothstep easing
    alpha = linearAlpha * linearAlpha * (3 - 2 * linearAlpha);
  }

  const interpolateLandmarks = (a: Landmark3D[], b: Landmark3D[]): Landmark3D[] => {
    return a.map((ptA, idx) => {
      const ptB = b[idx] || ptA;
      return {
        x: THREE.MathUtils.lerp(ptA.x, ptB.x, alpha),
        y: THREE.MathUtils.lerp(ptA.y, ptB.y, alpha),
        z: THREE.MathUtils.lerp(ptA.z, ptB.z, alpha),
      };
    });
  };

  const leftHand = interpolateLandmarks(
    prevFrame.leftHandLandmarks,
    nextFrame.leftHandLandmarks
  );
  const rightHand = interpolateLandmarks(
    prevFrame.rightHandLandmarks,
    nextFrame.rightHandLandmarks
  );

  // Calculate finger curls for analytics & bone drive
  const rThumb = calculateThumbCurl(rightHand[0], rightHand[1], rightHand[2], rightHand[3], rightHand[4]);
  const rIndex = calculateJointCurl(rightHand[0], rightHand[5], rightHand[6], rightHand[7], rightHand[8]);
  const rMiddle = calculateJointCurl(rightHand[0], rightHand[9], rightHand[10], rightHand[11], rightHand[12]);
  const rRing = calculateJointCurl(rightHand[0], rightHand[13], rightHand[14], rightHand[15], rightHand[16]);
  const rPinky = calculateJointCurl(rightHand[0], rightHand[17], rightHand[18], rightHand[19], rightHand[20]);

  const lThumb = calculateThumbCurl(leftHand[0], leftHand[1], leftHand[2], leftHand[3], leftHand[4]);
  const lIndex = calculateJointCurl(leftHand[0], leftHand[5], leftHand[6], leftHand[7], leftHand[8]);
  const lMiddle = calculateJointCurl(leftHand[0], leftHand[9], leftHand[10], leftHand[11], leftHand[12]);
  const lRing = calculateJointCurl(leftHand[0], leftHand[13], leftHand[14], leftHand[15], leftHand[16]);
  const lPinky = calculateJointCurl(leftHand[0], leftHand[17], leftHand[18], leftHand[19], leftHand[20]);

  return {
    timestamp: clampedTime,
    leftHand,
    rightHand,
    leftCurls: [lThumb.curl, lIndex.curl, lMiddle.curl, lRing.curl, lPinky.curl],
    rightCurls: [rThumb.curl, rIndex.curl, rMiddle.curl, rRing.curl, rPinky.curl],
    leftWristPos: leftHand[0] || { x: -0.25, y: 0.65, z: 0.1 },
    rightWristPos: rightHand[0] || { x: 0.25, y: 0.65, z: 0.1 },
  };
}

/**
 * Maps MediaPipe 3D Hand Landmarks to VRM 1.0 / 0.0 Humanoid bone transforms
 * with exponential anti-jitter smoothing.
 */
export function applyPoseToVRM(
  vrm: VRM,
  pose: InterpolatedSignPose,
  smoothed: SmoothedBoneRotations,
  deltaTimeSec: number
): void {
  if (!vrm || !vrm.humanoid) return;

  // Smoothing coefficient (higher = faster response, lower = more buttery smooth)
  const smoothFactor = 1 - Math.exp(-deltaTimeSec * 16.0);

  // Helper to smooth Euler angles
  const smoothEuler = (curr: THREE.Euler, target: THREE.Euler) => {
    curr.x = THREE.MathUtils.lerp(curr.x, target.x, smoothFactor);
    curr.y = THREE.MathUtils.lerp(curr.y, target.y, smoothFactor);
    curr.z = THREE.MathUtils.lerp(curr.z, target.z, smoothFactor);
  };

  // -------------------------------------------------------------
  // 1. RIGHT ARM KINEMATICS (Always In Front of Chest)
  // -------------------------------------------------------------
  const rWrist = pose.rightHand[0] || { x: 0.2, y: 0.2, z: 0.1 };
  const rMcpMiddle = pose.rightHand[9] || { x: 0.2, y: 0.1, z: 0.1 };

  // Map wrist height (-0.2 = near head/temple, 0.6 = lower chest)
  const rHeightNorm = THREE.MathUtils.clamp((rWrist.y - (-0.2)) / 0.8, 0, 1);
  const rUpperZ = THREE.MathUtils.lerp(0.18, 0.92, rHeightNorm);
  const rUpperY = THREE.MathUtils.lerp(0.95, 0.42, rHeightNorm);
  const rUpperX = THREE.MathUtils.lerp(-0.25, 0.08, rHeightNorm);

  const rReach = Math.hypot(rWrist.x - 0.2, rWrist.y - (-0.1));
  const rElbowY = THREE.MathUtils.clamp(1.75 - rReach * 1.3, 0.65, 2.0);
  const rElbowX = THREE.MathUtils.lerp(0.55, 0.12, 1 - rHeightNorm);

  const targetRightUpper = new THREE.Euler(rUpperX, rUpperY, rUpperZ);
  const targetRightLower = new THREE.Euler(rElbowX, rElbowY, 0);

  // Hand / Wrist rotation calculated from palm vector
  const rHandYaw = THREE.MathUtils.clamp((rMcpMiddle.x - rWrist.x) * 1.5, -0.6, 0.6);
  const rHandPitch = THREE.MathUtils.clamp((rWrist.y - rMcpMiddle.y) * 1.5, -0.6, 0.6);
  const targetRightHand = new THREE.Euler(rHandPitch - 0.2, rHandYaw, 0.1);

  smoothEuler(smoothed.rightUpperArm, targetRightUpper);
  smoothEuler(smoothed.rightLowerArm, targetRightLower);
  smoothEuler(smoothed.rightHand, targetRightHand);

  // Apply to VRM bones
  const rightUpperArmNode = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightUpperArm);
  const rightLowerArmNode = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightLowerArm);
  const rightHandNode = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightHand);

  if (rightUpperArmNode) rightUpperArmNode.rotation.copy(smoothed.rightUpperArm);
  if (rightLowerArmNode) rightLowerArmNode.rotation.copy(smoothed.rightLowerArm);
  if (rightHandNode) rightHandNode.rotation.copy(smoothed.rightHand);

  // -------------------------------------------------------------
  // 2. LEFT ARM KINEMATICS (Always In Front of Chest)
  // -------------------------------------------------------------
  const lWrist = pose.leftHand[0] || { x: -0.2, y: 0.5, z: 0.1 };
  const lMcpMiddle = pose.leftHand[9] || { x: -0.2, y: 0.4, z: 0.1 };

  // Map left wrist height
  const lHeightNorm = THREE.MathUtils.clamp((lWrist.y - (-0.2)) / 0.8, 0, 1);
  const lUpperZ = -THREE.MathUtils.lerp(0.18, 0.92, lHeightNorm);
  const lUpperY = -THREE.MathUtils.lerp(0.95, 0.42, lHeightNorm);
  const lUpperX = THREE.MathUtils.lerp(-0.25, 0.08, lHeightNorm);

  const lReach = Math.hypot(lWrist.x - (-0.2), lWrist.y - (-0.1));
  const lElbowY = -THREE.MathUtils.clamp(1.75 - lReach * 1.3, 0.65, 2.0);
  const lElbowX = THREE.MathUtils.lerp(0.55, 0.12, 1 - lHeightNorm);

  const targetLeftUpper = new THREE.Euler(lUpperX, lUpperY, lUpperZ);
  const targetLeftLower = new THREE.Euler(lElbowX, lElbowY, 0);

  const lHandYaw = THREE.MathUtils.clamp((lMcpMiddle.x - lWrist.x) * 1.5, -0.6, 0.6);
  const lHandPitch = THREE.MathUtils.clamp((lWrist.y - lMcpMiddle.y) * 1.5, -0.6, 0.6);
  const targetLeftHand = new THREE.Euler(lHandPitch - 0.2, lHandYaw, -0.1);

  smoothEuler(smoothed.leftUpperArm, targetLeftUpper);
  smoothEuler(smoothed.leftLowerArm, targetLeftLower);
  smoothEuler(smoothed.leftHand, targetLeftHand);

  const leftUpperArmNode = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftUpperArm);
  const leftLowerArmNode = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftLowerArm);
  const leftHandNode = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftHand);

  if (leftUpperArmNode) leftUpperArmNode.rotation.copy(smoothed.leftUpperArm);
  if (leftLowerArmNode) leftLowerArmNode.rotation.copy(smoothed.leftLowerArm);
  if (leftHandNode) leftHandNode.rotation.copy(smoothed.leftHand);

  // -------------------------------------------------------------
  // 3. RIGHT HAND FINGER BONES (5 fingers, 3 segments each)
  // -------------------------------------------------------------
  const rFingers = pose.rightCurls; // [thumb, index, middle, ring, pinky]
  const applyFingerFlex = (
    curlVal: number,
    smoothedJoints: [number, number, number],
    proxNode: any,
    interNode: any,
    distNode: any,
    splay: number = 0,
    isThumb: boolean = false
  ) => {
    const targetMcp = curlVal * (isThumb ? 0.65 : 1.3);
    const targetPip = curlVal * (isThumb ? 0.85 : 1.45);
    const targetDip = curlVal * (isThumb ? 0.95 : 1.1);

    smoothedJoints[0] = THREE.MathUtils.lerp(smoothedJoints[0], targetMcp, smoothFactor);
    smoothedJoints[1] = THREE.MathUtils.lerp(smoothedJoints[1], targetPip, smoothFactor);
    smoothedJoints[2] = THREE.MathUtils.lerp(smoothedJoints[2], targetDip, smoothFactor);

    if (proxNode) proxNode.rotation.set(0, splay, smoothedJoints[0]);
    if (interNode) interNode.rotation.set(0, 0, smoothedJoints[1]);
    if (distNode) distNode.rotation.set(0, 0, smoothedJoints[2]);
  };

  // Right Thumb
  const rThumbMeta = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightThumbMetacarpal);
  const rThumbProx = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightThumbProximal);
  const rThumbDist = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightThumbDistal);
  applyFingerFlex(rFingers[0], smoothed.rightFingers.thumb, rThumbProx, rThumbDist, null, -0.2, true);
  if (rThumbMeta) rThumbMeta.rotation.set(-0.2, 0.15, rFingers[0] * 0.4);

  // Right Index
  applyFingerFlex(
    rFingers[1],
    smoothed.rightFingers.index,
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightIndexProximal),
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightIndexIntermediate),
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightIndexDistal),
    0.08
  );

  // Right Middle
  applyFingerFlex(
    rFingers[2],
    smoothed.rightFingers.middle,
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightMiddleProximal),
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightMiddleIntermediate),
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightMiddleDistal),
    0.0
  );

  // Right Ring
  applyFingerFlex(
    rFingers[3],
    smoothed.rightFingers.ring,
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightRingProximal),
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightRingIntermediate),
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightRingDistal),
    -0.08
  );

  // Right Little
  applyFingerFlex(
    rFingers[4],
    smoothed.rightFingers.little,
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightLittleProximal),
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightLittleIntermediate),
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightLittleDistal),
    -0.16
  );

  // -------------------------------------------------------------
  // 4. LEFT HAND FINGER BONES (5 fingers, 3 segments each)
  // -------------------------------------------------------------
  const lFingers = pose.leftCurls;
  const applyLeftFingerFlex = (
    curlVal: number,
    smoothedJoints: [number, number, number],
    proxNode: any,
    interNode: any,
    distNode: any,
    splay: number = 0,
    isThumb: boolean = false
  ) => {
    // In VRM normalized left hand, flexion is negative Z
    const targetMcp = -curlVal * (isThumb ? 0.65 : 1.3);
    const targetPip = -curlVal * (isThumb ? 0.85 : 1.45);
    const targetDip = -curlVal * (isThumb ? 0.95 : 1.1);

    smoothedJoints[0] = THREE.MathUtils.lerp(smoothedJoints[0], targetMcp, smoothFactor);
    smoothedJoints[1] = THREE.MathUtils.lerp(smoothedJoints[1], targetPip, smoothFactor);
    smoothedJoints[2] = THREE.MathUtils.lerp(smoothedJoints[2], targetDip, smoothFactor);

    if (proxNode) proxNode.rotation.set(0, splay, smoothedJoints[0]);
    if (interNode) interNode.rotation.set(0, 0, smoothedJoints[1]);
    if (distNode) distNode.rotation.set(0, 0, smoothedJoints[2]);
  };

  // Left Thumb
  const lThumbMeta = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftThumbMetacarpal);
  const lThumbProx = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftThumbProximal);
  const lThumbDist = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftThumbDistal);
  applyLeftFingerFlex(lFingers[0], smoothed.leftFingers.thumb, lThumbProx, lThumbDist, null, 0.2, true);
  if (lThumbMeta) lThumbMeta.rotation.set(-0.2, -0.15, -lFingers[0] * 0.4);

  // Left Index
  applyLeftFingerFlex(
    lFingers[1],
    smoothed.leftFingers.index,
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftIndexProximal),
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftIndexIntermediate),
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftIndexDistal),
    -0.08
  );

  // Left Middle
  applyLeftFingerFlex(
    lFingers[2],
    smoothed.leftFingers.middle,
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftMiddleProximal),
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftMiddleIntermediate),
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftMiddleDistal),
    0.0
  );

  // Left Ring
  applyLeftFingerFlex(
    lFingers[3],
    smoothed.leftFingers.ring,
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftRingProximal),
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftRingIntermediate),
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftRingDistal),
    0.08
  );

  // Left Little
  applyLeftFingerFlex(
    lFingers[4],
    smoothed.leftFingers.little,
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftLittleProximal),
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftLittleIntermediate),
    vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftLittleDistal),
    0.16
  );

  // -------------------------------------------------------------
  // 5. CHEST & HEAD SUBTLE POSE (Natural conversational stance)
  // -------------------------------------------------------------
  const headNode = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Head);
  const chestNode = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Chest);

  // Subtle head orientation following active hand movement
  const targetHeadYaw = THREE.MathUtils.clamp((rWrist.x + lWrist.x) * 0.15, -0.15, 0.15);
  const targetHeadPitch = THREE.MathUtils.clamp(-(rWrist.y + lWrist.y) * 0.08, -0.1, 0.1);
  const targetHead = new THREE.Euler(targetHeadPitch, targetHeadYaw, 0);

  smoothEuler(smoothed.head, targetHead);
  if (headNode) headNode.rotation.copy(smoothed.head);
  if (chestNode) chestNode.rotation.set(0.02, 0, 0);
}
