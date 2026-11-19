import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../services/api.js";

export default function DetalheAlunoPersonal() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [aluno, setAluno] = useState(state?.aluno ?? null);
  const [carregando, setCarregando] = useState(!state?.aluno);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (state?.aluno) return;

    async function carregar() {
      try {
        setCarregando(true);
        setErro("");
        const resposta = await api.get(`/alunos/${id}`);
        setAluno(resposta.data);
      } catch (e) {
        setErro(e.response?.data?.erro || "Não foi possível carregar o aluno.");
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [id, state]);

  if (carregando) return <p role="status">Carregando aluno...</p>;
  if (erro) return <p role="alert">{erro}</p>;

  return (
    <main>
      <button type="button" onClick={() => navigate(-1)}>
        ← Voltar
      </button>

      <h1>{aluno?.nome?.trim() || "Aluno sem nome"}</h1>
      <p>{aluno?.email || "E-mail não informado"}</p>
    </main>
  );
}
