import { MessageTemplate } from "./types";

export class TemplateRenderer {
  public render(template: MessageTemplate, variables: Record<string, any>): {
    title: string;
    body: string;
    subject?: string;
    cta?: string;
  } {
    const interpolate = (text: string) => {
      return text.replace(/\{\{(.*?)\}\}/g, (_, key) => {
        const value = variables[key.trim()];
        return value !== undefined ? String(value) : `{{${key}}}`;
      });
    };

    return {
      title: interpolate(template.title),
      body: interpolate(template.body),
      subject: template.subject ? interpolate(template.subject) : undefined,
      cta: template.cta ? interpolate(template.cta) : undefined
    };
  }
}

export const templateRenderer = new TemplateRenderer();
