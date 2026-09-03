import type { ImportDomain } from "@mission-atos/contracts";
import { Alert, Table } from "@/src/shared/components";

interface GuideField {
  readonly name: string;
  readonly requirement: string;
  readonly guidance: string;
}

interface GuideContent {
  readonly records: string;
  readonly permission: string;
  readonly columns: readonly GuideField[];
  readonly duplicateRule: string;
  readonly jsonExample: string;
  readonly dayNames?: ReadonlyArray<{ readonly code: string; readonly label: string }>;
  readonly rolesNote?: string;
}

const PEOPLE_COLUMNS: readonly GuideField[] = [
  {
    name: "fullName",
    requirement: "Obrigatória",
    guidance: "Nome completo, com até 200 caracteres. Espaços extras são ajustados."
  },
  {
    name: "phone",
    requirement: "Opcional",
    guidance: "Telefone internacional começando com +, por exemplo +5511999999999. Deixe vazio para omitir."
  },
  {
    name: "email",
    requirement: "Opcional",
    guidance: "E-mail válido. O sistema converte para letras minúsculas."
  },
  {
    name: "birthDate",
    requirement: "Opcional",
    guidance: "Data no formato AAAA-MM-DD, por exemplo 1990-05-20. Não use data futura."
  },
  {
    name: "gender",
    requirement: "Opcional",
    guidance: "Texto livre com até 50 caracteres, por exemplo Feminino."
  },
  {
    name: "observations",
    requirement: "Opcional",
    guidance: "Texto com 1 a 10.000 caracteres quando preenchido. Deixe vazio para omitir."
  },
  {
    name: "cellCode",
    requirement: "Opcional",
    guidance: "Código de uma célula existente na mesma igreja, por exemplo CEL-001. Cria o vínculo ativo; código inexistente reprova a linha."
  }
];

const CELLS_COLUMNS: readonly GuideField[] = [
  {
    name: "code",
    requirement: "Obrigatório",
    guidance: "Código com até 50 caracteres. Acentos e espaços viram hífens e tudo fica em maiúsculas, por exemplo CEL-001."
  },
  {
    name: "name",
    requirement: "Obrigatório",
    guidance: "Nome da célula, com até 160 caracteres."
  },
  {
    name: "status",
    requirement: "Opcional",
    guidance: "Use FORMING, ACTIVE ou SUSPENDED. Sem valor, a célula nasce em formação. ACTIVE exige líder e supervisor."
  },
  {
    name: "leaderId",
    requirement: "Condicional",
    guidance: "Identificador interno do usuário líder, não o nome nem o e-mail. Obrigatório para ACTIVE. Sem o identificador, importe como FORMING e atribua depois."
  },
  {
    name: "supervisorId",
    requirement: "Condicional",
    guidance: "Identificador interno do usuário supervisor. Obrigatório para ACTIVE e omitido para FORMING sem liderança."
  },
  {
    name: "traineeLeaderId",
    requirement: "Opcional",
    guidance: "Identificador interno do líder em treinamento. Deixe vazio quando não houver."
  },
  {
    name: "meetingDay",
    requirement: "Obrigatório",
    guidance: "Código exato do dia em inglês maiúsculo, por exemplo WEDNESDAY."
  },
  {
    name: "meetingTime",
    requirement: "Obrigatório",
    guidance: "Horário no formato 24 horas HH:MM, por exemplo 19:30. Na planilha, digite como texto."
  },
  {
    name: "address",
    requirement: "Obrigatório",
    guidance: "Endereço com até 500 caracteres."
  }
];

const USERS_COLUMNS: readonly GuideField[] = [
  {
    name: "firstName",
    requirement: "Obrigatório",
    guidance: "Nome com até 100 caracteres."
  },
  {
    name: "lastName",
    requirement: "Obrigatório",
    guidance: "Sobrenome com até 100 caracteres."
  },
  {
    name: "email",
    requirement: "Obrigatório",
    guidance: "E-mail válido e único. O sistema converte para letras minúsculas."
  },
  {
    name: "initialPassword",
    requirement: "Obrigatória",
    guidance: "Senha de 12 a 128 caracteres, com maiúscula, minúscula, número e símbolo."
  },
  {
    name: "roles",
    requirement: "Obrigatória",
    guidance: "De 1 a 4 nomes diferentes entre ADMIN, PASTOR, SUPERVISOR e LEADER. Informe nomes de papéis, não identificadores."
  }
];

const DAY_NAMES: ReadonlyArray<{ readonly code: string; readonly label: string }> = [
  { code: "MONDAY", label: "segunda-feira" },
  { code: "TUESDAY", label: "terça-feira" },
  { code: "WEDNESDAY", label: "quarta-feira" },
  { code: "THURSDAY", label: "quinta-feira" },
  { code: "FRIDAY", label: "sexta-feira" },
  { code: "SATURDAY", label: "sábado" },
  { code: "SUNDAY", label: "domingo" }
];

