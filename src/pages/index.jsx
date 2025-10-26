import Layout from "./Layout.jsx";

import TableauDeBord from "./TableauDeBord";

import Enfants from "./Enfants";

import Evenements from "./Evenements";

import Statistiques from "./Statistiques";

import Reglages from "./Reglages";

import MonProfil from "./MonProfil";

import Suivi from "./Suivi";

import Rapports from "./Rapports";

import Messagerie from "./Messagerie";

import Communication from "./Communication";

import StatistiquesGenre from "./StatistiquesGenre";

import ProblemesResolus from "./ProblemesResolus";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    TableauDeBord: TableauDeBord,
    
    Enfants: Enfants,
    
    Evenements: Evenements,
    
    Statistiques: Statistiques,
    
    Reglages: Reglages,
    
    MonProfil: MonProfil,
    
    Suivi: Suivi,
    
    Rapports: Rapports,
    
    Messagerie: Messagerie,
    
    Communication: Communication,
    
    StatistiquesGenre: StatistiquesGenre,
    
    ProblemesResolus: ProblemesResolus,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<TableauDeBord />} />
                
                
                <Route path="/TableauDeBord" element={<TableauDeBord />} />
                
                <Route path="/Enfants" element={<Enfants />} />
                
                <Route path="/Evenements" element={<Evenements />} />
                
                <Route path="/Statistiques" element={<Statistiques />} />
                
                <Route path="/Reglages" element={<Reglages />} />
                
                <Route path="/MonProfil" element={<MonProfil />} />
                
                <Route path="/Suivi" element={<Suivi />} />
                
                <Route path="/Rapports" element={<Rapports />} />
                
                <Route path="/Messagerie" element={<Messagerie />} />
                
                <Route path="/Communication" element={<Communication />} />
                
                <Route path="/StatistiquesGenre" element={<StatistiquesGenre />} />
                
                <Route path="/ProblemesResolus" element={<ProblemesResolus />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}