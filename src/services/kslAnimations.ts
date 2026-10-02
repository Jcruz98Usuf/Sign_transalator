/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArmPose, HandPose, HeadPose, KSLKeyframe, KSLSignDefinition } from '../types/ksl';

// Default resting neutral poses
const REST_HAND: HandPose = {
  thumb: 0.2,
  index: 0.2,
  middle: 0.2,
  ring: 0.2,
  pinky: 0.2,
  spread: 0.1,
  pinch: 0.5,
  orientation: 'palm_in',
};

const OPEN_FLAT_HAND: HandPose = {
  thumb: 0.9,
  index: 1.0,
  middle: 1.0,
  ring: 1.0,
  pinky: 1.0,
  spread: 0.3,
  pinch: 0.8,
  orientation: 'palm_up',
};

const FIST_HAND: HandPose = {
  thumb: 0.0,
  index: 0.0,
  middle: 0.0,
  ring: 0.0,
  pinky: 0.0,
  spread: 0.0,
  pinch: 0.0,
  orientation: 'palm_in',
};

const THUMBS_UP_HAND: HandPose = {
  thumb: 1.0,
  index: 0.0,
  middle: 0.0,
  ring: 0.0,
  pinky: 0.0,
  spread: 0.0,
  pinch: 0.0,
  orientation: 'palm_left',
};

const POINTING_HAND: HandPose = {
  thumb: 0.1,
  index: 1.0,
  middle: 0.0,
  ring: 0.0,
  pinky: 0.0,
  spread: 0.1,
  pinch: 0.2,
  orientation: 'palm_in',
};

const TWO_FINGERS_HAND: HandPose = {
  thumb: 0.1,
  index: 1.0,
  middle: 1.0,
  ring: 0.0,
  pinky: 0.0,
  spread: 0.2,
  pinch: 0.1,
  orientation: 'palm_down',
};

const THREE_FINGERS_W_HAND: HandPose = {
  thumb: 0.0,
  index: 1.0,
  middle: 1.0,
  ring: 1.0,
  pinky: 0.0,
  spread: 0.6,
  pinch: 0.0,
  orientation: 'palm_out',
};

const NEUTRAL_HEAD: HeadPose = {
  x: 200,
  y: 110,
  tilt: 0,
  brows: 'neutral',
  mouth: 'neutral',
};

// Resting positions for avatar (Coordinates based on 400x500 viewport)
const REST_LEFT_ARM: ArmPose = {
  shoulder: { x: 140, y: 190 },
  elbow: { x: 100, y: 310 },
  wrist: { x: 120, y: 420 },
  hand: REST_HAND,
};

const REST_RIGHT_ARM: ArmPose = {
  shoulder: { x: 260, y: 190 },
  elbow: { x: 300, y: 310 },
  wrist: { x: 280, y: 420 },
  hand: REST_HAND,
};

