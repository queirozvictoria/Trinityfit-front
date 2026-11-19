
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./AgendarAluno.css";

const API_URL = "http://localhost:3000";

function obterUsuario() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    return null;
  }
}

function soData(valor) {
  return valor ? String(valor).split("T")[0] : "";
}

function formatarData(valor) {
  const [ano, mes, dia] = soData(valor).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "Data não informada";
}

function formatarHorario(valor) {
  return valor ? String(valor).slice(0, 5) : "--:--";
}

async function lerJson(response) {
  const texto = await response.text();

  try {
    return texto ? JSON.parse(texto) : {};
  } catch {
    throw new Error(texto || "O servidor retornou uma resposta inválida.");
  }
}

export default function AgendarAluno() {
  const navigate = useNavigate();
  const hoje = new Date().toLocaleDateString("en-CA");

  const usuario = obterUsuario();

  const codigoAluno = Number(
    usuario?.codigoAluno ??
    usuario?.codigoaluno ??
    usuario?.aluno?.codigoAluno ??
    usuario?.aluno?.codigoaluno
  ) || null;

  const token = localStorage.getItem("token");

  const [personais, setPersonais] = useState([]);
  const [personal, setPersonal] = useState("");

  const [disponibilidades, setDisponibilidades] = useState([]);
  const [disponibilidade, setDisponibilidade] = useState("");

  const [carregandoPersonais, setCarregandoPersonais] = useState(true);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const [erro, setErro] = useState("");

  // BUSCAR PERSONAIS
  useEffect(() => {
    async function buscarPersonais() {
      try {
        setCarregandoPersonais(true);
        setErro("");

        const response = await fetch(`${API_URL}/personal`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const dados = await lerJson(response);

        if (!response.ok) {
          throw new Error(dados.erro || dados.message || "Não foi possível carregar os personais.");
        }

        setPersonais(Array.isArray(dados) ? dados : []);
      } catch (error) {
        console.error("Erro ao buscar personais:", error);
        setErro(error.message);
      } finally {
        setCarregandoPersonais(false);
      }
    }

    buscarPersonais();
  }, [token]);

  // BUSCAR HORÁRIOS ATIVOS DO PERSONAL
  async function escolherPersonal(codigo) {
    setPersonal(codigo);
    setDisponibilidade("");
    setDisponibilidades([]);
    setErro("");

    if (!codigo) return;

    try {
      setCarregandoHorarios(true);

      const response = await fetch(
        `${API_URL}/disponibilidade/personal/${codigo}/ativas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const dados = await lerJson(response);

      if (!response.ok) {
        throw new Error(dados.erro || dados.message || "Não foi possível carregar os horários.");
      }

      const futuras = (Array.isArray(dados) ? dados : []).filter(
        (item) => soData(item.dataDisponibilidade) >= hoje
      );

      setDisponibilidades(futuras);
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
      setErro(error.message);
    } finally {
      setCarregandoHorarios(false);
    }
  }

  // AGENDAR HORÁRIO
  async function agendar(event) {
    event.preventDefault();
    setErro("");

    if (!token) {
      setErro("Sua sessão expirou. Faça login novamente.");
      return;
    }

    if (!codigoAluno) {
      setErro("Aluno não identificado. Faça login novamente.");
      console.error("Usuário salvo:", usuario);
      return;
    }

    if (!personal) {
      setErro("Selecione um personal.");
      return;
    }

    if (!disponibilidade) {
      setErro("Selecione um horário disponível.");
      return;
    }

    const slot = disponibilidades.find(
      (item) =>
        String(item.codigoDisponibilidade) === String(disponibilidade)
    );

    if (!slot) {
      setErro("O horário selecionado não foi encontrado. Selecione novamente.");
      return;
    }

    const dataFinal = soData(slot.dataDisponibilidade);
    const horarioFinal = formatarHorario(slot.horarioInicio);

    if (!dataFinal || horarioFinal === "--:--") {
      setErro("O horário selecionado é inválido.");
      return;
    }

    try {
      setCarregando(true);

      const dadosAgendamento = {
        codigoAluno,
        codigoPersonal: Number(personal),
        dataAgendamento: dataFinal,
        horarioAgendamento: horarioFinal,
        statusAgendamento: "PENDENTE",
      };

      console.log("Dados do agendamento:", dadosAgendamento);

      const response = await fetch(`${API_URL}/agendamento`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dadosAgendamento),
      });

      const dados = await lerJson(response);

      if (!response.ok) {
        console.error("Resposta do backend:", response.status, dados);

        throw new Error(
          dados.erro ||
          dados.message ||
          `Erro ${response.status}: não foi possível agendar.`
        );
      }

      alert("Horário agendado com sucesso!");
      navigate("/meus-horarios-aluno");
    } catch (error) {
      console.error("Erro ao agendar horário:", error);
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="agendar">
      <div className="agendar-container">
        <header className="agendar-cabecalho">
          <h1>Agendar horário</h1>
          <p>Escolha o personal e o horário do seu treino.</p>
        </header>

        <form className="agendar-form" onSubmit={agendar}>
          {erro && <p className="erro">{erro}</p>}

          <label htmlFor="personal">Personal</label>

          <select
            id="personal"
            value={personal}
            onChange={(event) => escolherPersonal(event.target.value)}
            required
            disabled={carregandoPersonais || carregando}
          >
            <option value="">
              {carregandoPersonais
                ? "Carregando personais..."
                : "Selecione um personal"}
            </option>

            {personais.map((item) => {
              const codigo = item.codigoPersonal ?? item.codigopersonal;

              return (
                <option key={codigo} value={codigo}>
                  {item.nome}
                </option>
              );
            })}
          </select>

          {personal && carregandoHorarios && (
            <p>Buscando horários disponíveis...</p>
          )}

          {personal &&
            !carregandoHorarios &&
            disponibilidades.length > 0 && (
              <>
                <label htmlFor="disponibilidade">
                  Selecione um horário disponível
                </label>

                <select
                  id="disponibilidade"
                  value={disponibilidade}
                  onChange={(event) => {
                    setDisponibilidade(event.target.value);
                    setErro("");
                  }}
                  required
                  disabled={carregando}
                >
                  <option value="">Selecione um horário</option>

                  {disponibilidades.map((item) => (
                    <option
                      key={item.codigoDisponibilidade}
                      value={item.codigoDisponibilidade}
                    >
                      {formatarData(item.dataDisponibilidade)} -{" "}
                      {formatarHorario(item.horarioInicio)} às{" "}
                      {formatarHorario(item.horarioFim)}
                    </option>
                  ))}
                </select>
              </>
            )}

          {personal &&
            !carregandoHorarios &&
            disponibilidades.length === 0 && (
              <p className="sem-horarios">
                Não há horários disponíveis para este personal.
              </p>
            )}

          <div className="agendar-acoes">
            <button
              type="button"
              onClick={() => navigate("/meus-horarios-aluno")}
              disabled={carregando}
            >
              Voltar
            </button>

            <button
              type="submit"
              disabled={
                carregando ||
                carregandoPersonais ||
                carregandoHorarios ||
                !disponibilidade ||
                disponibilidades.length === 0
              }
            >
              {carregando ? "Agendando..." : "Agendar horário"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
