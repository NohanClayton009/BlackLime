const sidebar = document.querySelector("#sidebar");
const menuButton = document.querySelector("#menuButton");
const sidebarOverlay = document.querySelector("#sidebarOverlay");
const sidebarCollapseButton = document.querySelector("#sidebarCollapseButton");
const sidebarCollapseIcon = document.querySelector("#sidebarCollapseIcon");
const pageContent = document.querySelector("#pageContent");
const pageTitle = document.querySelector("#pageTitle");
const pageEyebrow = document.querySelector("#pageEyebrow");
const MESSAGE_RETENTION_MS = 24 * 60 * 60 * 1000;
const DEFAULT_PROFILE_ROLE = "Dono";
const THEME_STORAGE_KEY = "blacklime-theme";

function applyTheme(theme) {
    const selectedTheme = theme === "light" ? "light" : "dark";
    document.body.dataset.theme = selectedTheme;
    const themeToggle = document.querySelector("#profileThemeToggle");
    if (themeToggle) {
        const isLight = selectedTheme === "light";
        themeToggle.setAttribute("aria-pressed", String(isLight));
        themeToggle.setAttribute("aria-label", isLight ? "Ativar tema escuro" : "Ativar tema claro");
        themeToggle.querySelector(".theme-toggle-label").textContent = isLight ? "Claro" : "Escuro";
        themeToggle.querySelector(".theme-toggle-icon").textContent = isLight ? "\u2600" : "\u25cf";
    }
}

let savedTheme = "dark";
try {
    savedTheme = localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
} catch (error) {
    console.error("Falha ao carregar o tema salvo.", error);
}
applyTheme(savedTheme);

const messageEditDialog = document.querySelector("#messageEditDialog");
const messageEditForm = document.querySelector("#messageEditForm");
const messageEditText = document.querySelector("#messageEditText");
const messageEditStatus = document.querySelector("#messageEditStatus");
let saveEditedMessage = null;

function openMessageEditor(message, onSave) {
    messageEditText.value = message;
    messageEditStatus.textContent = "";
    saveEditedMessage = onSave;
    messageEditDialog.showModal();
    messageEditText.focus();
}

messageEditForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const updatedText = messageEditText.value.trim();
    if (!updatedText) {
        messageEditStatus.textContent = "Escreva uma mensagem antes de salvar.";
        messageEditText.focus();
        return;
    }

    if (saveEditedMessage && saveEditedMessage(updatedText)) {
        messageEditDialog.close();
        saveEditedMessage = null;
    }
});

document.querySelector("#cancelMessageEdit").addEventListener("click", () => {
    messageEditDialog.close();
    saveEditedMessage = null;
});

function prepareExpiringMessages(savedMessages) {
    if (!Array.isArray(savedMessages)) {
        throw new Error("As mensagens salvas estão em um formato inválido.");
    }

    const now = Date.now();
    let changed = false;
    const messages = [];

    savedMessages.forEach((message) => {
        let savedMessage = message;
        if (typeof message === "string") {
            savedMessage = { text: message, sentAt: now };
            changed = true;
        } else if (
            !message ||
            typeof message.text !== "string" ||
            !Number.isFinite(message.sentAt)
        ) {
            throw new Error("Uma mensagem salva está em um formato inválido.");
        }

        if (now - savedMessage.sentAt >= MESSAGE_RETENTION_MS) {
            changed = true;
            return;
        }

        messages.push(savedMessage);
    });

    return { messages, changed };
}

function updateSidebarProfile(nameValue, roleValue) {
    const name = typeof nameValue === "string" && nameValue.trim() ? nameValue.trim() : "Nohan Silva";
    const role = typeof roleValue === "string" && roleValue.trim() ? roleValue.trim() : DEFAULT_PROFILE_ROLE;
    const initials = name.split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase() || "NS";
    const sidebarProfileName = document.querySelector("#sidebarProfileName");
    const sidebarProfileRole = document.querySelector("#sidebarProfileRole");
    const sidebarProfileAvatar = document.querySelector("#sidebarProfileAvatar");
    const sidebarProfileLink = document.querySelector(".profile-link");

    if (sidebarProfileName) {
        sidebarProfileName.textContent = name;
        if (sidebarProfileLink) {
            sidebarProfileLink.setAttribute("aria-label", `Abrir perfil de ${name}`);
            sidebarProfileLink.title = `Perfil de ${name}`;
        }
    }
    if (sidebarProfileRole) {
        sidebarProfileRole.textContent = role;
    }
    if (sidebarProfileAvatar) {
        sidebarProfileAvatar.textContent = initials;
    }
}

let savedProfileSettings = {};
let profileSettingsError = null;
try {
    savedProfileSettings = JSON.parse(localStorage.getItem("blacklime-settings") || "{}");
    if (!savedProfileSettings || typeof savedProfileSettings !== "object" || Array.isArray(savedProfileSettings)) {
        throw new Error("Os dados do perfil estão em um formato inválido.");
    }
    updateSidebarProfile(savedProfileSettings.name, savedProfileSettings.position);
} catch (error) {
    profileSettingsError = error;
    console.error("Falha ao carregar as informações do perfil.", error);
}

