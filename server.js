const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "data", "blacklime.json");
const RETENTION_MS = 24 * 60 * 60 * 1000;
const subscribers = new Map();
const ownerSubscribers = new Set();

fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
let database = { conversations: {}, ownerMessages: [] };

try {
  if (fs.existsSync(DATA_FILE)) {
    database = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    if (!database.conversations) database.conversations = {};
    if (!Array.isArray(database.ownerMessages)) database.ownerMessages = [];
  }
} catch (error) {
  console.error("Não foi possível carregar os dados.", error);
}

function saveDatabase() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(database, null, 2), "utf8");
}

function pruneMessages(messages) {
  if (!Array.isArray(messages)) return [];
  const now = Date.now();
  return messages.filter((message) =>
    message &&
    typeof message.text === "string" &&
    Number.isFinite(message.sentAt) &&
    now - message.sentAt < RETENTION_MS
  );
}

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(value));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Corpo da requisição muito grande."));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function notify(conversationId) {
  const message = `data: ${JSON.stringify({ conversationId, messages: database.conversations[conversationId] || [] })}\n\n`;
  for (const subscriber of subscribers.values()) {
    if (subscriber.conversationId === conversationId) {
      subscriber.write(message);
    }
  }
}

function notifyOwnerMessages() {
  const message = `data: ${JSON.stringify({ messages: database.ownerMessages })}\n\n`;
  for (const subscriber of ownerSubscribers) {
    subscriber.write(message);
  }
}

