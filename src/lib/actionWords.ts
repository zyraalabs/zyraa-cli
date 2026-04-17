const words = [
  "Architecting",
  "Blueprinting",
  "Reasoning",
  "Strategizing",
  "Analyzing",
  "Planning",
  "Thinking deeply",
  "Imagining",
  "Envisioning",
  "Deliberating",
  "Synthesizing",
  "Conceiving",
  "Scaffolding",
  "Crafting components",
  "Wiring the app",
  "Assembling",
  "Laying foundations",
  "Defining types",
  "Connecting the pieces",
  "Composing views",
  "Weaving logic",
  "Mapping the schema",
  "Forging interfaces",
  "Orchestrating",
  "Sculpting",
  "Harmonizing",
  "Integrating",
  "Prototyping",
  "Refining",
  "Designing",
  "Structuring",
  "Calibrating",
  "Turning ideas into code",
  "Bringing your vision to life",
  "Polishing",
  "Almost there",
];

let index = Math.floor(Math.random() * words.length);

export function nextActionWord(): string {
  const word = words[index % words.length];
  index++;
  return word;
}
