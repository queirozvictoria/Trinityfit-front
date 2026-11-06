
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import "./AlterarHorario.css";

export default function AlterarHorario() {
  const navigate = useNavigate();
  const location = useLocation();

  const horarioAtual = location.state?.horario;

  const [data, setData] = useState(() =>
    horarioAtual?.dataAgendamento
      ? String(horarioAtual.dataAgendamento).split("T")[0]
      : ""
  );

  const [horario, setHorario] = useState(() =>
    horarioAtual?.horarioAgendamento
      ? String(horarioAtual.horarioAgendamento).slice(0, 5)
      : ""
  );

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function salvarAlteracao(event) {
    event.preventDefault();

    if (!data || !horario) {
      setErro("Preencha a data e o horário.");
      return;
    }

    const idAgendamento = horarioAtual?.codigoAgendamento;

    if (!idAgendamento) {
      setErro("Não foi possível identificar este agendamento.");
      return;
    }

    if (
      !horarioAtual?.codigoAluno ||
      !horarioAtual?.codigoPersonal
    ) {
      setErro("Não foi possível identificar o aluno ou o personal.");
      return;
    }

    try {
      setCarregando(true);
      setErro("");
      setSucesso("");

      const resposta = await api.put(
        `/agendamento/${idAgendamento}`,
        {
          codigoAluno: horarioAtual.codigoAluno,
          codigoPersonal: horarioAtual.codigoPersonal,
          dataAgendamento: data,
          horarioAgendamento: horario,
          statusAgendamento:
            horarioAtual.statusAgendamento || "PENDENTE",
        }
      );

      console.log("Agendamento alterado:", resposta.data);

      setSucesso("Alteração salva com sucesso!");

      navigate("/minha-agenda", {
        state: { mensagem: "Horário alterado com sucesso!" },
      });
    } catch (error) {
      console.error("Erro ao alterar horário:", error);

      setErro(
        error.response?.data?.erro ||
        error.response?.data?.message ||
        error.message ||
        "Não foi possível alterar o horário. Tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="alterar-horario">
      <section className="alterar-horario-container">
        <header className="alterar-horario-cabecalho">
          <span className="alterar-horario-etiqueta">
            MINHA AGENDA
          </span>

          <h1>Alterar horário</h1>

          <p>
            Ajuste a data e o horário do atendimento de forma simples.
          </p>
        </header>

        {horarioAtual ? (
          <form
            className="alterar-horario-form"
            onSubmit={salvarAlteracao}
          >
            <div className="informacao-aluno">
              <span className="informacao-aluno-icone" aria-hidden="true">
                ♙
              </span>

              <div className="informacao-aluno-conteudo">
                <span className="informacao-aluno-titulo">
                  ALUNO DO AGENDAMENTO
                </span>

                <strong>
                  {horarioAtual.nomeAluno ||
                    horarioAtual.aluno ||
                    `Aluno #${horarioAtual.codigoAluno ?? "—"}`}
                </strong>
              </div>
            </div>

            {erro && (
              <p className="mensagem-horario erro" role="alert">
                {erro}
              </p>
            )}

            {sucesso && (
              <p className="mensagem-horario sucesso" role="status">
                {sucesso}
              </p>
            )}

            <div className="campo-horario">
              <label htmlFor="data">Data do atendimento</label>

              <input
                id="data"
                name="data"
                type="date"
                value={data}
                onChange={(event) => setData(event.target.value)}
                required
                disabled={carregando}
              />
            </div>

            <div className="campo-horario">
              <label htmlFor="horario">Horário do atendimento</label>

              <input
                id="horario"
                name="horario"
                type="time"
                value={horario}
                onChange={(event) => setHorario(event.target.value)}
                required
                disabled={carregando}
              />
            </div>

            <div className="alterar-horario-acoes">
              <button
                className="botao-horario-voltar"
                type="button"
                onClick={() => navigate("/minha-agenda")}
                disabled={carregando}
              >
                Voltar
              </button>

              <button
                className="botao-horario-salvar"
                type="submit"
                disabled={carregando}
              >
                {carregando ? "Salvando..." : "Salvar alteração"}
              </button>
            </div>
          </form>
        ) : (
          <div className="horario-nao-encontrado">
            <span className="horario-nao-encontrado-icone" aria-hidden="true">
              !
            </span>

            <h2>Nenhum horário selecionado</h2>

            <p>
              Volte para sua agenda e escolha o atendimento que deseja alterar.
            </p>

            <button
              type="button"
              onClick={() => navigate("/minha-agenda")}
            >
              Voltar para minha agenda
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
