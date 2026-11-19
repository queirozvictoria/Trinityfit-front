import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./CriarPlanilha.css";

const API_URL = "http://localhost:3000";

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
// Treino: Treino A - Peito e Tríceps
// Objetivo: ...
//
// Exercícios:
// 1. Nome
// Séries: 4 | Repetições: 12 | Descanso: 60 segundos
//
// (planilhas antigas, sem a linha "Treino:", continuam sendo lidas normalmente)
function lerDescricao(texto) {
  const descricao = String(texto ?? "");

  const nomeTreino =
    descricao.match(/^Treino:\s*(.*)$/m)?.[1]?.trim() ?? "";

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
    nomeTreino,
    objetivo,
    exercicios: exercicios.length > 0 ? exercicios : [novoExercicio()],
  };
}

export default function CriarPlanilha() {
  const navigate = useNavigate();
  const location = useLocation();

  // Busca os dados do personal que realizou o login.
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const codigoPersonalLogado =
    usuario?.codigoPersonal ?? usuario?.codigopersonal ?? null;

  // MODO EDIÇÃO: a planilha chega em location.state
  const planoEdicao =
    location.state?.planilha ?? location.state?.plano ?? null;

  const codigoPlanoEdicao = planoEdicao?.codigoPlanoTreino ?? null;
  const editando = Boolean(codigoPlanoEdicao);

  const dadosIniciais = editando
    ? lerDescricao(planoEdicao.descricaoPlanoTreino)
    : null;

  const [planilha, setPlanilha] = useState({
    // Lista de alunos marcados (no modo edição fica só o aluno da planilha)
    codigoAlunos: editando
      ? [String(planoEdicao.codigoAluno ?? planoEdicao.codigoaluno ?? "")]
      : [],
    nomeTreino: dadosIniciais?.nomeTreino ?? "",
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

        // /alunos pode devolver os campos em minúsculas (codigoaluno),
        // então normaliza para codigoAluno.
        if (ativo) {
          setAlunos(
            dados.map((aluno) => ({
              ...aluno,
              codigoAluno: aluno.codigoAluno ?? aluno.codigoaluno,
            }))
          );
        }
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

  // Marca / desmarca um aluno na lista
  function alternarAluno(codigoAluno) {
    setErro("");

    const codigo = String(codigoAluno);

    setPlanilha((estadoAnterior) => ({
      ...estadoAnterior,
      codigoAlunos: estadoAnterior.codigoAlunos.includes(codigo)
        ? estadoAnterior.codigoAlunos.filter((c) => c !== codigo)
        : [...estadoAnterior.codigoAlunos, codigo],
    }));
  }

  // Marca todos ou desmarca todos
  function alternarTodos() {
    setErro("");

    setPlanilha((estadoAnterior) => ({
      ...estadoAnterior,
      codigoAlunos:
        estadoAnterior.codigoAlunos.length === alunos.length
          ? []
          : alunos.map((aluno) => String(aluno.codigoAluno)),
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
    const codigoPersonal =
      planoEdicao?.codigoPersonal ?? codigoPersonalLogado;

    if (!codigoPersonal) {
      return "Personal não identificado. Faça login novamente.";
    }

    if (
      planilha.codigoAlunos.length === 0 ||
      planilha.codigoAlunos.some((c) => !c || Number.isNaN(Number(c)))
    ) {
      return "Selecione pelo menos um aluno.";
    }

    if (!planilha.nomeTreino.trim()) {
      return "Informe o nome do treino.";
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

  // Monta o texto salvo no banco (nome do treino + objetivo + todos os exercícios)
  function montarDescricao() {
    const gridExercicios = exercicios
      .map(
        (exercicio, index) =>
          `${index + 1}. ${exercicio.nome.trim()}\n` +
          `Séries: ${exercicio.series.trim()} | ` +
          `Repetições: ${exercicio.repeticoes.trim()} | ` +
          `Descanso: ${exercicio.descanso.trim()}`
      )
      .join("\n\n");

    return (
      `Treino: ${planilha.nomeTreino.trim()}\n` +
      `Objetivo: ${planilha.objetivo.trim()}\n\n` +
      `Exercícios:\n${gridExercicios}`
    );
  }

  // Envia a planilha de UM aluno (POST ou PUT)
  async function enviarPlanilha(codigoAluno, descricaoPlanoTreino) {
    const url = editando
      ? `${API_URL}/plano-treino/${codigoPlanoEdicao}`
      : `${API_URL}/plano-treino`;

    const response = await fetch(url, {
      method: editando ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        codigoAluno: Number(codigoAluno),
        codigoPersonal: Number(
          planoEdicao?.codigoPersonal ?? codigoPersonalLogado
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

    return dados;
  }

  // ==========================================
  // SALVAR PLANILHA
  // - criando: uma planilha (POST) para cada aluno marcado
  // - editando: PUT na planilha do aluno
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

      const descricaoPlanoTreino = montarDescricao();
      const codigos = planilha.codigoAlunos;

      const resultados = await Promise.allSettled(
        codigos.map((codigo) => enviarPlanilha(codigo, descricaoPlanoTreino))
      );

      const falhas = codigos.filter(
        (_, i) => resultados[i].status === "rejected"
      );

      if (falhas.length > 0) {
        const salvos = codigos.length - falhas.length;

        const nomesFalhas = falhas
          .map((codigo) => {
            const aluno = alunos.find(
              (a) => String(a.codigoAluno) === String(codigo)
            );
            return aluno ? nomeDoAluno(aluno) : `Aluno ${codigo}`;
          })
          .join(", ");

        // Deixa marcados só os alunos que falharam, para tentar de novo
        // sem duplicar a planilha de quem já foi salvo.
        setPlanilha((estadoAnterior) => ({
          ...estadoAnterior,
          codigoAlunos: falhas.map(String),
        }));

        setErro(
          (salvos > 0
            ? `${salvos} planilha(s) salva(s). `
            : "") + `Não foi possível salvar para: ${nomesFalhas}.`
        );

        return;
      }

      alert(
        editando
          ? "Plano de treino atualizado com sucesso!"
          : codigos.length > 1
            ? `Plano de treino salvo para ${codigos.length} alunos!`
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

  const todosMarcados =
    alunos.length > 0 && planilha.codigoAlunos.length === alunos.length;

  return (
    <main className="criar-planilha">
      <div className="criar-planilha-container">
        <header className="criar-planilha-cabecalho">
          <h1>{editando ? "Editar Planilha" : "Criar Planilha"}</h1>
          <p>
            {editando
              ? "Altere o treino personalizado do seu aluno."
              : "Monte o treino e escolha um ou mais alunos para recebê-lo."}
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

            {/* ALUNOS */}
            <div className="campo-planilha">
              <label>
                {editando ? "Aluno" : "Alunos"}
                {!editando && planilha.codigoAlunos.length > 0 && (
                  <> ({planilha.codigoAlunos.length} selecionado(s))</>
                )}
              </label>

              {editando ? (
                // Na edição a planilha pertence a um aluno só
                <input
                  type="text"
                  className="input-planilha"
                  value={(() => {
                    const aluno = alunos.find(
                      (a) =>
                        String(a.codigoAluno) === planilha.codigoAlunos[0]
                    );
                    return aluno
                      ? nomeDoAluno(aluno)
                      : `Aluno ${planilha.codigoAlunos[0]}`;
                  })()}
                  disabled
                />
              ) : (
                <>
                  {carregandoAlunos && <small>Carregando alunos...</small>}

                  {!carregandoAlunos && alunos.length === 0 && !erro && (
                    <small>Nenhum aluno cadastrado.</small>
                  )}

                  {alunos.length > 0 && (
                    <div className="lista-alunos">
                      <label className="aluno-opcao aluno-opcao-todos">
                        <input
                          type="checkbox"
                          checked={todosMarcados}
                          onChange={alternarTodos}
                          disabled={carregando}
                        />
                        <span>Marcar todos</span>
                      </label>

                      {alunos.map((aluno) => (
                        <label
                          key={aluno.codigoAluno}
                          className="aluno-opcao"
                        >
                          <input
                            type="checkbox"
                            checked={planilha.codigoAlunos.includes(
                              String(aluno.codigoAluno)
                            )}
                            onChange={() => alternarAluno(aluno.codigoAluno)}
                            disabled={carregando}
                          />
                          <span>{nomeDoAluno(aluno)}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* NOME DO TREINO */}
            <div className="campo-planilha">
              <label htmlFor="nomeTreino">Nome do treino</label>

              <input
                id="nomeTreino"
                type="text"
                className="input-planilha"
                placeholder="Ex: Treino A - Peito e Tríceps"
                value={planilha.nomeTreino}
                onChange={(event) =>
                  atualizarPlanilha("nomeTreino", event.target.value)
                }
                required
                disabled={carregando}
              />
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
                : planilha.codigoAlunos.length > 1
                  ? `Salvar para ${planilha.codigoAlunos.length} alunos`
                  : "Salvar planilha"}
          </button>
        </form>
      </div>
    </main>
  );
}