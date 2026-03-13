// Maps archetype names (from backend/quiz) to avatar .glb model paths
// Each model has tuned scale & posY to render at the same visible size in the pedestal
// high_achiever is the baseline reference model

const avatarMap = {
  // Exact backend archetype names → model paths
  'High Achiever Burnout Risk': '/avatars/high_achiever.glb',
  'Creative Sprinter':          '/avatars/creative_sprinter.glb',
  'Impulsive Temporal Discounter': '/avatars/impulsive.glb',
  'Fragile Perfectionist':     '/avatars/perfectionist.glb',
  'Distracted Wanderer':        '/avatars/wanderer.glb',
  'Guarded Stoic':              '/avatars/stoic.glb',
  'UPI Native':                 '/avatars/wanderer.glb',

  // Legacy shorthand keys
  high_achiever:     '/avatars/high_achiever.glb',
  creative_sprinter: '/avatars/creative_sprinter.glb',
  impulsive:         '/avatars/impulsive.glb',
  perfectionist:     '/avatars/perfectionist.glb',
  wanderer:          '/avatars/wanderer.glb',
  stoic:             '/avatars/stoic.glb',
};

export default avatarMap;
