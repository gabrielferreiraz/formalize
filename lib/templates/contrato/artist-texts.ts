export interface ContratoCategoriaTextos {
  tipoServico: string;
  pessoasDefault: number;
  formatoTitulo: string;
  formatoTexto: (instruments: string) => string;
  repertorioTexto: string;
  interrupcaoTitulo: string;
  interrupcaoTexto: string;
  obsBacklineOuSom: string;
}

export function getTextosCategoria(categoria: string | null | undefined): ContratoCategoriaTextos {
  const cat = (categoria || "banda").toLowerCase();

  switch (cat) {
    case "dj":
      return {
        tipoServico: "set",
        pessoasDefault: 3,
        formatoTitulo: "Setup e Performance",
        formatoTexto: (_instruments: string) =>
          "O CONTRATADO realizará performance de DJ set, utilizando controlador, mixer, player de mídia e sistema de monitoramento próprio. O setup e a desmontagem deverão ser realizados dentro do horário combinado, sem comprometer o início da performance. Rider técnico em anexo.",
        repertorioTexto:
          "A seleção musical ficará inteiramente a critério do CONTRATADO, podendo o CONTRATANTE indicar estilos ou gêneros preferidos com antecedência mínima de 7 dias antes do evento.",
        interrupcaoTitulo: "Interrupção do Set",
        interrupcaoTexto:
          "O set poderá ser interrompido a qualquer momento se constatado situação de risco à integridade física do artista, comportamento inadequado do público, ou falha de infraestrutura que comprometa a segurança da performance. Neste caso, o CONTRATADO não terá multa e o serviço será considerado parcialmente cumprido.",
        obsBacklineOuSom:
          "Sistema de som e PA profissional adequado ao espaço deverão ser fornecidos e instalados pelo CONTRATANTE. Os equipamentos pessoais de DJ serão fornecidos pelo CONTRATADO.",
      };

    case "solo":
      return {
        tipoServico: "apresentação",
        pessoasDefault: 3,
        formatoTitulo: "Formato da Apresentação",
        formatoTexto: (instruments: string) =>
          `O CONTRATADO realizará apresentação em formato solo com os seguintes instrumentos: ${instruments}, conforme rider técnico em anexo.`,
        repertorioTexto:
          "A escolha do repertório ficará a critério do CONTRATADO, podendo incluir pedidos do CONTRATANTE com antecedência mínima de 15 dias antes do evento.",
        interrupcaoTitulo: "Interrupção da Apresentação",
        interrupcaoTexto:
          "A apresentação será interrompida a qualquer momento se constatado comportamento inadequado do público para com o artista, ficando o CONTRATADO isento de responsabilidade ou multa, sendo o serviço considerado realizado.",
        obsBacklineOuSom:
          "Som e PA adequados ao evento deverão ser fornecidos pelo CONTRATANTE. O backline pessoal do artista será fornecido pelo CONTRATADO.",
      };

    case "cantor":
      return {
        tipoServico: "apresentação",
        pessoasDefault: 3,
        formatoTitulo: "Formato da Apresentação",
        formatoTexto: (_instruments: string) =>
          "O CONTRATADO realizará apresentação vocal e musical, podendo contar com acompanhamento ao vivo ou backing track, conforme rider técnico a ser confirmado em até 7 dias antes do evento.",
        repertorioTexto:
          "A escolha do repertório ficará a critério do CONTRATADO, podendo incluir pedidos do CONTRATANTE com antecedência mínima de 15 dias antes do evento.",
        interrupcaoTitulo: "Interrupção da Apresentação",
        interrupcaoTexto:
          "A apresentação será interrompida a qualquer momento se constatado comportamento inadequado do público para com o artista, ficando o CONTRATADO isento de responsabilidade ou multa, sendo o serviço considerado realizado.",
        obsBacklineOuSom:
          "Som e PA adequados ao evento deverão ser fornecidos pelo CONTRATANTE ou pelo espaço. Instrumentos e equipamentos pessoais serão fornecidos pelo CONTRATADO.",
      };

    case "dupla":
      return {
        tipoServico: "show",
        pessoasDefault: 4,
        formatoTitulo: "Formato da Dupla",
        formatoTexto: (instruments: string) =>
          `O CONTRATADO se apresentará no formato de dupla, com os seguintes instrumentos: ${instruments}, conforme rider técnico em anexo.`,
        repertorioTexto:
          "A escolha do repertório ficará a critério do CONTRATADO, podendo incluir pedidos do CONTRATANTE com antecedência de até 15 dias antes do evento.",
        interrupcaoTitulo: "Interrupção do Show",
        interrupcaoTexto:
          "O espetáculo será interrompido a qualquer momento se constatado comportamento inadequado do público para com os artistas, ficando o CONTRATADO isento de responsabilidade ou multa, sendo o espetáculo considerado realizado.",
        obsBacklineOuSom:
          "Som profissional para o evento deverá ser fornecido pelo CONTRATANTE ou pelo espaço. Backline com técnico de som será fornecido pelo CONTRATADO para uso próprio.",
      };

    case "outros":
      return {
        tipoServico: "apresentação",
        pessoasDefault: 4,
        formatoTitulo: "Formato da Apresentação",
        formatoTexto: (_instruments: string) =>
          "O CONTRATADO realizará apresentação artística conforme acordado entre as partes, com instrumentação e formato descritos no rider técnico em anexo.",
        repertorioTexto:
          "O conteúdo artístico a ser executado ficará a critério do CONTRATADO, podendo incluir pedidos do CONTRATANTE com antecedência mínima de 15 dias antes do evento.",
        interrupcaoTitulo: "Interrupção da Apresentação",
        interrupcaoTexto:
          "A apresentação será interrompida a qualquer momento se constatado comportamento inadequado do público ou situação de risco, ficando o CONTRATADO isento de responsabilidade ou multa, sendo o serviço considerado realizado.",
        obsBacklineOuSom:
          "Som e infraestrutura técnica adequados ao evento deverão ser fornecidos pelo CONTRATANTE. Equipamentos pessoais do artista serão fornecidos pelo CONTRATADO.",
      };

    default: // "banda"
      return {
        tipoServico: "show",
        pessoasDefault: 7,
        formatoTitulo: "Formato da Banda",
        formatoTexto: (instruments: string) =>
          `O artista se apresentará em seu formato de banda completa com os seguintes instrumentos: ${instruments}, conforme o mapa de palco em anexo na última página.`,
        repertorioTexto:
          "A escolha do repertório ficará a critério do CONTRATADO, podendo incluir pedido do CONTRATANTE com antecedência de até 30 dias da data prevista para o evento.",
        interrupcaoTitulo: "Interrupção do Show",
        interrupcaoTexto:
          "O espetáculo será interrompido a qualquer momento se constatado comportamento inadequado do público para com o artista e sua banda, ficando evidenciado que o CONTRATADO não terá responsabilidade ou multa, sendo o espetáculo considerado realizado.",
        obsBacklineOuSom:
          "Som profissional para atender o evento durante o tempo determinado deverá ser fornecido pelo CONTRATANTE ou pelo espaço de eventos. Backline com técnico de som será fornecido pelo artista para uso próprio.",
      };
  }
}
