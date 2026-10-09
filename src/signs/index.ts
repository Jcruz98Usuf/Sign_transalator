/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SignRecording } from '../types/vrmSign';

import helloData from './hello.json';
import helpData from './help.json';
import painData from './pain.json';
import doctorData from './doctor.json';
import waterData from './water.json';
import yesData from './yes.json';
import noData from './no.json';
import thankYouData from './thank_you.json';
import dawaData from './dawa.json';
import homaData from './homa.json';
import hospitaliData from './hospitali.json';
import dharuraData from './dharura.json';
import sindanoData from './sindano.json';
import wapiData from './wapi.json';
import kichwaData from './kichwa.json';
import damuData from './damu.json';
import tumboData from './tumbo.json';
import kupumuaData from './kupumua.json';
import chunguzaData from './chunguza.json';
import chakulaData from './chakula.json';
import usingiziData from './usingizi.json';

export const MVP_SIGNS: Record<string, SignRecording> = {
  hello: helloData as SignRecording,
  help: helpData as SignRecording,
  pain: painData as SignRecording,
  doctor: doctorData as SignRecording,
  water: waterData as SignRecording,
  medicine: dawaData as SignRecording,
  fever: homaData as SignRecording,
  hospital: hospitaliData as SignRecording,
  emergency: dharuraData as SignRecording,
  injection: sindanoData as SignRecording,
  blood: damuData as SignRecording,
  stomach: tumboData as SignRecording,
  breathing: kupumuaData as SignRecording,
  examine: chunguzaData as SignRecording,
  food: chakulaData as SignRecording,
  sleep: usingiziData as SignRecording,
  where: wapiData as SignRecording,
  headache: kichwaData as SignRecording,
  yes: yesData as SignRecording,
  no: noData as SignRecording,
  thank_you: thankYouData as SignRecording,
};

export interface SignVocabularyItem {
  id: string;
  word: string;
  label: string; // KSL Gloss (English)
  kslGloss: string;
  category: 'greeting' | 'medical' | 'essential' | 'response';
  swahili: string;
  english: string;
  description: string;
  data: SignRecording;
}

