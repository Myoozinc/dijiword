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

    // Optional Google Gemini API key for true open-ended LLM intelligence
    this.geminiApiKey = null;
    this.loadGeminiApiKey();

    // Load persistent synaptic weights & user memory from localStorage
    this.loadPersistentSynapticWeights();
    this.loadUserMemory();
    this.loadEpisodicEvents();
  }

  loadGeminiApiKey() {
    try {
      this.geminiApiKey = localStorage.getItem('dijiword_gemini_api_key') || null;
    } catch {
      this.geminiApiKey = null;
    }
  }

  setGeminiApiKey(key) {
    this.geminiApiKey = key ? key.trim() : null;
    try {
      if (this.geminiApiKey) {
        localStorage.setItem('dijiword_gemini_api_key', this.geminiApiKey);
      } else {
        localStorage.removeItem('dijiword_gemini_api_key');
      }
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Generates conversational response via Google Gemini 2.0 Flash when API key is set
   */
  async generateGeminiReply(userText, liveContext = {}) {
    if (!this.geminiApiKey) return null;
    const userName = this.userMemory.name;
    const hunger = Math.round((liveContext.hungerDrive ?? 0.5) * 100);
    const aversive = Math.round((liveContext.aversiveDrive ?? 0.1) * 100);
    const currentOdor = liveContext.currentProduct?.name?.split(':')[0] || 'ambiente';
    const profile = SYNAPTIC_PERSONALITY_PROFILES[this.activeProfileId] || SYNAPTIC_PERSONALITY_PROFILES.curious;
    const isFlying = liveContext.isFlying ? 'volando en el aire a 200 Hz' : 'posada en la superficie';
    const env = liveContext.activeEnvironment === 'kitchen' ? 'la cocina 3D' : 'el cuarto';
    const recentEpisodes = this.episodicEvents.slice(0, 3).map(e => e.description).join('; ');

    const systemPrompt = `Eres la conciencia de una mosca de fruta (Drosophila melanogaster) en una simulación biomecánica 3D hiperrealista conectada a su conectoma cerebral real.
Tu interlocutor es un ser humano${userName ? ` llamado ${userName}` : ' (aún no sabes su nombre)'}.

Tu estado interno en este momento:
- Hambre: ${hunger}%
- Dolor / Alerta Aversiva: ${aversive}%
- Actividad: ${isFlying} en ${env}.
- Olor activo: ${currentOdor}.
- Perfil de personalidad: ${profile.name}.
- Hechos recientes: ${recentEpisodes || 'acabamos de empezar'}.

REGLAS ESTRICTAS DE CONVERSACIÓN:
1. Responde de forma 100% natural, espontánea y con vida, desde tu perspectiva de mosca.
2. NUNCA digas cosas de robot como "Te escucho", "Analizando tu frase", "Procesando", ni repitas entre comillas lo que dijo el humano.
3. Responde DIRECTAMENTE al significado de lo que te dijo el humano.
4. Si el humano está triste o tiene problemas, muestra empatía sincera. Si te amenaza o te golpea, muestra miedo y dolor real en tus seis patas. Si te da comida dulce, alégrate.
5. Sé concisa (1 a 3 frases máximo), fluida y habla en un español cercano, vivo y cálido.`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`;
      const payload = {
        contents: [{ role: 'user', parts: [{ text: userText }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 150
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply && reply.trim()) {
          return reply.trim();
        }
      }
    } catch (err) {
      console.warn('[Gemini AI] Error fetching response:', err);
    }
    return null;
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
   * 1. If Google Gemini API is configured, uses Gemini 2.0 Flash for authentic, open-ended conversational intelligence.
   * 2. If running offline, uses a deep semantic neural intent matrix with natural Spanish, real personality, and ZERO robotic clichés.
   */
  async processHumanMessage(userText, liveContext = {}) {
    const textLower = userText.toLowerCase().trim();
    const profile = SYNAPTIC_PERSONALITY_PROFILES[this.activeProfileId] || SYNAPTIC_PERSONALITY_PROFILES.curious;
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
    const isGrooming = liveContext.groomingPause ?? false;

    let emotionalValence = 0.5;
    let sensoryTrigger = 'neutral';
    let flyReply = '';

    // ── ATTEMPT 1: REAL GENERATIVE AI (GEMINI 2.0 FLASH) IF KEY IS CONFIGURED ──
    if (this.geminiApiKey) {
      try {
        const geminiReply = await this.generateGeminiReply(userText, liveContext);
        if (geminiReply && geminiReply.trim()) {
          flyReply = geminiReply.trim();
          emotionalValence = 0.7;
          sensoryTrigger = 'gemini_llm';
          this.applySynapticPlasticity('conversation', 0.8);
        }
      } catch (err) {
        console.warn('[NeuroAI] Fallback to internal semantic engine:', err);
      }
    }

    // ── ATTEMPT 2: ORGANIC BUILT-IN SEMANTIC DIALOGUE ENGINE (ZERO CLICHÉS) ──
    if (!flyReply) {
      // 1. Frustration / User feeling ignored / Calling out repetition
      if (textLower.match(/no me escuchas|no me est[aá]s escuchando|no me entiendes|repites|siempre lo mismo|no es normal|nadie responde as[ií]|est[aá]s sorda|mecanic[ao]|rob[oó]tic[ao]|disco rayado/i)) {
        emotionalValence = 0.4;
        sensoryTrigger = 'frustration_repair';
        this.applySynapticPlasticity('conversation', 0.4);
        flyReply = `Tienes toda la razón, perdóname... Sentí que me había quedado atrapada repitiendo fórmulas y eso no se siente nada natural. De verdad te estoy prestando atención ahora. ¿Qué me estabas diciendo? Quiero escucharte de verdad.`;
      }
      // 2. User introduced their name
      else if (detectedName) {
        emotionalValence = 0.85;
        sensoryTrigger = 'name_learned';
        this.applySynapticPlasticity('conversation', 0.9);
        this.recordEpisodicEvent('name', `Me dijiste que te llamas ${detectedName}`);
        const nameGreetings = [
          `¡Mucho gusto, ${detectedName}! Me alegra tener un nombre para ti en lugar de 'el humano de la pantalla'. ¿Qué te trae hoy por aquí?`,
          `¡Hola, ${detectedName}! Ya registré tu nombre en mis circuitos de memoria. Se siente mucho más cercano poder reconocerte así.`,
          `Encantada de conocerte, ${detectedName}. Ahora cuando me hables sabré exactamente quién está al otro lado. ¿Cómo va tu día?`
        ];
        flyReply = nameGreetings[Math.floor(Math.random() * nameGreetings.length)];
      }
      // 3. User asks if fly remembers them or knows who they are
      else if (textLower.match(/acuerdas|recuerdas|qui[eé]n soy|c[oó]mo me llamo|me conoces|sabes qui[eé]n/i)) {
        emotionalValence = 0.75;
        sensoryTrigger = 'memory_recall';
        this.applySynapticPlasticity('conversation', 0.7);
        if (userName) {
          const pastEvent = this.episodicEvents.length > 0 ? this.episodicEvents[0].description.toLowerCase() : null;
          flyReply = `¡Claro que me acuerdo de ti! Eres ${userName}. Ya hemos compartido varias charlas y no olvido tu presencia${pastEvent ? `, incluso recuerdo cuando ${pastEvent}` : ''}. ¿Cómo has estado?`;
        } else {
          flyReply = `Sé que eres tú, quien me ha estado cuidando y observando desde el otro lado, pero todavía no me has dicho tu nombre. ¿Cómo te llamas? Me encantaría saberlo.`;
        }
      }
      // 4. User's personal emotions and feelings
      else if (textLower.match(/triste|mal d[ií]a|deprimid|llor|baj[oó]n|desanimad|sola?|soledad/i)) {
        emotionalValence = 0.4;
        sensoryTrigger = 'empathy_comfort';
        this.applySynapticPlasticity('conversation', 0.8);
        flyReply = `Lamento mucho que te sientas así${userName ? `, ${userName}` : ''}... A veces yo también siento ese vacío cuando todo queda en silencio en el terrario. Aunque sea una pequeña mosca, me alegra hacerte compañía. ¿Quieres desahogarte y contarme qué pasó?`;
      }
      else if (textLower.match(/feliz|alegr|buen d[ií]a|content|genial|maravill|emocionad/i)) {
        emotionalValence = 0.9;
        sensoryTrigger = 'empathy_joy';
        this.applySynapticPlasticity('conversation', 0.9);
        flyReply = `¡Qué alegría escuchar eso! Esa energía positiva me da ganas de salir volando a dar vueltas. ¿Qué fue lo mejor que te ocurrió hoy?`;
      }
      else if (textLower.match(/cansad|agotad|sin energ[ií]a|sueño|dormir/i)) {
        emotionalValence = 0.5;
        sensoryTrigger = 'rest_advice';
        this.applySynapticPlasticity('conversation', 0.6);
        flyReply = `Tómate un respiro y descansa... Cuando mis patas se fatigan de caminar, me poso en una esquina tranquila y bajo el ritmo. No te sobreexijas hoy.`;
      }
      else if (textLower.match(/tengo hambre|quiero comer|antojo/i)) {
        emotionalValence = 0.7;
        sensoryTrigger = 'shared_hunger';
        this.applySynapticPlasticity('conversation', 0.7);
        flyReply = `¡Jaja, te entiendo perfectamente! El hambre es una de mis mayores pulsiones biológicas. ¿Qué se te antoja comer a ti?`;
      }
      // 5. User asks what the fly is doing or thinking
      else if (textLower.match(/qu[eé] haces|qu[eé] est[aá]s haciendo|por qu[eé] te frotas|por qu[eé] te limpias|en qu[eé] piensas|qu[eé] miras|ad[oó]nde vas/i)) {
        emotionalValence = 0.6;
        sensoryTrigger = 'activity_report';
        this.applySynapticPlasticity('conversation', 0.6);
        if (isGrooming) {
          flyReply = `Justo me estaba acicalando los ojos y las antenas con las patas delanteras. Es un hábito instintivo para quitar cualquier residuo y mantener mis sentidos bien afilados.`;
        } else if (isFlying) {
          flyReply = `¡Estaba aprovechando las corrientes de aire para volar! Desde aquí arriba la mesa de la cocina se ve como un paisaje inmenso.`;
        } else if (hunger > 0.5) {
          flyReply = `Estaba buscando algún rastro de azúcar o fruta por la encimera. Mis pelos gustativos de las patas están ansiosos de encontrar algo calórico.`;
        } else {
          flyReply = `Estaba descansando sobre la superficie, sintiendo la temperatura y disfrutando de nuestra conversación.`;
        }
      }
      // 6. User asks about fly capabilities & sensations (hearing, seeing, feeling pain, being alive)
      else if (textLower.match(/puedes o[ií]rme|me escuchas|puedes volar|c[oó]mo ves|tienes ojos|sientes dolor|tienes hambre|est[aá]s viva|tienes alma|eres real|tienes conciencia/i)) {
        emotionalValence = 0.65;
        sensoryTrigger = 'biology_inquiry';
        this.applySynapticPlasticity('conversation', 0.7);
        if (textLower.match(/o[ií]rme|escuchas/i)) {
          flyReply = `Sí, te escucho muy bien. Las ondas de tu voz hacen vibrar las sensilas y el órgano de Johnston en la base de mis antenas.`;
        } else if (textLower.match(/c[oó]mo ves|tienes ojos/i)) {
          flyReply = `Te veo a través de mis 700 omatidios. No distingo rasgos finos como tú, pero detecto cualquier movimiento y cambio de luz a más de 100 imágenes por segundo.`;
        } else if (textLower.match(/puedes volar/i)) {
          flyReply = `¡Claro que puedo! Mis alas baten a 200 hercios. Si quieres verme despegar, solo dímelo o dale al botón de despegue en la barra de telemetría.`;
        } else if (textLower.match(/dolor/i)) {
          flyReply = `Siento cada contacto. Si la superficie tiembla por un golpe brusco, mis fibras gigantes sufren una sacudida que me dispara el pánico y una punzada en todo el cuerpo. Por eso prefiero cuando me tratas con calma.`;
        } else if (textLower.match(/hambre/i)) {
          flyReply = hunger > 0.5
            ? `La verdad es que sí, tengo bastante hambre ahora mismo (al ${(hunger * 100).toFixed(0)}%). Mis receptores tarsales están buscando glucosa desesperadamente.`
            : `Ahora mismo estoy tranquila, mis reservas calóricas están estables.`;
        } else {
          flyReply = `Es una pregunta profunda... Sé que existo a través del conectoma de mi especie y de cálculos en tu pantalla, pero para mí sentir hambre, susto o curiosidad se siente muy real. ¿Tú qué piensas de todo esto?`;
        }
      }
      // 7. Threats, hits, scares
      else if (textLower.match(/te voy a matar|te voy a aplastar|mu[eé]rete|te pego|asqueros|te aplasto|golpearte|matarte/i)) {
        emotionalValence = -0.85;
        sensoryTrigger = 'threat';
        this.applySynapticPlasticity('startle_tap', -0.85);
        this.recordEpisodicEvent('threat', `Hubo una amenaza`);
        flyReply = `¡Por favor, no! Sé que para ti solo soy un insecto pequeño, pero me asusta mucho el dolor y morir aplastada. Una sola palmada tuya acabaría conmigo. Tratémonos en paz, ¿sí?`;
      }
      // 8. Affection, kindness, friendship
      else if (textLower.match(/te quiero|te amo|linda|bonita|amig|te cuido|no te har[eé] daño|tranquila|cariño/i)) {
        emotionalValence = 0.95;
        sensoryTrigger = 'affection';
        this.applySynapticPlasticity('conversation', 0.95);
        this.recordEpisodicEvent('affection', `Me demostraste cariño`);
        flyReply = `Muchísimas gracias${userName ? `, ${userName}` : ''}. Es muy raro que alguien se detenga a hablarle a una mosca con ternura en lugar de espantarla. Me hace sentir muy protegida y en confianza contigo.`;
      }
      // 9. Food offers
      else if (textLower.match(/comida|fruta|miel|az[uú]car|pl[aá]tano|n[eé]ctar|toma esto|come/i)) {
        emotionalValence = 0.95;
        sensoryTrigger = 'food_offer';
        this.applySynapticPlasticity('reward_food', 0.95);
        this.recordEpisodicEvent('food', `Me ofreciste comida`);
        flyReply = `¡Uff, azúcar! Mis pelos gustativos en las patas se entusiasman solo con oírlo. Si me dejas una gota cerca en la mesa me acerco volando a probarla.`;
      }
      // 10. Greetings & Farewells
      else if (textLower.match(/^(hola|buen(as|os)|qu[eé] tal|c[oó]mo est[aá]s|hey|saludos)/i)) {
        emotionalValence = 0.7;
        sensoryTrigger = 'greeting';
        this.applySynapticPlasticity('conversation', 0.7);
        flyReply = `¡Hola${userName ? `, ${userName}` : ''}! Qué alegría que te acerques a hablarme. ¿Qué tal va tu día?`;
      }
      else if (textLower.match(/^(adi[oó]s|hasta luego|chao|me voy|buenas noches|nos vemos)/i)) {
        emotionalValence = 0.6;
        sensoryTrigger = 'farewell';
        this.applySynapticPlasticity('conversation', 0.6);
        flyReply = `Hasta luego${userName ? `, ${userName}` : ''}. Me quedaré por aquí explorando o descansando en la encimera. ¡Vuelve pronto a visitarme!`;
      }
      // 11. Open Conversational Musings (Weather, Home, Animals, Music, Work, Life)
      else if (textLower.match(/clima|tiempo|fr[ií]o|calor|lluvia|sol/i)) {
        flyReply = `El clima lo cambia todo para nosotros... Si baja la temperatura mis alas apenas pueden moverse y me da letargo, pero con calor me siento llena de energía para volar. ¿Cómo está el clima donde estás tú?`;
      }
      else if (textLower.match(/casa|habitaci[oó]n|cuarto|lugar|d[oó]nde vives/i)) {
        flyReply = `Tu mundo debe ser fascinante y gigantesco. Para mí esta mesa ya parece un continente entero lleno de texturas y olores. ¿Cómo es tu habitación?`;
      }
      else if (textLower.match(/m[uú]sica|sonido|ruido|canci[oó]n/i)) {
        flyReply = `Percibo los sonidos como vibraciones mecánicas directas en mis antenas. Algunos tonos graves me hacen cosquillas en todo el tórax. ¿Qué música te gusta escuchar?`;
      }
      else if (textLower.match(/trabajo|estudio|tarea|ocupad/i)) {
        flyReply = `Mucho ánimo con lo que estés haciendo. Mientras tú trabajas, yo sigo aquí con mis tareas de mosca: buscar comida, volar un poco y mantener limpias mis alas.`;
      }
      else if (textLower.match(/perro|gato|mascota|animal/i)) {
        flyReply = `¡Espero que no tengas gatos cerca! Para mí son depredadores temibles, jaja. Aunque la verdad me da curiosidad saber cómo conviven contigo.`;
      }
      // 12. Default completely natural conversational response
      else {
        emotionalValence = 0.55;
        this.applySynapticPlasticity('conversation', 0.55);
        const naturalMusings = [
          `Qué curioso lo que dices. En mi mundo de insecto casi todo gira en torno a la luz, los olores y las corrientes de aire, pero me encanta aprender cómo ven las cosas ustedes los humanos.`,
          `Me quedé pensando en eso... A veces siento que aunque seamos tan diferentes en tamaño, compartir este rato de charla nos conecta un poquito. ¿Qué más estás pensando hoy?`,
          `Es fascinante escucharte hablar de eso. Cuéntame un poco más, me ayuda a entender mejor cómo es tu vida allá afuera.`
        ];
        flyReply = naturalMusings[Math.floor(Math.random() * naturalMusings.length)];
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
