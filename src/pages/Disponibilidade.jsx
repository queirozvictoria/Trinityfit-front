
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";

import "./Disponibilidade.css";

const API_URL = "http://localhost:3000";

function obterUsuario() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "{}");
  } catch {
    return {};
  }
}

function obterCodigoPersonal() {
  const usuario = obterUsuario();

  const codigo =
    usuario.codigoPersonal ??
    usuario.codigopersonal ??
    usuario.personal?.codigoPersonal ??
    usuario.personal?.codigopersonal;

  return codigo ? Number(codigo) : null;
}

function obterToken() {
  return localStorage.getItem("token");
}

function obterHeaders() {
  const token = obterToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function soData(valor) {
  return valor ? String(valor).split("T")[0] : "";
}

function formatarData(valor) {
  const [ano, mes, dia] = soData(valor).split("-");
  return ano && mes && dia
    ? `${dia}/${mes}/${ano}`
    : "Data não informada";
}

function formatarHorario(valor) {
  return valor ? String(valor).slice(0, 5) : "--:--";
}

async function lerJson(response) {
  const texto = await response.text();

  try {
    return texto ? JSON.parse(texto) : {};
  } catch {
    throw new Error("O servidor retornou uma resposta inválida.");
  }
}

function mensagemErro(dados, padrao) {
  return dados.erro || dados.message || dados.mensagem || padrao;
}

export default function Disponibilidade() {
  const navigate = useNavigate();

  const hoje = new Date().toLocaleDateString("en-CA");

  const [codigoPersonal] = useState(obterCodigoPersonal);

  const [horarios, setHorarios] = useState([]);
  const [data, setData] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [horarioFim, setHorarioFim] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [removendoId, setRemovendoId] = useState(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const buscarHorarios = useCallback(async () => {
    if (!codigoPersonal) {
      setErro("Não foi possível identificar o personal logado. Faça login novamente.");
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      setErro("");

      const response = await api.get(
        `/disponibilidade/personal/${codigoPersonal}/ativas`,
        {
          headers: obterHeaders(),
        }
      );

      const dados = response.data;

      setHorarios(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error("Erro ao buscar horários:", error);

      setHorarios([]);

      setErro(
        mensagemErro(
          error.response?.data,
          error.message || "Não foi possível carregar os horários."
        )
      );
    } finally {
      setCarregando(false);
    }
  }, [codigoPersonal]);

  useEffect(() => {
    buscarHorarios();
  }, [buscarHorarios]);

  async function adicionar(event) {
    event.preventDefault();

    if (!codigoPersonal) {
      setErro("Personal não identificado. Faça login novamente.");
      return;
    }

    if (!obterToken()) {
      setErro("Token não encontrado. Faça login novamente.");
      return;
    }

    if (!data || !horarioInicio || !horarioFim) {
      setErro("Preencha a data, o início e o fim.");
      return;
    }

    if (horarioFim <= horarioInicio) {
      setErro("O horário final precisa ser depois do inicial.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      const response = await api.post(
        "/disponibilidade",
        {
          codigoPersonal,
          dataDisponibilidade: data,
          horarioInicio,
          horarioFim,
          status: true,
        },
        {
          headers: obterHeaders(),
        }
      );

      const dados = response.data;

      setMensagem("Horário adicionado com sucesso.");
      setHorarioInicio("");
      setHorarioFim("");

      await buscarHorarios();
    } catch (error) {
      console.error(
        "Resposta do servidor:",
        error.response?.status,
        error.response?.data
      );

      setErro(
        mensagemErro(
          error.response?.data,
          "Não foi possível salvar o horário."
        )
      );
    } finally {
      setSalvando(false);
    }
  }

  async function remover(item) {
    const confirmou = window.confirm(
      `Remover o horário de ${formatarData(item.dataDisponibilidade)} às ${formatarHorario(item.horarioInicio)}?`
    );

    if (!confirmou) return;

    try {
      setRemovendoId(item.codigoDisponibilidade);
      setErro("");
      setMensagem("");

      const response = await api.delete(
        `/disponibilidade/${item.codigoDisponibilidade}`,
        {
          headers: obterHeaders(),
        }
      );

      const dados = response.data;

      setHorarios((lista) =>
        lista.filter(
          (h) =>
            h.codigoDisponibilidade !== item.codigoDisponibilidade
        )
      );

      setMensagem("Horário removido.");
    } catch (error) {
      console.error("Erro ao remover horário:", error);

      setErro(
        mensagemErro(
          error.response?.data,
          "Não foi possível remover o horário."
        )
      );
    } finally {
      setRemovendoId(null);
    }
  }

  return (
    <main className="disp">
      <div className="disp-container">
        <header className="disp-cabecalho">
          <h1>Meus horários disponíveis</h1>
          <p>
            Cadastre os dias e horários em que você atende.
            Seus alunos só poderão agendar nesses horários.
          </p>
        </header>

        <form className="disp-form" onSubmit={adicionar}>
          <label htmlFor="data">Dia</label>
          <input
            id="data"
            type="date"
            min={hoje}
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
          />

          <div className="disp-linha">
            <div>
              <label htmlFor="inicio">Início</label>
              <input
                id="inicio"
                type="time"
                value={horarioInicio}
                onChange={(e) => setHorarioInicio(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="fim">Fim</label>
              <input
                id="fim"
                type="time"
                value={horarioFim}
                onChange={(e) => setHorarioFim(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="disp-btn"
            disabled={salvando || !codigoPersonal}
          >
            {salvando ? "Salvando..." : "Adicionar horário"}
          </button>
        </form>

        {mensagem && (
          <p className="disp-msg disp-sucesso">{mensagem}</p>
        )}

        {erro && (
          <p className="disp-msg disp-erro">{erro}</p>
        )}

        <h2 className="disp-subtitulo">Horários livres</h2>

        {carregando && (
          <p className="disp-vazio">Carregando...</p>
        )}

        {!carregando && horarios.length === 0 && (
          <p className="disp-vazio">
            Você ainda não cadastrou horários.
          </p>
        )}

        {!carregando && horarios.length > 0 && (
          <ul className="disp-lista">
            {horarios.map((item) => (
              <li
                key={item.codigoDisponibilidade}
                className="disp-card"
              >
                <div>
                  <strong>
                    {formatarData(item.dataDisponibilidade)}
                  </strong>
                  <span>
                    {formatarHorario(item.horarioInicio)} às{" "}
                    {formatarHorario(item.horarioFim)}
                  </span>
                </div>

                <button
                  type="button"
                  className="disp-btn-remover"
                  onClick={() => remover(item)}
                  disabled={removendoId !== null}
                >
                  {removendoId === item.codigoDisponibilidade
                    ? "Removendo..."
                    : "Remover"}
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          className="disp-btn-voltar"
          onClick={() => navigate("/personal")}
        >
          Voltar
        </button>
      </div>
    </main>
  );
}
