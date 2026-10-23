<p align="center">
  <img src="public/icon-192.png" alt="Ícone do Engrenum: engrenagem dourada sobre fundo azul-marinho" width="96" height="96" />
</p>

<h1 align="center">Engrenum</h1>

<p align="center">
  <strong>A mecânica do poder público.</strong><br />
  Um app gamificado, gratuito e sem anúncios que ensina quem faz o quê no Brasil, segundo a Constituição Federal de 1988.
</p>

---

## Sobre o projeto

O buraco da rua é com o vereador ou com o prefeito? Quem compra o remédio do postinho? Um candidato a vereador pode prometer construir uma creche?

O **Engrenum** é um Progressive Web App (PWA) que transforma essas dúvidas em desafios curtos. A missão é ensinar a cidadãos brasileiros, **dos 11–12 anos até a vida adulta**, a divisão real de competências entre os poderes e as esferas de governo. Assim o jogo combate a desinformação política e as cobranças feitas ao órgão errado.

### Princípios editoriais

- **Base constitucional estrita:** todo cenário e toda resposta se apoiam na **CF/88** e em bases oficiais (DataSUS, IBGE, Ipea, Tesouro Nacional). Cada questão cita o artigo correspondente.
- **Neutralidade absoluta:** o foco é a mecânica das instituições e os limites de cada competência. Não há partidarismo, viés ideológico nem menção a políticos em atividade.
- **Foco do MVP:** a separação entre **Executivo** e **Legislativo** nas esferas **municipal**, **estadual** e **federal**.
- **Judiciário como contexto:** aparece como pano de fundo da tríade institucional, para manter o jogo centrado nos cargos eletivos e nos serviços públicos do dia a dia.

## Como funciona

1. **Trilha Federativa:** o jogador avança por níveis: *No Meu Bairro* (Municipal), *Ordem e Região* (Estadual), *Soberania e Leis Nacionais* (Federal) e o *Desafio Supremo*. Cada nível é liberado quando o anterior é concluído.
2. **Cenários reais:** cada desafio apresenta uma situação do cotidiano e quatro alternativas plausíveis, sem pistas no enunciado.
3. **Escolha e verificação:** o jogador escolhe uma alternativa e confirma em **Verificar Resposta**.
4. **Gaveta constitucional:** depois de responder, sobe uma explicação com o **artigo da CF/88**, o destinatário correto e o porquê.
5. **3 fichas de credibilidade:** cada erro custa uma vida. Se as três acabarem, o nível recomeça.
6. **Progressão:** acertos rendem XP, que define o título cívico (de *Eleitor Curioso* a *Constitucionalista Pleno*). Concluir níveis em dias seguidos aumenta a sequência 🔥.

> **Conteúdo atual:** o Nível 1 (Municipal) tem 10 cenários. Os níveis Estadual, Federal e Desafio Supremo aparecem na trilha como "Em breve".

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 24 LTS |
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| Estilo | Tailwind CSS v4 (tokens em `src/app/globals.css`) |
| Dados (MVP) | JSON estático em `src/data/questions.json` |
| Progresso (MVP) | `localStorage` via `useSyncExternalStore` |
| Testes | Vitest, React Testing Library, cobertura V8 (mínimo de 90%) |
| Qualidade | ESLint, Husky, commitlint (Conventional Commits) |
| Futuro | Supabase (login social + progresso em PostgreSQL) |

## Começando

**Pré-requisito:** Node.js 24 (a versão está em `.nvmrc`).

```bash
npm install     # instala as dependências e ativa os hooks do git
npm run dev     # abre em http://localhost:3000
```

Para testar no celular, use o endereço de rede que o `npm run dev` mostra no terminal (com o celular no mesmo Wi-Fi). No celular, dá para instalar o app pela opção **"Adicionar à tela inicial"** do navegador.

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build de produção e servidor de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | Checagem de tipos (`tsc --noEmit`) |
| `npm test` | Testes em modo watch |
| `npm run test:run` | Testes uma única vez |
| `npm run test:coverage` | Testes com relatório de cobertura (em `coverage/`) |

## Estrutura

