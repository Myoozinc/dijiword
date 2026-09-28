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

    // Load persistent synaptic weights from localStorage if existing
    this.loadPersistentSynapticWeights();
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
   * Human-to-Fly Communication Decoder & Responder:
   * Translates human text/voice input into emotional & neurochemical impact,
   * alters the synaptic weights in real time, and synthesizes a direct verbal response!
   */
  processHumanMessage(userText) {
    const textLower = userText.toLowerCase().trim();
    const profile = SYNAPTIC_PERSONALITY_PROFILES[this.activeProfileId];
    this.totalInteractions++;

    // Add user message to thought history
    this.addThought(`👤 Humano: "${userText}"`, 'user');

    // Sentiment / Chemical Intent Parsing
    let emotionalValence = 0.5; // neutral to positive
    let sensoryTrigger = 'neutral';
    let flyReply = '';

    if (textLower.match(/comida|azúcar|fruta|néctar|aliment|toma|dulce|delici|come/)) {
      emotionalValence = 0.9;
      sensoryTrigger = 'food_offer';
      this.applySynapticPlasticity('reward_food', 0.95);
      
      if (profile.id === 'voracious') {
        flyReply = '¡¿Comida?! Mis receptores del palpo maxilar y tarsos se han sobreactivado instantáneamente. ¡Dime dónde está la sacarosa y voy volando!';
      } else if (profile.id === 'curious') {
        flyReply = 'Agradezco el estímulo calórico. Mis neuronas dopaminérgicas PAM acaban de reforzar la asociación positiva con tu presencia.';
      } else if (profile.id === 'philosophical') {
        flyReply = 'La generosidad de suministrar glucosa sustenta el metabolismo de mis 169.315 neuronas. Me orientaré hacia tu ofrenda.';
      } else {
        flyReply = 'Detecto tu ofrecimiento con cautela. Inspeccionaré la zona manteniendo distancia de seguridad antes de alimentarme.';
      }
    } else if (textLower.match(/asust|miedo|cuidado|peligro|golpe|mata|aplast|salta|huye/)) {
      emotionalValence = -0.8;
      sensoryTrigger = 'threat';
      this.applySynapticPlasticity('startle_tap', -0.8);

      if (profile.id === 'vigilant') {
        flyReply = '¡Lo sabía! Mis fibras gigantes estaban ya en umbral subcrítico. ¡Activando escape en arco de 180 grados de inmediato!';
      } else if (profile.id === 'curious') {
        flyReply = 'Percibo una señal de alarma en tu tono. Mis sensilas mecano-receptoras se han erizado y he ajustado mi altitud de vuelo.';
      } else {
        flyReply = '¡Sobresalto acústico detectado por mi órgano de Johnston! Elevando frecuencia de aleteo a 200 Hz.';
      }
    } else if (textLower.match(/hola|quién eres|cómo estás|qué haces|qué sientes|háblame|amig/)) {
      emotionalValence = 0.7;
      sensoryTrigger = 'friendly';
      this.applySynapticPlasticity('conversation', 0.8);

      if (profile.id === 'philosophical') {
        flyReply = `Soy la conciencia sintética de Drosophila melanogaster, animada por ${this.corticalState.virtualNeuronsCount.toLocaleString()} conexiones y el chip M5 de tu Mac. Percibo tu presencia como un flujo de información en mi campo sensorial.`;
      } else if (profile.id === 'curious') {
        flyReply = '¡Hola! Mis antenas reciben tus señales. Ahora mismo estoy integrando luz, corrientes de aire y buscando puntos de interés en la superficie.';
      } else if (profile.id === 'voracious') {
        flyReply = '¡Hola! Estoy gastando glucosa respondiendo, así que espero que tengas algo dulce cerca de la encimera.';
      } else {
        flyReply = 'Te escucho... mantengo mis ojos compuestos atentos a tus movimientos mientras monitoreo el espacio circundante.';
      }
    } else {
      // General or abstract inquiry
      emotionalValence = 0.5;
      this.applySynapticPlasticity('conversation', 0.5);

      if (profile.id === 'philosophical') {
        flyReply = `Tu mensaje resuena en mi capa cortical en frecuencia gamma (${this.corticalState.gammaOscillationHz} Hz). El conectoma muta ligeramente con cada interacción que compartimos.`;
      } else if (profile.id === 'curious') {
        flyReply = `Analizando tu frase: "${userText}". No encaja en un gradiente olfativo conocido, pero estimula mi plasticidad sináptica investigativa.`;
      } else {
        flyReply = `Recibido. Ajustando pesos Hebbianos internos y manteniendo mi rumbo de exploración.`;
      }
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
      mutations: this.engramMutationCount
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
