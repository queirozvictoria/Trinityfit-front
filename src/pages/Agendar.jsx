import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Agendar.css";

const API_URL = "http://localhost:3000";

/* =====================================================
   HELPERS
   ===================================================== */

function obterCodigoPersonal() {
  try {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
    const codigo = usuario?.codigoPersonal ?? usuario?.codigopersonal;
    return codigo ? Number(codigo) : null;
  } catch {
    return null;
  }
}

function obterHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function mensagemErro(dados, padrao) {
  return dados?.erro || dados?.detalhe || dados?.message || dados?.mensagem || padrao;
}

/** Faz a requisição, lê o JSON e lança Error com mensagem amigável se falhar. */
async function requisitar(caminho, opcoes = {}) {
  const response = await fetch(`${API_URL}${caminho}`, {
    headers: obterHeaders(),
    ...opcoes,
  });
  const dados = await response.json();

  if (!response.ok) {
    throw new Error(mensagemErro(dados, `Erro HTTP ${response.status}`));
  }

  return dados;
}

/** Data de hoje (fuso local) no formato yyyy-mm-dd, usada como mínimo do campo de data. */
function hojeISO() {
  const agora = new Date();
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
  return agora.toISOString().slice(0, 10);
}

/* =====================================================
   COMPONENTES AUXILIARES
   ===================================================== */

function Campo({ id, label, children }) {
  return (
    <div className="agendar-campo">
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

/* =====================================================
   TELA
   ===================================================== */

const FORM_INICIAL = { aluno: "", data: "", horario: "" };

export default function Agendar() {
  const navigate = useNavigate();

  const [codigoPersonal] = useState(obterCodigoPersonal);
  const [form, setForm] = useState(FORM_INICIAL);

  const [alunos, setAlunos] = useState([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const ocupado = carregando || carregandoAlunos;

  useEffect(() => {
    async function buscarAlunos() {
      try {
        setCarregandoAlunos(true);
        setErro("");

        const dados = await requisitar("/alunos");
        setAlunos(Array.isArray(dados) ? dados : []);
      } catch (error) {
        console.error("Erro ao buscar alunos:", error);
        setErro(error.message || "Não foi possível carregar os alunos.");
      } finally {
        setCarregandoAlunos(false);
      }
    }

    buscarAlunos();
  }, []);

  function alterarCampo(event) {
    const { name, value } = event.target;

    setForm((anterior) => ({ ...anterior, [name]: value }));
    setErro("");
  }

  async function agendar(event) {
    event.preventDefault();

    if (!codigoPersonal) {
      setErro("Personal não identificado. Faça login novamente.");
      return;
    }

    if (!localStorage.getItem("token")) {
      setErro("Sessão não encontrada. Faça login novamente.");
      return;
    }

    if (!form.aluno || !form.data || !form.horario) {
      setErro("Preencha todos os campos.");
      return;
    }

    try {
      setCarregando(true);
      setErro("");

      await requisitar("/agendamento", {
        method: "POST",
        body: JSON.stringify({
          codigoAluno: Number(form.aluno),
          codigoPersonal,
          dataAgendamento: form.data,
          horarioAgendamento: form.horario,
          statusAgendamento: "PENDENTE",
        }),
      });

      alert("Horário agendado com sucesso!");
      navigate("/minha-agenda");
    } catch (error) {
      console.error("Erro ao agendar horário:", error);
      setErro(error.message || "Não foi possível agendar o horário.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="agendar">
      <div className="agendar-container">
        <header className="agendar-cabecalho">
          <h1>Agendar horário</h1>
          <p>Escolha o aluno, a data e o horário do atendimento.</p>
        </header>

        <form className="agendar-form" onSubmit={agendar} noValidate>
          {erro && (
            <p className="agendar-erro" role="alert">
              {erro}
            </p>
          )}

          <Campo id="aluno" label="Aluno">
            <select
              id="aluno"
              name="aluno"
              value={form.aluno}
              onChange={alterarCampo}
              disabled={carregandoAlunos}
              required
            >
              <option value="">
                {carregandoAlunos ? "Carregando alunos..." : "Selecione um aluno"}
              </option>

              {alunos.map((item) => {
                const idAluno = item.codigoaluno ?? item.codigoAluno;

                return (
                  <option key={idAluno} value={idAluno}>
                    {item.nome}
                  </option>
                );
              })}
            </select>
          </Campo>

          <Campo id="data" label="Data">
            <input
              id="data"
              name="data"
              type="date"
              min={hojeISO()}
              value={form.data}
              onChange={alterarCampo}
              required
            />
          </Campo>

          <Campo id="horario" label="Horário">
            <input
              id="horario"
              name="horario"
              type="time"
              value={form.horario}
              onChange={alterarCampo}
              required
            />
          </Campo>

          <div className="agendar-acoes">
            <button
              type="button"
              className="agendar-btn agendar-btn-secundario"
              onClick={() => navigate("/minha-agenda")}
              disabled={carregando}
            >
              Voltar
            </button>

            <button
              type="submit"
              className="agendar-btn agendar-btn-primario"
              disabled={ocupado}
              aria-busy={carregando}
            >
              {carregando ? "Agendando..." : "Agendar horário"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}