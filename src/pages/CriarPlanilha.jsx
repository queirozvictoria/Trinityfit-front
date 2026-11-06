import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./CriarPlanilha.css";

const API_URL = "http://localhost:3000";

// Personal "logado" (fixo por enquanto, até existir login do personal).
const CODIGO_PERSONAL = 1;

function nomeDoAluno(aluno) {
  return (
    aluno.nomeAluno ??
    aluno.nome ??
    aluno.nomeCompleto ??
    `Aluno ${aluno.codigoAluno}`
  );
}

function novoExercicio(dados = {}) {
  return {
    id: crypto.randomUUID(),
    nome: dados.nome ?? "",
    series: dados.series ?? "",
    repeticoes: dados.repeticoes ?? "",
    descanso: dados.descanso ?? "",
  };
}

// Converte o texto salvo no banco de volta para o formulário:
//
// Objetivo: ...
//
// Exercícios:
// 1. Nome
// Séries: 4 | Repetições: 12 | Descanso: 60 segundos
function lerDescricao(texto) {
  const descricao = String(texto ?? "");

  const objetivo =
    descricao.match(/^Objetivo:\s*(.*)$/m)?.[1]?.trim() ?? "";

  const parteExercicios = descricao.split(/^Exercícios:\s*$/m)[1] ?? "";

  const exercicios = parteExercicios
    .trim()
    .split(/\n\s*\n/)
    .map((bloco) => {
      const linhas = bloco.trim().split("\n");
      const nome = (linhas[0] ?? "").replace(/^\d+\.\s*/, "").trim();
      const detalhes = linhas.slice(1).join(" ");

      const m = detalhes.match(
        /Séries:\s*(.*?)\s*\|\s*Repetições:\s*(.*?)\s*\|\s*Descanso:\s*(.*)$/
      );

      return nome
        ? novoExercicio({
            nome,
            series: m?.[1]?.trim(),
            repeticoes: m?.[2]?.trim(),
            descanso: m?.[3]?.trim(),
          })
        : null;
    })
    .filter(Boolean);

  return {
    objetivo,
    exercicios: exercicios.length > 0 ? exercicios : [novoExercicio()],
  };
}