const pages = {
    acesso: {
        title: "Acesse a Black Lime",
        eyebrow: "SUA CONTA",
        content: `
            <section class="auth-layout" aria-labelledby="authTitle">
                <div class="auth-intro">
                    <div class="auth-brand" aria-label="Black Lime">
                        <div class="brand-mark" aria-hidden="true"><span></span><span></span></div>
                        <span class="brand-name">BLACK<span>LIME</span></span>
                    </div>
                    <p class="panel-kicker">COLABORAÇÃO COMEÇA AQUI</p>
                    <h2 id="authTitle">Boas ideias crescem em equipe.</h2>
                    <p>Entre na sua conta ou crie seu perfil para continuar para a Black Lime.</p>
                </div>
                <section class="panel auth-panel" aria-label="Acessar ou criar conta">
                    <div class="auth-tabs" role="group" aria-label="Escolha uma opção">
                        <button class="auth-tab active" type="button" data-auth-mode="signup" aria-pressed="true">Criar conta</button>
                        <button class="auth-tab" type="button" data-auth-mode="login" aria-pressed="false">Fazer login</button>
                    </div>
                    <form class="auth-form" id="authSignupForm">
                        <h2>Criar seu perfil</h2>
                        <label for="authSignupName">Nome completo</label>
                        <input id="authSignupName" name="name" type="text" autocomplete="name" placeholder="Como podemos chamar você?" required>
                        <label for="authSignupEmail">E-mail</label>
                        <input id="authSignupEmail" name="email" type="email" autocomplete="email" placeholder="voce@empresa.com" required>
                        <button class="primary-button auth-submit" type="submit">Criar conta e continuar</button>
                        <p class="auth-status" id="authSignupStatus" role="status" aria-live="polite"></p>
                    </form>
                    <form class="auth-form" id="authLoginForm" hidden>
                        <h2>Que bom ter você de volta</h2>
                        <label for="authLoginEmail">E-mail da sua conta</label>
                        <input id="authLoginEmail" name="email" type="email" autocomplete="email" placeholder="voce@empresa.com" required>
                        <button class="primary-button auth-submit" type="submit">Entrar na Black Lime</button>
                        <p class="auth-status" id="authLoginStatus" role="status" aria-live="polite"></p>
                    </form>
                    <p class="auth-note">Demonstração: o perfil fica salvo somente neste navegador. Esta versão não usa senhas nem possui autenticação online.</p>
                </section>
            </section>`
    },
    empresa: {
        title: "Sobre a empresa",
        eyebrow: "BLACK LIME",
        content: `
            <section class="company-hero" aria-labelledby="companyName">
                <div>
                    <p class="panel-kicker">QUEM SOMOS</p>
                    <h2 id="companyName">Black Lime</h2>
                    <p>A Black Lime é uma empresa criada para conectar pessoas, organizar equipes e transformar ideias em projetos com mais clareza e colaboração.</p>
                </div>
                <div class="company-hero-mark" aria-hidden="true">
                    <div class="brand-mark"><span></span><span></span></div>
                </div>
            </section>
            <section class="company-content-grid" aria-label="Informações da empresa">
                <article class="panel company-info-card">
                    <p class="panel-kicker">NOSSA MISSÃO</p>
                    <h2>Facilitar o trabalho em equipe</h2>
                    <p>Oferecer uma experiência simples para comunicação, gestão de pessoas e acompanhamento das atividades da empresa.</p>
                </article>
                <article class="panel company-info-card">
                    <p class="panel-kicker">NOSSOS VALORES</p>
                    <h2>Colaboração e responsabilidade</h2>
                    <ul class="company-values">
                        <li>Comunicação clara</li>
                        <li>Trabalho em equipe</li>
                        <li>Respeito e confiança</li>
                        <li>Foco em resultados</li>
                    </ul>
                </article>
                <article class="panel company-info-card company-info-wide">
                    <p class="panel-kicker">NOSSA PROPOSTA</p>
                    <h2>Um ambiente digital para crescer juntos</h2>
                    <p>Centralizamos comunicados, equipes e conversas em um único espaço, ajudando cada pessoa a entender prioridades e participar das decisões.</p>
                </article>
            </section>`
    },
    cadastro: {
        title: "Criar meu perfil",
        eyebrow: "SEU PRIMEIRO PASSO",
        content: `
            <section class="signup-page">
                <article class="panel signup-panel">
                    <button class="close-form-button signup-close" id="closeSignupDialog" type="button" aria-label="Fechar cadastro">&times;</button>
                    <p class="panel-kicker">VAMOS COMEÇAR</p>
                    <h2 id="signupTitle">Crie seu perfil</h2>
                    <p class="signup-intro">Preencha seus dados para personalizar sua experiência na Black Lime.</p>
                    <form class="signup-form">
                        <label for="signupName">Nome completo<input id="signupName" name="name" type="text" autocomplete="name" placeholder="Como podemos chamar você?" required></label>
                        <label for="signupEmail">E-mail<input id="signupEmail" name="email" type="email" autocomplete="email" placeholder="voce@empresa.com" required></label>
                        <button class="primary-button signup-submit" type="submit">Criar meu perfil</button>
                        <p class="signup-status" id="signupStatus" role="status" aria-live="polite"></p>
                    </form>
                    <p class="signup-disclaimer">Cadastro de demonstração: os dados ficam salvos apenas neste navegador. Esta versão não possui login nem armazena senhas.</p>
                    <a class="signup-dashboard-link" href="index.html?pagina=equipe">Já tenho um perfil? Acessar o painel <span aria-hidden="true">→</span></a>
                </article>
            </section>`
    },
    analises: {
        title: "Análises",
        eyebrow: "DADOS E DESEMPENHO",
        content: `
            <section class="stats-grid" aria-label="Indicadores de análise">
                <article class="stat-card"><div class="stat-heading"><span>Receita no período</span><span class="trend up">+12,5%</span></div><strong>R$ 48.290</strong><small>em comparação ao período anterior</small></article>
                <article class="stat-card"><div class="stat-heading"><span>Conversão</span><span class="trend up">+2,4%</span></div><strong>8,6%</strong><small>Visitantes que viraram clientes</small></article>
                <article class="stat-card"><div class="stat-heading"><span>Ticket médio</span><span class="trend up">+5,1%</span></div><strong>R$ 1.240</strong><small>Valor médio por projeto</small></article>
                <article class="stat-card accent-card"><div class="stat-heading"><span>Novos clientes</span><span>Este mês</span></div><strong>156</strong><small>18 a mais que no mês passado</small></article>
            </section>
            <section class="panel page-panel"><div class="panel-header"><div><p class="panel-kicker">RELATÓRIO</p><h2>Receita ao longo da semana</h2></div><span class="trend up">+12,5% nesta semana</span></div><div class="bar-chart page-chart" aria-label="Gráfico de receita semanal"><div class="bar-group"><span class="bar" style="height:58%"></span><small>Seg</small></div><div class="bar-group"><span class="bar" style="height:72%"></span><small>Ter</small></div><div class="bar-group"><span class="bar" style="height:48%"></span><small>Qua</small></div><div class="bar-group"><span class="bar" style="height:88%"></span><small>Qui</small></div><div class="bar-group"><span class="bar" style="height:68%"></span><small>Sex</small></div><div class="bar-group"><span class="bar" style="height:96%"></span><small>Sáb</small></div><div class="bar-group"><span class="bar muted" style="height:78%"></span><small>Dom</small></div></div></section>`
    },
    projetos: {
        title: "Projetos",
        eyebrow: "ACOMPANHE SUAS ENTREGAS",
        content: `
            <div class="page-intro"><div><h2>Seus projetos</h2><p>Veja o andamento das entregas da equipe.</p></div><span class="trend up">8 projetos ativos</span></div>
            <section class="project-grid">
                <article class="panel project-card"><div class="project-top"><span class="project-tag">IDENTIDADE VISUAL</span><span class="project-status">Em andamento</span></div><h2>Vortex</h2><p>Criação de identidade visual e sistema de marca.</p><div class="progress-track"><span style="width:72%"></span></div><small>72% concluído <span>Entrega: 28 nov</span></small></article>
                <article class="panel project-card"><div class="project-top"><span class="project-tag">CAMPANHA</span><span class="project-status">Em andamento</span></div><h2>Studio Nord</h2><p>Campanha digital de lançamento da nova coleção.</p><div class="progress-track"><span style="width:48%"></span></div><small>48% concluído <span>Entrega: 02 dez</span></small></article>
                <article class="panel project-card"><div class="project-top"><span class="project-tag">DESENVOLVIMENTO</span><span class="project-status">Revisão</span></div><h2>TechFlow</h2><p>Nova experiência para o site institucional.</p><div class="progress-track"><span style="width:90%"></span></div><small>90% concluído <span>Entrega: 24 nov</span></small></article>
            </section>`
    },
    equipe: {
        title: "Equipe",
        eyebrow: "PESSOAS E COLABORAÇÃO",
        content: `
            <div class="page-intro"><div><h2>Equipes e liderança</h2><p>Crie equipes e escolha quem vai coordenar cada uma.</p></div><span class="trend up">Gestão de pessoas</span></div>
            <section class="panel team-creation-panel" id="teamCreationPanel">
                <div class="panel-header">
                    <div><p class="panel-kicker">NOVA EQUIPE</p><h2>Organize seu time</h2></div>
                    <button class="close-form-button" id="closeTeamForm" type="button" aria-label="Fechar criação de equipe">&times;</button>
                </div>
                <form class="team-form">
                    <label>Nome da equipe<input type="text" name="teamName" value="CodeDev" required></label>
                    <div class="friend-selection-field">
                        <span class="friend-selection-title">Lista de amizades <span class="field-hint">(selecione os membros)</span></span>
                        <button class="friend-selection-button" id="toggleTeamFriends" type="button" aria-expanded="false" aria-controls="teamFriendList">
                            <span>Selecionar amizades</span><span aria-hidden="true">⌄</span>
                        </button>
                        <div class="friend-selection-list" id="teamFriendList" hidden></div>
                    </div>
                    <div class="team-creator-field">
                        <span class="friend-selection-title">Líder da equipe</span>
                        <div class="team-creator-profile">
                            <span class="avatar" id="teamCreatorAvatar" aria-hidden="true"></span>
                            <span id="teamCreatorName"></span>
                            <span class="team-creator-badge">Você</span>
                        </div>
                    </div>
                    <button class="primary-button team-submit" type="submit">Criar equipe</button>
                    <p class="team-form-status" role="status" aria-live="polite"></p>
                </form>
            </section>
            <section class="created-teams" aria-label="Equipes criadas">
                <div class="panel-header">
                    <div><p class="panel-kicker">EQUIPES</p><h2 id="teamListTitle">Equipes criadas</h2></div>
                    <button class="secondary-button" id="showTeamForm" type="button" hidden>Nova equipe</button>
                </div>
                <div class="team-grid" id="createdTeams"></div>
            </section>
            <div class="page-intro">
                <div><h2>Amizades</h2><p>Pessoas e contatos da sua rede na empresa.</p></div>
                <button class="secondary-button add-friend-button" id="addFriendButton" type="button"><span aria-hidden="true">+</span> Adicionar amizade</button>
            </div>
            <section class="panel friend-form-panel" id="friendFormPanel" hidden>
                <div class="panel-header">
                    <div><p class="panel-kicker">NOVO CONTATO</p><h2>Adicionar amizade</h2></div>
                    <button class="close-form-button" id="closeFriendForm" type="button" aria-label="Fechar formulário de amizade">&times;</button>
                </div>
                <form class="team-form friend-form">
                    <label>Nome<input type="text" name="friendName" required></label>
                    <label>Cargo ou área<input type="text" name="friendRole" required></label>
                    <label>E-mail<input type="email" name="friendEmail" required></label>
                    <button class="primary-button" type="submit">Adicionar</button>
                </form>
            </section>
            <p class="company-friends-status" id="companyFriendsStatus" role="status" aria-live="polite"></p>
            <section class="team-grid" id="companyFriendsGrid" aria-label="Amizades">
            </section>`
    },
    mensagens: {
        title: "Mensagens",
        eyebrow: "CONVERSAS DA EQUIPE",
        content: `
            <section class="messaging-layout">
                <aside class="panel team-chat-list-panel">
                    <p class="panel-kicker">EQUIPES</p>
                    <h2>Conversas</h2>
                    <p class="team-conversation-list-status" id="teamConversationListStatus" role="status" aria-live="polite"></p>
                    <div class="team-conversation-list" id="teamConversationList"></div>
                    <p class="panel-kicker friend-conversation-kicker">AMIZADES</p>
                    <p class="team-conversation-list-status" id="friendConversationListStatus" role="status" aria-live="polite"></p>
                    <div class="team-conversation-list" id="friendConversationList"></div>
                </aside>
                <section class="panel team-chat-panel" aria-label="Conversa">
                    <div id="emptyChatPrompt" class="empty-chat-prompt">Selecione uma equipe ou amizade para abrir a conversa.</div>
                    <div id="teamChatArea" class="team-chat-area" hidden>
                        <div class="team-chat-header">
                            <h2 id="teamConversationTitle"></h2>
                            <p id="teamConversationMeta"></p>
                            <p class="message-retention-note">As mensagens são excluídas automaticamente 24 horas após o envio.</p>
                        </div>
                        <div class="team-chat-messages" id="teamChatMessages" aria-live="polite"></div>
                        <p class="team-chat-status" id="teamChatStatus" role="status" aria-live="polite"></p>
                        <form class="team-chat-form" id="teamChatForm">
                            <input type="text" name="message" id="teamMessageInput" placeholder="Escreva uma mensagem..." maxlength="500" required>
                            <button class="primary-button" type="submit">Enviar</button>
                        </form>
                    </div>
                </section>
            </section>`
    },
    dono: {
        title: "Área do Dono",
        eyebrow: "PAINEL EXCLUSIVO",
        content: `
            <section class="owner-dashboard">
                <article class="panel owner-dashboard-welcome">
                    <p class="panel-kicker">ÁREA DO DONO</p>
                    <h2 id="ownerPageGreeting">Olá!</h2>
                    <p>Esta é a página exclusiva do dono da empresa.</p>
                </article>
                <div class="owner-dashboard-actions">
                    <a class="panel owner-dashboard-action" href="index.html">
                        <strong>Visão geral</strong>
                        <span>Acessar os comunicados da empresa</span>
                    </a>
                    <a class="panel owner-dashboard-action" href="index.html?pagina=equipe">
                        <strong>Equipes</strong>
                        <span>Gerenciar equipes e amizades</span>
                    </a>
                </div>
                <section class="panel owner-moderation-panel">
                    <div class="panel-header">
                        <div><p class="panel-kicker">MODERAÇÃO</p><h2>Mensagens das equipes</h2></div>
                    </div>
                    <p class="owner-moderation-status" id="ownerModerationStatus" role="status" aria-live="polite"></p>
                    <div class="owner-moderation-list" id="ownerModerationList"></div>
                </section>
            </section>`
    },
    perfil: {
        title: "Meu perfil",
        eyebrow: "CONTA PESSOAL",
        content: `
            <section class="profile-page">
                <article class="panel profile-summary">
                    <div class="avatar profile-page-avatar" id="profilePageAvatar">NS</div>
                    <div class="profile-summary-copy">
                        <p class="panel-kicker">PERFIL DA CONTA</p>
                        <h2 id="profilePageName">Nohan Silva</h2>
                        <p id="profilePageEmail">nohan@example.com</p>
                        <span class="profile-role" id="profilePageRole">Dono</span>
                    </div>
                    <button class="theme-toggle" id="profileThemeToggle" type="button" aria-label="Ativar tema claro" aria-pressed="false">
                        <span class="theme-toggle-icon" aria-hidden="true">&#9679;</span>
                        <span class="theme-toggle-label">Escuro</span>
                    </button>
                </article>
                <section class="panel profile-info-panel">
                    <div class="panel-header">
                        <div><p class="panel-kicker">DADOS DA CONTA</p><h2>Informações pessoais</h2></div>
                        <a class="secondary-button profile-edit-link" href="index.html?pagina=configuracoes">Editar perfil</a>
                    </div>
                    <dl class="profile-details-list">
                        <div><dt>Nome completo</dt><dd id="profileDetailName">Nohan Silva</dd></div>
                        <div><dt>E-mail</dt><dd id="profileDetailEmail">nohan@example.com</dd></div>
                    </dl>
                    <a class="secondary-button profile-owner-link" id="profileOwnerLink" href="index.html?pagina=dono" hidden>Abrir página do Dono</a>
                    <p class="profile-page-status" id="profilePageStatus" role="status" aria-live="polite"></p>
                </section>
            </section>`
    },
    configuracoes: {
        title: "Configurações",
        eyebrow: "PREFERÊNCIAS DA CONTA",
        content: `
            <section class="panel settings-panel"><div class="panel-header"><div><p class="panel-kicker">PERFIL</p><h2>Informações pessoais</h2></div></div>
                <form class="settings-form">
                    <label>Nome completo<input type="text" name="name" value="Nohan Silva"></label>
                    <label>E-mail<input type="email" name="email" value="nohan@example.com"></label>
                    <button class="primary-button" type="submit">Salvar alterações</button>
                    <p class="form-status" role="status" aria-live="polite"></p>
                </form>
            </section>`
    }
};

