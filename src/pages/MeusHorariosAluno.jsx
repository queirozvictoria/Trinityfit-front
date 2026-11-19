
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./MeusHorariosAluno.css";

const API_URL = "http://localhost:3000";

function obterUsuario() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "{}");
  } catch {
    return {};
  }
}

function obterCodigoAluno() {
  const usuario = obterUsuario();

  const codigo =
    usuario.codigoAluno ??
    usuario.codigoaluno ??
    usuario.aluno?.codigoAluno ??
    usuario.aluno?.codigoaluno;

  return codigo ? Number(codigo) : null;
}

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
    throw new Error(texto || "O servidor retornou uma resposta inválida.");
  }
}

export default function MeusHorariosAluno() {
  const navigate = useNavigate();

  const [codigoAluno] = useState(obterCodigoAluno);
  const [token] = useState(() => localStorage.getItem("token"));

  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [cancelandoId, setCancelandoId] = useState(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  // BUSCAR HORÁRIOS DO ALUNO
  const buscarAgendamentos = useCallback(async () => {
    if (!token) {
      setErro("Sessão não encontrada. Faça login novamente.");
      setCarregando(false);
      return;
    }

    if (!codigoAluno) {
      setErro("Aluno não identificado. Faça login novamente.");
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      setErro("");

      const response = await fetch(
        `${API_URL}/agendamento/aluno/${codigoAluno}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const dados = await lerJson(response);

      if (!response.ok) {
        throw new Error(
          dados.erro ||
          dados.message ||
          "Não foi possível carregar seus horários."
        );
      }

      if (!Array.isArray(dados)) {
        throw new Error("A resposta do servidor não é uma lista.");
      }

      setAgendamentos(dados);
    } catch (error) {
      console.error("Erro ao buscar horários do aluno:", error);
      setAgendamentos([]);
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }, [codigoAluno, token]);

  useEffect(() => {
    buscarAgendamentos();
  }, [buscarAgendamentos]);

  // DESMARCAR HORÁRIO
  async function desmarcar(agendamento) {
    const confirmou = window.confirm(
      `Desmarcar o horário de ${formatarData(
        agendamento.dataAgendamento
      )} às ${formatarHorario(agendamento.horarioAgendamento)}?`
    );

    if (!confirmou) return;

    if (!token) {
      setErro("Sessão não encontrada. Faça login novamente.");
      return;
    }

    try {
      setCancelandoId(agendamento.codigoAgendamento);
      setErro("");
      setMensagem("");

      const response = await fetch(
        `${API_URL}/agendamento/${agendamento.codigoAgendamento}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            statusAgendamento: "CANCELADO",
          }),
        }
      );

      const dados = await lerJson(response);

      if (!response.ok) {
        throw new Error(
          dados.erro ||
          dados.message ||
          "Não foi possível desmarcar o horário."
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
    } catch (error) {
      console.error("Erro ao desmarcar horário:", error);
      setErro(error.message);
    } finally {
      setCancelandoId(null);
    }
  }

  return (
    <main className="mha">
      <div className="mha-container">
        <header className="mha-cabecalho">
          <div>
            <h1>Meus horários</h1>
            <p>
              Consulte seus atendimentos, agende novos horários e desmarque,
              se precisar.
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
              onClick={buscarAgendamentos}
              disabled={carregando}
            >
              {carregando ? "Atualizando..." : "Atualizar"}
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

                  <span
                    className={`mha-status mha-status-${status.toLowerCase()}`}
                  >
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
