
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
import "./PlanilhasTreino.css";

const API_URL = "/plano-treino";

async function buscarContexto() {
  const resposta = await api.get("/alunos");
  const alunos = resposta.data;

  return {
    alunos: alunos.reduce((mapa, aluno) => {
      const codigo = aluno.codigoAluno ?? aluno.codigoaluno;

      mapa[String(codigo)] = aluno;

      return mapa;
    }, {}),
  };
}

function nomeDoAluno(aluno) {
  return (
    aluno.nomeAluno ??
    aluno.nome ??
    aluno.nomeCompleto ??
    "Aluno sem nome"
  );
}

function tituloPlanilha(planilha, contexto) {
  const codigo = planilha.codigoAluno ?? planilha.codigoaluno;
  const aluno = contexto.alunos[String(codigo)];

  if (aluno) {
    return nomeDoAluno(aluno);
  }

  return `Aluno #${codigo ?? "não informado"}`;
}

function resumoPlanilha(planilha) {
  const texto = String(planilha.descricaoPlanoTreino ?? "");

  const nomeTreino =
    texto.match(/^Treino:\s*(.*)$/m)?.[1]?.trim() ?? "";

  const objetivo =
    texto.match(/^Objetivo:\s*(.*)$/m)?.[1]?.trim() ?? "";

  const quantidade = (texto.match(/^\d+\.\s+/gm) ?? []).length;

  return {
    nomeTreino,
    objetivo,
    quantidade,
  };
}

export default function PlanilhasTreino() {
  const navigate = useNavigate();

  const [planilhas, setPlanilhas] = useState([]);
  const [contexto, setContexto] = useState({ alunos: {} });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarPlanilhas() {
    try {
      setCarregando(true);
      setErro("");

      const [respostaPlanilhas, dadosContexto] =
        await Promise.all([
          api.get(API_URL),
          buscarContexto(),
        ]);

      setPlanilhas(respostaPlanilhas.data);
      setContexto(dadosContexto);

    } catch (error) {
      console.error("Erro ao carregar planilhas:", error);
      setErro("Não foi possível carregar as planilhas.");

    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPlanilhas();
  }, []);

  async function excluirPlanilha(codigoPlanoTreino) {
    const confirmar = window.confirm(
      "Deseja realmente excluir esta planilha?"
    );

    if (!confirmar) return;

    try {
      await api.delete(
        `${API_URL}/${codigoPlanoTreino}`
      );

      setPlanilhas((anteriores) =>
        anteriores.filter(
          (planilha) =>
            planilha.codigoPlanoTreino !== codigoPlanoTreino
        )
      );

      window.alert("Planilha excluída com sucesso!");

    } catch (error) {
      console.error("Erro ao excluir planilha:", error);

      window.alert(
        error.response?.data?.erro ??
        "Não foi possível excluir a planilha."
      );
    }
  }

  if (carregando) {
    return (
      <div className="planilha-treino">
        <div className="planilha-treino-container">
          <p>Carregando planilhas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="planilha-treino">
      <div className="planilha-treino-container">

        {/* CABEÇALHO */}
        <header className="planilha-treino-cabecalho">
          <h1>Planilhas de Treino</h1>

          <p>
            Gerencie suas planilhas de treino, visualize os
            exercícios e acompanhe os objetivos dos alunos.
          </p>
        </header>

        {/* BOTÃO CRIAR */}
        <div className="planilha-treino-topo">
          <button
            className="botao-criar"
            onClick={() => navigate("/criar-planilha")}
          >
            + Criar nova planilha
          </button>
        </div>

        {/* MENSAGEM DE ERRO */}
        {erro && (
          <p role="alert">{erro}</p>
        )}

        {/* LISTA DE PLANILHAS */}
        {planilhas.length === 0 ? (
          <div className="sem-planilhas">
            <h2>Nenhuma planilha cadastrada</h2>

            <p>
              Comece criando uma nova planilha de treino
              para seus alunos.
            </p>
          </div>
        ) : (
          <div className="planilhas-lista">

            {planilhas.map((planilha) => {
              const {
                nomeTreino,
                objetivo,
                quantidade,
              } = resumoPlanilha(planilha);

              return (
                <div
                  key={planilha.codigoPlanoTreino}
                  className="planilha-card"
                >

                  {/* NOME DO ALUNO */}
                  <h3>
                    {tituloPlanilha(planilha, contexto)}
                  </h3>

                  {/* NOME DO TREINO */}
                  {nomeTreino && (
                    <p>
                      <strong>Treino:</strong> {nomeTreino}
                    </p>
                  )}

                  {/* OBJETIVO */}
                  {objetivo && (
                    <p>
                      <strong>Objetivo:</strong> {objetivo}
                    </p>
                  )}

                  {/* QUANTIDADE DE EXERCÍCIOS */}
                  {quantidade > 0 && (
                    <p>
                      {quantidade}{" "}
                      {quantidade === 1
                        ? "exercício"
                        : "exercícios"}
                    </p>
                  )}

                  {/* BOTÕES DE AÇÃO */}
                  <div className="acoes">

                    <button
                      className="botao-editar"
                      onClick={() =>
                        navigate("/criar-planilha", {
                          state: { planilha },
                        })
                      }
                    >
                      Editar
                    </button>

                    <button
                      className="botao-excluir"
                      onClick={() =>
                        excluirPlanilha(
                          planilha.codigoPlanoTreino
                        )
                      }
                    >
                      Excluir
                    </button>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}
