import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route to structure ticket description
  app.post('/api/structure-ticket', async (req, res) => {
    try {
      const { description, procedures, problemSolved, clientValidated, isEscalated, aiGuidelines, aiPromptStandard, aiPromptEscalated } = req.body;

      if (!description) {
        return res.status(400).json({ error: 'Description is required' });
      }
      
      let prompt = '';
      
      let guidelinesContext = '';
      if (aiGuidelines && aiGuidelines.length > 0) {
        const guidelinesList = aiGuidelines.map((g: string) => `- ${g}`).join('\n');
        guidelinesContext = `\n\nIMPORTANTE: Siga rigorosamente as seguintes diretrizes ao estruturar a sua resposta:\n${guidelinesList}`;
      }

      if (isEscalated) {
        let proceduresContext = '';
        if (procedures && procedures.length > 0) {
          const proceduresList = procedures.map((p: any) => `- ${p.name}: ${p.description}`).join('\n');
          proceduresContext = `\nAlém disso, os seguintes procedimentos foram executados, mas o incidente persiste:\n${proceduresList}\nInclua menção a esses procedimentos executados na sua frase.`;
        }

        let basePrompt = aiPromptEscalated || `Você é um assistente técnico de TI. 
Eu vou te enviar um texto relatando um problema ou atendimento de suporte que está sendo ESCALONADO para outro setor.
Sua tarefa é reescrever esse texto relatando a descrição (demanda) e a tratativa em UMA ÚNICA FRASE CONTÍNUA (sem tópicos).
Corrija erros ortográficos e use linguagem profissional e técnica.{proceduresContext}
A sua resposta DEVE terminar OBRIGATORIAMENTE com a seguinte frase exata: "Cliente solicita suporte especializado para andamento do chamado."
NÃO use tópicos como "Demanda:" ou "Tratativa/Solução:". A resposta inteira deve ser um parágrafo/frase único.{guidelinesContext}

O texto é:
"{description}"`;

        prompt = basePrompt
          .replace('{description}', description)
          .replace('{proceduresContext}', proceduresContext)
          .replace('{guidelinesContext}', guidelinesContext)
          .replace('{validationContext}', '');

      } else {
        let proceduresContext = '';
        if (procedures && procedures.length > 0) {
          const proceduresList = procedures.map((p: any) => `- ${p.name}: ${p.description}`).join('\n');
          proceduresContext = `\nAlém disso, considere que os seguintes procedimentos TÉCNICOS também foram executados com sucesso:\n${proceduresList}\nInclua menção direta a esses procedimentos na seção Tratativa/Solução, de forma técnica.`;
        }

        let validationContext = '';
        if (!isEscalated && (problemSolved !== undefined || clientValidated !== undefined)) {
          const solvedText = problemSolved 
            ? 'Após os procedimentos, o problema foi solucionado!' 
            : 'Após os procedimentos, o problema não foi solucionado.';
          const validatedText = clientValidated 
            ? 'Cliente validou o chamado!' 
            : 'Cliente não validou o chamado.';
          validationContext = `\n\nNo final da sua resposta, adicione OBRIGATORIAMENTE as seguintes duas frases em linhas separadas:\n${solvedText}\n${validatedText}`;
        }

        let basePrompt = aiPromptStandard || `Você é um assistente técnico de TI. 
Eu vou te enviar um texto relatando um problema ou atendimento de suporte.
Sua tarefa é reestruturar esse texto em dois tópicos: "Demanda" e "Tratativa/Solução".
Corrija erros ortográficos e use linguagem profissional e técnica.
NÃO invente procedimentos ou informações que não estão no texto original nem na lista de procedimentos executados.
NÃO "encha linguiça" ou adicione detalhes não mencionados.{proceduresContext}{validationContext}{guidelinesContext}

O texto é:
"{description}"

Formate a saída EXATAMENTE assim:
Demanda: [texto da demanda]

Tratativa/Solução: [texto da tratativa/solução]`;

        prompt = basePrompt
          .replace('{description}', description)
          .replace('{proceduresContext}', proceduresContext)
          .replace('{guidelinesContext}', guidelinesContext)
          .replace('{validationContext}', validationContext);
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text;
      
      res.json({ result: text });
    } catch (error) {
      console.error('Error in /api/structure-ticket:', error);
      res.status(500).json({ error: 'Failed to process ticket description' });
    }
  });

  app.post('/api/search-solutions', async (req, res) => {
    try {
      const { description, faqs, procedures, tickets } = req.body;

      if (!description) {
        return res.status(400).json({ error: 'Description is required' });
      }
      
      const prompt = `Você é um assistente técnico de TI. 
Sua tarefa é analisar o relato de um problema e buscar na base de conhecimento (FAQs, Procedimentos e Chamados Anteriores) os itens mais relevantes que possam ajudar a resolver o problema.

RELATO DO PROBLEMA:
"${description}"

BASE DE CONHECIMENTO (IDs e Textos):
FAQs: ${JSON.stringify((faqs || []).map((f: any) => ({ id: f.id, text: f.name + ' ' + f.subject + ' ' + f.technicalInfo })))}
Procedimentos: ${JSON.stringify((procedures || []).map((p: any) => ({ id: p.id, text: p.name + ' ' + p.description })))}
Chamados Anteriores: ${JSON.stringify((tickets || []).map((t: any) => ({ id: t.id, text: t.description })))}

Retorne APENAS um objeto JSON no seguinte formato, listando os IDs dos itens mais relevantes encontrados (máximo 3 de cada). Se não encontrar nada, retorne arrays vazios.
{
  "faqs": ["id1", "id2"],
  "procedures": ["id1"],
  "tickets": ["id1"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              faqs: { type: "array", items: { type: "string" } },
              procedures: { type: "array", items: { type: "string" } },
              tickets: { type: "array", items: { type: "string" } }
            }
          }
        }
      });

      const resultText = response.text;
      let resultJson = { faqs: [], procedures: [], tickets: [] };
      if (resultText) {
        try {
          resultJson = JSON.parse(resultText);
        } catch (e) {
          console.error("Failed to parse AI response as JSON", e);
        }
      }

      res.json({ result: resultJson });
    } catch (error) {
      console.error('Error in /api/search-solutions:', error);
      res.status(500).json({ error: 'Failed to search solutions' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
