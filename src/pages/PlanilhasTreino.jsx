import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./PlanilhasTreino.css";

const API_BASE = "http://localhost:3000";
const API_URL = `${API_BASE}/plano-treino`;

function formatarData(valor) {
  if (!valor) return "data não informada";

  const [ano, mes, dia] = String(valor).split("T")[0].split("-");

  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "data não informada";
}

function formatarHorario(valor) {
  return valor ? String(valor).slice(0, 5) : "--:--";
}

// Busca agendamentos e alunos só para mostrar nome, data e horário
// no card. Se falhar, o card mostra o código do agendamento.
async function buscarContexto() {
  const contexto = { agendamentos: {}, alunos: {} };

  try {
    const [respAgendamentos, respAlunos] = await Promise.all([
      fetch(`${API_BASE}/agendamento`),
      fetch(`${API_BASE}/alunos`),
    ]);

    const agendamentos = respAgendamentos.ok
      ? await respAgendamentos.json()
      : [];

    const alunos = respAlunos.ok ? await respAlunos.json() : [];

    if (Array.isArray(agendamentos)) {
      agendamentos.forEach((item) => {
        contexto.agendamentos[item.codigoAgendamento] = item;
      });
    }

    // /alunos devolve os campos em minúsculas (codigoaluno, nome)
    if (Array.isArray(alunos)) {
      alunos.forEach((item) => {
        contexto.alunos[item.codigoaluno] = item.nome;
      });
    }
  } catch (error) {
    console.error("Erro ao buscar dados do agendamento:", error);
  }

  return contexto;
}

function tituloPlanilha(planilha, contexto) {
  const agendamento = contexto.agendamentos[planilha.codigoAgendamento];

  if (!agendamento) {
    return `Agendamento #${planilha.codigoAgendamento ?? "—"}`;
  }

  const nome =
    contexto.alunos[agendamento.codigoAluno] ??
    `Aluno #${agendamento.codigoAluno}`;

  return `${nome} — ${formatarData(
    agendamento.dataAgendamento
  )} às ${formatarHorario(agendamento.horarioAgendamento)}`;
}

export default function PlanilhasTreino() {
  const navigate = useNavigate();

  const [planilhas, setPlanilhas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [excluindoId, setExcluindoId] = useState(null);
  const [erro, setErro] = useState("");
  const [falhaCarga, setFalhaCarga] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [contexto, setContexto] = useState({
    agendamentos: {},
    alunos: {},
  });

  const buscarPlanilhas = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");
      setFalhaCarga(false);

      const response = await fetch(API_URL);
      const dados = await response.json();

      if (!response.ok) {
        throw new Error(
          dados.erro || "Não foi possível buscar as planilhas."
        );
      }

      if (!Array.isArray(dados)) {
        throw new Error("O servidor retornou uma lista inválida.");
      }

      setPlanilhas(dados);

      buscarContexto().then(setContexto);
    } catch (error) {
      console.error("Erro ao buscar planilhas:", error);
      setFalhaCarga(true);
      setErro(error.message || "Não foi possível carregar as planilhas.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarPlanilhas();
  }, [buscarPlanilhas]);

  async function excluirPlanilha(planilha) {
    const idPlanilha = planilha.codigoPlanoTreino;

    if (idPlanilha == null || idPlanilha === "") {
      setErro("Identificador da planilha não encontrado.");
      return;
    }

    const confirmar = window.confirm(
      "Deseja realmente excluir esta planilha de treino?"
    );

    if (!confirmar) return;

    try {
      setExcluindoId(idPlanilha);
      setErro("");
      setMensagem("");

      const response = await fetch(
        `${API_URL}/${encodeURIComponent(idPlanilha)}`,
        { method: "DELETE" }
      );

      let dados = {};

      try {
        dados = await response.json();
      } catch {
        // A API pode responder sem conteúdo JSON.
      }

      if (!response.ok) {
        throw new Error(
          dados.erro || "Não foi possível excluir a planilha."
        );
      }

      setPlanilhas((listaAnterior) =>
        listaAnterior.filter(
          (item) =>
            String(item.codigoPlanoTreino) !== String(idPlanilha)
        )
      );

      setMensagem("Planilha excluída com sucesso.");
    } catch (error) {
      console.error("Erro ao excluir planilha:", error);
      setErro(error.message || "Erro ao excluir a planilha.");
    } finally {
      setExcluindoId(null);
    }
  }

  function editarPlanilha(planilha) {
    navigate("/criar-planilha", {
      state: { planilha },
    });
  }

  return (
    <main className="planilha-treino">
      <div className="planilha-treino-container">
        <header className="planilha-treino-cabecalho">
          <h1>Planilhas de Treino</h1>
          <p>Crie e gerencie as planilhas dos seus alunos.</p>
        </header>

        <div className="planilha-treino-topo">
          <button
            type="button"
            className="botao-criar"
            onClick={() => navigate("/criar-planilha")}
          >
            + Criar planilha
          </button>
        </div>

        {erro && (
          <div className="mensagem-erro" role="alert">
            <p>{erro}</p>

            {!carregando && (
              <button type="button" onClick={buscarPlanilhas}>
                Tentar novamente
              </button>
            )}
          </div>
        )}

        {mensagem && (
          <p className="mensagem-sucesso" role="status">
            {mensagem}
          </p>
        )}

        {carregando && (
          <p className="mensagem-carregando" role="status">
            Carregando planilhas...
          </p>
        )}

        {!carregando && !falhaCarga && (
          <section
            className="planilhas-lista"
            aria-label="Lista de planilhas de treino"
          >
            {planilhas.length === 0 ? (
              <div className="lista-vazia">
                <p>Nenhuma planilha de treino cadastrada.</p>
                <p>Selecione "Criar planilha" para adicionar a primeira.</p>
              </div>
            ) : (
              planilhas.map((planilha) => {
                const idPlanilha = planilha.codigoPlanoTreino;

                return (
                  <article
                    className="planilha-card"
                    key={idPlanilha ?? planilha.codigoAgendamento}
                  >
                    <h3>{tituloPlanilha(planilha, contexto)}</h3>

                    <div className="planilha-detalhes-bloco">
                      <p style={{ whiteSpace: "pre-line" }}>
                        {planilha.descricaoPlanoTreino ||
                          "Nenhuma descrição informada."}
                      </p>
                    </div>

                    <div className="acoes">
                      <button
                        type="button"
                        className="botao-editar"
                        onClick={() => editarPlanilha(planilha)}
                        disabled={excluindoId !== null}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="botao-excluir"
                        onClick={() => excluirPlanilha(planilha)}
                        disabled={excluindoId !== null}
                      >
                        {String(excluindoId) === String(idPlanilha)
                          ? "Excluindo..."
                          : "Excluir"}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        )}
      </div>
    </main>
  );
}