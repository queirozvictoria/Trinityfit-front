import { useNavigate } from "react-router-dom";
import "./Aluno.css";

export default function Aluno() {
  const navigate = useNavigate();

  return (
    <main className="aluno">
      <div className="aluno-container">
        <header className="aluno-cabecalho">
          <span className="aluno-etiqueta">
            SUA ÁREA EXCLUSIVA
          </span>

          <h1>Área do Aluno</h1>

          <p>
            Bem-vindo à sua área de treino!
            <br />
            Acompanhe seus horários e sua rotina de exercícios.
          </p>
        </header>

        <section aria-labelledby="servicos-titulo">
          <h2
            id="servicos-titulo"
            className="servicos-titulo"
          >
            Seus serviços
          </h2>

          <p className="servicos-descricao">
            Escolha uma opção abaixo para continuar.
          </p>

          <div className="servicos">
            <button
              type="button"
              className="servico"
              aria-label="Acessar meus horários"
              onClick={() => navigate("/meus-horarios-aluno")}
            >
              <span className="servico-icone" aria-hidden="true">
                ◷
              </span>

              <h3>Meus horários</h3>

              <p>
                Consulte seus horários, agende novos treinos ou
                desmarque horários já agendados.
              </p>

              <span className="servico-link">
                Acessar horários →
              </span>
            </button>

            <button
              type="button"
              className="servico"
              aria-label="Acessar minha planilha de treino"
              onClick={() => navigate("/minha-planilha-de-treino")}
            >
              <span className="servico-icone" aria-hidden="true">
                ✓
              </span>

              <h3>Minha planilha de treino</h3>

              <p>
                Consulte seus exercícios, treinos e orientações
                definidas pelo seu personal.
              </p>

              <span className="servico-link">
                Ver minha planilha →
              </span>
            </button>
          </div>
        </section>

        <footer className="aluno-rodape">
          <p>Seu treino, sua evolução, seu ritmo.</p>
        </footer>
      </div>
    </main>
  );
}