export const KSL_LEXICON: KSLSignDefinition[] = [
  // 1. MSAADA (HELP)
  {
    id: 'msaada',
    gloss: 'MSAADA',
    swahili: 'Msaada',
    english: 'Help / Assist',
    category: 'essential',
    description: 'Non-dominant palm held flat; dominant fist with thumb-up rests on palm, both hands rise upward together.',
    culturalNote: 'Universal KSL emergency & assistance sign, used in East African clinics.',
    durationMs: 1400,
    keyframes: [
      {
        progress: 0.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
      {
        progress: 0.35,
        head: { ...NEUTRAL_HEAD, mouth: 'open' },
        leftArm: {
          shoulder: { x: 140, y: 190 },
          elbow: { x: 130, y: 280 },
          wrist: { x: 190, y: 340 },
          hand: OPEN_FLAT_HAND,
        },
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 270, y: 280 },
          wrist: { x: 195, y: 320 },
          hand: THUMBS_UP_HAND,
        },
        caption: 'Place dominant fist on open support palm',
      },
      {
        progress: 0.8,
        head: { ...NEUTRAL_HEAD, brows: 'raised', mouth: 'open' },
        leftArm: {
          shoulder: { x: 140, y: 190 },
          elbow: { x: 140, y: 240 },
          wrist: { x: 190, y: 250 },
          hand: OPEN_FLAT_HAND,
        },
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 260, y: 240 },
          wrist: { x: 195, y: 230 },
          hand: THUMBS_UP_HAND,
        },
        caption: 'Lift both hands upward smoothly (Help)',
      },
      {
        progress: 1.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
    ],
  },

  // 2. DAKTARI (DOCTOR)
  {
    id: 'daktari',
    gloss: 'DAKTARI',
    swahili: 'Daktari',
    english: 'Doctor / Physician',
    category: 'medical',
    description: 'Non-dominant arm extended with wrist exposed; dominant two fingers tap the radial pulse twice.',
    culturalNote: 'Standard KSL medical sign derived from clinical pulse assessment.',
    durationMs: 1500,
    keyframes: [
      {
        progress: 0.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
      {
        progress: 0.3,
        head: { ...NEUTRAL_HEAD, tilt: -0.05 },
        leftArm: {
          shoulder: { x: 140, y: 190 },
          elbow: { x: 120, y: 270 },
          wrist: { x: 175, y: 300 },
          hand: { ...OPEN_FLAT_HAND, orientation: 'palm_up' },
        },
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 260, y: 250 },
          wrist: { x: 185, y: 285 },
          hand: TWO_FINGERS_HAND,
        },
        caption: 'Position fingers over wrist pulse point',
      },
      {
        progress: 0.5,
        head: NEUTRAL_HEAD,
        leftArm: {
          shoulder: { x: 140, y: 190 },
          elbow: { x: 120, y: 270 },
          wrist: { x: 175, y: 300 },
          hand: { ...OPEN_FLAT_HAND, orientation: 'palm_up' },
        },
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 270, y: 250 },
          wrist: { x: 190, y: 265 },
          hand: TWO_FINGERS_HAND,
        },
        caption: 'Tap pulse once',
      },
      {
        progress: 0.75,
        head: NEUTRAL_HEAD,
        leftArm: {
          shoulder: { x: 140, y: 190 },
          elbow: { x: 120, y: 270 },
          wrist: { x: 175, y: 300 },
          hand: { ...OPEN_FLAT_HAND, orientation: 'palm_up' },
        },
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 260, y: 250 },
          wrist: { x: 185, y: 285 },
          hand: TWO_FINGERS_HAND,
        },
        caption: 'Tap pulse second time (Daktari)',
      },
      {
        progress: 1.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
    ],
  },

  // 3. MAUMIVU (PAIN)
  {
    id: 'maumivu',
    gloss: 'MAUMIVU',
    swahili: 'Maumivu',
    english: 'Pain / Ache / Hurt',
    category: 'medical',
    description: 'Both index fingers point at each other and perform quick twisting motion with grimaced facial expression.',
    culturalNote: 'Facial non-manual marker (grimace/furrowed brow) indicates severity of pain.',
    durationMs: 1400,
    keyframes: [
      {
        progress: 0.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
      {
        progress: 0.35,
        head: { ...NEUTRAL_HEAD, brows: 'furrowed', mouth: 'grimace' },
        leftArm: {
          shoulder: { x: 140, y: 190 },
          elbow: { x: 120, y: 260 },
          wrist: { x: 165, y: 270 },
          hand: POINTING_HAND,
        },
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 280, y: 260 },
          wrist: { x: 235, y: 270 },
          hand: { ...POINTING_HAND, orientation: 'palm_left' },
        },
        caption: 'Point index fingers toward area of distress',
      },
      {
        progress: 0.65,
        head: { ...NEUTRAL_HEAD, brows: 'furrowed', mouth: 'grimace', tilt: 0.08 },
        leftArm: {
          shoulder: { x: 140, y: 190 },
          elbow: { x: 130, y: 250 },
          wrist: { x: 180, y: 265 },
          hand: POINTING_HAND,
        },
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 270, y: 250 },
          wrist: { x: 220, y: 265 },
          hand: POINTING_HAND,
        },
        caption: 'Twist index fingers inward with pain expression',
      },
      {
        progress: 1.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
    ],
  },

  // 4. MAJI (WATER)
  {
    id: 'maji',
    gloss: 'MAJI',
    swahili: 'Maji',
    english: 'Water',
    category: 'essential',
    description: '"W" handshape taps chin gently twice.',
    culturalNote: 'Standard KSL and regional ASL-cognate sign used across East Africa.',
    durationMs: 1300,
    keyframes: [
      {
        progress: 0.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
      {
        progress: 0.4,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 270, y: 230 },
          wrist: { x: 215, y: 160 },
          hand: THREE_FINGERS_W_HAND,
        },
        caption: 'Tap chin with "W" index finger',
      },
      {
        progress: 0.65,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 275, y: 235 },
          wrist: { x: 225, y: 175 },
          hand: THREE_FINGERS_W_HAND,
        },
        caption: 'Retract slightly',
      },
      {
        progress: 0.85,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 270, y: 230 },
          wrist: { x: 215, y: 160 },
          hand: THREE_FINGERS_W_HAND,
        },
        caption: 'Tap chin second time (Maji)',
      },
      {
        progress: 1.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
    ],
  },

  // 5. DAWA (MEDICINE)
  {
    id: 'dawa',
    gloss: 'DAWA',
    swahili: 'Dawa',
    english: 'Medicine / Medication',
    category: 'medical',
    description: 'Dominant middle finger rotates in open non-dominant palm, then fingers touch lips.',
    culturalNote: 'Represents crushing pills into powder and taking oral medicine.',
    durationMs: 1600,
    keyframes: [
      {
        progress: 0.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
      {
        progress: 0.3,
        head: NEUTRAL_HEAD,
        leftArm: {
          shoulder: { x: 140, y: 190 },
          elbow: { x: 130, y: 280 },
          wrist: { x: 180, y: 310 },
          hand: OPEN_FLAT_HAND,
        },
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 260, y: 270 },
          wrist: { x: 190, y: 295 },
          hand: { ...REST_HAND, middle: 1.0, thumb: 0.2 },
        },
        caption: 'Middle finger touches center of open palm',
      },
      {
        progress: 0.55,
        head: NEUTRAL_HEAD,
        leftArm: {
          shoulder: { x: 140, y: 190 },
          elbow: { x: 130, y: 280 },
          wrist: { x: 180, y: 310 },
          hand: OPEN_FLAT_HAND,
        },
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 265, y: 270 },
          wrist: { x: 195, y: 300 },
          hand: { ...REST_HAND, middle: 1.0 },
        },
        caption: 'Grind in circular motion (Pill crushing)',
      },
      {
        progress: 0.8,
        head: { ...NEUTRAL_HEAD, mouth: 'open' },
        leftArm: REST_LEFT_ARM,
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 270, y: 220 },
          wrist: { x: 210, y: 150 },
          hand: { ...FIST_HAND, thumb: 0.5, index: 0.5 },
        },
        caption: 'Bring fingers to lips (Swallowing medication)',
      },
      {
        progress: 1.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
    ],
  },

  // 6. DHARURA (EMERGENCY)
  {
    id: 'dharura',
    gloss: 'DHARURA',
    swahili: 'Dharura',
    english: 'Emergency / Urgent',
    category: 'medical',
    description: 'Both hands raised with urgency, fluttering rapidly side to side with wide alarmed eyes.',
    culturalNote: 'Signals immediate triage escalation (Code Blue / trauma).',
    durationMs: 1400,
    keyframes: [
      {
        progress: 0.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
      {
        progress: 0.3,
        head: { ...NEUTRAL_HEAD, brows: 'raised', mouth: 'open' },
        leftArm: {
          shoulder: { x: 140, y: 190 },
          elbow: { x: 110, y: 230 },
          wrist: { x: 130, y: 210 },
          hand: { ...OPEN_FLAT_HAND, spread: 0.8 },
        },
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 290, y: 230 },
          wrist: { x: 270, y: 210 },
          hand: { ...OPEN_FLAT_HAND, spread: 0.8 },
        },
        caption: 'Raise both open hands with urgency',
      },
      {
        progress: 0.55,
        head: { ...NEUTRAL_HEAD, brows: 'raised', mouth: 'open' },
        leftArm: {
          shoulder: { x: 140, y: 190 },
          elbow: { x: 105, y: 230 },
          wrist: { x: 145, y: 215 },
          hand: { ...OPEN_FLAT_HAND, spread: 0.8 },
        },
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 295, y: 230 },
          wrist: { x: 255, y: 215 },
          hand: { ...OPEN_FLAT_HAND, spread: 0.8 },
        },
        caption: 'Shake horizontally side-to-side',
      },
      {
        progress: 0.8,
        head: { ...NEUTRAL_HEAD, brows: 'raised', mouth: 'open' },
        leftArm: {
          shoulder: { x: 140, y: 190 },
          elbow: { x: 110, y: 230 },
          wrist: { x: 130, y: 210 },
          hand: { ...OPEN_FLAT_HAND, spread: 0.8 },
        },
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 290, y: 230 },
          wrist: { x: 270, y: 210 },
          hand: { ...OPEN_FLAT_HAND, spread: 0.8 },
        },
        caption: 'Rapid emergency alert shake (Dharura)',
      },
      {
        progress: 1.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
    ],
  },

  // 7. HOSPITALI (HOSPITAL)
  {
    id: 'hospitali',
    gloss: 'HOSPITALI',
    swahili: 'Hospitali',
    english: 'Hospital / Clinic',
    category: 'medical',
    description: 'Dominant index and middle fingers trace a cross (+) on the upper non-dominant arm.',
    culturalNote: 'Derived from the Red Cross / medical emblem on arm bands.',
    durationMs: 1500,
    keyframes: [
      {
        progress: 0.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
      {
        progress: 0.3,
        head: NEUTRAL_HEAD,
        leftArm: {
          shoulder: { x: 140, y: 190 },
          elbow: { x: 115, y: 280 },
          wrist: { x: 140, y: 360 },
          hand: REST_HAND,
        },
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 230, y: 250 },
          wrist: { x: 130, y: 210 },
          hand: TWO_FINGERS_HAND,
        },
        caption: 'Draw vertical line on upper left arm',
      },
      {
        progress: 0.55,
        head: NEUTRAL_HEAD,
        leftArm: {
          shoulder: { x: 140, y: 190 },
          elbow: { x: 115, y: 280 },
          wrist: { x: 140, y: 360 },
          hand: REST_HAND,
        },
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 230, y: 250 },
          wrist: { x: 130, y: 245 },
          hand: TWO_FINGERS_HAND,
        },
        caption: 'Draw downward vertical stroke',
      },
      {
        progress: 0.8,
        head: NEUTRAL_HEAD,
        leftArm: {
          shoulder: { x: 140, y: 190 },
          elbow: { x: 115, y: 280 },
          wrist: { x: 140, y: 360 },
          hand: REST_HAND,
        },
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 235, y: 250 },
          wrist: { x: 145, y: 228 },
          hand: TWO_FINGERS_HAND,
        },
        caption: 'Cross horizontally to complete (+) cross',
      },
      {
        progress: 1.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
    ],
  },

  // 8. SINDANO (INJECTION)
  {
    id: 'sindano',
    gloss: 'SINDANO',
    swahili: 'Sindano',
    english: 'Injection / Shot / Vaccine',
    category: 'medical',
    description: 'Left arm bent; right hand mimics holding syringe and pushing plunger down with thumb into arm.',
    culturalNote: 'Common in immunization, IV access, and blood draw consultations.',
    durationMs: 1400,
    keyframes: [
      {
        progress: 0.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
      {
        progress: 0.35,
        head: { ...NEUTRAL_HEAD, brows: 'neutral', mouth: 'neutral' },
        leftArm: {
          shoulder: { x: 140, y: 190 },
          elbow: { x: 120, y: 270 },
          wrist: { x: 170, y: 290 },
          hand: OPEN_FLAT_HAND,
        },
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 230, y: 240 },
          wrist: { x: 155, y: 240 },
          hand: { ...REST_HAND, thumb: 1.0, index: 0.8, middle: 0.8 },
        },
        caption: 'Hold syringe above arm muscle',
      },
      {
        progress: 0.7,
        head: { ...NEUTRAL_HEAD, brows: 'furrowed', mouth: 'grimace' },
        leftArm: {
          shoulder: { x: 140, y: 190 },
          elbow: { x: 120, y: 270 },
          wrist: { x: 170, y: 290 },
          hand: OPEN_FLAT_HAND,
        },
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 220, y: 250 },
          wrist: { x: 145, y: 255 },
          hand: { ...REST_HAND, thumb: 0.1, index: 0.8, middle: 0.8 },
        },
        caption: 'Press plunger down with thumb (Injection)',
      },
      {
        progress: 1.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
    ],
  },

  // 9. WAPI (WHERE)
  {
    id: 'wapi',
    gloss: 'WAPI',
    swahili: 'Wapi',
    english: 'Where?',
    category: 'question',
    description: 'Both palms held open facing upward, sweeping outward gently with raised questioning eyebrows.',
    culturalNote: 'In KSL question syntax, WAPI typically appears at the end of the sentence.',
    durationMs: 1400,
    keyframes: [
      {
        progress: 0.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
      {
        progress: 0.35,
        head: { ...NEUTRAL_HEAD, brows: 'raised', tilt: 0.04 },
        leftArm: {
          shoulder: { x: 140, y: 190 },
          elbow: { x: 110, y: 270 },
          wrist: { x: 150, y: 310 },
          hand: OPEN_FLAT_HAND,
        },
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 290, y: 270 },
          wrist: { x: 250, y: 310 },
          hand: OPEN_FLAT_HAND,
        },
        caption: 'Palms facing up with raised inquiry brows',
      },
      {
        progress: 0.7,
        head: { ...NEUTRAL_HEAD, brows: 'raised', tilt: -0.04 },
        leftArm: {
          shoulder: { x: 140, y: 190 },
          elbow: { x: 100, y: 270 },
          wrist: { x: 130, y: 310 },
          hand: OPEN_FLAT_HAND,
        },
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 300, y: 270 },
          wrist: { x: 270, y: 310 },
          hand: OPEN_FLAT_HAND,
        },
        caption: 'Sweep palms outward horizontally (Where?)',
      },
      {
        progress: 1.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
    ],
  },

  // 10. NDIYO (YES)
  {
    id: 'ndiyo',
    gloss: 'NDIYO',
    swahili: 'Ndiyo',
    english: 'Yes / Agree',
    category: 'essential',
    description: 'Fist nods up and down from the wrist like an affirming head nod.',
    culturalNote: 'Accompanied by affirmative head nod.',
    durationMs: 1200,
    keyframes: [
      {
        progress: 0.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
      {
        progress: 0.35,
        head: { ...NEUTRAL_HEAD, mouth: 'smile' },
        leftArm: REST_LEFT_ARM,
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 270, y: 260 },
          wrist: { x: 240, y: 250 },
          hand: FIST_HAND,
        },
        caption: 'Hold fist upright',
      },
      {
        progress: 0.65,
        head: { ...NEUTRAL_HEAD, mouth: 'smile' },
        leftArm: REST_LEFT_ARM,
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 270, y: 260 },
          wrist: { x: 240, y: 290 },
          hand: FIST_HAND,
        },
        caption: 'Tilt fist downward (Nod yes)',
      },
      {
        progress: 0.85,
        head: { ...NEUTRAL_HEAD, mouth: 'smile' },
        leftArm: REST_LEFT_ARM,
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 270, y: 260 },
          wrist: { x: 240, y: 250 },
          hand: FIST_HAND,
        },
        caption: 'Return fist upright (Ndiyo)',
      },
      {
        progress: 1.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
    ],
  },

  // 11. HAPANA (NO)
  {
    id: 'hapana',
    gloss: 'HAPANA',
    swahili: 'Hapana',
    english: 'No / Negative',
    category: 'essential',
    description: 'Index, middle, and thumb snap closed together sharply with a negative headshake.',
    culturalNote: 'Accompanied by side-to-side headshake.',
    durationMs: 1200,
    keyframes: [
      {
        progress: 0.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
      {
        progress: 0.35,
        head: { ...NEUTRAL_HEAD, tilt: 0.06 },
        leftArm: REST_LEFT_ARM,
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 270, y: 250 },
          wrist: { x: 230, y: 240 },
          hand: { ...REST_HAND, index: 1.0, middle: 1.0, thumb: 1.0, pinch: 0.8 },
        },
        caption: 'Hold index, middle & thumb open',
      },
      {
        progress: 0.7,
        head: { ...NEUTRAL_HEAD, tilt: -0.06 },
        leftArm: REST_LEFT_ARM,
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 270, y: 250 },
          wrist: { x: 230, y: 250 },
          hand: { ...REST_HAND, index: 0.3, middle: 0.3, thumb: 0.2, pinch: 0.0 },
        },
        caption: 'Snap fingers closed onto thumb (Hapana / No)',
      },
      {
        progress: 1.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
    ],
  },

  // 12. ASANTE (THANK YOU)
  {
    id: 'asante',
    gloss: 'ASANTE',
    swahili: 'Asante',
    english: 'Thank You',
    category: 'essential',
    description: 'Flat open hand touches chin/lips, then moves outward and forward toward other person with polite bow.',
    culturalNote: 'Sign of deep respect and acknowledgment across Kenya.',
    durationMs: 1300,
    keyframes: [
      {
        progress: 0.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
      {
        progress: 0.35,
        head: { ...NEUTRAL_HEAD, mouth: 'smile' },
        leftArm: REST_LEFT_ARM,
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 260, y: 240 },
          wrist: { x: 210, y: 165 },
          hand: { ...OPEN_FLAT_HAND, orientation: 'palm_in' },
        },
        caption: 'Fingertips touch chin gently',
      },
      {
        progress: 0.75,
        head: { ...NEUTRAL_HEAD, mouth: 'smile', tilt: 0.04 },
        leftArm: REST_LEFT_ARM,
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 270, y: 250 },
          wrist: { x: 230, y: 250 },
          hand: { ...OPEN_FLAT_HAND, orientation: 'palm_up' },
        },
        caption: 'Extend hand forward toward doctor/patient (Asante)',
      },
      {
        progress: 1.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
    ],
  },

  // 13. HOMA (FEVER)
  {
    id: 'homa',
    gloss: 'HOMA',
    swahili: 'Homa',
    english: 'Fever / High Temperature',
    category: 'medical',
    description: 'Back of dominant hand touches forehead to check heat with concerned facial expression.',
    culturalNote: 'Common in clinical malaria and infection triage.',
    durationMs: 1400,
    keyframes: [
      {
        progress: 0.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
      {
        progress: 0.45,
        head: { ...NEUTRAL_HEAD, brows: 'furrowed' },
        leftArm: REST_LEFT_ARM,
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 270, y: 210 },
          wrist: { x: 210, y: 110 },
          hand: { ...OPEN_FLAT_HAND, orientation: 'palm_out' },
        },
        caption: 'Back of hand touches forehead (Checking fever)',
      },
      {
        progress: 0.8,
        head: { ...NEUTRAL_HEAD, brows: 'furrowed' },
        leftArm: REST_LEFT_ARM,
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 275, y: 220 },
          wrist: { x: 225, y: 140 },
          hand: OPEN_FLAT_HAND,
        },
        caption: 'Pull away with concern (Homa)',
      },
      {
        progress: 1.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
    ],
  },

  // 14. WEWE (YOU)
  {
    id: 'wewe',
    gloss: 'WEWE',
    swahili: 'Wewe',
    english: 'You',
    category: 'essential',
    description: 'Index finger points directly forward to the other person.',
    durationMs: 1100,
    keyframes: [
      {
        progress: 0.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
      {
        progress: 0.5,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 270, y: 260 },
          wrist: { x: 220, y: 270 },
          hand: POINTING_HAND,
        },
        caption: 'Point directly forward (You)',
      },
      {
        progress: 1.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
    ],
  },

  // 15. MIMI (ME / I)
  {
    id: 'mimi',
    gloss: 'MIMI',
    swahili: 'Mimi',
    english: 'Me / I',
    category: 'essential',
    description: 'Index finger points gently to center of chest.',
    durationMs: 1100,
    keyframes: [
      {
        progress: 0.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
      {
        progress: 0.5,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: {
          shoulder: { x: 260, y: 190 },
          elbow: { x: 260, y: 260 },
          wrist: { x: 200, y: 235 },
          hand: POINTING_HAND,
        },
        caption: 'Point to chest (Me / I)',
      },
      {
        progress: 1.0,
        head: NEUTRAL_HEAD,
        leftArm: REST_LEFT_ARM,
        rightArm: REST_RIGHT_ARM,
      },
    ],
  },
];

