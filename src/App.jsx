
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Logo from "./pages/logo";

// Componentes
import Sidebar from "./components/Sidebar";

// Telas públicas
import Login from "./pages/login";
import Cadastro from "./pages/cadastro";

// Páginas
import Disponibilidade from "./pages/Disponibilidade";
import Aluno from "./pages/Aluno";
import Personal from "./pages/Personal";
import MeusAlunos from "./pages/MeusAlunos";
import MeusHorarios from "./pages/MeusHorarios";
import MeusHorariosAluno from "./pages/MeusHorariosAluno";
import PlanilhasTreino from "./pages/PlanilhasTreino";
import CriarPlanilha from "./pages/CriarPlanilha";
import PlanilhasTreinoAluno from "./pages/PlanilhasTreinoAluno";
import Agendar from "./pages/Agendar";
import AgendarAluno from "./pages/AgendarAluno";
import AlterarHorario from "./pages/AlterarHorario";
import CancelarHorario from "./pages/CancelarHorario";

import PrivateRoute from "./pages/PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <Logo />

      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* Rotas protegidas */}
        <Route element={<PrivateRoute />}>
          <Route element={<SidebarLayout />}>
            {/* Área do aluno */}
            <Route path="/aluno" element={<Aluno />} />
            <Route
              path="/meus-horarios-aluno"
              element={<MeusHorariosAluno />}
            />
            <Route
              path="/minha-planilha-de-treino"
              element={<PlanilhasTreinoAluno />}
            />
            <Route path="/agendar-aluno" element={<AgendarAluno />} />

            {/* Área do personal */}
            <Route path="/personal" element={<Personal />} />
            <Route path="/meus-alunos" element={<MeusAlunos />} />
            <Route path="/minha-agenda" element={<MeusHorarios />} />
            <Route
              path="/disponibilidade"
              element={<Disponibilidade />}
            />

            {/* Planilhas */}
            <Route path="/planilhas" element={<PlanilhasTreino />} />
            <Route path="/criar-planilha" element={<CriarPlanilha />} />

            {/* Agendamentos */}
            <Route path="/agendar" element={<Agendar />} />
            <Route
              path="/alterar-horario"
              element={<AlterarHorario />}
            />
            <Route
              path="/cancelar-horario"
              element={<CancelarHorario />}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

import { Outlet } from "react-router-dom";

function SidebarLayout() {
  return (
    <>
      <Sidebar />
      <Outlet />
    </>
  );
}

export default App;
