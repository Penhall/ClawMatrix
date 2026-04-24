import type { OutputLanguage, Principle } from '../../types.js';

type LocalizedText = Record<OutputLanguage, string>;

interface RawPrinciple {
  id: number;
  name: string;
  description: LocalizedText;
}

const rawPrinciples: RawPrinciple[] = [
  { id: 1, name: 'Segmentation', description: { pt: 'Divida o objeto em partes independentes; torne o objeto seccionável; aumente o grau de fragmentação.', en: 'Divide an object into independent parts; make it sectional; increase the degree of fragmentation.' } },
  { id: 2, name: 'Taking Out (Extraction)', description: { pt: 'Extraia a parte ou propriedade que causa problemas, ou isole a única propriedade necessária.', en: 'Separate the disturbing part or property from an object, or isolate the only useful part or property.' } },
  { id: 3, name: 'Local Quality', description: { pt: 'Substitua estrutura homogênea por heterogênea; faça cada parte funcionar na condição mais adequada.', en: 'Replace uniform structure with non-uniform structure; make each part work under the most suitable conditions.' } },
  { id: 4, name: 'Asymmetry', description: { pt: 'Substitua forma simétrica por assimétrica; se já for assimétrica, aumente o grau de assimetria.', en: 'Replace a symmetrical form with an asymmetrical one; if it is already asymmetrical, increase the degree of asymmetry.' } },
  { id: 5, name: 'Merging (Consolidation)', description: { pt: 'Combine objetos idênticos ou destinados a operações similares no espaço ou no tempo.', en: 'Combine identical objects or objects intended for similar operations in space or time.' } },
  { id: 6, name: 'Universality', description: { pt: 'Faça o objeto executar múltiplas funções, eliminando a necessidade de outros objetos.', en: 'Make an object perform multiple functions, eliminating the need for other objects.' } },
  { id: 7, name: 'Nested Doll (Matryoshka)', description: { pt: 'Coloque um objeto dentro de outro; passe um objeto por dentro de outro que, por sua vez, está dentro de um terceiro.', en: 'Place one object inside another; pass one object through another that is itself inside a third.' } },
  { id: 8, name: 'Anti-weight (Counterweight)', description: { pt: 'Compense o peso do objeto ligando-o a outro que fornece força de elevação, ou compense usando forças aerodinâmicas ou hidrostáticas.', en: 'Compensate the weight of an object by coupling it with another that provides lift, or use aerodynamic or hydrostatic forces.' } },
  { id: 9, name: 'Preliminary Anti-action', description: { pt: 'Se o objeto vai experimentar tensões indesejadas, aplique uma ação contrária antecipada para compensá-las.', en: 'If an object is likely to experience undesirable stresses, apply a counteracting action in advance.' } },
  { id: 10, name: 'Preliminary Action', description: { pt: 'Execute a mudança necessária em um objeto, total ou parcialmente, antes que seja necessária. Pré-posicione objetos para que possam entrar em ação sem perda de tempo.', en: 'Perform the required change to an object fully or partially in advance. Pre-position objects so they can act without losing time.' } },
  { id: 11, name: 'Beforehand Cushioning', description: { pt: 'Compense a baixa confiabilidade do objeto preparando contramedidas de emergência antes que o problema ocorra.', en: 'Compensate for low reliability by preparing emergency measures before the problem occurs.' } },
  { id: 12, name: 'Equipotentiality', description: { pt: 'Mude a condição de operação de modo que não seja necessário elevar ou abaixar objetos; elimine a necessidade de mudança de posição.', en: 'Change operating conditions so objects need not be raised or lowered; remove the need for positional change.' } },
  { id: 13, name: 'The Other Way Round (Inversion)', description: { pt: 'Inverta a ação usada para resolver o problema. Imobilize o que está em movimento e mova o que está imóvel.', en: 'Invert the action used to solve the problem. Make moving parts stationary and move what was stationary.' } },
  { id: 14, name: 'Spheroidality (Curvature)', description: { pt: 'Substitua partes ou formas lineares por curvilíneas; use rolos, esferas, espirais em vez de superfícies planas.', en: 'Replace linear parts or flat surfaces with curved ones; use rollers, spheres, or spirals instead of planes.' } },
  { id: 15, name: 'Dynamics', description: { pt: 'Permita que as características de um objeto se ajustem dinamicamente para serem ótimas em cada fase da operação.', en: 'Allow an object or system to change dynamically so it stays optimal at each stage of operation.' } },
  { id: 16, name: 'Partial or Excessive Actions', description: { pt: 'Se 100% do efeito desejado é difícil de alcançar, obtenha um pouco mais ou um pouco menos. O problema pode ser consideravelmente mais simples.', en: 'If 100% of the desired effect is hard to achieve, obtain slightly more or slightly less. The problem may become much simpler.' } },
  { id: 17, name: 'Another Dimension', description: { pt: 'Mova um objeto em duas ou três dimensões; use camadas diferentes; incline ou vire o objeto.', en: 'Move an object in two or three dimensions; use different layers; tilt or rotate the object.' } },
  { id: 18, name: 'Mechanical Vibration', description: { pt: 'Cause oscilações em um objeto. Aumente a frequência até a faixa ultrassônica. Use frequência de ressonância.', en: 'Cause an object to oscillate. Increase the frequency up to ultrasonic ranges. Use resonance frequency.' } },
  { id: 19, name: 'Periodic Action', description: { pt: 'Substitua ação contínua por ação periódica ou pulsante. Mude a frequência. Use pausas entre impulsos para ações adicionais.', en: 'Replace continuous action with periodic or pulsed action. Change the frequency. Use pauses between pulses for extra actions.' } },
  { id: 20, name: 'Continuity of Useful Action', description: { pt: 'Realize o trabalho continuamente; faça todas as partes trabalhando em todo momento. Elimine movimentos ociosos e intermediários.', en: 'Carry out work continuously; keep all parts working at all times. Eliminate idle and intermediate motions.' } },
  { id: 21, name: 'Skipping (Rushing Through)', description: { pt: 'Conduza um processo ou certas fases em alta velocidade para evitar danos ou efeitos colaterais.', en: 'Conduct a process, or specific stages of it, at high speed to avoid damage or side effects.' } },
  { id: 22, name: 'Blessing in Disguise', description: { pt: 'Use fatores prejudiciais para obter efeito positivo. Elimine o efeito prejudicial combinando-o com outro efeito prejudicial.', en: 'Use harmful factors to obtain a positive effect. Eliminate a harmful factor by combining it with another harmful factor.' } },
  { id: 23, name: 'Feedback', description: { pt: 'Introduza retroalimentação para melhorar um processo ou ação. Se já há retroalimentação, mude sua magnitude ou influência.', en: 'Introduce feedback to improve a process or action. If feedback already exists, change its magnitude or influence.' } },
  { id: 24, name: 'Intermediary', description: { pt: 'Use um objeto intermediário para carregar, transferir ou transmitir uma ação. Combine temporariamente o objeto com outro que possa ser removido.', en: 'Use an intermediary object to carry, transfer, or transmit an action. Temporarily combine the object with another that can later be removed.' } },
  { id: 25, name: 'Self-service', description: { pt: 'Faça o objeto se servir, realizando funções auxiliares e de reparo. Use recursos e energia residuais.', en: 'Make an object serve itself by performing auxiliary and repair functions. Use residual resources and energy.' } },
  { id: 26, name: 'Copying', description: { pt: 'Use cópias ópticas, visuais ou simples no lugar de objetos caros, frágeis ou inconvenientes. Se já usa cópia visível, use infravermelha ou ultravioleta.', en: 'Use optical, visual, or simple copies in place of expensive, fragile, or inconvenient objects. If a visible copy is already used, move to infrared or ultraviolet.' } },
  { id: 27, name: 'Cheap Short-living Objects', description: { pt: 'Substitua um objeto caro e durável por uma coleção de objetos baratos e descartáveis, sacrificando certas qualidades.', en: 'Replace an expensive durable object with a collection of cheap disposable ones, sacrificing some qualities such as lifetime.' } },
  { id: 28, name: 'Mechanics Substitution', description: { pt: 'Substitua sistemas mecânicos por ópticos, acústicos, térmicos ou olfativos. Use campos elétricos, magnéticos ou eletromagnéticos.', en: 'Replace mechanical means with optical, acoustic, thermal, or chemical means. Use electric, magnetic, or electromagnetic fields.' } },
  { id: 29, name: 'Pneumatics and Hydraulics', description: { pt: 'Use partes gasosas ou líquidas de um objeto em vez de partes sólidas: inflável, cheio de líquido, amortecimento por ar.', en: 'Use gaseous or liquid parts of an object instead of solid parts: inflatable, liquid-filled, or air-cushioned structures.' } },
  { id: 30, name: 'Flexible Shells and Thin Films', description: { pt: 'Use cascas e filmes flexíveis em vez de estruturas tridimensionais. Isole o objeto do ambiente usando cascas e filmes.', en: 'Use flexible shells and thin films instead of three-dimensional structures. Isolate the object from its environment with shells and films.' } },
  { id: 31, name: 'Porous Materials', description: { pt: 'Torne o objeto poroso ou use elementos adicionais porosos. Se o objeto já é poroso, use a porosidade para introduzir uma substância útil.', en: 'Make the object porous or add porous elements. If it is already porous, use the pores to introduce a useful substance.' } },
  { id: 32, name: 'Color Changes', description: { pt: 'Mude a cor de um objeto ou de seu ambiente. Mude a transparência. Use traçadores coloridos para observar objetos ou processos difíceis de ver.', en: 'Change the color of an object or its environment. Change transparency. Use colored tracers to observe objects or processes that are hard to see.' } },
  { id: 33, name: 'Homogeneity', description: { pt: 'Faça objetos que interagem com o objeto principal do mesmo material ou de material similar, para evitar reações indesejadas.', en: 'Make interacting objects out of the same material, or a similar one, to avoid undesirable reactions.' } },
  { id: 34, name: 'Discarding and Recovering', description: { pt: 'Faça porções de um objeto que completaram sua função desaparecer ou modificar diretamente durante a operação.', en: 'Make portions of an object that have completed their function disappear or change directly during operation.' } },
  { id: 35, name: 'Parameter Changes', description: { pt: 'Mude o estado físico do objeto: concentração, flexibilidade, temperatura, grau de agregação. Mude a pressão, temperatura ou outras propriedades.', en: 'Change an object’s physical state: concentration, flexibility, temperature, or degree of aggregation. Alter pressure, temperature, or other properties.' } },
  { id: 36, name: 'Phase Transitions', description: { pt: 'Use fenômenos que ocorrem durante transições de fase: mudanças de volume, absorção ou liberação de calor.', en: 'Use phenomena that occur during phase transitions, such as volume change or heat absorption and release.' } },
  { id: 37, name: 'Thermal Expansion', description: { pt: 'Use expansão ou contração de materiais por aquecimento. Use materiais com diferentes coeficientes de expansão térmica.', en: 'Use thermal expansion or contraction of materials. Use materials with different coefficients of thermal expansion.' } },
  { id: 38, name: 'Strong Oxidants', description: { pt: 'Substitua ar comum por ar enriquecido com oxigênio. Substitua por oxigênio puro, ozônio ou oxigênio ionizado.', en: 'Replace ordinary air with oxygen-enriched air. Replace it with pure oxygen, ozone, or ionized oxygen.' } },
  { id: 39, name: 'Inert Atmosphere', description: { pt: 'Substitua o ambiente normal por inerte. Realize o processo no vácuo.', en: 'Replace the normal environment with an inert one. Carry out the process in a vacuum.' } },
  { id: 40, name: 'Composite Materials', description: { pt: 'Substitua materiais homogêneos por compósitos. Combine materiais diferentes para obter propriedades que nenhum deles tem individualmente.', en: 'Replace homogeneous materials with composites. Combine different materials to obtain properties none of them has alone.' } },
];

function localizePrinciple(principle: RawPrinciple, lang: OutputLanguage): Principle {
  return {
    id: principle.id,
    name: principle.name,
    description: principle.description[lang],
  };
}

export function getPrinciples(lang: OutputLanguage = 'pt'): Principle[] {
  return rawPrinciples.map((principle) => localizePrinciple(principle, lang));
}

export const principles: Principle[] = getPrinciples();

export function getPrinciple(id: number, lang: OutputLanguage = 'pt'): Principle | undefined {
  const principle = rawPrinciples.find((item) => item.id === id);
  return principle ? localizePrinciple(principle, lang) : undefined;
}