// Helper: Linear interpolation
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Cubic smooth easing for natural human motion
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Interpolates full avatar skeletal frame at normalized progress (0.0 to 1.0)
 */
export function interpolateKeyframe(keyframes: KSLKeyframe[], progress: number): KSLKeyframe {
  if (keyframes.length === 0) {
    return {
      progress: 0,
      head: NEUTRAL_HEAD,
      leftArm: REST_LEFT_ARM,
      rightArm: REST_RIGHT_ARM,
    };
  }

  const clamped = Math.max(0, Math.min(1, progress));

  // Find surrounding keyframes
  let prevIdx = 0;
  for (let i = 0; i < keyframes.length; i++) {
    if (keyframes[i].progress <= clamped) {
      prevIdx = i;
    } else {
      break;
    }
  }

  const nextIdx = Math.min(keyframes.length - 1, prevIdx + 1);
  const k1 = keyframes[prevIdx];
  const k2 = keyframes[nextIdx];

  if (prevIdx === nextIdx || k1.progress === k2.progress) {
    return k1;
  }

  const span = k2.progress - k1.progress;
  const rawRatio = (clamped - k1.progress) / span;
  const ratio = easeInOutCubic(rawRatio);

  const lerpPoint = (p1: { x: number; y: number }, p2: { x: number; y: number }) => ({
    x: lerp(p1.x, p2.x, ratio),
    y: lerp(p1.y, p2.y, ratio),
  });

  const lerpHand = (h1: HandPose, h2: HandPose): HandPose => ({
    thumb: lerp(h1.thumb, h2.thumb, ratio),
    index: lerp(h1.index, h2.index, ratio),
    middle: lerp(h1.middle, h2.middle, ratio),
    ring: lerp(h1.ring, h2.ring, ratio),
    pinky: lerp(h1.pinky, h2.pinky, ratio),
    spread: lerp(h1.spread, h2.spread, ratio),
    pinch: lerp(h1.pinch, h2.pinch, ratio),
    orientation: ratio < 0.5 ? h1.orientation : h2.orientation,
  });

  const lerpArm = (a1: ArmPose, a2: ArmPose): ArmPose => ({
    shoulder: lerpPoint(a1.shoulder, a2.shoulder),
    elbow: lerpPoint(a1.elbow, a2.elbow),
    wrist: lerpPoint(a1.wrist, a2.wrist),
    hand: lerpHand(a1.hand, a2.hand),
  });

  return {
    progress: clamped,
    head: {
      x: lerp(k1.head.x, k2.head.x, ratio),
      y: lerp(k1.head.y, k2.head.y, ratio),
      tilt: lerp(k1.head.tilt, k2.head.tilt, ratio),
      brows: ratio < 0.5 ? k1.head.brows : k2.head.brows,
      mouth: ratio < 0.5 ? k1.head.mouth : k2.head.mouth,
    },
    leftArm: lerpArm(k1.leftArm, k2.leftArm),
    rightArm: lerpArm(k1.rightArm, k2.rightArm),
    caption: ratio < 0.5 ? k1.caption : k2.caption,
  };
}