const GUIDE_CONTENT: Record<ImportDomain, GuideContent> = {
  people: {
    records: "pessoas",
    permission: "Disponível para administradores e pastores.",
    columns: PEOPLE_COLUMNS,
    duplicateRule: "Telefone, e-mail ou nome com nascimento repetidos geram erro na linha correspondente.",
    jsonExample: `[
  {
    "fullName": "Maria da Silva",
    "phone": "+5511999999999",
    "email": "maria@example.com",
    "birthDate": "1990-05-20",
    "gender": "Feminino",
    "observations": "Importada do sistema anterior",
    "cellCode": "CEL-001"
  }
]`
  },
  cells: {
    records: "células",
    permission: "Disponível para administradores e pastores.",
    columns: CELLS_COLUMNS,
    duplicateRule: "Código repetido no arquivo ou já existente na igreja gera erro na linha correspondente.",
    dayNames: DAY_NAMES,
    jsonExample: `[
  {
    "code": "CEL-001",
    "name": "Célula Central",
    "status": "FORMING",
    "meetingDay": "WEDNESDAY",
    "meetingTime": "19:30",
    "address": "Rua das Flores, 100"
  }
]`
  },
  users: {
    records: "usuários",
    permission: "Disponível somente para administradores.",
    columns: USERS_COLUMNS,
    duplicateRule: "E-mail repetido gera erro na linha correspondente.",
    rolesNote: "Na planilha ou no CSV, separe os papéis com |, por exemplo ADMIN|PASTOR. Se usar vírgula dentro do CSV, coloque o valor entre aspas. No JSON, use uma lista, por exemplo [\"LEADER\"].",
    jsonExample: `[
  {
    "firstName": "Maria",
    "lastName": "Silva",
    "email": "maria@example.com",
    "initialPassword": "TrocarDepois#2026",
    "roles": ["LEADER"]
  }
]`
  }
};

export function BulkImportGuide({ domain }: { readonly domain: ImportDomain }) {
  const content = GUIDE_CONTENT[domain];
  const headingId = `${domain}-import-guide`;
  const tableLabel = `Colunas aceitas para importar ${content.records}`;

  return (
    <section aria-labelledby={headingId} className="fieldset guide">
      <div>
        <p className="guide__eyebrow">Guia de importação</p>
        <h2 className="guide__title" id={headingId}>
          Como preparar o arquivo
        </h2>
        <p className="page-description">
          {content.permission} A importação aceita um arquivo por vez, com no máximo 5 MB e 2.000
          linhas. Os registros válidos entram na igreja da sua sessão; cada linha inválida aparece
          no resultado sem impedir as outras.
        </p>
      </div>

      <ol className="guide__steps">
        <li>Baixe o modelo CSV no formulário abaixo e mantenha os nomes das colunas exatamente iguais.</li>
        <li>Preencha uma linha para cada registro. Deixe os campos opcionais vazios quando não houver informação.</li>
        <li>Envie o arquivo e confira a tabela Resultado por linha. Corrija somente as linhas com erro e envie apenas essas linhas novamente.</li>
      </ol>

      <Alert variant="warning" title="Nomes exatos, sem colunas extras">
        Excel, CSV e JSON usam exatamente os nomes desta tabela. Qualquer coluna ou campo desconhecido
        invalida a linha.
      </Alert>

      <div>
        <h3 className="guide__subtitle" id={`${headingId}-columns`}>
          Colunas aceitas
        </h3>
        <Table
          aria-label={tableLabel}
          aria-describedby={headingId}
          columns={[
            { key: "name", header: "Coluna", render: (field) => <code>{field.name}</code> },
            { key: "requirement", header: "Obrigatoriedade", render: (field) => field.requirement },
            {
              key: "guidance",
              header: "Como preencher",
              render: (field) => field.guidance
            }
          ]}
          rows={content.columns}
          rowKey={(field) => field.name}
        />
      </div>

      {content.dayNames ? (
        <div>
          <h3 className="guide__subtitle" id={`${headingId}-days`}>
            Códigos dos dias da semana
          </h3>
          <ul className="guide__list">
            {content.dayNames.map((day) => (
              <li key={day.code}>
                <code>{day.code}</code> — {day.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h3 className="guide__subtitle" id={`${headingId}-formats`}>
          Formato do arquivo
        </h3>
        <ul className="guide__list">
          <li>
            <strong>Excel:</strong> use a primeira aba. A primeira linha deve conter os nomes exatos
            das colunas. Cada linha seguinte é um registro. Ignore linhas em branco e não inclua
            títulos, totais ou células mescladas. Digite horários como texto e datas como AAAA-MM-DD.
          </li>
          <li>
            <strong>CSV:</strong> a primeira linha deve conter os nomes exatos das colunas. Separe os
            valores por vírgula e salve em UTF-8. Coloque entre aspas qualquer valor com vírgula ou
            quebra de linha. Deixe campos opcionais vazios.
          </li>
          <li>
            <strong>JSON:</strong> envie uma lista de objetos ou um objeto com a chave
            <code>items</code>. Use exatamente os nomes das colunas como chaves e omita os campos
            opcionais em vez de usar <code>null</code>. A contagem começa na primeira linha de dados;
            o cabeçalho não conta.
          </li>
        </ul>
        {content.rolesNote ? <p className="page-description">{content.rolesNote}</p> : null}
        <figure className="guide__figure">
          <figcaption>Exemplo JSON para importar {content.records}</figcaption>
          <pre className="guide__code">
            <code>{content.jsonExample}</code>
          </pre>
        </figure>
      </div>

      <Alert variant="info" title="Depois do envio">
        {content.duplicateRule} Somente registros novos são criados; envie novamente apenas as linhas
        corrigidas para não duplicar registros.
      </Alert>
    </section>
  );
}
