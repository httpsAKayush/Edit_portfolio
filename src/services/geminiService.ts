export async function getEditorAdvice(projectTitle: string, projectDescription: string, currentGrade: string) {
  try {
    const res = await fetch("/api/editor-advice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectTitle, projectDescription, currentGrade })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.advice || "• Experiment with faster intercutting.\n• Try a more desaturated color palette.\n• Layer more ambient soundscapes.";
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return "• Experiment with faster intercutting.\n• Try a more desaturated color palette.\n• Layer more ambient soundscapes.";
  }
}