export default function CriarPlanilha() {
  const navigate = useNavigate();
  const location = useLocation();

  // MODO EDIÇÃO: a planilha chega em location.state
  const planoEdicao =
    location.state?.planilha ?? location.state?.plano ?? null;

  const codigoPlanoEdicao = planoEdicao?.codigoPlanoTreino ?? null;
  const editando = Boolean(codigoPlanoEdicao);

  const dadosIniciais = editando
    ? lerDescricao(planoEdicao.descricaoPlanoTreino)
    : null;

  const [planilha, setPlanilha] = useState({
    codigoAluno: editando ? String(planoEdicao.codigoAluno ?? "") : "",
    objetivo: dadosIniciais?.objetivo ?? "",
  });

  const [alunos, setAlunos] = useState([]);
  const [exercicios, setExercicios] = useState(
    dadosIniciais?.exercicios ?? [novoExercicio()]
  );

  const [carregando, setCarregando] = useState(false);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [erro, setErro] = useState("");

  // ==========================================
  // BUSCAR ALUNOS CADASTRADOS
  // GET /alunos
  // ==========================================
  useEffect(() => {
    let ativo = true;

    async function carregarAlunos() {
      try {
        setCarregandoAlunos(true);

        const response = await fetch(`${API_URL}/alunos`);
        const texto = await response.text();

        let dados;

        try {
          dados = texto ? JSON.parse(texto) : [];
        } catch {
          throw new Error("O servidor retornou uma resposta inválida.");
        }

        if (!response.ok) {
          throw new Error(dados?.erro || "Não foi possível buscar os alunos.");
        }

        if (!Array.isArray(dados)) {
          throw new Error("Os alunos retornados pelo servidor são inválidos.");
        }

        if (ativo) setAlunos(dados);
      } catch (error) {
        console.error("Erro ao buscar alunos:", error);

        if (ativo) {
          setAlunos([]);
          setErro(error.message || "Não foi possível carregar os alunos.");
        }
      } finally {
        if (ativo) setCarregandoAlunos(false);
      }
    }

    carregarAlunos();

    return () => {
      ativo = false;
    };
  }, []);

  function atualizarPlanilha(campo, valor) {
    setErro("");

    setPlanilha((estadoAnterior) => ({
      ...estadoAnterior,
      [campo]: valor,
    }));
  }

  function adicionarExercicio() {
    setErro("");
    setExercicios((lista) => [...lista, novoExercicio()]);
  }

  function removerExercicio(id) {
    setErro("");
    setExercicios((lista) => lista.filter((e) => e.id !== id));
  }

  function atualizarExercicio(id, campo, valor) {
    setErro("");

    setExercicios((lista) =>
      lista.map((e) => (e.id === id ? { ...e, [campo]: valor } : e))
    );
  }

  function validarFormulario() {
    if (!planilha.codigoAluno) {
      return "Selecione um aluno.";
    }

    if (!planilha.objetivo.trim()) {
      return "Informe o objetivo do treino.";
    }

    if (exercicios.length === 0) {
      return "Adicione pelo menos um exercício.";
    }

    for (let i = 0; i < exercicios.length; i++) {
      const exercicio = exercicios[i];

      if (!exercicio.nome.trim()) {
        return `Informe o nome do exercício #${i + 1}.`;
      }

      if (!exercicio.series.trim()) {
        return `Informe as séries do exercício #${i + 1}.`;
      }

      if (!exercicio.repeticoes.trim()) {
        return `Informe as repetições do exercício #${i + 1}.`;
      }

      if (!exercicio.descanso.trim()) {
        return `Informe o descanso do exercício #${i + 1}.`;
      }
    }

    return "";
  }

  // ==========================================
  // SALVAR PLANILHA (POST / PUT)
  // ==========================================
  async function salvarPlanilha(event) {
    event.preventDefault();

    setErro("");

    const mensagemErro = validarFormulario();

    if (mensagemErro) {
      setErro(mensagemErro);
      return;
    }

    try {
      setCarregando(true);

      const gridExercicios = exercicios
        .map(
          (exercicio, index) =>
            `${index + 1}. ${exercicio.nome.trim()}\n` +
            `Séries: ${exercicio.series.trim()} | ` +
            `Repetições: ${exercicio.repeticoes.trim()} | ` +
            `Descanso: ${exercicio.descanso.trim()}`
        )
        .join("\n\n");

      const descricaoPlanoTreino =
        `Objetivo: ${planilha.objetivo.trim()}\n\n` +
        `Exercícios:\n${gridExercicios}`;

      const url = editando
        ? `${API_URL}/plano-treino/${codigoPlanoEdicao}`
        : `${API_URL}/plano-treino`;

      const response = await fetch(url, {
        method: editando ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigoAluno: Number(planilha.codigoAluno),
          codigoPersonal: Number(
            planoEdicao?.codigoPersonal ?? CODIGO_PERSONAL
          ),
          // mantém o vínculo com o agendamento, se a planilha já tinha
          codigoAgendamento: planoEdicao?.codigoAgendamento ?? null,
          descricaoPlanoTreino,
        }),
      });

      const texto = await response.text();

      let dados = {};

      try {
        dados = texto ? JSON.parse(texto) : {};
      } catch {
        throw new Error("O servidor retornou uma resposta inválida.");
      }

      if (!response.ok) {
        throw new Error(
          dados?.erro || "Não foi possível salvar o plano de treino."
        );
      }

      alert(
        editando
          ? "Plano de treino atualizado com sucesso!"
          : "Plano de treino salvo com sucesso!"
      );

      navigate("/planilhas");
    } catch (error) {
      console.error("Erro ao salvar plano:", error);

      setErro(
        error.message || "Não foi possível salvar o plano de treino."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="criar-planilha">
      <div className="criar-planilha-container">
        <header className="criar-planilha-cabecalho">
          <h1>{editando ? "Editar Planilha" : "Criar Planilha"}</h1>
          <p>
            {editando
              ? "Altere o treino personalizado do seu aluno."
              : "Monte o treino personalizado para seu aluno."}
          </p>
        </header>

        {erro && (
          <p className="mensagem-erro" role="alert">
            {erro}
          </p>
        )}

        <form onSubmit={salvarPlanilha}>
          <section className="planilha-secao">
            <h2>Informações da Planilha</h2>

            {/* ALUNO */}
            <div className="campo-planilha">
              <label htmlFor="aluno">Aluno</label>

              <select
                id="aluno"
                className="input-planilha"
                value={planilha.codigoAluno}
                onChange={(event) =>
                  atualizarPlanilha("codigoAluno", event.target.value)
                }
                required
                disabled={carregandoAlunos || carregando || editando}
              >
                <option value="">
                  {carregandoAlunos
                    ? "Carregando alunos..."
                    : "Selecione um aluno"}
                </option>

                {alunos.map((aluno) => (
                  <option
                    key={aluno.codigoAluno}
                    value={String(aluno.codigoAluno)}
                  >
                    {nomeDoAluno(aluno)}
                  </option>
                ))}
              </select>

              {!carregandoAlunos && alunos.length === 0 && !erro && (
                <small>Nenhum aluno cadastrado.</small>
              )}
            </div>

            {/* OBJETIVO */}
            <div className="campo-planilha">
              <label htmlFor="objetivo">Objetivo</label>

              <input
                id="objetivo"
                type="text"
                className="input-planilha"
                placeholder="Ex: Ganho de massa muscular"
                value={planilha.objetivo}
                onChange={(event) =>
                  atualizarPlanilha("objetivo", event.target.value)
                }
                required
                disabled={carregando}
              />
            </div>
          </section>

          <section className="planilha-secao">
            <h2>Exercícios</h2>

            {exercicios.map((exercicio, index) => (
              <div className="exercicio-card" key={exercicio.id}>
                <div className="exercicio-cabecalho-card">
                  <h3>Exercício #{index + 1}</h3>

                  {exercicios.length > 1 && (
                    <button
                      type="button"
                      className="btn-remover"
                      onClick={() => removerExercicio(exercicio.id)}
                      disabled={carregando}
                    >
                      Remover
                    </button>
                  )}
                </div>

                <div className="exercicio-campos">
                  <div className="campo-planilha">
                    <label htmlFor={`nome-${exercicio.id}`}>
                      Nome do Exercício
                    </label>

                    <input
                      id={`nome-${exercicio.id}`}
                      type="text"
                      className="input-planilha"
                      placeholder="Ex: Supino Reto"
                      value={exercicio.nome}
                      onChange={(event) =>
                        atualizarExercicio(
                          exercicio.id,
                          "nome",
                          event.target.value
                        )
                      }
                      required
                      disabled={carregando}
                    />
                  </div>

                  <div className="campo-planilha">
                    <label htmlFor={`series-${exercicio.id}`}>Séries</label>

                    <input
                      id={`series-${exercicio.id}`}
                      type="text"
                      className="input-planilha"
                      placeholder="Ex: 4"
                      value={exercicio.series}
                      onChange={(event) =>
                        atualizarExercicio(
                          exercicio.id,
                          "series",
                          event.target.value
                        )
                      }
                      required
                      disabled={carregando}
                    />
                  </div>

                  <div className="campo-planilha">
                    <label htmlFor={`repeticoes-${exercicio.id}`}>
                      Repetições
                    </label>

                    <input
                      id={`repeticoes-${exercicio.id}`}
                      type="text"
                      className="input-planilha"
                      placeholder="Ex: 12 ou Até a falha"
                      value={exercicio.repeticoes}
                      onChange={(event) =>
                        atualizarExercicio(
                          exercicio.id,
                          "repeticoes",
                          event.target.value
                        )
                      }
                      required
                      disabled={carregando}
                    />
                  </div>

                  <div className="campo-planilha">
                    <label htmlFor={`descanso-${exercicio.id}`}>
                      Descanso
                    </label>

                    <input
                      id={`descanso-${exercicio.id}`}
                      type="text"
                      className="input-planilha"
                      placeholder="Ex: 60 segundos"
                      value={exercicio.descanso}
                      onChange={(event) =>
                        atualizarExercicio(
                          exercicio.id,
                          "descanso",
                          event.target.value
                        )
                      }
                      required
                      disabled={carregando}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="btn-adicionar"
              onClick={adicionarExercicio}
              disabled={carregando}
            >
              + Adicionar exercício
            </button>
          </section>

          <button
            type="submit"
            className="btn-salvar"
            disabled={carregando || carregandoAlunos}
          >
            {carregando
              ? "Salvando..."
              : editando
                ? "Salvar alterações"
                : "Salvar planilha"}
          </button>
        </form>
      </div>
    </main>
  );
}