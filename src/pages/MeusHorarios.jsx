import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./MeusHorarios.css";

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

export default function MeusHorarios() {
  const navigate = useNavigate();
  const location = useLocation();

  // Busca os dados do personal que realizou o login.
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const codigoPersonal =
    usuario?.codigoPersonal ?? usuario?.codigopersonal ?? null;

  const [agendamentos, setAgendamentos] = useState([]);
  const [nomesAlunos, setNomesAlunos] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [atualizandoId, setAtualizandoId] = useState(null);
  const [erro, setErro] = useState("");

  // Mensagem enviada por AlterarHorario / CancelarHorario ao voltar.
  const [mensagem, setMensagem] = useState(
    location.state?.mensagem ?? ""
  );

  // ==============================
  // BUSCAR AGENDA DO PERSONAL
  // GET /agendamento/personal/:codigoPersonal
  // ==============================
  const buscarAgenda = useCallback(async () => {
    if (!codigoPersonal) {
      setAgendamentos([]);
      setErro("Personal não identificado. Faça login novamente.");
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      setErro("");

      const response = await fetch(
        `${API_URL}/agendamento/personal/${codigoPersonal}`
      );

      const dados = await lerJson(response);

      if (!response.ok) {
        throw new Error(
          dados.erro || "Não foi possível carregar sua agenda."
        );
      }

      if (!Array.isArray(dados)) {
        throw new Error("A resposta do servidor não é uma lista.");
      }

      setAgendamentos(dados);

      // Nomes dos alunos (opcional: se falhar, mostra o código).
      try {
        const respostaAlunos = await fetch(`${API_URL}/alunos`);
        const alunos = await lerJson(respostaAlunos);

        if (respostaAlunos.ok && Array.isArray(alunos)) {
          // /alunos pode devolver os campos em minúsculas (codigoaluno, nome)
          setNomesAlunos(
            Object.fromEntries(
              alunos.map((aluno) => [
                aluno.codigoAluno ?? aluno.codigoaluno,
                aluno.nome,
              ])
            )
          );
        }
      } catch (erroAlunos) {
        console.error("Erro ao buscar nomes dos alunos:", erroAlunos);
      }
    } catch (error) {
      console.error("Erro ao buscar agenda:", error);

      setAgendamentos([]);
      setErro(error.message || "Não foi possível carregar sua agenda.");
    } finally {
      setCarregando(false);
    }
  }, [codigoPersonal]);

  useEffect(() => {
    buscarAgenda();
  }, [buscarAgenda]);

  function nomeDoAluno(agendamento) {
    return (
      nomesAlunos[agendamento.codigoAluno] ??
      `Aluno #${agendamento.codigoAluno}`
    );
  }

  // ==============================
  // CONFIRMAR HORÁRIO
  // PATCH /agendamento/:id/status
  // ==============================
  async function confirmar(agendamento) {
    try {
      setAtualizandoId(agendamento.codigoAgendamento);
      setErro("");
      setMensagem("");

      const response = await fetch(
        `${API_URL}/agendamento/${agendamento.codigoAgendamento}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statusAgendamento: "CONFIRMADO" }),
        }
      );

      const dados = await lerJson(response);

      if (!response.ok) {
        throw new Error(
          dados.erro || "Não foi possível confirmar o horário."
        );
      }

      setAgendamentos((lista) =>
        lista.map((item) =>
          item.codigoAgendamento === agendamento.codigoAgendamento
            ? { ...item, statusAgendamento: "CONFIRMADO" }
            : item
        )
      );

      setMensagem("Horário confirmado com sucesso.");
    } catch (error) {
      console.error("Erro ao confirmar horário:", error);

      setErro(error.message || "Não foi possível confirmar o horário.");
    } finally {
      setAtualizandoId(null);
    }
  }

  // ==============================
  // ALTERAR / CANCELAR
  // As telas abrem com o agendamento completo no state.
  // ==============================
  function abrirTela(caminho, agendamento) {
    navigate(caminho, {
      state: {
        horario: { ...agendamento, aluno: nomeDoAluno(agendamento) },
      },
    });
  }

  return (
    <main className="mh">
      <div className="mh-container">
        <header className="mh-cabecalho">
          <div>
            <h1>Meus horários</h1>
            <p>Organize os atendimentos dos seus alunos.</p>
          </div>

          <button
            type="button"
            className="mh-btn-principal"
            onClick={() => navigate("/agendar")}
          >
            + Agendar horário
          </button>
        </header>

        {mensagem && (
          <p className="mh-mensagem mh-sucesso" role="status">
            {mensagem}
          </p>
        )}

        {erro && (
          <p className="mh-mensagem mh-erro" role="alert">
            {erro}
          </p>
        )}

        {carregando && (
          <p className="mh-vazio" role="status">
            Carregando sua agenda...
          </p>
        )}

        {!carregando && !erro && agendamentos.length === 0 && (
          <p className="mh-vazio">
            Nenhum horário agendado. Use "Agendar horário" para criar o
            primeiro.
          </p>
        )}

        {!carregando && agendamentos.length > 0 && (
          <ul className="mh-lista">
            {agendamentos.map((agendamento) => {
              const status = normalizarStatus(
                agendamento.statusAgendamento
              );

              const ativo =
                status === "PENDENTE" || status === "CONFIRMADO";

              const atualizando =
                atualizandoId === agendamento.codigoAgendamento;

              return (
                <li
                  key={agendamento.codigoAgendamento}
                  className="mh-card"
                >
                  <div className="mh-card-info">
                    <strong className="mh-aluno">
                      {nomeDoAluno(agendamento)}
                    </strong>

                    <span className="mh-quando">
                      {formatarData(agendamento.dataAgendamento)} às{" "}
                      {formatarHorario(agendamento.horarioAgendamento)}
                    </span>
                  </div>

                  <span
                    className={`mh-status mh-status-${status.toLowerCase()}`}
                  >
                    {nomeStatus(status)}
                  </span>

                  {ativo && (
                    <div className="mh-acoes-card">
                      {status === "PENDENTE" && (
                        <button
                          type="button"
                          className="mh-btn-confirmar"
                          onClick={() => confirmar(agendamento)}
                          disabled={atualizandoId !== null}
                        >
                          {atualizando ? "Confirmando..." : "Confirmar"}
                        </button>
                      )}

                      <button
                        type="button"
                        className="mh-btn-secundario"
                        onClick={() =>
                          abrirTela("/alterar-horario", agendamento)
                        }
                        disabled={atualizandoId !== null}
                      >
                        Alterar
                      </button>

                      <button
                        type="button"
                        className="mh-btn-cancelar"
                        onClick={() =>
                          abrirTela("/cancelar-horario", agendamento)
                        }
                        disabled={atualizandoId !== null}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="mh-rodape">
          <button
            type="button"
            className="mh-btn-secundario"
            onClick={() => navigate("/personal")}
          >
            Voltar
          </button>

          <button
            type="button"
            className="mh-btn-secundario"
            onClick={buscarAgenda}
            disabled={carregando}
          >
            {carregando ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </div>
    </main>
  );
}