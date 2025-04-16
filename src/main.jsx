// Importa a biblioteca React que cria as interfaces
import React from "react";

//Interage com a arvore de elementos do navegador
import ReactDOM from "react-dom/client";

//Importa o componente raiz da aplicação
import App from "./App";

//Ponto de entrada para renderizar a o react dentro do dom 
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
