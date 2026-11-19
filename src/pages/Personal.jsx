
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Personal.css";

const API_URL = "http://localhost:3000";

// Identificar o personal que realizou o login
function obterCodigoPersonal() {
  try {
    const usuario = JSON.parse(
      localStorage.getItem("usuario") || "null"
    );

    return (
      usuario?.codigoPersonal ??
      usuario?.codigopersonal ??
      usuario?.personal?.codigoPersonal ??
      usuario?.personal?.codigopersonal ??
      null
    );
  } catch {
    return null;
  }
}

export default function Personal() {
  const navigate = useNavigate();

  const [personal, setPersonal] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const codigoPersonal = obterCodigoPersonal();

  const buscarDadosPersonal = useCallback(async () => {
    if (!codigoPersonal) {
      setErro("Personal não identificado. Faça login novamente.");
      setPersonal(null);
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      setErro("");

      const response = await fetch(
        `${API_URL}/personal/${codigoPersonal}`
      );

      const dados = await response.json();

      if (!response.ok) {
        throw new Error(
          dados.erro || "Não foi possível carregar os dados do personal."
        );
      }

      setPersonal(dados);
    } catch (error) {
      console.error("Erro ao buscar dados do personal:", error);

      setErro(error.message || "Erro ao carregar os dados.");
    } finally {
      setCarregando(false);
    }
  }, [codigoPersonal]);

  useEffect(() => {
    buscarDadosPersonal();
  }, [buscarDadosPersonal]);

  const nomePersonal =
    personal?.nome ||
    personal?.nomePersonal;

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
              <p>
                Não foi possível carregar seus dados.
                Clique para tentar novamente.
              </p>
            </button>
          )}
        </header>

        <h2 className="personal-servicos-titulo">
          Serviços
        </h2>

        <nav
          className="personal-servicos"
          aria-label="Serviços do personal"
        >
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

          <button
            type="button"
            className="personal-servico"
            onClick={() => navigate("/disponibilidade")}
          >
            Adicionar meus horários disponíveis
          </button>
        </nav>
      </div>
    </main>
  );
}