const pageParams = new URLSearchParams(window.location.search);
const requestedPage = pageParams.get("pagina");
const hasSavedProfile = typeof savedProfileSettings.name === "string" &&
    Boolean(savedProfileSettings.name.trim()) &&
    typeof savedProfileSettings.email === "string" &&
    Boolean(savedProfileSettings.email.trim());
const isSignupDialogOpen = requestedPage === "cadastro" && hasSavedProfile;
const currentPage = isSignupDialogOpen
    ? "inicio"
    : (!hasSavedProfile && requestedPage !== "acesso" ? "acesso" : requestedPage || "inicio");
const page = pages[currentPage];
const createTeamButton = document.querySelector("#createTeamButton");

document.body.classList.toggle("auth-screen", currentPage === "acesso");

if (createTeamButton && currentPage === "empresa") {
    createTeamButton.hidden = true;
}

if (createTeamButton && currentPage !== "inicio") {
    createTeamButton.lastChild.textContent = currentPage === "dono" ? " Criar mensagem" : " Criar equipe";
}

if (page) {
    pageTitle.textContent = page.title;
    pageEyebrow.textContent = page.eyebrow;
    pageContent.innerHTML = page.content;
    document.title = `${page.title} | Black Lime`;
}

if (isSignupDialogOpen) {
    const signupDialog = document.createElement("dialog");
    signupDialog.className = "signup-dialog";
    signupDialog.setAttribute("aria-labelledby", "signupTitle");
    signupDialog.innerHTML = pages.cadastro.content;
    document.body.append(signupDialog);

    signupDialog.addEventListener("close", () => {
        const url = new URL(window.location.href);
        url.searchParams.delete("pagina");
        window.history.replaceState(window.history.state, "", url);
    });
    signupDialog.addEventListener("click", (event) => {
        if (event.target === signupDialog) {
            signupDialog.close();
        }
    });
    document.querySelector("#closeSignupDialog").addEventListener("click", () => signupDialog.close());
    signupDialog.showModal();
    document.querySelector("#signupName").focus();
}

const profilePageName = document.querySelector("#profilePageName");
if (profilePageName) {
    const profilePageStatus = document.querySelector("#profilePageStatus");
    if (profileSettingsError) {
        profilePageStatus.textContent = "Não foi possível carregar os dados do perfil.";
    } else {
        const name = typeof savedProfileSettings.name === "string" && savedProfileSettings.name.trim()
            ? savedProfileSettings.name.trim()
            : "Nohan Silva";
        const email = typeof savedProfileSettings.email === "string" && savedProfileSettings.email.trim()
            ? savedProfileSettings.email.trim()
            : "nohan@example.com";
        const role = typeof savedProfileSettings.position === "string" && savedProfileSettings.position.trim()
            ? savedProfileSettings.position.trim()
            : DEFAULT_PROFILE_ROLE;
        const initials = name.split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase() || "NS";

        profilePageName.textContent = name;
        document.querySelector("#profilePageEmail").textContent = email;
        document.querySelector("#profilePageAvatar").textContent = initials;
        document.querySelector("#profilePageRole").textContent = role;
        document.querySelector("#profileDetailName").textContent = name;
        document.querySelector("#profileDetailEmail").textContent = email;
        document.querySelector("#profileOwnerLink").hidden = role !== "Dono";
    }
}

const profileThemeToggle = document.querySelector("#profileThemeToggle");
if (profileThemeToggle) {
    applyTheme(savedTheme);
    profileThemeToggle.addEventListener("click", () => {
        const nextTheme = document.body.dataset.theme === "light" ? "dark" : "light";
        applyTheme(nextTheme);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        } catch (error) {
            console.error("Falha ao salvar o tema.", error);
        }
    });
}

