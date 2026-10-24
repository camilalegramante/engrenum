// Every pt-BR UI string, grouped by screen/component (see CLAUDE.md, "No Hardcoded Strings").
// Content datasets (questions, swipe cards, levels, ranks, civic titles) live in their own files.

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export const STRINGS = {
  app: {
    name: "Engrenum",
    title: "Engrenum — A mecânica do poder público",
    description: "Aprenda a divisão real de atribuições dos poderes e esferas de governo de acordo com a CF/88.",
    manifestDescription: "Aprenda as competências dos poderes públicos segundo a CF/88.",
  },

  common: {
    xp: "XP",
    backToPath: "Voltar à Trilha",
    playAgain: "Jogar Novamente",
    seeResult: "Ver Resultado",
  },

  hud: {
    back: "Voltar ao mapa",
    enableSound: "Ativar som",
    disableSound: "Desativar som",
    toggleSound: "Alternar som",
    progress: "Progresso do nível",
    streakTitle: "Dias seguidos de foco cívico",
    streakUnit: "dias seguidos",
    xpTitle: "Pontos de cidadania (XP)",
    xpUnit: "pontos de XP",
    livesTitle: "Fichas de credibilidade (vidas)",
    livesUnit: "vidas restantes",
  },

  mascot: {
    waving: "Capivara, mascote do Engrenum, acenando",
    sleepy: "Capivara cochilando",
  },

  chest: {
    title: "Baú aberto!",
    rewardBefore: "Você ganhou",
    reward: (xp: number) => `+${xp} XP`,
    rewardAfter: "de bônus pela dedicação.",
    confirm: "Oba!",
  },

  dashboard: {
    heading: "Quem Manda Aqui? Trilha Federativa",
    footer: "Conteúdo educativo baseado na Constituição Federal de 1988.",
    swipeEyebrow: "Modo rápido",
    swipeDescription: "Promessas de campanha: legítimas ou inconstitucionais? Arraste a carta e descubra.",
    swipeAction: "Avaliar promessas",
  },

  journey: {
    label: "Sua jornada",
    rankHeading: "Título cívico",
    rankProgress: "Progresso para o próximo título",
    xpToNextRank: (xp: number, rankName: string) => `Faltam ${xp} XP para ${rankName}`,
    topRank: "Você chegou ao topo!",
    missionHeading: "Missão do dia",
    mission: "Complete 1 lição hoje",
    missionProgress: "Progresso da missão do dia",
    missionDone: (streak: number) => `Feito! Sequência de ${streak} 🔥`,
    missionPending: "Mantenha sua sequência viva",
  },

  path: {
    chestTitle: "Baú de recompensa",
    challengeTitle: "Desafio final",
    challengeSessionTitle: (levelTitle: string) => `Desafio final: ${levelTitle}`,
    status: {
      completed: "concluída",
      current: "próxima etapa",
      available: "disponível",
      locked: "bloqueada",
    },
    nodeLabel: (title: string, status: string) => `${title}: ${status}`,
    unitLabel: (unitNumber: number, sphereLabel: string) => `Nível ${unitNumber} · ${sphereLabel}`,
    levelCompleted: "✓ CONCLUÍDO",
    comingSoon: "EM BREVE",
    steps: (done: number, total: number) => `${done}/${total} ETAPAS`,
    play: "Jogar",
    fallbackLessonTitle: (lessonNumber: number) => `Lição ${lessonNumber}`,
    lockedMessage: "Complete as etapas anteriores para desbloquear.",
    scenarios: (count: number) => pluralize(count, "cenário", "cenários"),
    chestBonus: (xp: number) => `+${xp} XP de bônus`,
    chestOpened: "Você já abriu este baú.",
    challengeSubtitle: (scenarios: string) => `${scenarios} · libera o próximo nível`,
    lessonSubtitle: (lessonNumber: number, lessonCount: number, scenarios: string) =>
      `Lição ${lessonNumber} de ${lessonCount} · ${scenarios}`,
    openChest: "Abrir baú",
    startChallenge: "Encarar desafio",
    redoChallenge: "Refazer desafio",
    startLesson: "Começar",
    replayLesson: "Jogar de novo",
  },

  quiz: {
    sphere: (sphereLabel: string) => `Esfera ${sphereLabel}`,
    phase: (current: number, total: number) => `Fase ${current} de ${total}`,
    scenarioLabel: "Cenário Constitucional",
    verify: "Verificar Resposta",
    correctTitle: "Competência Constitucional Precisa!",
    wrongTitle: "Cobrança no Lugar Errado!",
    outOfLivesTitle: "Credibilidade Esgotada!",
    correctAnswer: (answer: string) => `Destinatário correto: ${answer}`,
    nextQuestion: "Próximo Desafio →",
    finishLevel: "Concluir Nível →",
    defeatMessage: (score: number, answered: number) =>
      `A cobrança de autoridades exige precisão constitucional. Você acertou ${score} de ${answered} cenários. Revise e tente de novo!`,
    retry: "Tentar Novamente",
    backToMap: "Voltar ao Mapa",
    levelDoneBadge: "Nível Concluído",
    lessonDoneBadge: "Lição Concluída",
    perfectLesson: "Lição perfeita!",
    lessonDone: "Lição concluída!",
    lessonDoneDescription: (lessonTitle: string) =>
      `Você completou "${lessonTitle}". Siga para a próxima etapa da trilha!`,
    pointsLabel: "Pontos Obtidos",
    accuracyLabel: "Taxa de Acerto",
  },

  swipe: {
    title: "Fato ou Fake Eleitoral",
    cardCounter: (current: number, total: number) => `Carta ${current} de ${total}`,
    hintStart: "Arraste para a",
    hintRight: "direita",
    hintMiddle: "se a promessa cabe ao cargo, ou para a",
    hintLeft: "esquerda",
    hintEnd: "se ela é inconstitucional.",
    statement: (statement: string) => `“${statement}”`,
    mascotLead: "Capi pergunta:",
    mascotQuestion: "essa promessa cabe nas competências do cargo?",
    legitimateStamp: "Legítimo",
    illegalStamp: "Ilegal",
    illegalAction: "Promessa ilegal",
    legitimateAction: "Legítimo",
    correctTitle: "Fato checado!",
    wrongTitle: "Caiu na promessa!",
    legitimateVerdict: "Promessa legítima: está dentro das competências do cargo.",
    illegalVerdict: "Promessa ilegal: invade a competência de outro poder ou esfera.",
    nextCard: "Próxima Carta →",
    roundDoneBadge: "Rodada Concluída",
    hitsLabel: "Acertos",
    accuracyLabel: "Aproveitamento",
    pointsLabel: "Pontos",
  },
} as const;
