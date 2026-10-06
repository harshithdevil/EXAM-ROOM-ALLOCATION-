import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import type { Dataset } from '@/lib/scheduler';
import { Button } from '@/components/ui/button';
import { Maximize2, Minus, Plus } from 'lucide-react';

type Props = { data: Dataset; edges: [string,string][]; colors?: Record<string,number> | undefined; selected: string | null; onSelect: (id: string | null) => void; active?: string | null | undefined; search?: string };
export function ConflictGraph({ data, edges, colors, selected, onSelect, active, search }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const cy = useRef<cytoscape.Core | null>(null);
  useEffect(() => {
    if (!container.current) return;
    const graph = cytoscape({ container: container.current, elements: [
      ...data.exams.map(e => ({ data: { id: e.id, label: e.subject } })),
      ...edges.map(([a,b]) => ({ data: { id: `${a}-${b}`, source: a, target: b } }))
    ], style: [
      { selector: 'node', style: { 'background-color': '#19374a', 'border-color': '#34809b', 'border-width': 1.5, 'label': 'data(label)', 'color': '#a9c1cb', 'font-family': 'DM Sans, sans-serif', 'font-size': 10, 'text-valign': 'bottom', 'text-margin-y': 10, 'width': 30, 'height': 30, 'text-max-width': '84px', 'text-wrap': 'ellipsis' } },
      { selector: 'edge', style: { 'line-color': '#254051', 'width': 1.3, 'opacity': .68, 'curve-style': 'bezier' } },
      { selector: 'node.focused', style: { 'border-color': '#f5c86a', 'border-width': 3, 'width': 39, 'height': 39, 'color': '#f6e2a6', 'font-weight': 'bold' } },
      { selector: 'node.neighbor', style: { 'border-color': '#92bca8', 'border-width': 2, 'color': '#d7e8e0' } },
      { selector: 'edge.focused', style: { 'line-color': '#73c2b1', 'width': 2, 'opacity': 1 } },
      { selector: 'node.dimmed', style: { 'opacity': .22 } },
      { selector: 'edge.dimmed', style: { 'opacity': .09 } },
    ], layout: { name: 'cose', animate: false, nodeRepulsion: () => 9000, idealEdgeLength: () => 100, padding: 40 }, minZoom: .35, maxZoom: 2.5 });
    cy.current = graph;
    graph.on('tap','node', e => onSelect(e.target.id()));
    graph.on('tap', e => { if (e.target === graph) onSelect(null); });
    return () => { graph.destroy(); cy.current = null; };
  }, [data.exams, edges]);
  useEffect(() => {
    const graph = cy.current; if (!graph) return;
    graph.nodes().forEach(n => {
      const color = colors?.[n.id()];
      const palette = ['#53c7b4','#e4b95f','#78a8ea','#df8f91','#bca0e0','#97be7c','#edaa79'];
      n.style('background-color', color ? palette[(color - 1) % palette.length] : '#19374a');
      n.style('border-color', color ? palette[(color - 1) % palette.length] : '#34809b');
      n.removeClass('focused neighbor dimmed');
    });
    graph.edges().removeClass('focused dimmed');
    const focus = active || selected;
    if (focus) {
      const node = graph.getElementById(focus);
      node.addClass('focused'); node.neighborhood('node').addClass('neighbor'); node.connectedEdges().addClass('focused');
      graph.nodes().difference(node.union(node.neighborhood('node'))).addClass('dimmed');
      graph.edges().difference(node.connectedEdges()).addClass('dimmed');
    } else if (search) graph.nodes().forEach(n => { if (!String(n.data('label')).toLowerCase().includes(search.toLowerCase())) n.addClass('dimmed'); });
  }, [colors, selected, active, search]);
  return <div className="relative h-full min-h-[340px] w-full overflow-hidden rounded-md graph-surface"><div ref={container} className="absolute inset-0"/><div className="absolute bottom-4 right-4 flex gap-1 rounded-md border border-border bg-card/90 p-1"><Button title="Zoom in" variant="ghost" size="icon" onClick={() => cy.current?.zoom({ level: Math.min(2.5,cy.current.zoom()*1.25), renderedPosition: { x: (container.current?.clientWidth ?? 0)/2, y: (container.current?.clientHeight ?? 0)/2 } })}><Plus/></Button><Button title="Zoom out" variant="ghost" size="icon" onClick={() => cy.current?.zoom({ level: Math.max(.35,cy.current.zoom()*.8), renderedPosition: { x: (container.current?.clientWidth ?? 0)/2, y: (container.current?.clientHeight ?? 0)/2 } })}><Minus/></Button><Button title="Fit graph" variant="ghost" size="icon" onClick={() => cy.current?.fit(undefined,40)}><Maximize2/></Button></div></div>;
}