const ownerPageGreeting = document.querySelector("#ownerPageGreeting");
if (ownerPageGreeting) {
    if (profileSettingsError) {
        pageContent.innerHTML = '<section class="panel owner-access-denied"><p>Não foi possível verificar o cargo do perfil.</p></section>';
    } else {
        const role = typeof savedProfileSettings.position === "string" && savedProfileSettings.position.trim()
            ? savedProfileSettings.position.trim()
            : DEFAULT_PROFILE_ROLE;
        if (role !== "Dono") {
            pageTitle.textContent = "Acesso restrito";
            pageEyebrow.textContent = "ÁREA EXCLUSIVA";
            pageContent.innerHTML = '<section class="panel owner-access-denied"><p>Esta página está disponível apenas para o cargo Dono.</p><a class="secondary-button" href="index.html?pagina=configuracoes">Alterar cargo nas configurações</a></section>';
            document.title = "Acesso restrito | Black Lime";
        } else {
            const name = typeof savedProfileSettings.name === "string" && savedProfileSettings.name.trim()
                ? savedProfileSettings.name.trim()
                : "Nohan Silva";
            ownerPageGreeting.textContent = `Olá, ${name}!`;
        }
    }
}

const ownerModerationList = document.querySelector("#ownerModerationList");
if (ownerModerationList) {
    const ownerModerationStatus = document.querySelector("#ownerModerationStatus");
    const conversationsKey = "blacklime-team-conversations";

    function renderOwnerModeration() {
        ownerModerationList.replaceChildren();

        try {
            const teams = JSON.parse(localStorage.getItem("blacklime-teams") || "[]");
            const conversations = JSON.parse(localStorage.getItem(conversationsKey) || "{}");
            if (
                !Array.isArray(teams) ||
                teams.some((team) => !team || typeof team.name !== "string") ||
                !conversations ||
                typeof conversations !== "object" ||
                Array.isArray(conversations)
            ) {
                throw new Error("Os dados das conversas estão em um formato inválido.");
            }

            let messageCount = 0;
            let conversationsChanged = false;
            teams.forEach((team) => {
                const teamMessages = conversations[team.name] === undefined ? [] : conversations[team.name];
                const preparedMessages = prepareExpiringMessages(teamMessages);
                if (preparedMessages.changed) {
                    conversations[team.name] = preparedMessages.messages;
                    conversationsChanged = true;
                }

                preparedMessages.messages.forEach((message, messageIndex) => {
                    messageCount += 1;
                    const item = document.createElement("article");
                    item.className = "owner-moderation-message";

                    const details = document.createElement("div");
                    const teamName = document.createElement("p");
                    teamName.className = "owner-moderation-team";
                    teamName.textContent = team.name;

                    const text = document.createElement("p");
                    text.className = "owner-moderation-text";
                    text.textContent = message.text;

                    const deleteButton = document.createElement("button");
                    deleteButton.className = "team-delete-button";
                    deleteButton.type = "button";
                    deleteButton.textContent = "Excluir";
                    deleteButton.setAttribute("aria-label", `Excluir mensagem da equipe ${team.name}`);
                    deleteButton.addEventListener("click", () => {
                        if (!window.confirm(`Tem certeza que deseja excluir esta mensagem da equipe "${team.name}"?`)) {
                            return;
                        }

                        try {
                            const latestConversations = JSON.parse(localStorage.getItem(conversationsKey) || "{}");
                            if (
                                !latestConversations ||
                                typeof latestConversations !== "object" ||
                                Array.isArray(latestConversations) ||
                                !Array.isArray(latestConversations[team.name]) ||
                                messageIndex >= latestConversations[team.name].length
                            ) {
                                throw new Error("A mensagem não está mais disponível para exclusão.");
                            }

                            latestConversations[team.name] = latestConversations[team.name]
                                .filter((_, index) => index !== messageIndex);
                            localStorage.setItem(conversationsKey, JSON.stringify(latestConversations));
                            renderOwnerModeration();
                            ownerModerationStatus.textContent = "Mensagem excluída.";
                        } catch (error) {
                            ownerModerationStatus.textContent = "Não foi possível excluir esta mensagem.";
                            console.error("Falha ao excluir uma mensagem pela Área do Dono.", error);
                        }
                    });

                    details.append(teamName, text);
                    item.append(details, deleteButton);
                    ownerModerationList.append(item);
                });
            });

            if (conversationsChanged) {
                localStorage.setItem(conversationsKey, JSON.stringify(conversations));
            }

            if (messageCount === 0) {
                ownerModerationStatus.textContent = "Não há mensagens de equipes para excluir.";
            } else {
                ownerModerationStatus.textContent = "";
            }
        } catch (error) {
            ownerModerationStatus.textContent = "Não foi possível carregar as mensagens das equipes.";
            console.error("Falha ao carregar mensagens para moderação.", error);
        }
    }

    renderOwnerModeration();
}

document.querySelectorAll(".navigation .nav-item").forEach((item) => {
    if (item.dataset.page === currentPage) {
        item.classList.add("active");
        item.setAttribute("aria-current", "page");
    }
});

const settingsForm = document.querySelector(".settings-form");

const signupForm = document.querySelector(".signup-form");
if (signupForm) {
    const signupStatus = document.querySelector("#signupStatus");
    const signupSubmit = signupForm.querySelector('button[type="submit"]');

    signupForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(signupForm);
        const settings = {
            name: formData.get("name").trim(),
            email: formData.get("email").trim(),
            position: "Colaborador"
        };

        try {
            localStorage.setItem("blacklime-settings", JSON.stringify(settings));
            updateSidebarProfile(settings.name, settings.position);
            signupStatus.textContent = "Perfil criado neste navegador. Você já pode acessar o painel.";
            signupSubmit.textContent = "Perfil criado";
            signupSubmit.disabled = true;
            signupForm.querySelectorAll("input, select").forEach((field) => {
                field.disabled = true;
            });
        } catch (error) {
            signupStatus.textContent = "Não foi possível salvar seu perfil neste navegador.";
            console.error("Falha ao criar o perfil.", error);
        }
    });
}

const authSignupForm = document.querySelector("#authSignupForm");
if (authSignupForm) {
    const authSignupStatus = document.querySelector("#authSignupStatus");
    const authLoginForm = document.querySelector("#authLoginForm");
    const authLoginStatus = document.querySelector("#authLoginStatus");
    const authTabs = document.querySelectorAll(".auth-tab");

    authTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const showSignup = tab.dataset.authMode === "signup";
            authSignupForm.hidden = !showSignup;
            authLoginForm.hidden = showSignup;
            authTabs.forEach((authTab) => {
                const isActive = authTab === tab;
                authTab.classList.toggle("active", isActive);
                authTab.setAttribute("aria-pressed", String(isActive));
            });
            (showSignup ? authSignupForm : authLoginForm).querySelector("input").focus();
        });
    });

    authSignupForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(authSignupForm);
        const name = String(formData.get("name") || "").trim();
        const email = String(formData.get("email") || "").trim();
        if (!name || !email) {
            authSignupStatus.textContent = "Informe seu nome e e-mail para continuar.";
            return;
        }

        const settings = { name, email, position: "Colaborador" };
        try {
            localStorage.setItem("blacklime-settings", JSON.stringify(settings));
            window.location.href = "index.html";
        } catch (error) {
            authSignupStatus.textContent = "Não foi possível salvar seu perfil neste navegador.";
            console.error("Falha ao criar o perfil.", error);
        }
    });

    authLoginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const email = String(new FormData(authLoginForm).get("email") || "").trim();
        const savedEmail = typeof savedProfileSettings.email === "string"
            ? savedProfileSettings.email.trim()
            : "";
        if (!savedEmail || email.toLocaleLowerCase("pt-BR") !== savedEmail.toLocaleLowerCase("pt-BR")) {
            authLoginStatus.textContent = "Não encontramos esse perfil neste navegador. Crie uma conta para continuar.";
            return;
        }

        window.location.href = "index.html";
    });
}

const teamForm = document.querySelector(".team-form");