function conversationIdFromRequest(url) {
  const match = url.pathname.match(/^\/api\/conversations\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.resolve(ROOT, `.${requestedPath}`);
  if (!filePath.startsWith(ROOT + path.sep)) {
    sendJson(response, 403, { error: "Acesso negado." });
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(response, 404, { error: "Arquivo não encontrado." });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const types = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8"
    };
    response.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
    response.end(content);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (url.pathname === "/api/events") {
    const conversationId = url.searchParams.get("conversa");
    if (!conversationId) {
      sendJson(response, 400, { error: "Informe a conversa." });
      return;
    }
    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });
    response.write(": connected\n\n");
    const subscriberId = `${conversationId}:${Date.now()}:${Math.random()}`;
    subscribers.set(subscriberId, {
      conversationId,
      write: (message) => response.write(message)
    });
    response.on("close", () => {
      if (subscriberId) subscribers.delete(subscriberId);
    });
    return;
  }

  if (url.pathname === "/api/owner-events") {
    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });
    response.write(": connected\n\n");
    const subscriber = { write: (message) => response.write(message) };
    ownerSubscribers.add(subscriber);
    response.on("close", () => ownerSubscribers.delete(subscriber));
    return;
  }

  if (url.pathname === "/api/owner-messages") {
    database.ownerMessages = pruneMessages(database.ownerMessages);

    if (request.method === "GET") {
      sendJson(response, 200, { messages: database.ownerMessages });
      return;
    }

    if (request.method === "POST") {
      readJson(request).then((body) => {
        if (!body || typeof body.text !== "string" || !body.text.trim()) {
          sendJson(response, 400, { error: "Mensagem inválida." });
          return;
        }
        const message = { text: body.text.trim().slice(0, 500), sentAt: Date.now() };
        database.ownerMessages.push(message);
        saveDatabase();
        notifyOwnerMessages();
        sendJson(response, 201, { message });
      }).catch(() => sendJson(response, 400, { error: "Não foi possível publicar a mensagem." }));
      return;
    }

    if (request.method === "PUT") {
      readJson(request).then((body) => {
        if (!Number.isInteger(body.index) || typeof body.text !== "string" || !body.text.trim()) {
          sendJson(response, 400, { error: "Dados inválidos." });
          return;
        }
        if (!database.ownerMessages[body.index]) {
          sendJson(response, 404, { error: "Mensagem não encontrada." });
          return;
        }
        database.ownerMessages[body.index].text = body.text.trim().slice(0, 500);
        saveDatabase();
        notifyOwnerMessages();
        sendJson(response, 200, { message: database.ownerMessages[body.index] });
      }).catch(() => sendJson(response, 400, { error: "Não foi possível editar a mensagem." }));
      return;
    }

    if (request.method === "DELETE") {
      readJson(request).then((body) => {
        if (!Number.isInteger(body.index)) {
          sendJson(response, 400, { error: "Índice inválido." });
          return;
        }
        database.ownerMessages.splice(body.index, 1);
        saveDatabase();
        notifyOwnerMessages();
        sendJson(response, 200, { messages: database.ownerMessages });
      }).catch(() => sendJson(response, 400, { error: "Não foi possível excluir a mensagem." }));
      return;
    }

    sendJson(response, 405, { error: "Método não permitido." });
    return;
  }

  const conversationId = conversationIdFromRequest(url);
  if (conversationId) {
    if (!database.conversations) database.conversations = {};
    database.conversations[conversationId] = pruneMessages(database.conversations[conversationId]);

    if (request.method === "GET") {
      sendJson(response, 200, { messages: database.conversations[conversationId] || [] });
      return;
    }

    if (request.method === "POST") {
      try {
        const body = await readJson(request);
        if (!body || typeof body.text !== "string" || !body.text.trim()) {
          sendJson(response, 400, { error: "Mensagem inválida." });
          return;
        }
        const message = {
          text: body.text.trim().slice(0, 500),
          sender: typeof body.sender === "string" ? body.sender.trim().slice(0, 100) : "Usuário",
          sentAt: Date.now()
        };
        database.conversations[conversationId].push(message);
        saveDatabase();
        notify(conversationId);
        sendJson(response, 201, { message });
      } catch (error) {
        sendJson(response, 400, { error: "Não foi possível enviar a mensagem." });
      }
      return;
    }

    if (request.method === "PUT") {
      try {
        const body = await readJson(request);
        if (!Number.isInteger(body.index) || typeof body.text !== "string" || !body.text.trim()) {
          sendJson(response, 400, { error: "Dados inválidos." });
          return;
        }
        if (!database.conversations[conversationId][body.index]) {
          sendJson(response, 404, { error: "Mensagem não encontrada." });
          return;
        }
        database.conversations[conversationId][body.index].text = body.text.trim().slice(0, 500);
        saveDatabase();
        notify(conversationId);
        sendJson(response, 200, { message: database.conversations[conversationId][body.index] });
      } catch (error) {
        sendJson(response, 400, { error: "Não foi possível editar a mensagem." });
      }
      return;
    }

    if (request.method === "DELETE") {
      try {
        const body = await readJson(request);
        if (!Number.isInteger(body.index)) {
          sendJson(response, 400, { error: "Índice inválido." });
          return;
        }
        database.conversations[conversationId].splice(body.index, 1);
        saveDatabase();
        notify(conversationId);
        sendJson(response, 200, { messages: database.conversations[conversationId] });
      } catch (error) {
        sendJson(response, 400, { error: "Não foi possível excluir a mensagem." });
      }
      return;
    }

    sendJson(response, 405, { error: "Método não permitido." });
    return;
  }

  serveStatic(request, response);
});

setInterval(() => {
  let changed = false;
  for (const conversationId of Object.keys(database.conversations || {})) {
    const pruned = pruneMessages(database.conversations[conversationId]);
    if (pruned.length !== database.conversations[conversationId].length) {
      database.conversations[conversationId] = pruned;
      changed = true;
    }
  }
  const prunedOwnerMessages = pruneMessages(database.ownerMessages);
  if (prunedOwnerMessages.length !== database.ownerMessages.length) {
    database.ownerMessages = prunedOwnerMessages;
    changed = true;
  }
  if (changed) saveDatabase();
}, 60 * 1000).unref();

server.listen(PORT, HOST, () => {
  console.log(`Black Lime disponível em http://${HOST}:${PORT}`);
});
