import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getEditorAdvice(projectTitle: string, projectDescription: string, currentGrade: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert AI video editing assistant built into a portfolio website. 
      The current project being viewed is "${projectTitle}". 
      Description: ${projectDescription}. 
      Current Color Grade applied: ${currentGrade}.
      
      Provide 3 brief, punchy editing or storytelling tips (15 words each) for this specific project. 
      Return them as a simple bulleted list. 
      Keep the tone technical, cool, and professional.`,
    });
    return response.text;
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return "• Experiment with faster intercutting.\n• Try a more desaturated color palette.\n• Layer more ambient soundscapes.";
  }
}