if (teamForm) {
    const friendSelectionList = document.querySelector("#teamFriendList");
    const toggleTeamFriendsButton = document.querySelector("#toggleTeamFriends");
    const teamStatus = teamForm.querySelector(".team-form-status");
    const teamList = document.querySelector("#createdTeams");
    const teamListTitle = document.querySelector("#teamListTitle");
    const submitButton = teamForm.querySelector(".team-submit");
    const creationPanel = document.querySelector("#teamCreationPanel");
    const showTeamFormButton = document.querySelector("#showTeamForm");
    const teamCreatorNameElement = document.querySelector("#teamCreatorName");
    const teamCreatorAvatar = document.querySelector("#teamCreatorAvatar");
    const creatorName = typeof savedProfileSettings.name === "string" && savedProfileSettings.name.trim()
        ? savedProfileSettings.name.trim()
        : "Nohan Silva";
    const creatorInitials = creatorName.split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();
    let teams = [];
    let storageAvailable = true;

    teamCreatorNameElement.textContent = creatorName;
    teamCreatorAvatar.textContent = creatorInitials;

    function setCreationFormVisible(visible) {
        creationPanel.hidden = !visible;
        showTeamFormButton.hidden = visible;
        if (visible) {
            populateFriendSelection();
            friendSelectionList.hidden = true;
            toggleTeamFriendsButton.setAttribute("aria-expanded", "false");
        } else {
            friendSelectionList.hidden = true;
            toggleTeamFriendsButton.setAttribute("aria-expanded", "false");
            toggleTeamFriendsButton.querySelector('[aria-hidden="true"]').textContent = "⌄";
        }
    }

    function getMembers() {
        return Array.from(new Set(
            Array.from(friendSelectionList.querySelectorAll('input[type="checkbox"]:checked'))
                .map((checkbox) => checkbox.value.trim())
                .filter(Boolean)
        ));
    }

    function getFriendDirectory() {
        try {
            const friends = JSON.parse(localStorage.getItem("blacklime-company-friend-list") || "[]");
            return Array.isArray(friends)
                ? friends.filter((friend) => friend && typeof friend.name === "string" && typeof friend.email === "string")
                : [];
        } catch (error) {
            return [];
        }
    }

    function populateFriendSelection() {
        friendSelectionList.replaceChildren();
        getFriendDirectory().forEach((friend) => {
            const label = document.createElement("label");
            label.className = "friend-selection-option";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = "teamMembers";
            checkbox.value = friend.name;

            const copy = document.createElement("span");
            copy.textContent = friend.name;
            label.append(checkbox, copy);
            friendSelectionList.append(label);
        });

        if (getFriendDirectory().length === 0) {
            const empty = document.createElement("p");
            empty.className = "friend-selection-empty";
            empty.textContent = "Nenhuma amizade cadastrada.";
            friendSelectionList.append(empty);
        }
        updateFriendButton();
    }

    function updateFriendButton() {
        const count = getMembers().length;
        toggleTeamFriendsButton.querySelector("span").textContent = count
            ? `${count} amizade${count === 1 ? "" : "s"} selecionada${count === 1 ? "" : "s"}`
            : "Selecionar amizades";
    }

    function renderTeams() {
        teamList.replaceChildren();
        teamListTitle.textContent = `Equipes criadas (${teams.length})`;

        teams.forEach((team, index) => {
            const card = document.createElement("article");
            card.className = "panel created-team-card";

            const top = document.createElement("div");
            top.className = "created-team-top";
            const name = document.createElement("h3");
            name.textContent = team.name;
            const actions = document.createElement("div");
            actions.className = "created-team-actions";
            const label = document.createElement("span");
            label.className = "project-status";
            label.textContent = "Ativa";
            const deleteButton = document.createElement("button");
            deleteButton.className = "team-delete-button";
            deleteButton.type = "button";
            deleteButton.textContent = "Excluir";
            deleteButton.setAttribute("aria-label", `Excluir equipe ${team.name}`);
            deleteButton.addEventListener("click", () => {
                if (!window.confirm(`Tem certeza que deseja excluir a equipe "${team.name}"?`)) {
                    return;
                }

                const remainingTeams = teams.filter((_, teamIndex) => teamIndex !== index);
                try {
                    localStorage.setItem("blacklime-teams", JSON.stringify(remainingTeams));
                } catch (error) {
                    teamStatus.textContent = `Não foi possível excluir a equipe ${team.name}.`;
                    console.error("Falha ao excluir a equipe.", error);
                    return;
                }

                teams = remainingTeams;
                renderTeams();
                teamStatus.textContent = `Equipe ${team.name} excluída.`;
            });
            actions.append(label, deleteButton);
            top.append(name, actions);

            const leader = document.createElement("p");
            leader.className = "team-leader";
            leader.textContent = `Líder: ${team.leader}`;

            const members = document.createElement("p");
            members.className = "team-members";
            members.textContent = `${team.members.length} integrante${team.members.length === 1 ? "" : "s"}: ${team.members.join(", ")}`;

            const conversationLink = document.createElement("a");
            conversationLink.className = "team-chat-link";
            conversationLink.href = `index.html?pagina=mensagens&conversa=${encodeURIComponent(team.name)}`;
            conversationLink.textContent = "Abrir conversa";

            card.append(top, leader, members, conversationLink);
            teamList.append(card);
        });
    }

    try {
        const savedTeams = JSON.parse(localStorage.getItem("blacklime-teams") || "[]");
        if (!Array.isArray(savedTeams) || savedTeams.some((team) =>
            !team ||
            typeof team.name !== "string" ||
            typeof team.leader !== "string" ||
            !Array.isArray(team.members) ||
            !team.members.every((member) => typeof member === "string") ||
            !team.members.includes(team.leader)
        )) {
            throw new Error("Os dados salvos das equipes estão em um formato inválido.");
        }
        teams = savedTeams;
        renderTeams();
        setCreationFormVisible(teams.length === 0);
        if (new URLSearchParams(window.location.search).get("acao") === "criar") {
            setCreationFormVisible(true);
        }
    } catch (error) {
        storageAvailable = false;
        submitButton.disabled = true;
        teamStatus.textContent = "Não foi possível carregar as equipes salvas neste navegador.";
        console.error("Falha ao carregar as equipes.", error);
    }

    showTeamFormButton.addEventListener("click", () => {
        setCreationFormVisible(true);
        teamStatus.textContent = "";
        teamForm.elements.teamName.focus();
    });

    document.querySelector("#closeTeamForm").addEventListener("click", () => {
        setCreationFormVisible(false);
        showTeamFormButton.focus();
    });

    toggleTeamFriendsButton.addEventListener("click", () => {
        friendSelectionList.hidden = !friendSelectionList.hidden;
        toggleTeamFriendsButton.setAttribute("aria-expanded", String(!friendSelectionList.hidden));
        toggleTeamFriendsButton.querySelector('[aria-hidden="true"]').textContent =
            friendSelectionList.hidden ? "⌄" : "⌃";
    });

    populateFriendSelection();
    friendSelectionList.addEventListener("change", updateFriendButton);

    teamForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!storageAvailable) {
            return;
        }

        const name = teamForm.elements.teamName.value.trim();
        const selectedFriends = getMembers();
        const members = Array.from(new Set([creatorName, ...selectedFriends]));
        const leader = creatorName;

        if (!name || selectedFriends.length === 0) {
            teamStatus.textContent = "Informe o nome da equipe e selecione pelo menos uma amizade.";
            return;
        }

        if (teams.some((team) => team.name.localeCompare(name, "pt-BR", { sensitivity: "base" }) === 0)) {
            teamStatus.textContent = "Já existe uma equipe com esse nome.";
            return;
        }

        const team = { name, members, leader };
        try {
            localStorage.setItem("blacklime-teams", JSON.stringify([...teams, team]));
        } catch (error) {
            teamStatus.textContent = "Não foi possível salvar a equipe neste navegador.";
            console.error("Falha ao salvar a equipe.", error);
            return;
        }

        teams.push(team);
        renderTeams();
        setCreationFormVisible(false);
        teamStatus.textContent = `Equipe ${name} criada e direcionada para ${leader}.`;
        teamForm.elements.teamName.value = "";
        friendSelectionList.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
            checkbox.checked = false;
        });
        updateFriendButton();
    });
}

const friendsGrid = document.querySelector("#companyFriendsGrid");

