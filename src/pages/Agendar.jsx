import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Agendar.css";

export default function Agendar() {
  const navigate = useNavigate();

  // ==============================
  // ESTADOS
  // ==============================
  const [aluno, setAluno] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");

  const [alunos, setAlunos] = useState([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  // ==============================
  // BUSCAR ALUNOS
  // ==============================
  async function buscarAlunos() {
    try {
      setCarregandoAlunos(true);
      setErro("");

      const response = await fetch("http://localhost:3000/alunos");

      const dados = await response.json();

      console.log("GET /alunos");
      console.log("Status:", response.status);
      console.log("Dados:", dados);

      if (!response.ok) {
        throw new Error(
          dados.erro ||
            dados.detalhe ||
            `Erro HTTP ${response.status}`
        );
      }

      setAlunos(dados);
    } catch (error) {
      console.error("Erro ao buscar alunos:", error);

      setErro(
        error.message ||
          "Não foi possível carregar os alunos."
      );
    } finally {
      setCarregandoAlunos(false);
    }
  }

  // Executa quando a tela abre
  useEffect(() => {
    buscarAlunos();
  }, []);

  // ==============================
  // AGENDAR
  // ==============================
  async function agendar(event) {
    event.preventDefault();

    // ==============================
    // VALIDAR CAMPOS
    // ==============================
    if (!aluno || !data || !horario) {
      setErro("Preencha todos os campos.");
      return;
    }

    try {
      setCarregando(true);
      setErro("");

      // ==============================
      // DADOS DO AGENDAMENTO
      // ==============================
      const dadosAgendamento = {
        codigoAluno: Number(aluno),
        codigoPersonal: 1,
        dataAgendamento: data,
        horarioAgendamento: horario,
        statusAgendamento: "PENDENTE",
      };

      console.log("================================");
      console.log("ENVIANDO AGENDAMENTO");
      console.log("Dados:", dadosAgendamento);
      console.log("================================");

      // ==============================
      // POST
      // ==============================
      const response = await fetch(
        "http://localhost:3000/agendamento",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(dadosAgendamento),
        }
      );

      // ==============================
      // LER RESPOSTA
      // ==============================
      const dados = await response.json();

      console.log("================================");
      console.log("RESPOSTA DO BACKEND");
      console.log("Status:", response.status);
      console.log("Dados:", dados);
      console.log("================================");

      // ==============================
      // VERIFICAR ERRO
      // ==============================
      if (!response.ok) {
        throw new Error(
          dados.erro ||
            dados.detalhe ||
            dados.message ||
            `Erro HTTP ${response.status}`
        );
      }

      // ==============================
      // SUCESSO
      // ==============================
      console.log(
        "Agendamento criado com sucesso:",
        dados
      );

      alert("Horário agendado com sucesso!");

      navigate("/minha-agenda");
    } catch (error) {
      console.error("================================");
      console.error("ERRO AO AGENDAR HORÁRIO");
      console.error("Mensagem:", error.message);
      console.error("Erro completo:", error);
      console.error("================================");

      setErro(
        error.message ||
          "Não foi possível agendar o horário."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="agendar">
      <div className="agendar-container">

        <header className="agendar-cabecalho">
          <h1>Agendar horário</h1>

          <p>
            Escolha o aluno, a data e o horário do atendimento.
          </p>
        </header>

        <form
          className="agendar-form"
          onSubmit={agendar}
        >

          {/* ==============================
              ERRO
          ============================== */}
          {erro && (
            <p className="erro">
              {erro}
            </p>
          )}

          {/* ==============================
              ALUNO
          ============================== */}
          <label htmlFor="aluno">
            Aluno
          </label>

          <select
            id="aluno"
            value={aluno}
            onChange={(event) => {
              setAluno(event.target.value);
              setErro("");
            }}
            required
            disabled={carregandoAlunos}
          >
            <option value="">
              {carregandoAlunos
                ? "Carregando alunos..."
                : "Selecione um aluno"}
            </option>

            {alunos.map((alunoItem) => {
              /*
               * O endpoint /alunos retorna:
               *
               * codigoaluno
               * nome
               *
               * Portanto usamos exatamente esses campos.
               */
              const idAluno = alunoItem.codigoaluno;
              const nomeAluno = alunoItem.nome;

              return (
                <option
                  key={idAluno}
                  value={idAluno}
                >
                  {nomeAluno}
                </option>
              );
            })}
          </select>

          {/* ==============================
              DATA
          ============================== */}
          <label htmlFor="data">
            Data
          </label>

          <input
            id="data"
            type="date"
            value={data}
            onChange={(event) => {
              setData(event.target.value);
              setErro("");
            }}
            required
          />

          {/* ==============================
              HORÁRIO
          ============================== */}
          <label htmlFor="horario">
            Horário
          </label>

          <input
            id="horario"
            type="time"
            value={horario}
            onChange={(event) => {
              setHorario(event.target.value);
              setErro("");
            }}
            required
          />

          {/* ==============================
              BOTÕES
          ============================== */}
          <div className="agendar-acoes">

            <button
              type="button"
              onClick={() => navigate("/minha-agenda")}
              disabled={carregando}
            >
              Voltar
            </button>

            <button
              type="submit"
              disabled={
                carregando ||
                carregandoAlunos
              }
            >
              {carregando
                ? "Agendando..."
                : "Agendar horário"}
            </button>

          </div>

        </form>
      </div>
    </main>
  );
}