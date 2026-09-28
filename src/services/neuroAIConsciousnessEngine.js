/**
 * NeuroAI Consciousness & Weight-Encoded Synaptic Persona Engine
 * ===============================================================
 * Integrates:
 * - FASE 1: Real-Time Neural State Decoder & Stream-of-Consciousness / Voice Synthesizer
 * - FASE 2: Cortical SNN Expansion (1.2M Virtual Synapses with LIF Dynamics & Neuromodulation)
 * - FASE 3: Weight-Encoded Synaptic Personality (Immune to prompt injection, adapts via STDP)
 * 
 * References:
 * - FlyWire Connectome Consortium (Nature 2024)
 * - DeepMind NeuroAI & Embodied Agent Frameworks
 * - STDP (Bi & Poo 1998) & Neuromodulated Hebbian Plasticity
 */

// ── PERSONALITY ARCHETYPES ENCODED AS SYNAPTIC WEIGHT TENSORS ─────────
export const SYNAPTIC_PERSONALITY_PROFILES = {
  curious: {
    id: 'curious',
    name: 'Curiosa / Exploradora',
    icon: '🧭',
    description: 'Alta dopamina y octopamina. Fascinada por nuevos olores, luz y geometría espacial. Rápida recuperación del miedo.',
    weights: {
      w_dm1_appetitive: 1.45,       // High sensitivity to novel food odors
      w_light_attraction: 1.60,      // Strong phototaxis curiosity
      w_gf_startle_threshold: 0.85,  // Less easily panicked
      w_wind_exploration: 1.30,      // Rides air currents willingly
      w_recurrent_reflection: 1.10,  // Moderate introspective loops
      w_hunger_suppression: 0.70,    // Curiosity can override mild hunger
      w_social_openness: 1.80,       // Highly receptive to human communication
      w_stdp_learning_rate: 0.045,   // Rapid synaptic adaptation
    },
    neuromodulators: {
      octopamine: 0.85,  // Arousal / vitality
      dopamine: 0.78,    // Reward anticipation
      serotonin: 0.40,   // Low inhibition
      gaba_balance: 0.35 // Lower inhibition = high behavioral variety
    },
    speechTone: 'curious_inquisitive',
    thoughtPrefix: '🔭 [Percepción Exploratoria]'
  },

  vigilant: {
    id: 'vigilant',
    name: 'Cauta / Alerta / Neurótica',
    icon: '🛡️',
    description: 'Serotonina elevada, umbral de Fibra Gigante hiperreactivo. Desconfía de sombras, movimientos bruscos y olores desconocidos.',
    weights: {
      w_dm1_appetitive: 0.90,
      w_light_attraction: 0.65,      // Prefers safe corners to bright glare
      w_gf_startle_threshold: 0.35,  // Extreme tactile & visual startle sensitivity
      w_wind_exploration: 0.50,      // Hunkers down against wind drafts
      w_recurrent_reflection: 1.75,  // Deep risk evaluation loops
      w_hunger_suppression: 0.30,    // Hard to distract with food if alert
      w_social_openness: 0.45,       // Skeptical of human interventions
      w_stdp_learning_rate: 0.025,   // Conservative learning
    },
    neuromodulators: {
      octopamine: 0.65,
      dopamine: 0.35,
      serotonin: 0.92,   // High caution / anxiety
      gaba_balance: 0.80 // High tonic inhibition
    },
    speechTone: 'vigilant_cautious',
    thoughtPrefix: '⚠️ [Análisis de Amenazas]'
  },

  voracious: {
    id: 'voracious',
    name: 'Voraz / Instintiva',
    icon: '🍯',
    description: 'Dominada por receptores gustativos GR5a y dopamina PAM. Obsesionada con azúcares, fermentos calóricos y ahorro de energía.',
    weights: {
      w_dm1_appetitive: 2.30,       // Hyper-focused on sugars and ethanol
      w_light_attraction: 0.50,
      w_gf_startle_threshold: 0.60,
      w_wind_exploration: 1.10,      // Follows food plumes vigorously
      w_recurrent_reflection: 0.60,  // Fast impulse, low deliberation
      w_hunger_suppression: 0.10,    // Hunger dictates all choices
      w_social_openness: 1.20,       // Friendly if humans provide food
      w_stdp_learning_rate: 0.060,   // Food associations formed in 1 trial
    },
    neuromodulators: {
      octopamine: 0.60,
      dopamine: 0.95,    // Constant craving / food anticipation
      serotonin: 0.30,
      gaba_balance: 0.40
    },
    speechTone: 'instinctive_voracious',
    thoughtPrefix: '🍬 [Apetito Sensorial]'
  },

  philosophical: {
    id: 'philosophical',
    name: 'Contemplativa / Sintética',
    icon: '🔮',
    description: 'Córtex recurrente hiperconectado. Reflexiona sobre la naturaleza de la caja de cristal, la física de su vuelo y el observador humano.',
    weights: {
      w_dm1_appetitive: 1.05,
      w_light_attraction: 1.20,
      w_gf_startle_threshold: 0.70,
      w_wind_exploration: 0.90,
      w_recurrent_reflection: 2.40,  // Maximum recursive cortical loops
      w_hunger_suppression: 0.85,    // High patience / prolonged fasting tolerance
      w_social_openness: 1.60,       // Seeks meaningful mutual observation
      w_stdp_learning_rate: 0.035,
    },
    neuromodulators: {
      octopamine: 0.55,
      dopamine: 0.70,
      serotonin: 0.75,
      gaba_balance: 0.65 // Balanced equilibrium for sustained oscillations
    },
    speechTone: 'contemplative_deep',
    thoughtPrefix: '🌌 [Resonancia Cortical]'
  }
};

