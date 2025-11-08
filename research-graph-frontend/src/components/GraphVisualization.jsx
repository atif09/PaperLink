import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { calculateNodeSize, truncateText, getNodeColor, formatCitationCount } from '../utils/graphUtils';

const GraphVisualization = ({ graphData, onNodeClick, selectedNodeId, filters }) => {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) return;

    const filterStartTime = performance.now();
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const defs = svg.append('defs');
    
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#9ca3af')
      .attr('opacity', 0.6);

    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setTransform(event.transform);
      });

    svg.call(zoom);

    const links = graphData.edges.map(edge => ({
      source: graphData.nodes.find(n => n.id === edge.source),
      target: graphData.nodes.find(n => n.id === edge.target),
      type: edge.type,
    })).filter(link => link.source && link.target);

    // Apply filters
    let filteredNodes = graphData.nodes;
    if (filters) {
      if (filters.paperType === 'foundational') {
        filteredNodes = graphData.nodes.filter(n => n.type === 'referenced' || n.type === 'main');
      } else if (filters.paperType === 'influential') {
        filteredNodes = graphData.nodes.filter(n => n.type === 'citing' || n.type === 'main');
      }

      if (filters.minCitations > 0) {
        filteredNodes = filteredNodes.filter(n => (n.citation_count || 0) >= filters.minCitations);
      }
    }

    const filteredEdges = links.filter(link => 
      filteredNodes.some(n => n.id === link.source.id) && 
      filteredNodes.some(n => n.id === link.target.id)
    );

    filteredNodes.forEach(node => {
      if (!node.x) node.x = width / 2 + (Math.random() - 0.5) * 100;
      if (!node.y) node.y = height / 2 + (Math.random() - 0.5) * 100;
    });

    const filterEndTime = performance.now();
    const filterDuration = filterEndTime - filterStartTime;

    // Track render start
    const renderStartTime = performance.now();

    const simulation = d3.forceSimulation(filteredNodes)
      .force('link', d3.forceLink(filteredEdges)
        .id(d => d.id)
        .distance(120))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50))
      .alpha(0.15)
      .alphaDecay(0.15);
      
    
    simulationRef.current = simulation;

    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(filteredEdges)
      .join('line')
      .attr('class', 'graph-link')
      .attr('stroke', '#555')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.4)
      .attr('marker-end', 'url(#arrowhead)');

    const nodeGroup = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(filteredNodes)
      .join('g')
      .attr('class', 'graph-node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    nodeGroup.append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => calculateNodeSize(d.citation_count || 0))
      .attr('fill', d => getNodeColor(d, graphData.centerNode))
      .attr('stroke', d => {
        if (d.id === selectedNodeId) return '#ffffff';
        if (d.id === graphData.centerNode) return '#ffffff';
        return '#4b5563';
      })
      .attr('stroke-width', d => {
        if (d.id === selectedNodeId) return 3;
        if (d.id === graphData.centerNode) return 2.5;
        return 1.5;
      })
      .style('cursor', 'pointer');

    nodeGroup.filter(d => (d.citation_count || 0) > 10000)
      .append('text')
      .attr('class', 'citation-badge-text')
      .attr('x', 0)
      .attr('y', d => -calculateNodeSize(d.citation_count || 0) - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#d1d5db')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .text(d => formatCitationCount(d.citation_count || 0))
      .style('pointer-events', 'none');

    nodeGroup.append('text')
      .text(d => truncateText(d.title, 25))
      .attr('x', 0)
      .attr('y', d => calculateNodeSize(d.citation_count || 0) + 18)
      .attr('text-anchor', 'middle')
      .attr('class', 'node-label')
      .attr('fill', '#e5e7eb')
      .attr('font-size', '9px')
      .attr('font-weight', '500')
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    nodeGroup.on('click', (event, d) => {
      event.stopPropagation();
      onNodeClick(d);

      d3.select(event.currentTarget).select('.node-circle')
        .transition()
        .duration(300)
        .attr('r', calculateNodeSize(d.citation_count || 0) * 1.3)
        .transition()
        .duration(300)
        .attr('r', calculateNodeSize(d.citation_count || 0));
    });

    nodeGroup.on('mouseenter', function (event, d) {
      setHoveredNode(d);

      link
        .transition()
        .duration(150)
        .attr('stroke-opacity', edge => {
          return (edge.source.id === d.id || edge.target.id === d.id) ? 0.7 : 0.15;
        });

      nodeGroup
        .transition()
        .duration(150)
        .style('opacity', node => {
          if (node.id === d.id) return 1;
          const isConnected = filteredEdges.some(edge => 
            (edge.source.id === d.id && edge.target.id === node.id) ||
            (edge.target.id === d.id && edge.source.id === node.id)
          );
          return isConnected ? 1 : 0.35;
        });

      d3.select(this).select('.node-circle')
        .transition()
        .duration(150)
        .attr('r', calculateNodeSize(d.citation_count || 0) * 1.25);

      d3.select(this).select('.node-label')
        .transition()
        .duration(150)
        .attr('fill', '#ffffff')
        .attr('font-size', '10px');
    });

    nodeGroup.on('mouseleave', function (event, d) {
      setHoveredNode(null);

      link
        .transition()
        .duration(150)
        .attr('stroke-opacity', 0.4);

      nodeGroup
        .transition()
        .duration(150)
        .style('opacity', 1);

      d3.select(this).select('.node-circle')
        .transition()
        .duration(150)
        .attr('r', calculateNodeSize(d.citation_count || 0));

      d3.select(this).select('.node-label')
        .transition()
        .duration(150)
        .attr('fill', '#e5e7eb')
        .attr('font-size', '9px');
    });

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      nodeGroup.attr('transform', d => `translate(${d.x},${d.y})`);

      
      if (simulation.alpha() < 0.05) {
        const renderEndTime = performance.now();
        const renderDuration = renderEndTime - renderStartTime;
        const totalDuration = renderEndTime - filterStartTime;
        
        console.log(`[PERFORMANCE STATS]`);
        console.log(`  Filter time: ${filterDuration.toFixed(2)}ms`);
        console.log(`  Render time: ${renderDuration.toFixed(2)}ms`);
        console.log(`  Total time: ${totalDuration.toFixed(2)}ms`);
        console.log(`  Nodes: ${filteredNodes.length}, Edges: ${filteredEdges.length}`);
      }

    });

    

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.1).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
    
  }, [graphData, selectedNodeId, onNodeClick, filters]);

  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      d3.zoom().scaleBy,
      1.3
    );
  };

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      d3.zoom().scaleBy,
      0.7
    );
  };

  const handleReset = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().duration(500).call(
      d3.zoom().transform,
      d3.zoomIdentity
    );
  };

  return (
    <div className="graph-container">
      <svg ref={svgRef} className="graph-svg" />

      {hoveredNode && (
        <div className="graph-tooltip" style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(30, 30, 30, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          padding: '12px 16px',
          maxWidth: '320px',
          fontSize: '12px',
          color: '#ffffff',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '13px' }}>
            {truncateText(hoveredNode.title, 40)}
          </div>
          <div style={{ fontSize: '11px', color: '#d1d5db', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <span>Year: {hoveredNode.year || 'N/A'}</span>
            <span>Citations: {formatCitationCount(hoveredNode.citation_count || 0)}</span>
          </div>
          <div style={{ fontSize: '10px', color: '#9ca3af', padding: '8px 0', borderTop: '1px solid rgba(255, 255, 255, 0.1)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '8px' }}>
            {hoveredNode.type === 'main' && 'Main Paper (Center)'}
            {hoveredNode.type === 'citing' && 'Influential (Builds on this work)'}
            {hoveredNode.type === 'referenced' && 'Foundational (This work cites)'}
          </div>
        </div>
      )}

      
    </div>
  );
};

export default GraphVisualization;