import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Personal.css";

// Identificador do personal trainer
const CODIGO_PERSONAL_LOGADO = 1;

export default function Personal() {
  const navigate = useNavigate();

  const [personal, setPersonal] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const buscarDadosPersonal = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const response = await fetch(
        `http://localhost:3000/personal/${CODIGO_PERSONAL_LOGADO}`
      );

      if (!response.ok) {
        throw new Error("Não foi possível carregar os dados do personal.");
      }

      const dados = await response.json();
      setPersonal(dados);
    } catch (error) {
      console.error("Erro ao buscar dados do personal:", error);
      setErro(error.message || "Erro ao carregar os dados.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarDadosPersonal();
  }, [buscarDadosPersonal]);

  const nomePersonal = personal?.nome || personal?.nomePersonal;

  return (
    <main className="personal">
      <div className="personal-container">
        <header className="personal-cabecalho">
          <h1>Área do Personal</h1>

          <p aria-live="polite">
            {carregando
              ? "Carregando informações..."
              : erro
                ? "Não foi possível carregar suas informações."
                : nomePersonal
                  ? `Bem-vindo à sua área de trabalho, ${nomePersonal}!`
                  : "Bem-vindo à sua área de trabalho!"}
          </p>

          {!carregando && erro && (
            <button
              type="button"
              className="personal-servico"
              onClick={buscarDadosPersonal}
            >
              <h3>Tentar novamente</h3>
              <p>Não foi possível carregar seus dados. Clique para tentar novamente.</p>
            </button>
          )}
        </header>

        <h2 className="personal-servicos-titulo">Serviços</h2>

        <nav className="personal-servicos" aria-label="Serviços do personal">
          <button
            type="button"
            className="personal-servico"
            onClick={() => navigate("/meus-alunos")}
          >
            <h3>Meus alunos</h3>
            <p>
              Consulte seus alunos e acompanhe seus treinos e informações.
            </p>
          </button>

          <button
            type="button"
            className="personal-servico"
            onClick={() => navigate("/minha-agenda")}
          >
            <h3>Meus horários</h3>
            <p>
              Consulte seus horários e organize seus atendimentos.
            </p>
          </button>

          <button
            type="button"
            className="personal-servico"
            onClick={() => navigate("/planilhas")}
          >
            <h3>Planilhas de treino</h3>
            <p>
              Crie e gerencie as planilhas de treino dos seus alunos.
            </p>
          </button>

          <button type="button" onClick={() => navigate("/disponibilidade")}>
           Adicionar meus horários disponíveis
           </button>

        </nav>
      </div>
    </main>
  );
}