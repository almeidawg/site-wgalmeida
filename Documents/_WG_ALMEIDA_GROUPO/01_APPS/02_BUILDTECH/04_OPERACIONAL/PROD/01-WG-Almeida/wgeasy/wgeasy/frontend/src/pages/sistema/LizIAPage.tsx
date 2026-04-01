import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Activity,
  Brain,
  Clock,
  FileText,
  MessageSquare,
  Plus,
  RefreshCw,
  SendHorizontal,
  ServerCog,
  Settings,
  Shield,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  createLizProject,
  createLizChatSession,
  getLizChatSession,
  getLizChatSessions,
  getLizLogs,
  getLizProjects,
  getLizStatus,
  getLizConfig,
  linkLizChatSessionProject,
  runLizActionPcStatus,
  runLizActionSendMessageTest,
  saveLizConfig,
  sendLizChatMessage,
  testBridgePcStatus,
  testLizBackendStatus,
  testOllamaGenerate,
  testOllamaTags,
  type LizActionResult,
  type LizChatMessage,
  type LizChatSession,
  type LizConfig,
  type LizProject,
} from "@/services/lizService";

type LizTab = "overview" | "tests" | "actions" | "chat" | "projects" | "logs" | "docs" | "settings";

interface LogEntry {
  id: string;
  title: string;
  provider: string;
  ok: boolean;
  durationMs: number;
  timestamp: string;
  endpoint: string;
  payload?: string;
  response?: string;
  error?: string;
}

const DOC_ITEMS = [
  {
    title: "Arquitetura Geral",
    path: "docs/liz/01_fundamentos/arquitetura_geral.md",
    description: "Mapa do ecossistema Liz + WGEasy + Ollama + Bridge + fallback.",
  },
  {
    title: "Owner Atual",
    path: "docs/liz/05_backend/owner_atual.md",
    description: "Estado do owner local, camada determinística e limites atuais do /api/chat.",
  },
  {
    title: "Estado da Sprint",
    path: "docs/liz/08_registro/estado_atual_sprint_2026-03-21.md",
    description: "Registro técnico consolidado com testes, falhas isoladas e próximo passo.",
  },
  {
    title: "Blueprint Liz WEB",
    path: "docs/liz/06_wgeasy/liz_web_blueprint.md",
    description: "Árvore técnica do módulo Liz IA no WGEasy, com guias, services, rotas e endpoints.",
  },
];

function stringifySafe(value: unknown) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function makeLog(title: string, result: LizActionResult, payload?: unknown): LogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    provider: result.provider,
    ok: result.ok,
    durationMs: result.durationMs,
    timestamp: new Date().toLocaleString("pt-BR"),
    endpoint: result.endpoint,
    payload: payload ? stringifySafe(payload) : undefined,
    response: result.data ? stringifySafe(result.data) : undefined,
    error: result.error,
  };
}

