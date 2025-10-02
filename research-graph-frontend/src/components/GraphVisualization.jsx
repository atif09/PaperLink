import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, Maximize2, Play, Pause } from 'lucide-react';
import { calculateNodeSize, truncateText } from '../utils/graphUtils';

const GraphVisualization = ({graphData, onNodeClick, selectedNodeId}) => {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const [isSimulating, setIsSimulating] = useState(true);
  const [transform, setTransform] = useState({l: 1, x: 0, y: 0});

  useEffect(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setTransform(event.transform)
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation(graphData.nodes)
      .force('link', d3.forceLink(graphData.edges)
        .id(d => d.id)
        .distance(150))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));
    
    simulationRef.current = simulation;

    const link = g.append('g')
      .selectAll('link')
      .data(graphData.edges)
      .join('line')
      .attr('class', 'graph-link')
      .attr('stroke', '#2a2a2a')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6);

    const node = g.append('g')
      .selectAll('g')
      .data(graphData.nodes)
      .join('g')
      .attr('class', 'graph-node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('circle')
      .attr('r', d => calculateNodeSize(d.citation_count || 0))
      .attr('fill', d => d.id === graphData.centerNode ? '#ffffff' : '#606060')
      .attr('stroke', d => d.id === selectedNodeId ? '#ffffff' : 'none')
      .attr('stroke-width', d => d.id === selectedNodeId ? 3 : 0)
      .style('cursor', 'pointer');
    
    node.append('text')
      .text(d => truncateText(d.title, 30))
      .attr('x', 0)
      .attr('y', d => calculateNodeSize(d.citation_count || 0) + 16)
      .attr('text-anchor', 'middle')
      .attr('class', 'node-label')
      .attr('fill', '#a0a0a0')
      .attr('font-size', '11px')
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    node.on('click', (event, d) => {
      event.stopPropagation();
      onNodeClick(d);
    });

    node.on('mousenter', function(event, d) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('fill', '#ffffff')
        .attr('r', calculateNodeSize(d.citation_count || 0) * 1.2);
      
      d3.select(this).select('text')
        .transition()
        .duration(200)
        .attr('fill', '#ffffff')
        .attr('font-size', '12px');
    });

    node.on('mouseleave', function(event, d) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('fill', d.id === graphData.centerNode ? '#ffffff' : '#606060')
        .attr('r', calculateNodeSize(d.citation_count || 0));
      
      d3.select(this).select('text')
        .transition()
        .duration(200)
        .attr('fill', '#a0a0a0')
        .attr('font-size', '11px');

    });

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
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
    
  }, [graphData, selectedNodeId, onNodeClick]);

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

  const toggleSimulation = () => {
    if (simulationRef.current) {
      if (isSimulating) {
        simulationRef.current.stop();
      } else {
        simulationRef.current.restart();
      }
      setIsSimulating(!isSimulating);
    }
  };

  return (
    <div className="graph-container">
      <svg ref={svgRef} className="graph-svg" />
      
      <div className="graph-controls">
        <button onClick={handleZoomIn} className="control-button" title="Zoom In">
          <ZoomIn size={18} />
        </button>
        <button onClick={handleZoomOut} className="control-button" title="Zoom Out">
          <ZoomOut size={18} />
        </button>
        <button onClick={handleReset} className="control-button" title="Reset View">
          <Maximize2 size={18} />
        </button>
        <button onClick={toggleSimulation} className="control-button" title={isSimulating ? 'Pause' : 'Play'}>
          {isSimulating ? <Pause size={18} /> : <Play size={18} />}
        </button>
      </div>
      
      {graphData && (
        <div className="graph-info">
          <span>{graphData.nodes?.length || 0} nodes</span>
          <span>{graphData.edges?.length || 0} connections</span>
        </div>
      )}
    </div>
  );
};

export default GraphVisualization;
