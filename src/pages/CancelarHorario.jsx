import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import "./CancelarHorario.css";

function formatarData(valor) {
  if (!valor) return "—";

  const [ano, mes, dia] = String(valor).split("T")[0].split("-");

  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "—";
}

function formatarHorario(valor) {
  return valor ? String(valor).slice(0, 5) : "—";
}

export default function CancelarHorario() {
  const navigate = useNavigate();
  const location = useLocation();

  const horarioAtual = location.state?.horario;
  const idAgendamento = horarioAtual?.codigoAgendamento;

  const jaCancelado =
    String(horarioAtual?.statusAgendamento ?? "").toUpperCase() ===
    "CANCELADO";

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function cancelarAgendamento(event) {
    event.preventDefault();
    setErro("");

    if (!idAgendamento) {
      setErro(
        "Não foi possível identificar este agendamento. Volte à agenda e selecione o horário novamente."
      );
      return;
    }

    try {
      setCarregando(true);

      const resposta = await api.patch(
        `/agendamento/${idAgendamento}/status`,
        { statusAgendamento: "CANCELADO" }
      );

      console.log("Agendamento cancelado:", resposta.data);

      navigate("/minha-agenda", {
        state: { mensagem: "Horário cancelado com sucesso!" },
      });
    } catch (error) {
      console.error("Erro ao cancelar horário:", error);

      setErro(
        error.response?.data?.erro ||
          error.response?.data?.message ||
          "Não foi possível cancelar o horário. Tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="alterar-horario">
      <div className="alterar-horario-container">
        <header className="alterar-horario-cabecalho">
          <h1>Cancelar horário</h1>
          <p>Confirme o cancelamento do atendimento abaixo.</p>
        </header>

        {horarioAtual ? (
          <form
            className="alterar-horario-form"
            onSubmit={cancelarAgendamento}
          >
            <div className="informacao-aluno">
              <strong>Aluno:</strong>
              <span>
                {horarioAtual.aluno ||
                  horarioAtual.nomeAluno ||
                  `Aluno #${horarioAtual.codigoAluno ?? "—"}`}
              </span>
            </div>

            <div className="informacao-aluno">
              <strong>Data:</strong>
              <span>{formatarData(horarioAtual.dataAgendamento)}</span>
            </div>

            <div className="informacao-aluno">
              <strong>Horário:</strong>
              <span>
                {formatarHorario(horarioAtual.horarioAgendamento)}
              </span>
            </div>

            {jaCancelado && (
              <p className="erro" role="alert">
                Este horário já está cancelado.
              </p>
            )}

            {erro && (
              <p className="erro" role="alert">
                {erro}
              </p>
            )}

            <div className="alterar-horario-acoes">
              <button
                type="button"
                className="botao-horario-voltar"
                onClick={() => navigate("/minha-agenda")}
                disabled={carregando}
              >
                Voltar
              </button>

              <button
                type="submit"
                className="botao-horario-salvar"
                disabled={carregando || jaCancelado}
              >
                {carregando ? "Cancelando..." : "Confirmar cancelamento"}
              </button>
            </div>
          </form>
        ) : (
          <div className="horario-nao-encontrado">
            <p>Nenhum horário foi selecionado.</p>
            <button
              type="button"
              onClick={() => navigate("/minha-agenda")}
            >
              Voltar para minha agenda
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
