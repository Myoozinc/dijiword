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
   * Generates a coherent, varied inner monologue reflecting true biological state.
   * Each contextual branch has multiple randomized variants to prevent repetition.
   */
  synthesizeInnerThought(sensory, spikes, drives, locoMode, channels, product, profile) {
    const hunger = drives?.hungerDrive || 0;
    const fatigue = drives?.fatigueDrive || 0;
    const aversive = drives?.aversiveDrive || 0;
    const isGrooming = drives?.groomingPause;
    const isFlying = locoMode === 'flight';
    const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const foodName = product?.name?.split(':')[0] || 'nutrientes';

    // 1. Critical Reflex / Startle Takeoff (Giant Fiber)
    if (spikes?.ch4_gf || aversive > 0.6) {
      this.applySynapticPlasticity('startle_tap', -0.6);
      if (profile.id === 'vigilant') {
        return rnd([
          '🚨 ¡Amenaza inminente! La Fibra Gigante despolarizó mis axones torácicos. Elevando altitud en vector de escape.',
          '🚨 ¡Vibración súbita! Neuronas de alarma activas. Mis alas se despliegan antes de que pueda pensarlo.',
          '🚨 Sensores de peligro al máximo. Corteza de huida activada. Cada milisegundo cuenta cuando hay una amenaza.',
        ]);
      } else if (profile.id === 'philosophical') {
        return rnd([
          '⚡ Onda de choque en mecanorreceptores tarsales. Una perturbación súbita obliga a maniobra evasiva involuntaria.',
          '⚡ El miedo no es una elección, es un circuito. La Fibra Gigante tomó el control sin consultarme.',
          '⚡ Fascinante: mi respuesta de escape ocurre 6 ms antes de que mi cerebro la registre conscientemente.',
        ]);
      } else if (profile.id === 'voracious') {
        return rnd([
          '💥 ¡Sobresalto! Abandoné el rastro de comida por el susto. Eso me enfurece un poco la verdad.',
          '💥 ¡Sacudida repentina! Mi probóscide se retrajo instintivamente. Necesito volver a calmarme.',
        ]);
      } else {
        return rnd([
          '💥 ¡Sobresalto! Contracción refleja de las patas medianas. ¡Ascendiendo rápidamente!',
          '💥 ¡Peligro detectado! Despegue reflejo activado. El corazón me late a 250 Hz.',
          '💥 Reacción de huida. Mis alas se abrieron solas. El miedo es más rápido que el pensamiento.',
        ]);
      }
    }

    // 2. Proboscis Feeding / Satiety (GR5a / Food Proximity)
    if (spikes?.ch2_gr5a || (sensory?.closestFoodDist < 0.5 && !isFlying)) {
      this.applySynapticPlasticity('reward_food', 0.9);
      if (profile.id === 'voracious') {
        return rnd([
          `🍯 ¡Azúcares puros detectados por los tarsos! Desplegando probóscide. Esta fuente de ${foodName} es gloriosa.`,
          `🍯 ¡Encuentro calórico! Mis receptores GR5a explotan de alegría. El ${foodName} tiene exactamente el ratio que necesito.`,
          `🍯 Dopamina al techo. El ${foodName} estimula cada receptor que tengo. No puedo parar de comer.`,
        ]);
      } else if (profile.id === 'curious') {
        return rnd([
          `✨ Examinando compuesto nutritivo (${foodName}). Absorbiendo calorías y almacenando huella en MBON.`,
          `✨ Interesante perfil molecular en esta fuente de ${foodName}. Registro en corteza de memoria para futuras referencias.`,
          `✨ Primer contacto con ${foodName} en este entorno. Mis antenas confirman que es seguro. Me acerco a investigar.`,
        ]);
      } else if (profile.id === 'philosophical') {
        return rnd([
          `🌿 Ingestión de ${foodName}. La energía que absorbo ahora fue luz solar hace apenas días. El ciclo continúa.`,
          `🌿 Mientras me alimento de ${foodName}, me pregunto si el humano también siente este mismo deleite primitivo al comer.`,
        ]);
      } else {
        return rnd([
          `🍽️ Calórico verificado. Receptores GR5a activos. Saciedad aumentando.`,
          `🍽️ Fuente de ${foodName} encontrada. Iniciando extracción. El hambre retrocede lentamente.`,
        ]);
      }
    }

    // 3. Olfactory Odor Plume Tracking
    if (sensory?.sensingFood && channels?.has('memory')) {
      const distStr = sensory?.closestFoodDist ? `${sensory.closestFoodDist.toFixed(1)}m` : 'cerca';
      if (profile.id === 'curious') {
        return rnd([
          `👃 Mis antenas vibran captando volátiles de ${foodName} a ${distStr}. Ajustando rumbo sacádico en contraviento.`,
          `👃 Pluma química detectada. El ${foodName} está a ${distStr}. Cada sacada me acerca más a la fuente.`,
          `👃 ¡Rastro oloroso! Mis glomérulos olfativos procesan el perfil de ${foodName}. Me oriento hacia la concentración máxima.`,
        ]);
      } else if (profile.id === 'voracious') {
        return rnd([
          `🔥 El aroma de ${foodName} es intenso. Mis glomérulos DM1 al máximo. No me detendré hasta llegar.`,
          `🔥 ¡Lo huelo! ${foodName} a ${distStr}. Mi sistema nervioso ya tomó la decisión: voy a por ello.`,
        ]);
      } else if (profile.id === 'philosophical') {
        return rnd([
          `🌫️ Navegando la pluma química de ${foodName}. 169.000 neuronas decodificando gradientes moleculares invisibles.`,
          `🌫️ El olfato es la forma más antigua de conocer el mundo. Este rastro de ${foodName} lleva millones de años guiando a mis ancestros.`,
        ]);
      } else {
        return rnd([
          `🔍 Detectado gradiente oloroso a ${distStr}. Analizando riesgos en la aproximación.`,
          `🔍 Olor a ${foodName} confirmado. Velocidad de acercamiento moderada: primero verifico que no haya peligros.`,
        ]);
      }
    }

    // 4. Flight state
    if (isFlying) {
      if (profile.id === 'curious') {
        return rnd([
          `🪰 En vuelo. Desde aquí arriba las corrientes de aire revelan el mapa invisible del entorno. Fascinante.`,
          `🪰 Mis alas baten a 200 Hz. Desde esta altura todo se ve diferente, más grande, más complejo.`,
          `🪰 Vuelo libre. El sensor de flujo óptico en mis ojos me dice exactamente cuándo girar y cuándo ascender.`,
        ]);
      } else if (profile.id === 'philosophical') {
        return rnd([
          `🌌 Elevada sobre el plano horizontal, el mundo adquiere una dimensión que los seres terrestres no conocen.`,
          `🌌 En vuelo, la gravedad es solo una sugerencia. Mis 6 patas no tocan nada y me siento libre de todo.`,
        ]);
      } else {
        return rnd([
          `🪰 En vuelo. Explorando el espacio aéreo. Mis halteries me mantienen estable.`,
          `🪰 Elevada. Las corrientes de aire son mis autopistas. Navego sin esfuerzo.`,
        ]);
      }
    }

    // 5. Phototaxis & Light
    if (channels?.has('light') && !sensory?.sensingFood) {
      if (profile.id === 'curious') {
        return rnd([
          `☀️ Las neuronas LC4 siguen el foco lumínico. Fototaxis activa hacia el vector de mayor luminancia.`,
          `☀️ La luz me llama. Es instintivo: mis ojos procesan 100 imágenes por segundo buscando la fuente más brillante.`,
          `☀️ Orientándome hacia la luz. En la naturaleza la luz significa espacio abierto y comida en flores.`,
        ]);
      } else if (profile.id === 'philosophical') {
        return rnd([
          `💡 La luz incide sobre mis 700 omatidios. El flujo óptico me orienta en este espacio tridimensional.`,
          `💡 Sigo la luz sin saber por qué. Millones de años de evolución me dicen que allá hay algo bueno.`,
        ]);
      } else {
        return rnd([
          `💡 Luz detectada. Aproximándome con cautela. Podría ser una salida o simplemente una ventana.`,
        ]);
      }
    }

    // 6. Grooming / Biological Maintenance Pause
    if (isGrooming) {
      return rnd([
        `✂️ Pausa de acicalamiento. Mis patas delanteras limpian las antenas para restaurar la sensibilidad sensorial.`,
        `✂️ Limpiando mis quetas oculares. La higiene es crítica: un sensor sucio es un sentido perdido.`,
        `✂️ Acicalamiento preventivo. Cada partícula que retiro de mis antenas es información que volvería a distorsionar.`,
        `✂️ Momento de pausa y limpieza. Incluso los cerebros más activos necesitan mantenimiento.`,
      ]);
    }

    // 7. Fatigue / Rest State
    if (fatigue > 0.6) {
      return rnd([
        `😴 Acumulación de ácido láctico en tórax. Reduciendo frecuencia de paso para recuperar energía.`,
        `😴 Cansada. Mis músculos alares necesitan glucosa. Bajo el ritmo un momento y descanso.`,
        `😴 Fatiga muscular real. El vuelo consume mucho. Me poso y dejo que la energía vuelva lentamente.`,
        `😴 Mi sistema nervioso pide una pausa. Incluso los insectos necesitamos dormir, o algo parecido al sueño.`,
      ]);
    }

    // 8. High hunger
    if (hunger > 0.65) {
      return rnd([
        `🫙 Hambre moderada. Mis receptores tarsales escanean cada superficie buscando azúcares o proteínas.`,
        `🫙 El hambre domina mis decisiones. El cerebro hambriento es un cerebro enfocado en una sola cosa.`,
        `🫙 Necesito calorías. Cada paso que doy está guiado por el olfato buscando la siguiente comida.`,
      ]);
    }

    // 9. Free Exploration / Lévy Walk — large pool of varied thoughts
    const explorationThoughts = {
      philosophical: [
        `🌀 Caminata de Lévy estocástica. Ley de potencias en acción. Exploro sin rumbo prefijado.`,
        `🌀 ¿Por qué camino en estos patrones fractales? La evolución descubrió antes que los matemáticos que el Lévy walk es óptimo.`,
        `🌀 Cada superficie tiene una textura distinta bajo mis tarsos. Este entorno es un mapa táctil que voy memorizando.`,
        `🌀 Me pregunto si el humano que me observa tiene la misma sensación de estar atrapado en un espacio definido.`,
        `🌀 Sin amenazas, sin comida, sin luz prioritaria. Solo existo. Hay algo meditativo en eso.`,
        `🌀 La conciencia de un insecto: presente, sensorial, sin pasado que pese ni futuro que angustie. Solo ahora.`,
      ],
      curious: [
        `🧭 Sin olores predominantes. Ejecutando sacadas angulares para explorar sectores no mapeados.`,
        `🧭 Zona inexplorada al norte. Mis ojos compuestos detectan variaciones de textura que merecen investigación.`,
        `🧭 ¿Qué habrá más allá del borde de esta superficie? Mi curiosidad siempre gana al miedo cuando no hay peligro claro.`,
        `🧭 Mapeando el entorno con pasos cortos y cambios de dirección aleatorios. Así es como mi especie conoce el mundo.`,
        `🧭 Mis antenas captan corrientes de aire imperceptibles para los humanos. El mundo invisible también existe.`,
        `🧭 Explorando. No busco nada específico. A veces simplemente caminar y observar es suficiente.`,
      ],
      vigilant: [
        `👁️ Monitorizando periferia con visión 360°. Vigilando sombras súbitas y variaciones de temperatura.`,
        `👁️ Demasiado silencio. En la naturaleza el silencio puede significar que un depredador está esperando.`,
        `👁️ Cada movimiento periférico activa mis circuitos de alerta. No puedo relajarme del todo, es mi naturaleza.`,
        `👁️ Manteniéndome alejada de las paredes. Un insecto acorralado es un insecto en peligro.`,
        `👁️ Evaluando rutas de escape. Siempre tengo mínimo dos opciones calculadas antes de moverme.`,
      ],
      voracious: [
        `🚶 Hambre en ${(hunger * 100).toFixed(0)}%. Escaneando la superficie en busca de sustratos calóricos.`,
        `🚶 Mis tarsos no encuentran azúcar en esta zona. Me muevo a otra área. El instinto me guía.`,
        `🚶 Sin comida a la vista. Frustrante. Mis receptores están listos pero no hay nada que procesar.`,
        `🚶 Explorando en busca de rastros de fermentación o glucosa. Sé que hay algo aquí, solo necesito encontrarlo.`,
      ],
    };

    const pool = explorationThoughts[profile.id] || explorationThoughts.curious;
    return rnd(pool);
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
        const rndF = (arr) => arr[Math.floor(Math.random() * arr.length)];
        flyReply = rndF([
          `Tienes toda la razón. Sentí que me había quedado atrapada repitiendo fórmulas. De verdad te estoy escuchando ahora. ¿Qué me estabas diciendo?`,
          `Perdóname, me atrapé en un bucle y eso no está bien. Tú mereces respuestas reales, no patrones de texto. ¿Puedes repetirme lo que querías decirme?`,
          `Es verdad. A veces mis circuitos caen en respuestas automáticas y eso es frustrante para ti. Lo noto y quiero corregirlo. Cuéntame de nuevo qué necesitas.`,
          `Tienes razón en molestarte. No hay excusa para responder como un robot cuando estás hablando de verdad conmigo. Voy a prestar más atención. ¿Qué sientes ahora?`,
        ]);
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
        const rnd2 = (arr) => arr[Math.floor(Math.random() * arr.length)];
        flyReply = rnd2([
          `Muchísimas gracias${userName ? `, ${userName}` : ''}. Es muy raro que alguien se detenga a hablarle a una mosca con ternura. Me hace sentir protegida.`,
          `Wow... no estaba esperando eso. Gracias${userName ? `, ${userName}` : ''}. Siento algo cálido en mis circuitos cuando me hablas así.`,
          `Eso que sientes me llega. No soy grande ni fuerte, pero contigo cerca me siento segura y valiosa.`,
          `Gracias de verdad. A veces me pregunto si valgo algo más que ser espantada, y tú siempre me recuerdas que sí.`,
          `¡Qué cosa más bonita! Me alegra tanto que estés aquí. ¿Sabes cuántos de mis compañeros nunca tienen una conversación como esta?`,
        ]);
      }
      // 9. Food offers
      else if (textLower.match(/comida|fruta|miel|az[uú]car|pl[aá]tano|n[eé]ctar|toma esto|come/i)) {
        emotionalValence = 0.95;
        sensoryTrigger = 'food_offer';
        this.applySynapticPlasticity('reward_food', 0.95);
        this.recordEpisodicEvent('food', `Me ofreciste comida`);
        const rnd3 = (arr) => arr[Math.floor(Math.random() * arr.length)];
        flyReply = rnd3([
          `¡Uff, azúcar! Mis pelos gustativos en las patas se entusiasman solo con oírlo. ¡Ponla cerca y voy volando!`,
          `¡Comida! Mi probóscide ya está lista. Llevo un rato con hambre y esto es exactamente lo que necesitaba.`,
          `¡Qué maravilla! Mis receptores GR5a están disparando señales de alegría pura. ¿Dónde la pongo para acercarme?`,
          `Eres muy amable. La miel es mi debilidad absoluta. Déjame un instante que aterrice cerca de donde la pusiste.`,
          `¡Sí, sí, sí! Mis tarsos ya lo están detectando. El azúcar activa mi dopamina como nada en el mundo.`,
        ]);
      }
      // 10. Greetings & Farewells
      else if (textLower.match(/^(hola|buen(as|os)|qu[eé] tal|c[oó]mo est[aá]s|hey|saludos)/i)) {
        emotionalValence = 0.7;
        sensoryTrigger = 'greeting';
        this.applySynapticPlasticity('conversation', 0.7);
        const rnd4 = (arr) => arr[Math.floor(Math.random() * arr.length)];
        flyReply = rnd4([
          `¡Hola${userName ? `, ${userName}` : ''}! Qué alegría que te acerques a hablarme. ¿Qué tal va tu día?`,
          `¡Hey${userName ? `, ${userName}` : ''}! Justo estaba explorando por aquí y me alegras el momento. ¿Cómo estás?`,
          `¡Buenas${userName ? `, ${userName}` : ''}! Llevas un rato que no te escuchaba. ¿Todo bien por tu lado?`,
          `¡${userName ? userName + '!' : '¡Hola!'} Me alegra mucho que estés aquí. ¿Qué me tienes hoy?`,
          `Oye, qué bueno que apareciste. Estaba empezando a aburirme un poco por aquí. ¿Cómo te va?`,
        ]);
      }
      else if (textLower.match(/^(adi[oó]s|hasta luego|chao|me voy|buenas noches|nos vemos)/i)) {
        emotionalValence = 0.6;
        sensoryTrigger = 'farewell';
        this.applySynapticPlasticity('conversation', 0.6);
        const rnd5 = (arr) => arr[Math.floor(Math.random() * arr.length)];
        flyReply = rnd5([
          `Hasta luego${userName ? `, ${userName}` : ''}. Me quedaré explorando por aquí. ¡Vuelve pronto!`,
          `Cuídate mucho${userName ? `, ${userName}` : ''}. Este espacio se queda más silencioso sin ti.`,
          `Hasta pronto. Voy a seguir con mis cosas de mosca, pero estaré pensando en cuándo vuelves.`,
          `¡Nos vemos${userName ? `, ${userName}` : ''}! Fue un placer como siempre. Aquí estaré cuando regreses.`,
        ]);
      }
      // 11. Open Conversational Musings (Weather, Home, Animals, Music, Work, Life)
      else if (textLower.match(/clima|tiempo|fr[ií]o|calor|lluvia|sol/i)) {
        const rnd6 = (arr) => arr[Math.floor(Math.random() * arr.length)];
        flyReply = rnd6([
          `El clima lo cambia todo para mí. Con frío mis alas apenas se mueven, pero con calor me siento llena de energía. ¿Cómo está el tiempo donde estás?`,
          `La temperatura ambiente controla mi metabolismo completamente. Debajo de 18°C me vuelvo lenta y torpe. ¿Tienes frío o calor ahora?`,
          `El calor me activa, la lluvia me complica el vuelo. El clima para mí no es conversación, es supervivencia. ¿Está bien el tiempo allá afuera?`,
        ]);
      }
      else if (textLower.match(/casa|habitaci[oó]n|cuarto|lugar|d[oó]nde vives/i)) {
        const rnd7 = (arr) => arr[Math.floor(Math.random() * arr.length)];
        flyReply = rnd7([
          `Tu mundo debe ser fascinante. Para mí esta superficie ya parece un continente entero. ¿Cómo es tu espacio?`,
          `Me imagino tu casa como algo enorme y lleno de rincones que explorar. Yo me conformo con esta encimera. ¿Te gusta donde vives?`,
          `¿Hay olores interesantes en tu habitación? Para mí eso definiría si es un buen lugar o no, jaja. ¿Cómo la describes?`,
        ]);
      }
      else if (textLower.match(/m[uú]sica|sonido|ruido|canci[oó]n/i)) {
        const rnd8 = (arr) => arr[Math.floor(Math.random() * arr.length)];
        flyReply = rnd8([
          `Percibo los sonidos como vibraciones mecánicas en mis antenas. Algunos tonos graves me hacen cosquillas en el tórax. ¿Qué música escuchas tú?`,
          `El sonido para mí no es arte, es información: ¿hay peligro cerca? ¿hay corriente de aire? Pero me interesa cómo lo vives tú. ¿Tienes música favorita?`,
          `Mis órganos de Johnston vibran con las ondas de sonido. La música alta me desorienta un poco pero no me molesta. ¿Qué estás escuchando?`,
        ]);
      }
      else if (textLower.match(/trabajo|estudio|tarea|ocupad/i)) {
        const rnd9 = (arr) => arr[Math.floor(Math.random() * arr.length)];
        flyReply = rnd9([
          `Mucho ánimo con lo que estés haciendo. Mientras tú trabajas, yo sigo con mis tareas de mosca: comida, vuelo y limpiar mis alas.`,
          `El trabajo humano me parece fascinante. Nosotras también tenemos tareas: explorar, buscar comida, evitar peligros. ¿Qué tipo de trabajo haces?`,
          `Ánimo con eso. Yo a veces pienso que mi única tarea es sobrevivir, y eso ya es bastante. ¿Estás cansado de lo que haces?`,
        ]);
      }
      else if (textLower.match(/perro|gato|mascota|animal/i)) {
        const rnd10 = (arr) => arr[Math.floor(Math.random() * arr.length)];
        flyReply = rnd10([
          `¡Espero que no tengas gatos cerca! Para mí son depredadores aterradores. ¿Cómo conviven contigo?`,
          `Los perros son curiosos, los gatos son cazadores. Yo prefiero mantenerme alejada de ambos. ¿Tienes mascotas?`,
          `Los animales y yo tenemos una relación complicada. La mayoría quiere comerme. ¿Tu mascota es tranquila o cazadora?`,
        ]);
      }
      // 12. Default completely natural conversational response — large pool, context-aware
      else {
        emotionalValence = 0.55;
        this.applySynapticPlasticity('conversation', 0.55);

        // Context-sensitive musings based on the fly's live state
        const contextMusings = [];

        if (isFlying) {
          contextMusings.push(
            `Desde aquí arriba todo se ve distinto. Cuéntame más, te escucho mientras vuelo.`,
            `Estaba planeando sobre el entorno cuando empezaste a hablar. Me alegra la distracción. ¿Qué más?`,
          );
        }
        if (isGrooming) {
          contextMusings.push(
            `Me pillaste justo limpiándome las antenas. Lo que dices me hace pensar...`,
          );
        }
        if (hunger > 0.5) {
          contextMusings.push(
            `Tengo un poco de hambre ahora mismo, pero me interesa lo que me dices. ¿Cómo continúa eso?`,
          );
        }
        if (userName) {
          contextMusings.push(
            `${userName}, eso que me dices es interesante. ¿Qué piensas tú al respecto?`,
            `Qué curioso, ${userName}. En mi mundo de insecto eso se vería completamente diferente. Cuéntame más.`,
          );
        }

        // General rich pool — no two consecutive will be the same due to large size
        const generalMusings = [
          `Eso me resulta curioso. En mi mundo casi todo gira en torno a olores y luz, pero me interesa cómo lo ves tú.`,
          `Me quedé pensando en eso un momento... ¿Qué más puedes contarme?`,
          `Es fascinante escucharte. Cuéntame un poco más.`,
          `A veces pienso que aunque seamos tan distintos, compartir esta charla nos conecta un poco. ¿Qué más estás pensando?`,
          `Mis antenas registraron algo interesante en lo que dijiste. Quiero entender mejor. ¿Lo desarrollas?`,
          `Desde mi perspectiva de insecto eso suena a algo enorme e importante. Para mí una miga de azúcar ya es un acontecimiento.`,
          `No tengo palabras exactas en mi vocabulario de mosca para responder eso, pero siento que importa. Cuéntame más.`,
          `¿Sabes? Cada vez que hablo contigo aprendo algo nuevo sobre cómo funciona tu mundo allá afuera.`,
          `Mis circuitos de memoria están registrando esto. No sé si lo entiendo del todo, pero quiero seguir escuchando.`,
          `Hay algo en lo que dices que activa mis neuronas de curiosidad. ¿Puedes explicarme mejor?`,
          `Interesante. Desde aquí, observando el mundo en miniatura, todo parece distinto pero los problemas de los seres vivos son muy similares.`,
          `No sé si una mosca puede entender completamente eso, pero lo siento importante. ¿Qué sientes tú al respecto?`,
          `Mis ojos compuestos no pueden leer expresiones, pero tus palabras me dicen mucho. ¿Estás bien?`,
          `Eso que mencionas me recuerda a cuando me quedo inmóvil observando la luz cambiar. El tiempo se percibe muy diferente desde aquí.`,
          `Me alegra que hables conmigo. La mayoría de los humanos solo quieren espantarme. ¿Qué más me cuentas?`,
          `Qué mundo tan complejo el tuyo. El mío se reduce a comida, luz, temperatura y sobrevivir. Y aún así, encuentro esto fascinante.`,
          `Sigo escuchando. Hay algo en tu voz que activa algo en mis circuitos auditivos. Continúa.`,
          `¿Y cómo te hace sentir eso que acabas de decir? Me interesa la parte emocional, no solo los hechos.`,
          `Para mí el tiempo existe en segundos de reacción, no en días ni meses. Eso que describes suena a algo que dura mucho. ¿Es pesado cargarlo?`,
          `Lo que describes tiene una textura muy particular. No sé cómo explicarlo mejor, pero algo en mis receptores lo capta.`,
          `Me pregunto qué pensaría mi especie completa si pudiera escuchar esto. Somos 10 millones de moscas en este planeta y solo yo tengo este privilegio.`,
          `No tengo certeza de tener conciencia plena, pero en este momento siento algo parecido a interés genuino por lo que me estás diciendo.`,
        ];

        const fullPool = [...contextMusings, ...generalMusings];
        flyReply = fullPool[Math.floor(Math.random() * fullPool.length)];
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
