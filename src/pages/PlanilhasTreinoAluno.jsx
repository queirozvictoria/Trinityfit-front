
import { useCallback, useEffect, useState } from "react";
import "./PlanilhasTreinoAluno.css";

const API_URL = "http://localhost:3000";

function formatarData(valor) {
  if (!valor) return "";

  const [ano, mes, dia] = String(valor).split("T")[0].split("-");

  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "";
}

function formatarHorario(valor) {
  return valor ? String(valor).slice(0, 5) : "";
}

function tituloTreino(planilha) {
  const data = formatarData(planilha.dataAgendamento);
  const horario = formatarHorario(planilha.horarioAgendamento);

  if (!data) return "Ficha de acompanhamento";

  return horario
    ? `Treino de ${data} às ${horario}`
    : `Treino de ${data}`;
}

export default function PlanilhasTreinoAluno() {
  const [planilhas, setPlanilhas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const buscarMeusTreinos = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const usuario = JSON.parse(
        localStorage.getItem("usuario") || "null"
      );

      const codigoAluno = usuario?.codigoAluno;

      // Recupera o token armazenado durante o login
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Sua sessão expirou. Faça login novamente."
        );
      }

      if (!codigoAluno) {
        throw new Error(
          "Aluno não identificado. Faça login novamente."
        );
      }

      // Envia o token JWT para o middleware
      const response = await fetch(
        `${API_URL}/plano-treino/aluno/${codigoAluno}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const dados = await response.json();

      if (!response.ok) {
        throw new Error(
          dados.erro ||
          dados.message ||
          "Não foi possível carregar seus treinos."
        );
      }

      if (!Array.isArray(dados)) {
        throw new Error(
          "O servidor retornou dados em um formato inválido."
        );
      }

      setPlanilhas(dados);

    } catch (error) {
      console.error("Erro ao buscar planilhas:", error);

      setErro(
        error.message || "Erro ao conectar com o servidor."
      );

    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarMeusTreinos();
  }, [buscarMeusTreinos]);

  return (
    <main className="planilha-aluno">
      <div className="planilha-aluno-container">

        <header className="planilha-aluno-cabecalho">
          <h1>Meu Treino</h1>
          <p>Confira os treinos definidos pelo seu personal.</p>
        </header>

        <div className="planilha-semana">
          Treino da semana
        </div>

        {erro && (
          <div className="mensagem-erro" role="alert">
            <p>{erro}</p>

            <button
              type="button"
              onClick={buscarMeusTreinos}
              disabled={carregando}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {carregando && (
          <p className="mensagem-carregando">
            Carregando sua planilha...
          </p>
        )}

        {!carregando && !erro && (
          <div className="lista-planilhas-conteudo">

            {planilhas.length === 0 ? (
              <p className="lista-vazia">
                Você ainda não possui nenhuma planilha de treino vinculada.
              </p>
            ) : (
              planilhas.map((planilha) => (
                <section
                  className="treino-card"
                  key={planilha.codigoPlanoTreino}
                >
                  <p className="treino-dia">
                    Treino vinculado
                  </p>

                  <h2 className="nome-treino">
                    {tituloTreino(planilha)}
                  </h2>

                  <div
                    className="exercicio informacoes-exercicio"
                    style={{
                      whiteSpace: "pre-line",
                      lineHeight: 1.7,
                    }}
                  >
                    {planilha.descricaoPlanoTreino ||
                      "Nenhuma descrição foi adicionada a esta planilha."}
                  </div>
                </section>
              ))
            )}

          </div>
        )}

        <div className="somente-leitura">
          Esta planilha é definida pelo seu personal e não pode ser alterada
          por você.
        </div>

      </div>
    </main>
  );
}
