
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./MeusHorariosAluno.css";

const API_URL = "http://localhost:3000";

function formatarData(valor) {
  if (!valor) return "Data não informada";

  const [ano, mes, dia] = String(valor).split("T")[0].split("-");

  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "Data não informada";
}

function formatarHorario(valor) {
  return valor ? String(valor).slice(0, 5) : "--:--";
}

function normalizarStatus(valor) {
  return String(valor ?? "PENDENTE").trim().toUpperCase();
}

function nomeStatus(status) {
  const nomes = {
    PENDENTE: "Pendente",
    CONFIRMADO: "Confirmado",
    CONCLUIDO: "Concluído",
    CANCELADO: "Cancelado",
  };

  return nomes[status] ?? status;
}

async function lerJson(response) {
  const texto = await response.text();

  try {
    return texto ? JSON.parse(texto) : {};
  } catch {
    throw new Error("O servidor retornou uma resposta inválida.");
  }
}

export default function MeusHorariosAluno() {
  const navigate = useNavigate();

  // Busca os dados do aluno que realizou o login.
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const codigoAluno = usuario?.codigoAluno;

  const [agendamentos, setAgendamentos] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoPlanos, setCarregandoPlanos] = useState(true);
  const [cancelandoId, setCancelandoId] = useState(null);
  const [erro, setErro] = useState("");
  const [erroPlanos, setErroPlanos] = useState("");
  const [mensagem, setMensagem] = useState("");

  // BUSCAR HORÁRIOS DO ALUNO
  // GET /agendamento/aluno/:codigoAluno
  const buscarAgendamentos = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const response = await fetch(
        `${API_URL}/agendamento/aluno/${codigoAluno}`
      );

      const dados = await lerJson(response);

      if (!response.ok) {
        throw new Error(
          dados.erro || "Não foi possível carregar seus horários."
        );
      }

      if (!Array.isArray(dados)) {
        throw new Error("A resposta do servidor não é uma lista.");
      }

      setAgendamentos(dados);
    } catch (error) {
      console.error("Erro ao buscar horários do aluno:", error);

      setAgendamentos([]);
      setErro(error.message || "Não foi possível carregar seus horários.");
    } finally {
      setCarregando(false);
    }
  }, [codigoAluno]);

  // BUSCAR PLANILHAS DE TREINO DO ALUNO
  // GET /plano-treino/aluno/:codigoAluno
  const buscarPlanos = useCallback(async () => {
    try {
      setCarregandoPlanos(true);
      setErroPlanos("");

      const response = await fetch(
        `${API_URL}/plano-treino/aluno/${codigoAluno}`
      );

      const dados = await lerJson(response);

      if (!response.ok) {
        throw new Error(
          dados.erro || "Não foi possível carregar seu treino."
        );
      }

      if (!Array.isArray(dados)) {
        throw new Error("A resposta do servidor não é uma lista.");
      }

      setPlanos(dados);
    } catch (error) {
      console.error("Erro ao buscar planos do aluno:", error);

      setPlanos([]);
      setErroPlanos(error.message || "Não foi possível carregar seu treino.");
    } finally {
      setCarregandoPlanos(false);
    }
  }, [codigoAluno]);

  const atualizarTudo = useCallback(() => {
    buscarAgendamentos();
    buscarPlanos();
  }, [buscarAgendamentos, buscarPlanos]);

  useEffect(() => {
    if (!codigoAluno) {
      setErro("Aluno não identificado. Faça login novamente.");
      setErroPlanos("Aluno não identificado. Faça login novamente.");
      setCarregando(false);
      setCarregandoPlanos(false);
      return;
    }

    atualizarTudo();
  }, [codigoAluno, atualizarTudo]);

  // DESMARCAR HORÁRIO
  // PATCH /agendamento/:id/status
  async function desmarcar(agendamento) {
    const confirmou = window.confirm(
      `Desmarcar o horário de ${formatarData(
        agendamento.dataAgendamento
      )} às ${formatarHorario(agendamento.horarioAgendamento)}?`
    );

    if (!confirmou) return;

    try {
      setCancelandoId(agendamento.codigoAgendamento);
      setErro("");
      setMensagem("");

      const response = await fetch(
        `${API_URL}/agendamento/${agendamento.codigoAgendamento}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statusAgendamento: "CANCELADO" }),
        }
      );

      const dados = await lerJson(response);

      if (!response.ok) {
        throw new Error(
          dados.erro || "Não foi possível desmarcar o horário."
        );
      }

      setAgendamentos((lista) =>
        lista.map((item) =>
          item.codigoAgendamento === agendamento.codigoAgendamento
            ? { ...item, statusAgendamento: "CANCELADO" }
            : item
        )
      );

      setMensagem("Horário desmarcado com sucesso.");
      buscarPlanos();
    } catch (error) {
      console.error("Erro ao desmarcar horário:", error);

      setErro(error.message || "Não foi possível desmarcar o horário.");
    } finally {
      setCancelandoId(null);
    }
  }

  // Planilhas de atendimentos que não foram cancelados
  const planosAtivos = planos.filter(
    (plano) => normalizarStatus(plano.statusAgendamento) !== "CANCELADO"
  );

  return (
    <main className="mha">
      <div className="mha-container">
        <header className="mha-cabecalho">
          <div>
            <h1>Meus horários</h1>
            <p>
              Consulte seus atendimentos, veja seu treino, agende novos
              horários e desmarque, se precisar.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="mha-btn-secundario"
              onClick={() => navigate("/agendar-aluno")}
            >
              Agendar novo horário
            </button>

            <button
              type="button"
              className="mha-btn-secundario"
              onClick={atualizarTudo}
              disabled={carregando || carregandoPlanos}
            >
              {carregando || carregandoPlanos ? "Atualizando..." : "Atualizar"}
            </button>
          </div>
        </header>

        {mensagem && (
          <p className="mha-mensagem mha-sucesso" role="status">
            {mensagem}
          </p>
        )}

        {erro && (
          <p className="mha-mensagem mha-erro" role="alert">
            {erro}
          </p>
        )}

        {carregando && (
          <p className="mha-vazio" role="status">
            Carregando seus horários...
          </p>
        )}

        {!carregando && !erro && agendamentos.length === 0 && (
          <p className="mha-vazio">
            Você ainda não tem horários agendados.
          </p>
        )}

        {!carregando && agendamentos.length > 0 && (
          <ul className="mha-lista">
            {agendamentos.map((agendamento) => {
              const status = normalizarStatus(
                agendamento.statusAgendamento
              );

              const podeDesmarcar =
                status === "PENDENTE" || status === "CONFIRMADO";

              const cancelando =
                cancelandoId === agendamento.codigoAgendamento;

              return (
                <li
                  key={agendamento.codigoAgendamento}
                  className="mha-card"
                >
                  <div className="mha-card-info">
                    <strong className="mha-data">
                      {formatarData(agendamento.dataAgendamento)}
                    </strong>

                    <span className="mha-hora">
                      {formatarHorario(agendamento.horarioAgendamento)}
                    </span>
                  </div>

                  <span className={`mha-status mha-status-${status.toLowerCase()}`}>
                    {nomeStatus(status)}
                  </span>

                  {podeDesmarcar && (
                    <button
                      type="button"
                      className="mha-btn-desmarcar"
                      onClick={() => desmarcar(agendamento)}
                      disabled={cancelando || cancelandoId !== null}
                    >
                      {cancelando ? "Desmarcando..." : "Desmarcar"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* ===================== MEU TREINO ===================== */}
        <header className="mha-cabecalho" style={{ marginTop: "32px" }}>
          <div>
            <h1>Meu treino</h1>
            <p>Planilha de treino montada pelo seu personal.</p>
          </div>
        </header>

        {erroPlanos && (
          <p className="mha-mensagem mha-erro" role="alert">
            {erroPlanos}
          </p>
        )}

        {carregandoPlanos && (
          <p className="mha-vazio" role="status">
            Carregando seu treino...
          </p>
        )}

        {!carregandoPlanos && !erroPlanos && planosAtivos.length === 0 && (
          <p className="mha-vazio">
            Seu personal ainda não cadastrou uma planilha de treino para você.
          </p>
        )}

        {!carregandoPlanos && planosAtivos.length > 0 && (
          <ul className="mha-lista">
            {planosAtivos.map((plano) => (
              <li
                key={plano.codigoPlanoTreino}
                className="mha-card"
                style={{ flexDirection: "column", alignItems: "stretch" }}
              >
                <div className="mha-card-info">
                  <strong className="mha-data">
                    Atendimento de {formatarData(plano.dataAgendamento)}
                  </strong>

                  <span className="mha-hora">
                    {formatarHorario(plano.horarioAgendamento)}
                  </span>
                </div>

                <p style={{ whiteSpace: "pre-wrap", margin: "8px 0 0" }}>
                  {plano.descricaoPlanoTreino || "Sem descrição do treino."}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="mha-acoes">
          <button
            type="button"
            className="mha-btn-secundario"
            onClick={() => navigate("/aluno")}
          >
            Voltar
          </button>
        </div>
      </div>
    </main>
  );
}