if (friendsGrid) {
    const friendsStatus = document.querySelector("#companyFriendsStatus");
    const addFriendButton = document.querySelector("#addFriendButton");
    const closeFriendFormButton = document.querySelector("#closeFriendForm");
    const friendFormPanel = document.querySelector("#friendFormPanel");
    const friendForm = document.querySelector(".friend-form");
    const friendSubmitButton = friendForm.querySelector('button[type="submit"]');
    const friendsStorageKey = "blacklime-company-friend-list";
    const defaultFriends = [];
    const removedFriendNames = new Set(["Nohan Silva", "Marina Costa", "João Pedro", "Ana Clara"]);
    const isRemovedFriend = (friend) => removedFriendNames.has(friend.name);
    let companyFriends = [...defaultFriends];
    let friendsStorageAvailable = true;

    function renderCompanyFriends() {
        friendsGrid.replaceChildren();

        companyFriends.forEach((friend, index) => {
            const card = document.createElement("article");
            card.className = "panel team-card company-friend-card";

            const avatar = document.createElement("div");
            avatar.className = "avatar added-friend-avatar";
            avatar.setAttribute("aria-hidden", "true");
            avatar.textContent = friend.name
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part.charAt(0).toUpperCase())
                .join("");

            const details = document.createElement("div");
            const name = document.createElement("h2");
            name.textContent = friend.name;
            const role = document.createElement("p");
            role.textContent = friend.role;
            details.append(name, role);
            if (friend.email) {
                const email = document.createElement("p");
                email.className = "company-friend-email";
                email.textContent = friend.email;
                details.append(email);
            }

            const deleteButton = document.createElement("button");
            deleteButton.className = "team-delete-button";
            deleteButton.type = "button";
            deleteButton.textContent = "Excluir";
            deleteButton.setAttribute("aria-label", `Excluir amizade de ${friend.name}`);
            deleteButton.disabled = !friendsStorageAvailable;
            deleteButton.addEventListener("click", () => {
                if (!window.confirm(`Remover ${friend.name} das amizades da empresa?`)) {
                    return;
                }

                const remainingFriends = companyFriends.filter((_, friendIndex) => friendIndex !== index);
                try {
                    localStorage.setItem(friendsStorageKey, JSON.stringify(remainingFriends));
                } catch (error) {
                    friendsStatus.textContent = `Não foi possível remover ${friend.name}.`;
                    console.error("Falha ao excluir uma amizade da empresa.", error);
                    return;
                }

                companyFriends = remainingFriends;
                renderCompanyFriends();
                friendsStatus.textContent = `${friend.name} foi removido(a) das amizades da empresa.`;
            });
            card.append(avatar, details, deleteButton);
            friendsGrid.append(card);
        });
    }

    try {
        const savedFriendList = localStorage.getItem(friendsStorageKey);
        if (savedFriendList !== null) {
            const parsedFriends = JSON.parse(savedFriendList);
            if (!Array.isArray(parsedFriends) || parsedFriends.some((friend) =>
                !friend || typeof friend.name !== "string" || typeof friend.role !== "string"
            )) {
                throw new Error("Os dados salvos das amizades estão em um formato inválido.");
            }
            companyFriends = parsedFriends.filter((friend) => !isRemovedFriend(friend));
            localStorage.setItem(friendsStorageKey, JSON.stringify(companyFriends));
        } else {
            const legacyFriends = JSON.parse(localStorage.getItem("blacklime-company-friends") || "[]");
            if (!Array.isArray(legacyFriends) || legacyFriends.some((friend) =>
                !friend || typeof friend.name !== "string" || typeof friend.role !== "string"
            )) {
                throw new Error("Os dados antigos das amizades estão em um formato inválido.");
            }

            companyFriends = [...defaultFriends];
            legacyFriends.forEach((friend) => {
                if (isRemovedFriend(friend)) {
                    return;
                }
                const exists = companyFriends.some((savedFriend) =>
                    savedFriend.name.localeCompare(friend.name, "pt-BR", { sensitivity: "base" }) === 0
                );
                if (!exists) {
                    companyFriends.push(friend);
                }
            });
            localStorage.setItem(friendsStorageKey, JSON.stringify(companyFriends));
        }
    } catch (error) {
        friendsStorageAvailable = false;
        friendSubmitButton.disabled = true;
        friendsStatus.textContent = "Não foi possível carregar as amizades salvas neste navegador.";
        console.error("Falha ao carregar as amizades da empresa.", error);
    }

    renderCompanyFriends();

    addFriendButton.addEventListener("click", () => {
        friendFormPanel.hidden = false;
        friendsStatus.textContent = "";
        friendForm.elements.friendName.focus();
    });

    closeFriendFormButton.addEventListener("click", () => {
        friendFormPanel.hidden = true;
        addFriendButton.focus();
    });

    friendForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!friendsStorageAvailable) {
            return;
        }

        const name = friendForm.elements.friendName.value.trim();
        const role = friendForm.elements.friendRole.value.trim();
        const email = friendForm.elements.friendEmail.value.trim();
        if (!name || !role || !email) {
            friendsStatus.textContent = "Informe o nome, o cargo ou área e o e-mail da pessoa.";
            return;
        }

        if (companyFriends.some((friend) =>
            friend.name.localeCompare(name, "pt-BR", { sensitivity: "base" }) === 0
        )) {
            friendsStatus.textContent = "Essa pessoa já está na lista de amizades da empresa.";
            return;
        }

        const friend = { name, role, email };
        try {
            localStorage.setItem(friendsStorageKey, JSON.stringify([...companyFriends, friend]));
        } catch (error) {
            friendsStatus.textContent = "Não foi possível salvar essa amizade neste navegador.";
            console.error("Falha ao adicionar uma amizade da empresa.", error);
            return;
        }

        companyFriends.push(friend);
        renderCompanyFriends();
        friendForm.reset();
        friendFormPanel.hidden = true;
        friendsStatus.textContent = `${name} foi adicionado(a) às amizades da empresa.`;
        addFriendButton.focus();
    });
}

const ownerMessageForm = document.querySelector("#ownerMessageForm");

if (ownerMessageForm) {
    const ownerMessagePanel = document.querySelector("#ownerMessageFormPanel");
    const ownerMessageText = ownerMessageForm.elements.message;
    const ownerMessageStatus = document.querySelector("#ownerMessageStatus");
    const ownerMessageList = document.querySelector("#ownerMessageList");
    const ownerMessageSubmit = ownerMessageForm.querySelector('button[type="submit"]');
    let ownerMessages = [];
    let messageStorageAvailable = true;
    let ownerMessageExpiryTimer;

    function renderOwnerMessages() {
        ownerMessageList.replaceChildren();

        ownerMessages.forEach((message, messageIndex) => {
            const card = document.createElement("article");
            card.className = "panel owner-message-card";

            const label = document.createElement("p");
            label.className = "panel-kicker";
            label.textContent = "MENSAGEM DO DONO";

            const text = document.createElement("p");
            text.className = "owner-message-text";
            text.textContent = message.text;

            const actions = document.createElement("details");
            actions.className = "message-actions-menu";

            const menuButton = document.createElement("summary");
            menuButton.className = "message-actions-button";
            menuButton.setAttribute("aria-label", "Opções da mensagem");
            menuButton.textContent = "•••";

            const menu = document.createElement("div");
            menu.className = "message-actions-options";

            const deleteButton = document.createElement("button");
            deleteButton.className = "owner-message-delete";
            deleteButton.type = "button";
            deleteButton.textContent = "Excluir";
            deleteButton.setAttribute("aria-label", "Excluir mensagem publicada");
            deleteButton.addEventListener("click", () => {
                ownerMessages = ownerMessages.filter((_, index) => index !== messageIndex);

                try {
                    localStorage.setItem("blacklime-owner-messages", JSON.stringify(ownerMessages));
                } catch (error) {
                    ownerMessageStatus.textContent = "Não foi possível excluir a mensagem.";
                    console.error("Falha ao excluir um comunicado do dono.", error);
                    return;
                }

                renderOwnerMessages();
                scheduleOwnerMessageExpiry();
                ownerMessageStatus.textContent = "Mensagem excluída.";
            });

            const editButton = document.createElement("button");
            editButton.className = "owner-message-delete";
            editButton.type = "button";
            editButton.textContent = "Editar";
            editButton.setAttribute("aria-label", "Editar mensagem publicada");
            editButton.addEventListener("click", () => {
                openMessageEditor(ownerMessages[messageIndex].text, (updatedText) => {
                    ownerMessages = ownerMessages.map((savedMessage, index) =>
                        index === messageIndex ? { ...savedMessage, text: updatedText } : savedMessage
                    );

                    try {
                        localStorage.setItem("blacklime-owner-messages", JSON.stringify(ownerMessages));
                    } catch (error) {
                        ownerMessageStatus.textContent = "Não foi possível editar a mensagem.";
                        console.error("Falha ao editar um comunicado do dono.", error);
                        return false;
                    }

                    renderOwnerMessages();
                    ownerMessageStatus.textContent = "Mensagem editada.";
                    return true;
                });
            });

            menu.append(deleteButton, editButton);

            actions.append(menuButton, menu);

            card.append(label, text, actions);
            ownerMessageList.append(card);
        });
    }

    function scheduleOwnerMessageExpiry() {
        window.clearTimeout(ownerMessageExpiryTimer);
        if (ownerMessages.length === 0) {
            return;
        }

        const nextExpiry = Math.min(...ownerMessages.map((message) => message.sentAt + MESSAGE_RETENTION_MS));
        ownerMessageExpiryTimer = window.setTimeout(() => {
            ownerMessages = ownerMessages.filter((message) => Date.now() - message.sentAt < MESSAGE_RETENTION_MS);
            renderOwnerMessages();

            try {
                localStorage.setItem("blacklime-owner-messages", JSON.stringify(ownerMessages));
            } catch (error) {
                messageStorageAvailable = false;
                ownerMessageSubmit.disabled = true;
                ownerMessageStatus.textContent = "Não foi possível atualizar as mensagens expiradas.";
                console.error("Falha ao remover comunicados expirados.", error);
            }

            scheduleOwnerMessageExpiry();
        }, Math.max(0, nextExpiry - Date.now()));
    }

    try {
        const savedMessages = JSON.parse(localStorage.getItem("blacklime-owner-messages") || "[]");
        const preparedMessages = prepareExpiringMessages(savedMessages);
        ownerMessages = preparedMessages.messages;
        if (preparedMessages.changed) {
            localStorage.setItem("blacklime-owner-messages", JSON.stringify(ownerMessages));
        }
        renderOwnerMessages();
        scheduleOwnerMessageExpiry();
    } catch (error) {
        messageStorageAvailable = false;
        ownerMessageSubmit.disabled = true;
        ownerMessageStatus.textContent = "Não foi possível carregar as mensagens salvas neste navegador.";
        console.error("Falha ao carregar os comunicados do dono.", error);
    }

    ownerMessageForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!messageStorageAvailable) {
            return;
        }

        const message = ownerMessageText.value.trim();
        if (!message) {
            ownerMessageStatus.textContent = "Escreva uma mensagem antes de publicar.";
            return;
        }

        ownerMessages = ownerMessages.filter((savedMessage) => Date.now() - savedMessage.sentAt < MESSAGE_RETENTION_MS);
        const newMessage = { text: message, sentAt: Date.now() };
        try {
            localStorage.setItem("blacklime-owner-messages", JSON.stringify([...ownerMessages, newMessage]));
        } catch (error) {
            ownerMessageStatus.textContent = "Não foi possível salvar a mensagem neste navegador.";
            console.error("Falha ao publicar um comunicado do dono.", error);
            return;
        }

        ownerMessages.push(newMessage);
        renderOwnerMessages();
        scheduleOwnerMessageExpiry();
        ownerMessageForm.reset();
        ownerMessagePanel.hidden = true;
        ownerMessageStatus.textContent = "Mensagem publicada.";
        createTeamButton.focus();
    });

    document.querySelector("#closeOwnerMessageForm").addEventListener("click", () => {
        ownerMessagePanel.hidden = true;
        createTeamButton.focus();
    });
}