/**
 * Generates synthetic KSL fingerspelling animation for custom words (e.g. drug names, proper names)
 */
export function generateFingerspellSign(word: string): KSLSignDefinition {
  const letters = word.toUpperCase().split('');
  const durationMs = Math.max(1200, letters.length * 600);
  const keyframes: KSLKeyframe[] = [];

  keyframes.push({
    progress: 0.0,
    head: NEUTRAL_HEAD,
    leftArm: REST_LEFT_ARM,
    rightArm: REST_RIGHT_ARM,
    caption: `Spell: ${word}`,
  });

  for (let i = 0; i < letters.length; i++) {
    const char = letters[i];
    const p1 = (i + 0.3) / (letters.length + 0.5);
    const p2 = (i + 0.8) / (letters.length + 0.5);

    // Dynamic hand configuration based on letter
    const isVowel = 'AEIOU'.includes(char);
    const handPose: HandPose = {
      thumb: isVowel ? 1.0 : 0.2,
      index: char === 'I' || char === 'Y' ? 0.1 : 0.9,
      middle: char === 'V' || char === 'W' || char === 'K' ? 1.0 : 0.2,
      ring: char === 'W' ? 1.0 : 0.1,
      pinky: char === 'I' || char === 'Y' ? 1.0 : 0.1,
      spread: 0.3,
      pinch: char === 'O' ? 0.0 : 0.5,
      orientation: 'palm_out',
    };

    keyframes.push({
      progress: p1,
      head: NEUTRAL_HEAD,
      leftArm: REST_LEFT_ARM,
      rightArm: {
        shoulder: { x: 260, y: 190 },
        elbow: { x: 280, y: 260 },
        wrist: { x: 250, y: 220 + (i % 2) * 5 },
        hand: handPose,
      },
      caption: `Letter "${char}"`,
    });

    keyframes.push({
      progress: p2,
      head: NEUTRAL_HEAD,
      leftArm: REST_LEFT_ARM,
      rightArm: {
        shoulder: { x: 260, y: 190 },
        elbow: { x: 280, y: 260 },
        wrist: { x: 250, y: 220 },
        hand: handPose,
      },
      caption: `Letter "${char}"`,
    });
  }

  keyframes.push({
    progress: 1.0,
    head: NEUTRAL_HEAD,
    leftArm: REST_LEFT_ARM,
    rightArm: REST_RIGHT_ARM,
    caption: `Spelled "${word}"`,
  });

  return {
    id: `spell_${word.toLowerCase()}`,
    gloss: `SPELL:${word}`,
    swahili: word,
    english: word,
    category: 'essential',
    description: `Fingerspelling the word "${word}" using the Kenyan Sign Language manual alphabet.`,
    culturalNote: 'Used in KSL for medical terminology, prescription drug brand names, and patient names.',
    durationMs,
    keyframes,
  };
}