export default function LizIAPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as LizTab) || "overview";
  const [config, setConfig] = useState<LizConfig>(() => getLizConfig());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [statusSnapshot, setStatusSnapshot] = useState<{
    ollama: string;
    bridge: string;
    backend: string;
    lastCheck: string;
  }>({
    ollama: "nao testado",
    bridge: "nao testado",
    backend: "nao testado",
    lastCheck: "-",
  });
  const [testPrompt, setTestPrompt] = useState("Responda apenas OK");
  const [actionMessage, setActionMessage] = useState("Teste da Liz IA via WGEasy");
  const [chatSessions, setChatSessions] = useState<LizChatSession[]>([]);
  const [activeChatSessionId, setActiveChatSessionId] = useState("");
  const [chatMessages, setChatMessages] = useState<LizChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatProjectId, setChatProjectId] = useState("");
  const [projects, setProjects] = useState<LizProject[]>([]);
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    objective: "",
    status: "active" as LizProject["status"],
  });

  useEffect(() => {
    saveLizConfig(config);
  }, [config]);

  useEffect(() => {
    void runOverviewRefresh();
    void loadBackendLogs();
    void loadChatSessions();
    void loadProjects();
  }, []);

  const summary = useMemo(
    () => ({
      total: logs.length,
      success: logs.filter((item) => item.ok).length,
      failures: logs.filter((item) => !item.ok).length,
      latest: logs[0] || null,
    }),
    [logs],
  );

  function updateTab(tab: LizTab) {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next);
  }

  async function runCheck(
    key: string,
    title: string,
    executor: () => Promise<LizActionResult>,
    payload?: unknown,
  ) {
    setRunning(key);
    const result = await executor();
    setLogs((prev) => [makeLog(title, result, payload), ...prev].slice(0, 40));
    setRunning(null);
    return result;
  }

  async function runOverviewRefresh() {
    setRunning("refresh");
    const [ollama, bridge, backend, backendStatus] = await Promise.all([
      testOllamaTags(config),
      testBridgePcStatus(config),
      testLizBackendStatus(config),
      getLizStatus(config),
    ]);

    setLogs((prev) => [
      makeLog("Resumo status Liz", backendStatus),
      makeLog("Status Ollama", ollama),
      makeLog("Status Bridge", bridge),
      makeLog("Status Backend Liz", backend),
      ...prev,
    ].slice(0, 40));

    setStatusSnapshot({
      ollama:
        backendStatus.ok && backendStatus.data?.ollamaOnline === true
          ? "online"
          : ollama.ok
            ? "online"
            : "falha",
      bridge:
        backendStatus.ok && backendStatus.data?.bridgeOnline === true
          ? "online"
          : bridge.ok
            ? "online"
            : "falha",
      backend: backend.ok ? "online" : "nao integrado",
      lastCheck: new Date().toLocaleString("pt-BR"),
    });
    setRunning(null);
  }

  async function loadBackendLogs() {
    setRunning("load-logs");
    const result = await getLizLogs(config);
    if (result.ok) {
      const backendLogs = Array.isArray(result.data?.logs)
        ? result.data.logs.map((item, index) => {
            const record = item as Record<string, unknown>;
            return {
              id: String(record.id || `${Date.now()}-${index}`),
              title: String(record.title || "Log Liz"),
              provider: String(record.provider || "liz_backend"),
              ok: Boolean(record.ok),
              durationMs: Number(record.durationMs || 0),
              timestamp: new Date(
                String(record.timestamp || new Date().toISOString()),
              ).toLocaleString("pt-BR"),
              endpoint: String(record.endpoint || "-"),
              payload: record.payload ? stringifySafe(record.payload) : undefined,
              response: record.response ? stringifySafe(record.response) : undefined,
              error: record.error ? String(record.error) : undefined,
            } satisfies LogEntry;
          })
        : [];

      setLogs(backendLogs.slice(0, 40));
    } else {
      setLogs((prev) => [makeLog("Carregar logs Liz", result), ...prev].slice(0, 40));
    }
    setRunning(null);
  }

  async function runSendMessageTest() {
    const payload = {
      target: config.ownerPhone || undefined,
      message: actionMessage,
    };
    const result = await runCheck(
      "action-send-message-test",
      "AçÍo: enviar mensagem teste",
      () => runLizActionSendMessageTest(config, payload),
      payload,
    );

    if (result.ok) {
      await loadBackendLogs();
    }
  }

  async function loadChatSessions() {
    const result = await getLizChatSessions(config);
    if (!result.ok) return;
    const sessions = Array.isArray(result.data?.sessions) ? result.data.sessions : [];
    setChatSessions(sessions);
    if (!activeChatSessionId && sessions[0]?.id) {
      setActiveChatSessionId(sessions[0].id);
      await loadChatSession(sessions[0].id);
    }
  }

  async function loadChatSession(sessionId: string) {
    setRunning("chat-load");
    const result = await getLizChatSession(config, sessionId);
    if (result.ok) {
      setActiveChatSessionId(sessionId);
      setChatMessages(Array.isArray(result.data?.messages) ? result.data.messages : []);
      setChatProjectId(result.data?.session?.projectId || "");
    } else {
      setLogs((prev) => [makeLog("Carregar sessÍo chat", result, { sessionId }), ...prev].slice(0, 40));
    }
    setRunning(null);
  }

  async function createNewChatSession() {
    setRunning("chat-session-create");
    const result = await createLizChatSession(config, {
      title: "Nova conversa Liz",
      projectId: chatProjectId || undefined,
    });
    if (result.ok && result.data?.session?.id) {
      await loadChatSessions();
      await loadChatSession(result.data.session.id);
    } else {
      setLogs((prev) => [makeLog("Criar sessÍo chat", result), ...prev].slice(0, 40));
    }
    setRunning(null);
  }

  async function sendChat() {
    const message = chatInput.trim();
    if (!message) return;

    setRunning("chat-send");
    const result = await sendLizChatMessage(config, {
      sessionId: activeChatSessionId || undefined,
      message,
      projectId: chatProjectId || undefined,
    });

    if (result.ok) {
      const nextSessionId = result.data?.session?.id || activeChatSessionId;
      setChatInput("");
      if (nextSessionId) setActiveChatSessionId(nextSessionId);
      setChatMessages(Array.isArray(result.data?.messages) ? result.data.messages : []);
      await loadChatSessions();
      await loadBackendLogs();
    } else {
      setLogs((prev) =>
        [makeLog("Enviar mensagem chat", result, { sessionId: activeChatSessionId, message }), ...prev].slice(0, 40),
      );
    }
    setRunning(null);
  }

  async function loadProjects() {
    const result = await getLizProjects(config);
    if (!result.ok) {
      setLogs((prev) => [makeLog("Carregar projetos Liz", result), ...prev].slice(0, 40));
      return;
    }

    setProjects(Array.isArray(result.data?.projects) ? result.data.projects : []);
  }

  async function createProject() {
    if (!projectForm.name.trim()) return;

    setRunning("project-create");
    const result = await createLizProject(config, projectForm);
    if (result.ok && result.data?.project) {
      setProjectForm({
        name: "",
        description: "",
        objective: "",
        status: "active",
      });
      await loadProjects();
      setChatProjectId(result.data.project.id);
      await loadBackendLogs();
    } else {
      setLogs((prev) => [makeLog("Criar projeto Liz", result, projectForm), ...prev].slice(0, 40));
    }
    setRunning(null);
  }

  async function linkProjectToActiveSession() {
    if (!activeChatSessionId) return;

    setRunning("chat-project-link");
    const result = await linkLizChatSessionProject(config, activeChatSessionId, {
      projectId: chatProjectId || undefined,
    });

    if (result.ok) {
      await loadChatSessions();
      await loadChatSession(activeChatSessionId);
      await loadBackendLogs();
    } else {
      setLogs((prev) =>
        [
          makeLog("Vincular projeto ao chat", result, {
            sessionId: activeChatSessionId,
            projectId: chatProjectId,
          }),
          ...prev,
        ].slice(0, 40),
      );
    }

    setRunning(null);
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-orange-500 hover:bg-orange-500">Liz IA</Badge>
            <Badge variant="outline">Módulo Operacional</Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Central Liz</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Painel operacional da Liz dentro do WGEasy. Esta versÍo prioriza
            status, testes controlados, ações previsíveis e documentaçÍo, sem
            depender do owner JSON local que ficou congelado nesta sprint.
          </p>
        </div>
        <Button
          onClick={runOverviewRefresh}
          disabled={running === "refresh"}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar status
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => updateTab(value as LizTab)}>
        <TabsList className="flex h-auto flex-wrap gap-2">
          <TabsTrigger value="overview">VisÍo Geral</TabsTrigger>
          <TabsTrigger value="tests">Testes</TabsTrigger>
          <TabsTrigger value="actions">Ações</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="projects">Projetos</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="docs">DocumentaçÍo</TabsTrigger>
          <TabsTrigger value="settings">ConfiguraçÍo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatusCard
              title="Ollama local"
              value={statusSnapshot.ollama}
              description={config.ollamaBaseUrl}
              icon={<Brain className="h-4 w-4" />}
            />
            <StatusCard
              title="Bridge"
              value={statusSnapshot.bridge}
              description={config.bridgeBaseUrl}
              icon={<Wrench className="h-4 w-4" />}
            />
            <StatusCard
              title="Backend Liz"
              value={statusSnapshot.backend}
              description={config.lizBackendUrl}
              icon={<ServerCog className="h-4 w-4" />}
            />
            <StatusCard
              title="Última checagem"
              value={statusSnapshot.lastCheck}
              description={`Modelo owner: ${config.ownerModel}`}
              icon={<Clock className="h-4 w-4" />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader>
                <CardTitle>Estado técnico desta sprint</CardTitle>
                <CardDescription>
                  Baseado no que já foi validado no backend da Liz.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  O fluxo do owner segue com ações simples resolvidas por camada
                  determinística local. O caminho JSON via <code>/api/chat</code>
                  continua congelado nesta sprint.
                </p>
                <ul className="space-y-2">
                  <li>• `deterministic_local` já venceu `pcStatus` e envio simples.</li>
                  <li>• `BridgeAI` ainda sustenta conversa livre quando o owner local falha.</li>
                  <li>• `Liz IA` nasce como módulo operacional do WGEasy, nÍo como chat autônomo final.</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo rápido</CardTitle>
                <CardDescription>Leitura operacional do módulo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <SummaryLine label="Total de verificações" value={String(summary.total)} />
                <SummaryLine label="Sucessos" value={String(summary.success)} />
                <SummaryLine label="Falhas" value={String(summary.failures)} />
                <SummaryLine
                  label="Último provider"
                  value={summary.latest?.provider || "-"}
                />
                <SummaryLine
                  label="Último endpoint"
                  value={summary.latest?.endpoint || "-"}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tests" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Testes rápidos</CardTitle>
              <CardDescription>
                ExecuçÍo controlada para validar infraestrutura e motor local.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Button
                variant="outline"
                disabled={running === "ollama-tags"}
                onClick={() =>
                  runCheck("ollama-tags", "Teste Ollama Tags", () => testOllamaTags(config))
                }
                className="justify-start gap-2"
              >
                <Brain className="h-4 w-4" />
                Testar Ollama
              </Button>
              <Button
                variant="outline"
                disabled={running === "bridge-status"}
                onClick={() =>
                  runCheck(
                    "bridge-status",
                    "Teste Bridge pcStatus",
                    () => testBridgePcStatus(config),
                  )
                }
                className="justify-start gap-2"
              >
                <Activity className="h-4 w-4" />
                Testar Bridge
              </Button>
              <Button
                variant="outline"
                disabled={running === "ollama-generate"}
                onClick={() =>
                  runCheck(
                    "ollama-generate",
                    "Teste Ollama Generate",
                    () => testOllamaGenerate(config, testPrompt),
                    { prompt: testPrompt, model: config.ownerModel },
                  )
                }
                className="justify-start gap-2"
              >
                <Shield className="h-4 w-4" />
                Teste modelo curto
              </Button>
              <Button
                variant="outline"
                disabled={running === "liz-backend"}
                onClick={() =>
                  runCheck(
                    "liz-backend",
                    "Teste Backend Liz",
                    () => testLizBackendStatus(config),
                  )
                }
                className="justify-start gap-2"
              >
                <Settings className="h-4 w-4" />
                Testar Backend Liz
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prompt de validaçÍo</CardTitle>
              <CardDescription>
                Usado no teste rápido do modelo local via <code>/api/generate</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="liz-test-prompt">Prompt</Label>
              <Textarea
                id="liz-test-prompt"
                value={testPrompt}
                onChange={(event) => setTestPrompt(event.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ações operacionais desta sprint</CardTitle>
              <CardDescription>
                Ações seguras baseadas no que já está validado hoje.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-base">Verificar status do PC</CardTitle>
                  <CardDescription>
                    Usa o endpoint da Bridge como açÍo operacional estável.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    disabled={running === "action-pc-status"}
                    onClick={() =>
                      runCheck(
                        "action-pc-status",
                        "AçÍo: verificar status do PC",
                        () => runLizActionPcStatus(config),
                      )
                    }
                    className="gap-2"
                  >
                    <Activity className="h-4 w-4" />
                    Executar pcStatus
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-base">Mensagem de teste</CardTitle>
                  <CardDescription>
                    Envia uma mensagem de teste controlada para o destino configurado.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Label htmlFor="liz-action-message">Mensagem</Label>
                  <Input
                    id="liz-action-message"
                    value={actionMessage}
                    onChange={(event) => setActionMessage(event.target.value)}
                  />
                  <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                    Destino atual: <strong>{config.ownerPhone || "ownerPhone nÍo configurado"}</strong>
                  </div>
                  <Button
                    disabled={running === "action-send-message-test"}
                    onClick={runSendMessageTest}
                    className="gap-2"
                  >
                    <Activity className="h-4 w-4" />
                    Enviar mensagem teste
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Chat Liz</CardTitle>
              <CardDescription>
                Entrega 3.1 com sessões simples, histórico básico e associaçÍo opcional com projeto.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[280px_1fr]">
              <div className="space-y-3 rounded-lg border p-4">
                <div className="space-y-2">
                  <Label htmlFor="liz-chat-project">Projeto opcional</Label>
                  <select
                    id="liz-chat-project"
                    value={chatProjectId}
                    onChange={(event) => setChatProjectId(event.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Sem projeto</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} · {project.status}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  disabled={running === "chat-session-create"}
                  onClick={createNewChatSession}
                >
                  <Plus className="h-4 w-4" />
                  Nova sessÍo
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  disabled={!activeChatSessionId || running === "chat-project-link"}
                  onClick={linkProjectToActiveSession}
                >
                  <FileText className="h-4 w-4" />
                  Vincular projeto
                </Button>
                <div className="space-y-2">
                  {chatSessions.length === 0 ? (
                    <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                      Nenhuma sessÍo criada ainda.
                    </div>
                  ) : (
                    chatSessions.map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => void loadChatSession(session.id)}
                        className={`w-full rounded-md border p-3 text-left text-sm ${
                          activeChatSessionId === session.id ? "border-orange-500 bg-orange-50" : ""
                        }`}
                      >
                        <div className="font-medium">{session.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {session.projectId || "Sem projeto"} ·{" "}
                          {new Date(session.updatedAt).toLocaleString("pt-BR")}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">
                    <MessageSquare className="mr-1 h-3 w-3" />
                    {activeChatSessionId ? "SessÍo ativa" : "Nova conversa"}
                  </Badge>
                  <Badge variant="outline">Modelo: {config.ownerModel}</Badge>
                  <Badge variant="outline">Projeto: {chatProjectId || "Livre"}</Badge>
                </div>

                <div className="min-h-[280px] space-y-3 rounded-md border bg-muted/20 p-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Sem histórico ainda. Crie uma sessÍo ou envie a primeira mensagem.
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`rounded-lg p-3 text-sm ${
                          message.role === "user"
                            ? "ml-auto max-w-[85%] bg-orange-500 text-white"
                            : "mr-auto max-w-[85%] border bg-background"
                        }`}
                      >
                        <div className="mb-1 text-[11px] opacity-80">
                          {message.role === "user" ? "Usuário" : "Liz"}
                          {message.model ? ` · ${message.model}` : ""}
                        </div>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="liz-chat-input">Mensagem</Label>
                  <Textarea
                    id="liz-chat-input"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    rows={4}
                    placeholder="Digite a mensagem para a Liz..."
                  />
                  <div className="flex justify-end">
                    <Button
                      disabled={running === "chat-send"}
                      onClick={sendChat}
                      className="gap-2"
                    >
                      <SendHorizontal className="h-4 w-4" />
                      Enviar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Projetos da Liz</CardTitle>
              <CardDescription>
                Entrega 3.2 com cadastro simples de projetos e contexto inicial para o chat.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[360px_1fr]">
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-base">Novo projeto</CardTitle>
                  <CardDescription>
                    Dados mínimos para dar contexto inicial à Liz.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="liz-project-name">Nome</Label>
                    <Input
                      id="liz-project-name"
                      value={projectForm.name}
                      onChange={(event) =>
                        setProjectForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="liz-project-objective">Objetivo</Label>
                    <Textarea
                      id="liz-project-objective"
                      rows={3}
                      value={projectForm.objective}
                      onChange={(event) =>
                        setProjectForm((prev) => ({ ...prev, objective: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="liz-project-description">DescriçÍo</Label>
                    <Textarea
                      id="liz-project-description"
                      rows={4}
                      value={projectForm.description}
                      onChange={(event) =>
                        setProjectForm((prev) => ({ ...prev, description: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="liz-project-status">Status</Label>
                    <select
                      id="liz-project-status"
                      value={projectForm.status}
                      onChange={(event) =>
                        setProjectForm((prev) => ({
                          ...prev,
                          status: event.target.value as LizProject["status"],
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="active">active</option>
                      <option value="paused">paused</option>
                      <option value="draft">draft</option>
                    </select>
                  </div>
                  <Button
                    className="w-full gap-2"
                    disabled={running === "project-create"}
                    onClick={createProject}
                  >
                    <Plus className="h-4 w-4" />
                    Criar projeto
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Projetos cadastrados</CardTitle>
                  <CardDescription>
                    Selecione um projeto para usar como contexto no chat.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {projects.length === 0 ? (
                    <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                      Nenhum projeto criado ainda.
                    </div>
                  ) : (
                    projects.map((project) => (
                      <div key={project.id} className="rounded-lg border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="font-medium">{project.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {project.objective || "Sem objetivo definido"}
                            </div>
                          </div>
                          <Badge variant="outline">{project.status}</Badge>
                        </div>
                        {project.description ? (
                          <p className="mt-3 text-sm text-muted-foreground">{project.description}</p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setChatProjectId(project.id);
                              updateTab("chat");
                            }}
                          >
                            Usar no chat
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Logs da sessÍo</CardTitle>
                  <CardDescription>
                    Últimas execuções da Central Liz nesta interface e no backend.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={running === "load-logs"}
                  onClick={loadBackendLogs}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Recarregar logs
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {logs.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  Nenhuma execuçÍo registrada nesta sessÍo.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong>{log.title}</strong>
                          <Badge variant={log.ok ? "default" : "destructive"}>
                            {log.ok ? "OK" : "Falha"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {log.timestamp} · {log.provider} · {log.durationMs} ms
                        </p>
                      </div>
                      <Badge variant="outline">{log.endpoint}</Badge>
                    </div>
                    {log.payload ? (
                      <>
                        <div className="my-3 border-t" />
                        <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                          {log.payload}
                        </pre>
                      </>
                    ) : null}
                    {log.response ? (
                      <>
                        <div className="my-3 border-t" />
                        <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                          {log.response}
                        </pre>
                      </>
                    ) : null}
                    {log.error ? (
                      <>
                        <div className="my-3 border-t" />
                        <p className="text-sm text-red-600">{log.error}</p>
                      </>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>DocumentaçÍo oficial da Liz</CardTitle>
              <CardDescription>
                Base inicial organizada para onboarding, arquitetura e registro técnico.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DOC_ITEMS.map((item) => (
                <div key={item.path} className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 text-orange-500" />
                    <div className="space-y-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.description}</div>
                      <code className="block text-xs">{item.path}</code>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>ConfiguraçÍo local</CardTitle>
              <CardDescription>
                Ajustes salvos no navegador para operar esta Central Liz.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field
                label="Ollama base URL"
                value={config.ollamaBaseUrl}
                onChange={(value) => setConfig((prev) => ({ ...prev, ollamaBaseUrl: value }))}
              />
              <Field
                label="Bridge base URL"
                value={config.bridgeBaseUrl}
                onChange={(value) => setConfig((prev) => ({ ...prev, bridgeBaseUrl: value }))}
              />
              <Field
                label="Backend Liz URL"
                value={config.lizBackendUrl}
                onChange={(value) => setConfig((prev) => ({ ...prev, lizBackendUrl: value }))}
              />
              <Field
                label="Modelo owner"
                value={config.ownerModel}
                onChange={(value) => setConfig((prev) => ({ ...prev, ownerModel: value }))}
              />
              <Field
                label="Owner phone"
                value={config.ownerPhone}
                onChange={(value) => setConfig((prev) => ({ ...prev, ownerPhone: value }))}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
}) {
  const ok = value === "online";
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <span className="text-xl font-semibold capitalize">{value}</span>
        <Badge variant={ok ? "default" : "outline"}>
          {ok ? "estável" : "pendente"}
        </Badge>
      </CardContent>
    </Card>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