if (currentPage === "inicio" && new URLSearchParams(window.location.search).get("acao") === "mensagem") {
    const ownerMessagePanel = document.querySelector("#ownerMessageFormPanel");
    const ownerMessageInput = document.querySelector("#ownerMessageText");
    if (ownerMessagePanel && ownerMessageInput) {
        ownerMessagePanel.hidden = false;
        ownerMessageInput.focus();
        ownerMessagePanel.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

const teamConversationList = document.querySelector("#teamConversationList");

if (teamConversationList) {
    const friendConversationList = document.querySelector("#friendConversationList");
    const listStatus = document.querySelector("#teamConversationListStatus");
    const friendListStatus = document.querySelector("#friendConversationListStatus");
    const chatArea = document.querySelector("#teamChatArea");
    const emptyChatPrompt = document.querySelector("#emptyChatPrompt");
    const chatTitle = document.querySelector("#teamConversationTitle");
    const chatMeta = document.querySelector("#teamConversationMeta");
    const chatMessages = document.querySelector("#teamChatMessages");
    const chatStatus = document.querySelector("#teamChatStatus");
    const chatForm = document.querySelector("#teamChatForm");
    const chatInput = chatForm.elements.message;
    let teams = [];
    let friends = [];
    let deleteChatMessage = () => {};
    let editChatMessage = () => {};
    const canDeleteChatMessages = !profileSettingsError &&
        (savedProfileSettings.position || DEFAULT_PROFILE_ROLE) === "Dono";

    function renderChatMessages(messages) {
        chatMessages.replaceChildren();
        messages.forEach((message, messageIndex) => {
            const bubble = document.createElement("article");
            bubble.className = "chat-message";

            const sender = document.createElement("span");
            sender.className = "chat-message-sender";
            sender.textContent = "Você";

            const text = document.createElement("p");
            text.className = "chat-message-text";
            text.textContent = message.text;

            bubble.append(sender, text);

            if (canDeleteChatMessages) {
                const actions = document.createElement("details");
                actions.className = "message-actions-menu";

                const menuButton = document.createElement("summary");
                menuButton.className = "message-actions-button";
                menuButton.setAttribute("aria-label", "Opções da mensagem");
                menuButton.textContent = "•••";

                const menu = document.createElement("div");
                menu.className = "message-actions-options";

                const deleteButton = document.createElement("button");
                deleteButton.className = "chat-message-delete";
                deleteButton.type = "button";
                deleteButton.textContent = "Excluir";
                deleteButton.setAttribute("aria-label", "Excluir esta mensagem");
                deleteButton.addEventListener("click", () => deleteChatMessage(messageIndex));

                const editButton = document.createElement("button");
                editButton.className = "chat-message-delete";
                editButton.type = "button";
                editButton.textContent = "Editar";
                editButton.setAttribute("aria-label", "Editar esta mensagem");
                editButton.addEventListener("click", () => editChatMessage(messageIndex));

                menu.append(deleteButton, editButton);

                actions.append(menuButton, menu);
                bubble.append(actions);
            }

            chatMessages.append(bubble);
        });
    }

    try {
        const savedTeams = JSON.parse(localStorage.getItem("blacklime-teams") || "[]");
        if (!Array.isArray(savedTeams) || savedTeams.some((team) =>
            !team ||
            typeof team.name !== "string" ||
            typeof team.leader !== "string" ||
            !Array.isArray(team.members) ||
            !team.members.every((member) => typeof member === "string")
        )) {
            throw new Error("Os dados salvos das equipes estão em um formato inválido.");
        }
        teams = savedTeams;
        if (teams.length === 0) {
            listStatus.textContent = "Nenhuma equipe cadastrada.";
        }

        const selectedConversation = new URLSearchParams(window.location.search);
        const selectedTeamName = selectedConversation.get("tipo") === "amizade"
            ? null
            : selectedConversation.get("conversa");
        teams.forEach((team) => {
            const link = document.createElement("a");
            link.className = "team-conversation-link";
            link.href = `index.html?pagina=mensagens&conversa=${encodeURIComponent(team.name)}`;
            link.textContent = team.name;
            link.setAttribute("aria-label", `Abrir conversa da equipe ${team.name}`);
            if (team.name === selectedTeamName) {
                link.setAttribute("aria-current", "page");
            }
            teamConversationList.append(link);
        });
    } catch (error) {
        listStatus.textContent = "Não foi possível carregar as equipes neste navegador.";
        console.error("Falha ao carregar as equipes para as conversas.", error);
    }

    try {
        const savedFriends = JSON.parse(localStorage.getItem("blacklime-company-friend-list") || "[]");
        if (!Array.isArray(savedFriends) || savedFriends.some((friend) =>
            !friend || typeof friend.name !== "string" || typeof friend.email !== "string"
        )) {
            throw new Error("Os dados salvos das amizades estão em um formato inválido.");
        }
        friends = savedFriends;
        if (friends.length === 0) {
            friendListStatus.textContent = "Nenhuma amizade cadastrada.";
        }
        friends.forEach((friend) => {
            const link = document.createElement("a");
            link.className = "team-conversation-link";
            link.href = `index.html?pagina=mensagens&tipo=amizade&conversa=${encodeURIComponent(friend.email)}`;
            link.textContent = friend.name;
            link.setAttribute("aria-label", `Abrir conversa com ${friend.name}`);
            if (
                new URLSearchParams(window.location.search).get("tipo") === "amizade" &&
                friend.email.localeCompare(new URLSearchParams(window.location.search).get("conversa") || "", "pt-BR", { sensitivity: "base" }) === 0
            ) {
                link.setAttribute("aria-current", "page");
            }
            friendConversationList.append(link);
        });
    } catch (error) {
        friendListStatus.textContent = "Não foi possível carregar as amizades neste navegador.";
        console.error("Falha ao carregar as amizades para as conversas.", error);
    }

    const conversationParams = new URLSearchParams(window.location.search);
    const selectedTeamName = conversationParams.get("tipo") === "amizade" ? null : conversationParams.get("conversa");
    const selectedTeam = teams.find((team) => team.name === selectedTeamName);
    const selectedFriend = conversationParams.get("tipo") === "amizade"
        ? friends.find((friend) =>
            friend.email.localeCompare(conversationParams.get("conversa") || "", "pt-BR", { sensitivity: "base" }) === 0
        )
        : null;

    if (selectedTeam || selectedFriend) {
        emptyChatPrompt.hidden = true;
        chatArea.hidden = false;
        const conversationId = selectedFriend ? selectedFriend.email.toLocaleLowerCase("pt-BR") : selectedTeam.name;
        const conversationStorageKey = selectedFriend
            ? "blacklime-friend-conversations"
            : "blacklime-team-conversations";
        chatTitle.textContent = selectedFriend ? selectedFriend.name : selectedTeam.name;
        chatMeta.textContent = selectedFriend
            ? `${selectedFriend.role || "Amizade"} · ${selectedFriend.email}`
            : `Líder: ${selectedTeam.leader} · ${selectedTeam.members.length} integrante${selectedTeam.members.length === 1 ? "" : "s"}`;
        let allConversations = {};
        let messages = [];
        let chatStorageAvailable = true;
        let chatExpiryTimer;

        function scheduleChatMessageExpiry() {
            window.clearTimeout(chatExpiryTimer);
            if (messages.length === 0) {
                return;
            }

            const nextExpiry = Math.min(...messages.map((message) => message.sentAt + MESSAGE_RETENTION_MS));
            chatExpiryTimer = window.setTimeout(() => {
                messages = messages.filter((message) => Date.now() - message.sentAt < MESSAGE_RETENTION_MS);
                allConversations = { ...allConversations, [conversationId]: messages };
                renderChatMessages(messages);

                try {
                    localStorage.setItem(conversationStorageKey, JSON.stringify(allConversations));
                } catch (error) {
                    chatStorageAvailable = false;
                    chatInput.disabled = true;
                    chatForm.querySelector('button[type="submit"]').disabled = true;
                    chatStatus.textContent = "Não foi possível atualizar as mensagens expiradas.";
                    console.error("Falha ao remover mensagens expiradas da conversa.", error);
                }

                scheduleChatMessageExpiry();
            }, Math.max(0, nextExpiry - Date.now()));
        }

        deleteChatMessage = (messageIndex) => {
            if (!chatStorageAvailable) {
                chatStatus.textContent = "Não é possível excluir mensagens neste navegador.";
                return;
            }

            const updatedMessages = messages.filter((_, index) => index !== messageIndex);
            const updatedConversations = { ...allConversations, [conversationId]: updatedMessages };
            try {
                localStorage.setItem(conversationStorageKey, JSON.stringify(updatedConversations));
            } catch (error) {
                chatStatus.textContent = "Não foi possível excluir a mensagem neste navegador.";
                console.error("Falha ao excluir uma mensagem da conversa.", error);
                return;
            }

            allConversations = updatedConversations;
            messages = updatedMessages;
            renderChatMessages(messages);
            scheduleChatMessageExpiry();
            chatStatus.textContent = "Mensagem excluída.";
        };

        editChatMessage = (messageIndex) => {
            if (!chatStorageAvailable) {
                chatStatus.textContent = "Não é possível editar mensagens neste navegador.";
                return;
            }

            openMessageEditor(messages[messageIndex].text, (updatedText) => {
                const updatedMessages = messages.map((savedMessage, index) =>
                    index === messageIndex ? { ...savedMessage, text: updatedText } : savedMessage
                );
                const updatedConversations = { ...allConversations, [conversationId]: updatedMessages };
                try {
                    localStorage.setItem(conversationStorageKey, JSON.stringify(updatedConversations));
                } catch (error) {
                    chatStatus.textContent = "Não foi possível editar a mensagem neste navegador.";
                    console.error("Falha ao editar uma mensagem da conversa.", error);
                    return false;
                }

                allConversations = updatedConversations;
                messages = updatedMessages;
                renderChatMessages(messages);
                chatStatus.textContent = "Mensagem editada.";
                return true;
            });
        };

        try {
            allConversations = JSON.parse(localStorage.getItem(conversationStorageKey) || "{}");
            if (!allConversations || typeof allConversations !== "object" || Array.isArray(allConversations)) {
                throw new Error("As conversas salvas estão em um formato inválido.");
            }
            const savedConversationMessages = allConversations[conversationId];
            const preparedMessages = prepareExpiringMessages(savedConversationMessages === undefined ? [] : savedConversationMessages);
            messages = preparedMessages.messages;
            allConversations = { ...allConversations, [conversationId]: messages };
            if (preparedMessages.changed) {
                localStorage.setItem(conversationStorageKey, JSON.stringify(allConversations));
            }
            renderChatMessages(messages);
            scheduleChatMessageExpiry();
        } catch (error) {
            chatStorageAvailable = false;
            chatInput.disabled = true;
            chatForm.querySelector('button[type="submit"]').disabled = true;
            chatStatus.textContent = "Não foi possível carregar as mensagens salvas neste navegador.";
            console.error("Falha ao carregar a conversa da equipe.", error);
        }

        chatForm.addEventListener("submit", (event) => {
            event.preventDefault();
            if (!chatStorageAvailable) {
                return;
            }

            const message = chatInput.value.trim();
            if (!message) {
                return;
            }

            const retainedMessages = messages.filter((savedMessage) => Date.now() - savedMessage.sentAt < MESSAGE_RETENTION_MS);
            const updatedMessages = [...retainedMessages, { text: message, sentAt: Date.now() }];
            const updatedConversations = { ...allConversations, [conversationId]: updatedMessages };
            try {
                localStorage.setItem(conversationStorageKey, JSON.stringify(updatedConversations));
            } catch (error) {
                chatStatus.textContent = "Não foi possível enviar a mensagem neste navegador.";
                console.error("Falha ao enviar mensagem na conversa da equipe.", error);
                return;
            }

            allConversations = updatedConversations;
            messages = updatedMessages;
            renderChatMessages(messages);
            scheduleChatMessageExpiry();
            chatStatus.textContent = "";
            chatForm.reset();
            chatInput.focus();
        });
    } else if (conversationParams.get("conversa")) {
        emptyChatPrompt.textContent = conversationParams.get("tipo") === "amizade"
            ? "Essa amizade não foi encontrada. Confira a lista de amizades e tente novamente."
            : "Essa equipe não foi encontrada. Volte à página Equipe e tente novamente.";
    }
}

if (settingsForm) {
    const status = settingsForm.querySelector(".form-status");
    const fields = Array.from(settingsForm.querySelectorAll("[name]"));

    try {
        const savedSettings = JSON.parse(localStorage.getItem("blacklime-settings") || "{}");
        fields.forEach((field) => {
            if (savedSettings[field.name]) {
                field.value = savedSettings[field.name];
            }
        });
    } catch (error) {
        status.textContent = "Não foi possível carregar as configurações salvas.";
        console.error("Falha ao carregar as configurações do perfil.", error);
    }

    settingsForm.addEventListener("submit", (event) => {
        event.preventDefault();

        try {
            const settings = {
                ...savedProfileSettings,
                ...Object.fromEntries(new FormData(settingsForm))
            };
            localStorage.setItem("blacklime-settings", JSON.stringify(settings));
            updateSidebarProfile(settings.name, settings.position);
            status.textContent = "Alterações salvas neste navegador.";
        } catch (error) {
            status.textContent = "Não foi possível salvar as alterações neste navegador.";
            console.error("Falha ao salvar as configurações do perfil.", error);
        }
    });
}

if (menuButton && sidebar && sidebarOverlay) {
    menuButton.addEventListener("click", () => {
        setSidebar(!sidebar.classList.contains("open"));
    });

    sidebarOverlay.addEventListener("click", () => setSidebar(false));
}

function updateSidebarCollapseButton() {
    if (!sidebarCollapseButton || !sidebarCollapseIcon) {
        return;
    }

    const isMobile = window.innerWidth <= 760;
    const isCollapsed = document.body.classList.contains("sidebar-collapsed");

    if (isMobile) {
        sidebarCollapseIcon.textContent = "\u00d7";
        sidebarCollapseButton.setAttribute("aria-label", "Fechar barra lateral");
        sidebarCollapseButton.setAttribute("aria-expanded", String(Boolean(sidebar && sidebar.classList.contains("open"))));
        sidebarCollapseButton.title = "Fechar barra lateral";
        return;
    }

    sidebarCollapseIcon.textContent = isCollapsed ? "\u203a" : "\u00d7";
    sidebarCollapseButton.setAttribute("aria-label", isCollapsed ? "Expandir barra lateral" : "Minimizar barra lateral");
    sidebarCollapseButton.setAttribute("aria-expanded", String(!isCollapsed));
    sidebarCollapseButton.title = isCollapsed ? "Expandir barra lateral" : "Minimizar barra lateral";
}

if (sidebarCollapseButton) {
    sidebarCollapseButton.addEventListener("click", () => {
        if (window.innerWidth <= 760) {
            setSidebar(false);
            return;
        }

        document.body.classList.toggle("sidebar-collapsed");
        updateSidebarCollapseButton();
    });

    window.addEventListener("resize", updateSidebarCollapseButton);
    updateSidebarCollapseButton();
}

function setSidebar(open) {
    if (!sidebar || !sidebarOverlay || !menuButton) {
        return;
    }

    sidebar.classList.toggle("open", open);
    sidebarOverlay.classList.toggle("open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    updateSidebarCollapseButton();
}

createTeamButton?.addEventListener("click", () => {
    if (currentPage === "inicio" && ownerMessageForm) {
        const ownerMessagePanel = document.querySelector("#ownerMessageFormPanel");
        ownerMessagePanel.hidden = false;
        ownerMessageStatus.textContent = "";
        document.querySelector("#ownerMessageText").focus();
        ownerMessagePanel.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }

    if (currentPage === "dono") {
        window.location.href = "index.html?acao=mensagem";
        return;
    }

    if (teamForm && currentPage === "equipe") {
        const creationPanel = document.querySelector("#teamCreationPanel");
        if (creationPanel.hidden) {
            document.querySelector("#showTeamForm").click();
        }
        teamForm.elements.teamName.focus();
        creationPanel.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }

    window.location.href = "index.html?pagina=equipe&acao=criar";
});