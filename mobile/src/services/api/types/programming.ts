export interface SolutionStep {
  order: number;
  text: string;
  done: boolean;
}

export interface CodeSnippet {
  language: string;
  code: string;
  label?: string;
}

export interface ProgrammingDetails {
  id: string;
  ticketId: string;
  tenantId: string;
  programmerId?: string;
  technicalDescription?: string;
  rootCause?: string;
  stepsToReproduce?: string;
  solutionSteps: SolutionStep[];
  codeSnippets: CodeSnippet[];
  attachments: { url: string; filename: string; size: number }[];
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
}
