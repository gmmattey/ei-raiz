import React, { createContext, useContext, useState, useEffect } from 'react';

const ModoVisualizacaoContext = createContext();

export const ModoVisualizacaoProvider = ({ children }) => {
  const [ocultarValores, setOcultarValores] = useState(() => {
    return localStorage.getItem('ocultarValores') !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('ocultarValores', ocultarValores);
  }, [ocultarValores]);

  return (
    <ModoVisualizacaoContext.Provider value={{ ocultarValores, toggleOcultarValores: () => setOcultarValores(!ocultarValores), setOcultarValores }}>
      {children}
    </ModoVisualizacaoContext.Provider>
  );
};

export const useModoVisualizacao = () => useContext(ModoVisualizacaoContext);
