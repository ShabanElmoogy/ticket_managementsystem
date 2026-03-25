import { z } from 'zod';

const solutionStep = z.object({
  order: z.number().int().min(0),
  text:  z.string().min(1),
  done:  z.boolean().default(false),
});

const codeSnippet = z.object({
  language: z.string(),
  code:     z.string(),
  label:    z.string().optional(),
});

export const upsertProgrammingSchema = z.object({
  technicalDescription: z.string().optional(),
  rootCause:            z.string().optional(),
  stepsToReproduce:     z.string().optional(),
  solutionSteps:        z.array(solutionStep).optional(),
  codeSnippets:         z.array(codeSnippet).optional(),
  estimatedHours:       z.number().positive().optional(),
  actualHours:          z.number().positive().optional(),
});

export const assignProgrammerSchema = z.object({
  programmerId: z.string().uuid(),
});