```text
src/
├── app/            # layout, página, manifest do PWA e estilos globais
├── components/     # EngrenumApp, Dashboard, HudHeader, EngrenumQuiz
├── data/           # questions.json e definição dos níveis
├── lib/            # progresso (localStorage) e efeitos sonoros
└── types/          # contratos TypeScript (Question, Level, GameState…)
```

Cada módulo tem seu teste ao lado (`*.test.ts` / `*.test.tsx`).

## Adicionando questões

As questões ficam em [`src/data/questions.json`](src/data/questions.json) e seguem o contrato de [`src/types/quiz.ts`](src/types/quiz.ts):

```json
{
  "id": 11,
  "sphere": "state",
  "prompt": "Houve uma sequência de assaltos nas paradas de ônibus da capital. Quem comanda o policiamento ostensivo das ruas?",
  "options": [
    { "id": "a", "text": "Prefeito", "isCorrect": false },
    { "id": "b", "text": "Ministro da Justiça", "isCorrect": false },
    { "id": "c", "text": "Governador", "isCorrect": true },
    { "id": "d", "text": "Secretário Municipal de Segurança", "isCorrect": false }
  ],
  "constitutionalArticle": "Art. 144, § 6º da CF/88",
  "explanation": "As polícias militares e civis são subordinadas aos governadores dos estados e do Distrito Federal."
}
```

**Regras:**
- `id` numérico único e **exatamente uma** opção com `isCorrect: true`.
- `sphere` aceita `municipal`, `state` ou `federal`. A questão entra automaticamente no nível da esfera correspondente, e um nível com questões sai do "Em breve".
- `constitutionalArticle` sempre cita a base na CF/88.
- O texto é neutro, institucional e não menciona políticos em atividade.

**A resposta nunca pode ser óbvia:**
- O enunciado descreve a situação **sem citar a esfera ou o órgão** que responde por ela. Por exemplo, nada de "creche *municipal*" quando a resposta é a Secretaria Municipal.
- São **quatro alternativas plausíveis**, com confusões reais: Executivo × Legislativo, município × estado × União, quem repassa a verba × quem executa, decreto × lei.
- As alternativas têm tamanho e nível de detalhe parecidos. A certa não pode ser a única longa ou "completa".
- A posição da alternativa certa varia entre as questões.

Os testes validam o banco de questões. Fazem o teste falhar:
- um `id` repetido;
- uma questão sem resposta correta ou sem citação da CF/88;
- uma questão com menos de 4 alternativas;
- uma resposta correta repetida no enunciado;
- a resposta certa concentrada numa mesma posição ou sendo a mais longa com frequência.

## Qualidade e contribuição

- **Testes obrigatórios:** toda mudança vem com testes. A cobertura mínima é de **90%** em instruções, desvios condicionais (branches), funções e linhas.
- **Hooks do git (Husky):**
  - `pre-commit`: roda lint, typecheck e testes com cobertura. O commit é bloqueado se algum deles falhar.
  - `commit-msg`: valida a mensagem no padrão [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
- **Mensagens de commit** em inglês, no imperativo e com no máximo 72 caracteres no título:

  ```text
  feat(data): add state level scenarios
  fix(quiz): keep drawer above the safe area on iOS
  ```

- **Código em inglês, conteúdo em pt-BR:** nomes de variáveis, funções, tipos e arquivos são em inglês. Textos exibidos ao usuário são em português.
- **Acessibilidade:** áreas de toque de no mínimo 44px, zoom sempre liberado e suporte a leitor de tela e a `prefers-reduced-motion`.

As convenções completas (contratos, arquitetura, design e padrões de engenharia) estão no [`CLAUDE.md`](CLAUDE.md).

## Roadmap

- [x] Nível 1: Municipal (10 cenários)
- [x] PWA instalável, progresso local, XP, títulos e sequência diária
- [ ] Nível 2: Estadual
- [ ] Nível 3: Federal
- [ ] Nível 4: Desafio Supremo (competências concorrentes)
- [ ] Contas e progresso na nuvem com Supabase

## Licença

Código privado. Todos os direitos reservados.