export const SIGN_VOCABULARY: SignVocabularyItem[] = [
  {
    id: 'pain',
    word: 'pain',
    label: 'PAIN',
    kslGloss: 'MAUMIVU',
    category: 'medical',
    swahili: 'Maumivu',
    english: 'Pain / Ache / Hurt',
    description: 'Both index fingers point at each other and perform a quick twisting motion in front of the chest.',
    data: painData as SignRecording,
  },
  {
    id: 'medicine',
    word: 'medicine',
    label: 'MEDICINE',
    kslGloss: 'DAWA',
    category: 'medical',
    swahili: 'Dawa',
    english: 'Medicine / Prescription',
    description: 'Flat left palm held open while right middle finger gently circular-rubs palm mimicking preparing a pill.',
    data: dawaData as SignRecording,
  },
  {
    id: 'doctor',
    word: 'doctor',
    label: 'DOCTOR',
    kslGloss: 'DAKTARI',
    category: 'medical',
    swahili: 'Daktari',
    english: 'Doctor / Physician',
    description: 'Right fingertips tap the radial pulse on the upturned left wrist twice.',
    data: doctorData as SignRecording,
  },
  {
    id: 'fever',
    word: 'fever',
    label: 'FEVER',
    kslGloss: 'HOMA',
    category: 'medical',
    swahili: 'Homa',
    english: 'Fever / High Temperature',
    description: 'Back of dominant right hand touches forehead checking body temperature.',
    data: homaData as SignRecording,
  },
  {
    id: 'emergency',
    word: 'emergency',
    label: 'EMERGENCY',
    kslGloss: 'DHARURA',
    category: 'medical',
    swahili: 'Dharura',
    english: 'Emergency / Urgent Alert',
    description: 'Both hands wave urgently across the chest signaling immediate critical priority.',
    data: dharuraData as SignRecording,
  },
  {
    id: 'hospital',
    word: 'hospital',
    label: 'HOSPITAL',
    kslGloss: 'HOSPITALI',
    category: 'medical',
    swahili: 'Hospitali',
    english: 'Hospital / Clinic',
    description: 'Right index finger traces cross emblem upon upper left arm/shoulder.',
    data: hospitaliData as SignRecording,
  },
  {
    id: 'headache',
    word: 'headache',
    label: 'HEADACHE',
    kslGloss: 'KICHWA',
    category: 'medical',
    swahili: 'Kichwa Kinauma',
    english: 'Headache',
    description: 'Right index finger taps and rotates near temple signaling acute head discomfort.',
    data: kichwaData as SignRecording,
  },
  {
    id: 'injection',
    word: 'injection',
    label: 'INJECTION',
    kslGloss: 'SINDANO',
    category: 'medical',
    swahili: 'Sindano',
    english: 'Injection / Shot / Vaccine',
    description: 'Right thumb and index mimic syringe pressing into upper left arm.',
    data: sindanoData as SignRecording,
  },
  {
    id: 'blood',
    word: 'blood',
    label: 'BLOOD',
    kslGloss: 'DAMU',
    category: 'medical',
    swahili: 'Damu',
    english: 'Blood / Bleeding',
    description: 'Flat left forearm held horizontal while dominant right index finger traces downward indicating bleeding or blood flow.',
    data: damuData as SignRecording,
  },
  {
    id: 'stomach',
    word: 'stomach',
    label: 'STOMACH',
    kslGloss: 'TUMBO',
    category: 'medical',
    swahili: 'Tumbo Kuumwa',
    english: 'Stomach Ache / Abdominal Pain',
    description: 'Both open palms gently pat and circulate over the lower abdomen indicating stomach pain or nausea.',
    data: tumboData as SignRecording,
  },
  {
    id: 'breathing',
    word: 'breathing',
    label: 'BREATHING',
    kslGloss: 'KUPUMUA',
    category: 'medical',
    swahili: 'Kupumua / Kifua',
    english: 'Difficulty Breathing / Chest',
    description: 'Both open hands placed in front of chest rise and expand outward, then sink inward with respiration rhythm.',
    data: kupumuaData as SignRecording,
  },
  {
    id: 'examine',
    word: 'examine',
    label: 'EXAMINE',
    kslGloss: 'CHUNGUZA',
    category: 'medical',
    swahili: 'Chunguza / Pima',
    english: 'Examine / Medical Test',
    description: '"C" or pinch handshape moves forward methodically as clinician checks or tests patient.',
    data: chunguzaData as SignRecording,
  },
  {
    id: 'food',
    word: 'food',
    label: 'FOOD',
    kslGloss: 'CHAKULA',
    category: 'essential',
    swahili: 'Chakula',
    english: 'Food / Nutrition',
    description: 'Right hand flattened-O handshape taps toward mouth twice signifying eating or meal schedule.',
    data: chakulaData as SignRecording,
  },
  {
    id: 'sleep',
    word: 'sleep',
    label: 'SLEEP',
    kslGloss: 'USINGIZI',
    category: 'essential',
    swahili: 'Usingizi / Pumzika',
    english: 'Sleep / Rest',
    description: 'Right palm tilts gently toward right ear with slight head tilt denoting rest or sleeping state.',
    data: usingiziData as SignRecording,
  },
  {
    id: 'help',
    word: 'help',
    label: 'HELP',
    kslGloss: 'MSAADA',
    category: 'essential',
    swahili: 'Msaada',
    english: 'Help / Assistance',
    description: 'Flat left palm supports thumbs-up right fist lifting upward together.',
    data: helpData as SignRecording,
  },
  {
    id: 'water',
    word: 'water',
    label: 'WATER',
    kslGloss: 'MAJI',
    category: 'essential',
    swahili: 'Maji',
    english: 'Water',
    description: '"W" handshape (index, middle, ring spread) taps chin gently twice.',
    data: waterData as SignRecording,
  },
  {
    id: 'where',
    word: 'where',
    label: 'WHERE',
    kslGloss: 'WAPI',
    category: 'essential',
    swahili: 'Wapi',
    english: 'Where / Location Inquiry',
    description: 'Both palms turned upward gently swaying outward in a questioning inquiry.',
    data: wapiData as SignRecording,
  },
  {
    id: 'hello',
    word: 'hello',
    label: 'HELLO',
    kslGloss: 'HABARI',
    category: 'greeting',
    swahili: 'Habari / Hujambo',
    english: 'Hello / Greeting',
    description: 'Raised right hand near temple, open fingers smoothly waving outward.',
    data: helloData as SignRecording,
  },
  {
    id: 'yes',
    word: 'yes',
    label: 'YES',
    kslGloss: 'NDIYO',
    category: 'response',
    swahili: 'Ndiyo',
    english: 'Yes / Agree',
    description: 'Right fist nods downward at the wrist twice like an affirming head nod.',
    data: yesData as SignRecording,
  },
  {
    id: 'no',
    word: 'no',
    label: 'NO',
    kslGloss: 'HAPANA',
    category: 'response',
    swahili: 'Hapana',
    english: 'No / Decline',
    description: 'Index and middle fingers snap closed against the thumb twice.',
    data: noData as SignRecording,
  },
  {
    id: 'thank_you',
    word: 'thank_you',
    label: 'THANK YOU',
    kslGloss: 'ASANTE',
    category: 'greeting',
    swahili: 'Asante',
    english: 'Thank You / Gratitude',
    description: 'Fingertips touch chin/lips then sweep forward and downward toward person.',
    data: thankYouData as SignRecording,
  },
];
