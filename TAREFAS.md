# Tarefas Formalize

Documento de controle de tarefas em andamento. Sempre verificar este arquivo antes de fazer qualquer outra coisa.
Prioridade: seguir a ordem abaixo. Se o usuário pedir algo fora desta lista, lembrar que existem tarefas pendentes e perguntar se quer pausar ou continuar depois.

---

## ✅ Concluídas (referência)
- Sistema de cláusulas de contrato (templates, presets, editor)
- Campo `categoria` no onboarding (perfil do artista → preset de contrato)
- Tutorial com spotlight, beam SVG e card flutuante com posicionamento inteligente
- Cards de exemplo em `RecentDocs` para usuário novo
- Seletor de modelo de contrato movido para página de Templates

---

## 🔴 Pendentes (em ordem de prioridade)

### 1. Botão "Ver PDF" — texto invisível ✅ CONCLUÍDA
**Problema:** Após gerar PDF, o modal aparece mas o botão "Ver PDF" tem texto e ícone brancos sobre fundo branco — ilegível.
**Causa provável:** `text-stage-950` não existe no Tailwind config da app, então a cor não aplica.
**Arquivo:** `components/ui/PdfReadyModal.tsx` — linha ~126 (`className="... bg-white text-stage-950 ..."`)
**Fix:** Trocar `text-stage-950` por cor escura garantida (`text-gray-900` ou `text-[#0a0a0a]`). Verificar também o ícone `<IconDoc>`.

---

### 2. Tutorial — elemento spotlighted desfocado ✅ CONCLUÍDA
**Problema:** O elemento dentro do anel de spotlight deveria ficar em foco (visível e nítido), mas está sendo coberto pelo overlay escuro junto com o resto da página.
**Causa:** O overlay (`position:fixed, inset:0`) cobre tudo incluindo o elemento alvo. O elemento precisa estar acima do overlay via `z-index`, ou o overlay precisa ter um "buraco" real (não apenas box-shadow).
**Arquivo:** `components/ui/PageTutorial.tsx`
**Fix:** Renderizar um `<div>` clone/portal do elemento no z-index acima do overlay, ou usar `mix-blend-mode` no spotlight ring para que o conteúdo interno apareça nítido. Opção mais limpa: aplicar `isolation: isolate` + `position: relative; z-index: 9203` no próprio elemento spotlighted via JS temporariamente.

---

### 3. Erro após "Reiniciar configuração inicial" + novo onboarding ✅ CONCLUÍDA
**Problema:** Depois de reiniciar e refazer o onboarding, aparece tela de erro. Botão "Tentar novamente" não responde. Só funciona clicar em "Login" para retornar ao fluxo normal.
**Suspeita:** Após `patch({ onboardingDone: true })` + `router.replace("/admin/orcamento")`, o layout (server component) ainda lê `onboardingDone: false` da sessão em cache ou a sessão next-auth não é atualizada, criando loop de redirect ou erro 500.
**Arquivos a investigar:**
- `app/(admin)/admin/onboarding/page.tsx` — função `finish()`
- `app/(admin)/layout.tsx` — lógica de redirect `onboardingDone`
- `app/(admin)/admin/configuracoes/page.tsx` — botão "Reiniciar"
- Procurar `error.tsx` ou tela de erro customizada no app router
**Fix planejado:** Após `patch` no `finish()`, forçar hard reload (`window.location.href = "/admin/orcamento"`) em vez de `router.replace`, garantindo que o server component releia o DB. Adicionar animação de loading no botão "Tentar novamente".

---

### 4. Configurações — botão "Salvar alterações" inteligente ✅ CONCLUÍDA
**Problema:** Botão sempre aparece (esmaecido). Deveria: estar oculto quando nenhuma alteração foi feita, aparecer em fade-in quando algum campo mudar (incluindo troca de imagem), posicionar no bottom sem sobrepor o menu de navegação (se o menu sumir, descer um pouco mais).
**Arquivo:** `app/(admin)/admin/configuracoes/page.tsx`
**Fix aplicado:**
- `isDirty` via `JSON.stringify(data) !== JSON.stringify(initialData)`
- `MutationObserver` em `document.body` detecta classe `nav-hidden` (adicionada pelo AdminHeader ao rolar pra baixo)
- `createPortal` para escapar do `overflowX: clip` do layout pai
- `position: fixed`, `bottom: isMobile ? (navHidden ? 16 : 80) : 24`
- Fade-in via `opacity` + `transform: translateY` com transition spring

---

### 5. Cálculo "Como você quer receber?" no Orçamento e Contrato ✅ CONCLUÍDA
**Problema:** Existe um cálculo de recebimento líquido no form de orçamento ("Como você quer receber?") que mostra quanto o artista realmente recebe dependendo da forma de pagamento. Esse mesmo componente/lógica precisa estar no formulário de Contrato também.
**Arquivos a investigar:**
- `components/forms/FormOrcamento.tsx` — localizar a seção de cálculo
- `components/forms/FormContrato.tsx` — onde inserir
**Fix planejado:** Extrair o componente/lógica de cálculo de `FormOrcamento` para um componente reutilizável, e incluir no `FormContrato` na seção de pagamento/cache.

---

## 📝 Notas
- Sempre rodar `npx tsc --noEmit` após cada mudança para garantir zero erros de tipo.
- Commits só quando o usuário pedir explicitamente.
- Este documento deve ser atualizado conforme as tarefas são concluídas.