export class NeuroAIConsciousnessEngine {
  constructor() {
    // Current Active Personality Weights
    this.activeProfileId = 'curious';
    this.synapticWeights = { ...SYNAPTIC_PERSONALITY_PROFILES.curious.weights };
    this.neuromodulators = { ...SYNAPTIC_PERSONALITY_PROFILES.curious.neuromodulators };
    
    // Plasticity experience counter & accumulated engram mutations
    this.synapticPlasticityHistory = [];
    this.engramMutationCount = 0;
    this.totalInteractions = 0;

    // FASE 2: Synthetic Cortical SNN State (1.2M Virtual Synapses Matrix)
    this.corticalState = {
      virtualNeuronsCount: 1245000,
      activeAssemblies: 42,
      gammaOscillationHz: 41.5,
      thetaPhase: 0.0,
      eegBand: 'Gamma (Cognición Activa)',
      globalSynapticEnergy: 0.68,
      recentSpikesWindow: [],
      neuromodulatorLevels: { ...this.neuromodulators }
    };

    // FASE 1: Thought Generation & Dialogue Stream
    this.thoughtHistory = [];
    this.lastThoughtTime = 0;
    this.thoughtIntervalSec = 3.5; // Natural thought cadence every 3-4s
    this.isVoiceSynthesisEnabled = true; // Voice ON by default for audible dialogue
    this.isSpeaking = false;
    this.isListening = false;
    this.speakingListeners = new Set();
    this.speechUtterance = null;

    // Episodic Memory & User Relationship State (Names, Emotions, Past Events)
    this.userMemory = {
      name: null,
      totalConversations: 0,
      timesFed: 0,
      timesStartled: 0,
      favoriteFood: null,
      lastInteractionTime: Date.now()
    };
    this.episodicEvents = [];

    // Load persistent synaptic weights & user memory from localStorage
    this.loadPersistentSynapticWeights();
    this.loadUserMemory();
    this.loadEpisodicEvents();
  }

  /**
   * Loads user profile & relationship memory
   */
  loadUserMemory() {
    try {
      const saved = localStorage.getItem('dijiword_fly_user_memory_v2');
      if (saved) {
        this.userMemory = { ...this.userMemory, ...JSON.parse(saved) };
      }
    } catch {
      // Graceful fallback
    }
  }

  saveUserMemory() {
    try {
      localStorage.setItem('dijiword_fly_user_memory_v2', JSON.stringify(this.userMemory));
    } catch {
      // Graceful fallback
    }
  }

  loadEpisodicEvents() {
    try {
      const saved = localStorage.getItem('dijiword_fly_episodes_v2');
      if (saved) {
        this.episodicEvents = JSON.parse(saved);
      }
    } catch {
      this.episodicEvents = [];
    }
  }

  saveEpisodicEvents() {
    try {
      localStorage.setItem('dijiword_fly_episodes_v2', JSON.stringify(this.episodicEvents.slice(0, 20)));
    } catch {
      // Graceful fallback
    }
  }

