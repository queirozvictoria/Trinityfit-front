
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
import "./MeusAlunos.css";

export default function MeusAlunos() {
  const navigate = useNavigate();

  const [alunos, setAlunos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const buscarAlunos = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await api.get("/alunos");

      if (!Array.isArray(resposta.data)) {
        throw new Error("A resposta do servidor não é uma lista de alunos.");
      }

      setAlunos(resposta.data);
    } catch (error) {
      console.error("Erro ao buscar alunos:", error);
      setAlunos([]);

      setErro(
        error.response?.data?.erro ||
        error.message ||
        "Não foi possível carregar os alunos."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarAlunos();
  }, [buscarAlunos]);

  function abrirAluno(aluno) {
    navigate("/aluno", {
      state: { aluno },
    });
  }

  return (
    <main className="meus-alunos">
      <div className="meus-alunos-container">
        <header className="meus-alunos-cabecalho">
          <div>
            <h1>Meus Alunos</h1>
            <p>Consulte os alunos cadastrados.</p>
          </div>

          <button
            type="button"
            className="btn-atualizar-alunos"
            onClick={buscarAlunos}
            disabled={carregando}
          >
            {carregando ? "Atualizando..." : "Atualizar lista"}
          </button>
        </header>

        {carregando && (
          <p className="mensagem-carregando" role="status">
            Carregando alunos...
          </p>
        )}

        {!carregando && erro && (
          <div className="mensagem-erro-container">
            <p className="mensagem-erro" role="alert">
              {erro}
            </p>

            <button
              type="button"
              className="btn-tentar-novamente"
              onClick={buscarAlunos}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!carregando && !erro && (
          <div className="lista-alunos">
            {alunos.length === 0 ? (
              <p className="lista-vazia">
                Nenhum aluno cadastrado no momento.
              </p>
            ) : (
              alunos.map((aluno, index) => {
                const idAluno =
                  aluno.codigoaluno ??
                  aluno.codigoAluno ??
                  aluno.id ??
                  aluno.idAluno;

                const nomeAluno =
                  aluno.nome?.trim() ||
                  aluno.nomeAluno ||
                  "Aluno sem nome";

                const emailAluno =
                  aluno.email ||
                  "E-mail não informado";

                return (
                  <button
                    key={idAluno ?? `${nomeAluno}-${emailAluno}-${index}`}
                    type="button"
                    className="aluno-card"
                    onClick={() => abrirAluno(aluno)}
                    disabled={idAluno == null}
                  >
                    <h3>{nomeAluno}</h3>
                    <p>{emailAluno}</p>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </main>
  );
}