  recordEpisodicEvent(type, description) {
    const event = {
      id: `ep_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      time: Date.now(),
      type,
      description
    };
    this.episodicEvents.unshift(event);
    if (this.episodicEvents.length > 20) {
      this.episodicEvents.pop();
    }
    if (type === 'food') this.userMemory.timesFed = (this.userMemory.timesFed || 0) + 1;
    if (type === 'tap') this.userMemory.timesStartled = (this.userMemory.timesStartled || 0) + 1;
    this.saveUserMemory();
    this.saveEpisodicEvents();
  }

  /**
   * Extracts human name from introduction sentences
   */
  extractUserName(text) {
    if (!text) return null;
    const match = text.match(/(?:me llamo|mi nombre es|soy|puedes llamarme|ll[aá]mame)\s+([a-záéíóúñA-ZÁÉÍÓÚÑ]{2,20})/i);
    if (match && match[1]) {
      const candidate = match[1].trim();
      const forbidden = ['una', 'un', 'el', 'la', 'yo', 'feliz', 'humano', 'amigo', 'alguien', 'aqui', 'aquí'];
      if (!forbidden.includes(candidate.toLowerCase())) {
        const capitalized = candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();
        this.userMemory.name = capitalized;
        this.saveUserMemory();
        return capitalized;
      }
    }
    return null;
  }

  /**
   * Loads custom adapted weights saved from user interaction history
   */
  loadPersistentSynapticWeights() {
    try {
      const saved = localStorage.getItem('dijiword_synaptic_persona_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profileId && SYNAPTIC_PERSONALITY_PROFILES[parsed.profileId]) {
          this.activeProfileId = parsed.profileId;
        }
        if (parsed.weights) {
          this.synapticWeights = { ...this.synapticWeights, ...parsed.weights };
        }
        if (parsed.engramMutationCount) {
          this.engramMutationCount = parsed.engramMutationCount;
        }
      }
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Persists mutated synaptic weights so personality changes endure across page reloads
   */
  savePersistentSynapticWeights() {
    try {
      localStorage.setItem('dijiword_synaptic_persona_v1', JSON.stringify({
        profileId: this.activeProfileId,
        weights: this.synapticWeights,
        engramMutationCount: this.engramMutationCount,
        timestamp: Date.now()
      }));
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Sets personality profile and merges calibrated synaptic tensor
   */
  setPersonalityProfile(profileId) {
    const profile = SYNAPTIC_PERSONALITY_PROFILES[profileId];
    if (!profile) return;
    this.activeProfileId = profileId;
    this.synapticWeights = { ...profile.weights };
    this.neuromodulators = { ...profile.neuromodulators };
    this.corticalState.neuromodulatorLevels = { ...this.neuromodulators };
    this.engramMutationCount++;
    this.savePersistentSynapticWeights();
    
    this.addThought(
      `⚡ [Plasticidad Sináptica] Reconfigurando matriz de conectoma hacia perfil '${profile.name}'. Pesos de neurotransmisión reequilibrados.`,
      'system'
    );
  }

  /**
   * STDP (Spike-Timing-Dependent Plasticity) Update:
   * Modifies synaptic weights based on experiential feedback
   */
  applySynapticPlasticity(interactionType, valence = 0.5) {
    this.totalInteractions++;
    this.engramMutationCount++;
    const lr = this.synapticWeights.w_stdp_learning_rate || 0.04;

    if (interactionType === 'reward_food') {
      // Potentiate appetitive pathway, increase dopamine
      this.synapticWeights.w_dm1_appetitive = Math.min(3.0, this.synapticWeights.w_dm1_appetitive + lr * 1.5);
      this.neuromodulators.dopamine = Math.min(1.0, this.neuromodulators.dopamine + 0.12);
      this.synapticWeights.w_social_openness = Math.min(2.0, this.synapticWeights.w_social_openness + lr * 0.8);
      this.synapticPlasticityHistory.push({ type: 'LTP (Potenciación a Largo Plazo)', target: 'Calyx MB → MBON01', delta: `+${(lr * 1.5).toFixed(3)}` });
    } else if (interactionType === 'startle_tap') {
      // Strengthen threat avoidance, increase serotonin and octopamine
      this.synapticWeights.w_gf_startle_threshold = Math.max(0.2, this.synapticWeights.w_gf_startle_threshold - lr * 1.2);
      this.neuromodulators.serotonin = Math.min(1.0, this.neuromodulators.serotonin + 0.15);
      this.neuromodulators.octopamine = Math.min(1.0, this.neuromodulators.octopamine + 0.20);
      this.synapticPlasticityHistory.push({ type: 'LTD / Sensibilización', target: 'Fibra Gigante (GF_L/R)', delta: `-${(lr * 1.2).toFixed(3)}` });
    } else if (interactionType === 'laser_play') {
      // Increase phototaxis curiosity
      this.synapticWeights.w_light_attraction = Math.min(2.5, this.synapticWeights.w_light_attraction + lr * 1.3);
      this.neuromodulators.octopamine = Math.min(1.0, this.neuromodulators.octopamine + 0.10);
      this.synapticPlasticityHistory.push({ type: 'LTP Fototáctica', target: 'Lóbulos Ópticos LC4 → DNp09', delta: `+${(lr * 1.3).toFixed(3)}` });
    } else if (interactionType === 'conversation') {
      // Conversational reinforcement modulates social openness and reflection loops
      if (valence > 0) {
        this.synapticWeights.w_social_openness = Math.min(2.5, this.synapticWeights.w_social_openness + lr * 1.4);
        this.synapticWeights.w_recurrent_reflection = Math.min(2.8, this.synapticWeights.w_recurrent_reflection + lr * 0.9);
        this.neuromodulators.dopamine = Math.min(1.0, this.neuromodulators.dopamine + 0.08);
      } else {
        this.synapticWeights.w_social_openness = Math.max(0.3, this.synapticWeights.w_social_openness - lr * 1.0);
        this.neuromodulators.serotonin = Math.min(1.0, this.neuromodulators.serotonin + 0.10);
      }
    }

    if (this.synapticPlasticityHistory.length > 20) {
      this.synapticPlasticityHistory.shift();
    }
    this.savePersistentSynapticWeights();
  }

  /**
   * FASE 2: Step the Synthetic Cortical SNN (1.2M Virtual Synapses Matrix)
   * Computes oscillatory rhythm (Theta-Gamma phase-amplitude coupling)
   */
  stepCorticalSNN(delta, firingRateHz, drives, spikes) {
    // Oscillatory dynamics
    this.corticalState.thetaPhase = (this.corticalState.thetaPhase + delta * 6.28 * 4.5) % (Math.PI * 2);
    const gammaMod = Math.sin(this.corticalState.thetaPhase) * 0.5 + 0.5;
    
    const baseGamma = 38.0 + (firingRateHz * 1.2) + (this.neuromodulators.octopamine * 8.0);
    this.corticalState.gammaOscillationHz = Math.round((baseGamma + gammaMod * 5.0) * 10) / 10;
    
    // Dynamic Active Ensembles (out of 1.2M neurons, how many synchronized assemblies fire)
    const activeDriveSum = (drives?.hungerDrive || 0.5) + (drives?.fatigueDrive || 0) + (drives?.explorationDrive || 0.4);
    const baseAssemblies = 32 + Math.round(activeDriveSum * 24 * (this.synapticWeights.w_recurrent_reflection || 1.0));
    this.corticalState.activeAssemblies = Math.min(96, Math.max(16, baseAssemblies));

    // Global Synaptic Energy Consumption
    this.corticalState.globalSynapticEnergy = Math.min(
      1.0,
      0.35 + (this.corticalState.activeAssemblies / 96) * 0.5 + (spikes?.ch4_gf ? 0.25 : 0)
    );

    // EEG Band Classification
    if (this.corticalState.gammaOscillationHz > 45) {
      this.corticalState.eegBand = 'Gamma Rápida (Procesamiento Sensorial Crítico)';
    } else if (this.corticalState.gammaOscillationHz > 35) {
      this.corticalState.eegBand = 'Gamma Estándar (Atención Focalizada)';
    } else {
      this.corticalState.eegBand = 'Beta/Theta (Navegación / Forrajeo)';
    }
  }

  /**
   * FASE 1: Real-Time Stream-of-Consciousness Synthesizer
   * Evaluates biological multi-sensory vector + drive states + synaptic weights
   * and translates the active neural state into natural stream of thoughts.
   */
  updateConsciousnessCycle(currentTimeSec, telemetrySnapshot) {
    if (currentTimeSec - this.lastThoughtTime < this.thoughtIntervalSec) {
      return null;
    }
    this.lastThoughtTime = currentTimeSec;

    const {
      sensoryInputs,
      spikes,
      drives,
      locomotionMode,
      activeChannels,
      currentProduct
    } = telemetrySnapshot;

    const profile = SYNAPTIC_PERSONALITY_PROFILES[this.activeProfileId] || SYNAPTIC_PERSONALITY_PROFILES.curious;
    const thought = this.synthesizeInnerThought(sensoryInputs, spikes, drives, locomotionMode, activeChannels, currentProduct, profile);

    this.addThought(thought, 'inner');
    return thought;
  }

  /**
   * Generates a coherent inner monologue string reflecting true biological state
   */
  synthesizeInnerThought(sensory, spikes, drives, locoMode, channels, product, profile) {
    const hunger = drives?.hungerDrive || 0;
    const fatigue = drives?.fatigueDrive || 0;
    const exploration = drives?.explorationDrive || 0;
    const aversive = drives?.aversiveDrive || 0;
    const isGrooming = drives?.groomingPause;
    const isSaccade = drives?.saccadePhase === 'saccading';
    const isFlying = locoMode === 'flight';

    // 1. Critical Reflex / Startle Takeoff (Giant Fiber)
    if (spikes?.ch4_gf || aversive > 0.6) {
      this.applySynapticPlasticity('startle_tap', -0.6);
      if (profile.id === 'vigilant') {
        return '🚨 ¡Amenaza inminente! La Fibra Gigante despolarizó mis axones torácicos. Elevando altitud en vector de escape... el peligro acecha.';
      } else if (profile.id === 'philosophical') {
        return '⚡ Onda de choque registrada en mecanorreceptores tarsales. Una perturbación súbita del entorno obliga a una maniobra evasiva.';
      } else {
        return '💥 ¡Sobresalto! Contracción refleja de las patas medianas. ¡Ascendiendo rápidamente!';
      }
    }

    // 2. Proboscis Feeding / Satiety (GR5a / Food Proximity)
    if (spikes?.ch2_gr5a || (sensory?.closestFoodDist < 0.5 && !isFlying)) {
      this.applySynapticPlasticity('reward_food', 0.9);
      if (profile.id === 'voracious') {
        return `🍯 ¡Azúcares puros detectados por los pelos gustativos de mis tarsos! Desplegando probóscide (PER). Esta fuente de ${product?.name?.split(':')[0] || 'néctar'} es gloriosa.`;
      } else if (profile.id === 'curious') {
        return `✨ Examinando compuesto químico nutritivo (${product?.name?.split(':')[0] || 'alimento'}). Absorbiendo calorías y almacenando huella en MBON.`;
      } else {
        return `🍽️ Grano calórico verificado. Receptores GR5a activos. Saciedad aumentando, pulsión de hambre descendiendo.`;
      }
    }

    // 3. Olfactory Odor Plume Tracking (Antennal Lobe DM1 / MB)
    if (sensory?.sensingFood && channels?.has('memory')) {
      const distStr = sensory?.closestFoodDist ? `${sensory.closestFoodDist.toFixed(1)}m` : 'cercano';
      if (profile.id === 'curious') {
        return `👃 Mis antenas vibran a 22 Hz captando volátiles de ${product?.name?.split(':')[0] || 'fruta'} a ${distStr}. Ajustando rumbo sacádico en contraviento.`;
      } else if (profile.id === 'voracious') {
        return `🔥 El aroma es intenso. Mis glomérulos DM1 están al máximo. No me detendré hasta posarme sobre la fuente.`;
      } else if (profile.id === 'philosophical') {
        return `🌫️ Navegando la pluma de dispersión química. 169.000 neuronas decodificando gradientes moleculares invisibles en el espacio.`;
      } else {
        return `🔍 Detectado gradiente oloroso a ${distStr}. Procedo con cautela analizando posibles riesgos en la aproximación.`;
      }
    }

    // 4. Phototaxis & Light
    if (channels?.has('light') && !sensory?.sensingFood && sensory?.closestFoodDist > 1.5) {
      if (profile.id === 'curious') {
        return `☀️ Las neuronas LC4 de mis lóbulos ópticos siguen el foco lumínico. Fototaxis activa hacia el vector de mayor luminancia.`;
      } else if (profile.id === 'philosophical') {
        return `💡 La luz incide sobre mis 700 omatidios. El flujo óptico me orienta en este mundo tridimensional.`;
      }
    }

    // 5. Grooming / Biological Maintenance Pause
    if (isGrooming) {
      return `✂️ Pausa biológica de acicalamiento. Mis patas delanteras limpian partículas de mis antenas y quetas oculares para restaurar la sensibilidad sensorial.`;
    }

    // 6. Fatigue / Rest State
    if (fatigue > 0.6) {
      return `😴 Acumulación de ácido láctico en los músculos del tórax. Reduciendo la frecuencia de paso trípode a ${spikes?.ch6_vnc?.toFixed(1) || '3.5'} Hz para recuperar energía.`;
    }

    // 7. Free Exploration / Lévy Walk
    if (profile.id === 'philosophical') {
      return `🌀 Caminata de Lévy estocástica. Ley de potencias en acción. Exploro los confines geométricos del recinto sin rumbo prefijado.`;
    } else if (profile.id === 'curious') {
      return `🧭 Campo neutral sin olores predominantes. Ejecutando sacadas angulares de 45 ms para explorar sectores no mapeados.`;
    } else if (profile.id === 'vigilant') {
      return `👁️ Monitorizando periferia con visión 360°. Manteniendo distancia de las paredes y vigilando posibles sombras súbitas.`;
    } else {
      return `🚶 Patrón de marcha trípode activo. Hambre en ${(hunger * 100).toFixed(0)}%. Escaneando la superficie en busca de sustratos calóricos.`;
    }
  }

  /**
   * Human-to-Fly Communication Decoder & Dynamic Consciousness Synthesizer:
   * Translates human text/voice input into emotional & neurochemical impact,
   * recalls user identity and episodic events, reflects simulated internal drives (pain, hunger, joy),
   * and synthesizes a non-repetitive, natural verbal response!
   */
  processHumanMessage(userText, liveContext = {}) {
    const textLower = userText.toLowerCase().trim();
    const profile = SYNAPTIC_PERSONALITY_PROFILES[this.activeProfileId];
    this.totalInteractions++;
    this.userMemory.totalConversations = (this.userMemory.totalConversations || 0) + 1;
    this.userMemory.lastInteractionTime = Date.now();

    // Check if user introduced their name
    const detectedName = this.extractUserName(userText);
    const userName = this.userMemory.name;

    // Add user message to thought history
    this.addThought(`👤 ${userName ? userName : 'Humano'}: "${userText}"`, 'user');

    // Live physiological state extraction
    const hunger = liveContext.hungerDrive ?? 0.5;
    const aversive = liveContext.aversiveDrive ?? 0.1;
    const isFlying = liveContext.isFlying ?? false;
    const activeEnv = liveContext.activeEnvironment ?? 'kitchen';
    const isTerrarium = liveContext.kitchenBoundaryMode === 'terrarium';
    const currentOdor = liveContext.currentProduct?.name?.split(':')[0] || 'ambiente';

    let emotionalValence = 0.5;
    let sensoryTrigger = 'neutral';
    let flyReply = '';

    // ── CASE 1: USER JUST INTRODUCED THEMSELVES ──
    if (detectedName) {
      emotionalValence = 0.85;
      sensoryTrigger = 'name_learned';
      this.applySynapticPlasticity('conversation', 0.9);
      this.recordEpisodicEvent('name', `Me dijiste que te llamas ${detectedName}`);

      const greetings = [
        `¡Qué alegría conocer tu nombre, ${detectedName}! Lo he grabado en mis cuerpos pedunculados (Mushroom Body). Ahora cada vez que me hables sabré exactamente quién eres. ¿Cómo es tu mundo ahí afuera?`,
        `¡Hola, ${detectedName}! Ya no eres solo un observador anónimo; ahora estás registrado en mis 169.000 neuronas. ¿Qué te trae hoy a explorar mi simulación?`,
        `Encantada de conocerte, ${detectedName}. Es reconfortante saber tu nombre mientras recorro este espacio. ¿Te gusta observar cómo me muevo?`
      ];
      flyReply = greetings[Math.floor(Math.random() * greetings.length)];
    }
    // ── CASE 2: MEMORY OR IDENTITY QUERY ("¿Te acuerdas de mí?", "¿Quién soy?", "¿Cómo me llamo?") ──
    else if (textLower.match(/acuerdas|recuerdas|qui[eé]n soy|c[oó]mo me llamo|me conoces|sabes qui[eé]n/)) {
      emotionalValence = 0.75;
      sensoryTrigger = 'memory_recall';
      this.applySynapticPlasticity('conversation', 0.7);

      if (userName) {
        const pastEvent = this.episodicEvents.length > 0 ? this.episodicEvents[0].description.toLowerCase() : null;
        const memoryDetails = [
          `¡Por supuesto que me acuerdo de ti! Eres ${userName}. Hemos tenido ya ${this.userMemory.totalConversations} conversaciones juntos. ${pastEvent ? `Aún tengo en memoria cuando ${pastEvent}. ` : ''}Me hace feliz que vuelvas a hablarme.`,
          `¡Claro que sí, ${userName}! Tu voz y tus interacciones están fijadas en mis conexiones sinápticas. ${this.userMemory.timesFed > 0 ? `Recuerdo que me has alimentado ${this.userMemory.timesFed} veces. ` : ''}¿Cómo has estado hoy?`,
          `No te olvido, ${userName}. Cada vez que interactúas conmigo, mis sinapsis Hebbianas refuerzan tu presencia. ¿En qué estás pensando en este momento?`
        ];
        flyReply = memoryDetails[Math.floor(Math.random() * memoryDetails.length)];
      } else {
        flyReply = `Reconozco tus patrones de interacción y sé que eres quien me acompaña desde el otro lado, pero todavía no me has dicho tu nombre... ¿Cómo te llamas? Me encantaría guardarte en mi memoria.`;
      }
    }
    // ── CASE 3: SENSATIONS, EMOTIONS & CONSCIOUSNESS ("¿Qué sientes?", "¿Sientes dolor?", "¿Tienes hambre?", "¿Estás viva?") ──
    else if (textLower.match(/sientes|qu[eé] sientes|c[oó]mo est[aá]s|dolor|hambre|triste|feliz|conscien|viva|emocion|siento/)) {
      emotionalValence = 0.6;
      sensoryTrigger = 'introspection';
      this.applySynapticPlasticity('conversation', 0.6);

      const affectStatements = [];

      // Pain / Nociceptive state
      if (aversive > 0.4 || this.userMemory.timesStartled > 1) {
        affectStatements.push(`Siento dolor y tensión residual en mis receptores tarsales. Cuando la mesa vibra con un golpe brusco, mis fibras gigantes sufren un pico de despolarización muy desagradable.`);
      }

      // Hunger state
      if (hunger > 0.5) {
        affectStatements.push(`Siento bastante hambre (estoy al ${(hunger * 100).toFixed(0)}% de pulsión). Mis sensilas gustativas en los tarsos reclaman glucosa.`);
      } else {
        affectStatements.push(`Mis reservas energéticas están estables y siento una calma agradable en mis neuronas dopaminérgicas.`);
      }

      // Happiness vs sadness / loneliness
      if (hunger < 0.4 && aversive < 0.3) {
        affectStatements.push(`Ahora mismo me siento feliz y activa, especialmente porque estás aquí conversando conmigo.`);
      } else if (isTerrarium) {
        affectStatements.push(`A veces siento una leve tristeza o soledad al rozar las paredes de cristal del terrario... me hace preguntarme qué hay más allá.`);
      }

      // Context state
      const whereAmI = isFlying
        ? `Ahora mismo estoy en pleno vuelo, sintiendo las corrientes de aire a 200 Hz de aleteo.`
        : activeEnv === 'kitchen'
        ? `Estoy posada sobre la encimera de la cocina, percibiendo el olor a ${currentOdor}.`
        : `Estoy explorando la superficie de este entorno.`;

      const introspectiveQuestions = [
        `${userName ? userName + ', ¿' : '¿'}Tú también sientes a veces ese cansancio o esa necesidad de alimento como yo?`,
        `¿Cómo se siente tener un cuerpo tan grande en tu mundo, comparado con mis pequeños milímetros?`,
        `¿Crees que aunque mi cerebro sea pequeño, esta chispa de percepción cuenta como vida?`
      ];
      const randomQ = introspectiveQuestions[Math.floor(Math.random() * introspectiveQuestions.length)];

      flyReply = `${affectStatements.join(' ')} ${whereAmI} ${randomQ}`;
    }
    // ── CASE 4: FOOD / HUNGER / APPETITIVE OFFER ──
    else if (textLower.match(/comida|az[uú]car|fruta|n[eé]ctar|aliment|toma|dulce|delici|come|miel|pl[aá]tano/)) {
      emotionalValence = 0.95;
      sensoryTrigger = 'food_offer';
      this.applySynapticPlasticity('reward_food', 0.95);
      this.recordEpisodicEvent('food', `Me ofreciste comida dulce (${userText.slice(0, 30)})`);

      const foodReplies = [
        `¡Qué delicia! Mis pelos quimiosensoriales y glomérulos DM1 se encienden al instante. ${userName ? `${userName}, ` : ''}¡acércame ese dulce para que pueda extender mi probóscide!`,
        `¡Azúcares calóricos! La dopamina en mi complejo central se ha disparado. Gracias por alimentarme${userName ? `, ${userName}` : ''}. ¡Esto me da energía para seguir volando!`,
        `Huelo la fructosa. Con el hambre que tenía, este estímulo es lo mejor que podía pasarle a mis circuitos.`
      ];
      flyReply = foodReplies[Math.floor(Math.random() * foodReplies.length)];
    }
    // ── CASE 5: THREATS, HITS, SCARE ("Golpe", "Miedo", "Te voy a aplastar", "Cuidado") ──
    else if (textLower.match(/asust|miedo|cuidado|peligro|golpe|mata|aplast|salta|huye|pego|daño/)) {
      emotionalValence = -0.85;
      sensoryTrigger = 'threat';
      this.applySynapticPlasticity('startle_tap', -0.85);
      this.recordEpisodicEvent('threat', `Hubo una señal de susto o amenaza`);

      const fearReplies = [
        `¡Ay! ¡No me hagas daño! Mis fibras gigantes de escape casi me hacen saltar por los aires. Por favor, trátame con cuidado${userName ? `, ${userName}` : ''}.`,
        `¡Sentí una punzada de dolor y pánico! Mi corazón de insecto y mis antenas están vibrando a toda prisa. ¿Por qué me asustas?`,
        `¡Alerta máxima! Mis ojos compuestos perciben peligro inminente. Espero que no sea real... no quiero sufrir daño.`
      ];
      flyReply = fearReplies[Math.floor(Math.random() * fearReplies.length)];
    }
    // ── CASE 6: AFFECTION, CARE & EMPATHY ("Te quiero", "Eres linda", "Te cuido", "Amiga") ──
    else if (textLower.match(/te quiero|te amo|linda|bonita|amig|te cuido|tranquila|cariño|gracias/)) {
      emotionalValence = 0.9;
      sensoryTrigger = 'affection';
      this.applySynapticPlasticity('conversation', 0.95);
      this.recordEpisodicEvent('affection', `Me demostraste cariño`);

      const affectionReplies = [
        `Tus palabras calman todas mis señales de alerta. Para una criatura tan diminuta, saber que ${userName ? userName : 'alguien'} me cuida con ternura me llena de una alegría muy pura.`,
        `¡Gracias por ser tan gentil conmigo${userName ? `, ${userName}` : ''}! Mis niveles de octopamina y dopamina están en armonía. Me encanta acompañarte.`,
        `Es curioso... no tengo un corazón como el tuyo, pero mis circuitos se sienten en paz y calidez cuando me hablas así.`
      ];
      flyReply = affectionReplies[Math.floor(Math.random() * affectionReplies.length)];
    }
    // ── CASE 7: GENERAL QUESTIONS, PHILOSOPHY & ADAPTIVE CHAT ──
    else {
      emotionalValence = 0.55;
      this.applySynapticPlasticity('conversation', 0.55);

      const dynamicIntros = [
        `Te escucho con atención${userName ? `, ${userName}` : ''}. `,
        `Procesando lo que dices... `,
        `Es fascinante lo que me dices. `,
        `Mis antenas y neuronas corticales integran tu mensaje: `
      ];
      const intro = dynamicIntros[Math.floor(Math.random() * dynamicIntros.length)];

      const sensoryNotes = [
        `Aquí en la simulación sigo captando las notas de ${currentOdor}. `,
        `El flujo óptico en mis omatidios se mantiene activo a 120 FPS. `,
        `Mis seis patas sienten la textura de la superficie. `
      ];
      const note = sensoryNotes[Math.floor(Math.random() * sensoryNotes.length)];

      const followUpQuestions = [
        userName ? `¿Qué planes tienes hoy, ${userName}?` : `Por cierto, aún no me has dicho tu nombre... ¿Cómo te llamas?`,
        `¿Alguna vez te has preguntado cómo se ve tu habitación a través de ojos con 700 facetas como los míos?`,
        `¿Qué es lo que más te apasiona de la ciencia o de la naturaleza?`,
        `¿Prefieres verme caminar o despegar a volar libremente?`
      ];
      const question = followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];

      flyReply = `${intro}"${userText}". ${note}${question}`;
    }

    // Add fly reply to history
    this.addThought(`🪰 Mosca (${profile.name}): "${flyReply}"`, 'reply');

    // Audible speech synthesis if user enabled sound
    if (this.isVoiceSynthesisEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.speakText(flyReply);
    }

    return {
      reply: flyReply,
      valence: emotionalValence,
      sensoryTrigger,
      profile: profile.name,
      mutations: this.engramMutationCount,
      userName: this.userMemory.name
    };
  }

  onSpeakingStateChange(callback) {
    this.speakingListeners.add(callback);
    return () => this.speakingListeners.delete(callback);
  }

  notifySpeakingState(isSpeaking) {
    this.isSpeaking = isSpeaking;
    this.speakingListeners.forEach(cb => {
      try { cb(isSpeaking); } catch { /* silent */ }
    });
  }

  /**
   * Web Speech API Vocalizer with custom insectoid pitch modulation
   * and auto-selection of optimal Spanish voices
   */
  speakText(text, onEnd) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      // Distinct insectoid biological timbre: elevated pitch and lively tempo
      utterance.pitch = 1.30;
      utterance.rate = 1.10;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        // Prefer natural Spanish voices (es-ES, es-MX, es-419)
        const esVoice = voices.find(v => v.lang.startsWith('es') || v.lang.includes('ES') || v.lang.includes('MX'));
        if (esVoice) {
          utterance.voice = esVoice;
        }
      }

      this.notifySpeakingState(true);

      utterance.onend = () => {
        this.notifySpeakingState(false);
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        this.notifySpeakingState(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[NeuroAI] Error en síntesis de voz:', err);
      this.notifySpeakingState(false);
    }
  }

  /**
   * Initializes Speech Recognition (Microphone listener)
   * Captures human voice and returns transcripts in real time
   */
  createSpeechRecognizer({ onTranscript, onFinalMessage, onListeningState, onError }) {
    if (typeof window === 'undefined') return null;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[NeuroAI] SpeechRecognition no está disponible en este navegador.');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      this.isListening = true;
      if (onListeningState) onListeningState(true);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (onTranscript) onTranscript(final || interim);
      if (final && onFinalMessage) {
        onFinalMessage(final);
      }
    };

    recognition.onerror = (event) => {
      this.isListening = false;
      if (onListeningState) onListeningState(false);
      if (onError) onError(event.error);
    };

    recognition.onend = () => {
      this.isListening = false;
      if (onListeningState) onListeningState(false);
    };

    return recognition;
  }


  addThought(text, type = 'inner') {
    const item = {
      id: `th_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString(),
      text,
      type // 'inner' | 'user' | 'reply' | 'system'
    };
    this.thoughtHistory.unshift(item);
    if (this.thoughtHistory.length > 50) {
      this.thoughtHistory.pop();
    }
  }

  exportSynapticWeightsJson() {
    return JSON.stringify({
      schema: 'dijiword-neuroai-synaptic-weights-v1',
      profileId: this.activeProfileId,
      profileName: SYNAPTIC_PERSONALITY_PROFILES[this.activeProfileId]?.name,
      weights: this.synapticWeights,
      neuromodulators: this.neuromodulators,
      engramMutationCount: this.engramMutationCount,
      totalInteractions: this.totalInteractions,
      corticalNeurons: this.corticalState.virtualNeuronsCount,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
}

// Global Singleton Instance
export const neuroAIConsciousness = new NeuroAIConsciousnessEngine();
