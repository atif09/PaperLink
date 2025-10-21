import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, Maximize2, Play, Pause } from 'lucide-react';
import { calculateNodeSize, truncateText, getNodeColor } from '../utils/graphUtils';

const GraphVisualization = ({graphData, onNodeClick, selectedNodeId}) => {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const [isSimulating, setIsSimulating] = useState(true);
  const [transform, setTransform] = useState({k: 1, x: 0, y: 0});
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const defs = svg.append('defs');
    
    // Arrow markers
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#606060')
      .attr('opacity', 0.5);

    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setTransform(event.transform);
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
      .attr('class', 'links')
      .selectAll('line')
      .data(graphData.edges)
      .join('line')
      .attr('class', 'graph-link')
      .attr('stroke', '#404040')
      .attr('stroke-width', d => {
        const sourceCitations = d.source.citation_count || 0;
        const targetCitations = d.target.citation_count || 0;
        const maxCitations = Math.max(sourceCitations, targetCitations);
        return maxCitations > 50000 ? 2 : 1.5;
      })
      .attr('stroke-opacity', 0.3)
      .attr('marker-end', 'url(#arrowhead)');

    const nodeGroup = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(graphData.nodes)
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
        return '#404040';
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
      .attr('y', d => -calculateNodeSize(d.citation_count || 0) - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', '#888888')
      .attr('font-size', '9px')
      .attr('font-weight', '500')
      .text(d => {
        const count = d.citation_count || 0;
        if (count >= 1000) return Math.floor(count / 1000) + 'k';
        return count;
      })
      .style('pointer-events', 'none');
    
    nodeGroup.append('text')
      .text(d => truncateText(d.title, 30))
      .attr('x', 0)
      .attr('y', d => calculateNodeSize(d.citation_count || 0) + 16)
      .attr('text-anchor', 'middle')
      .attr('class', 'node-label')
      .attr('fill', '#cccccc')
      .attr('font-size', '10px')
      .attr('font-weight', '400')
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

    nodeGroup.on('mouseenter', function(event, d) {
      setHoveredNode(d);
      
      link
        .transition()
        .duration(150)
        .attr('stroke-opacity', edge => {
          return (edge.source.id === d.id || edge.target.id === d.id) ? 0.6 : 0.15;
        });
      
      nodeGroup
        .transition()
        .duration(150)
        .style('opacity', node => {
          if (node.id === d.id) return 1;
          const isConnected = graphData.edges.some(edge => 
            (edge.source.id === d.id && edge.target.id === node.id) ||
            (edge.target.id === d.id && edge.source.id === node.id)
          );
          return isConnected ? 1 : 0.4;
        });
      
      d3.select(this).select('.node-circle')
        .transition()
        .duration(150)
        .attr('r', calculateNodeSize(d.citation_count || 0) * 1.2);
      
      d3.select(this).select('.node-label')
        .transition()
        .duration(150)
        .attr('fill', '#ffffff')
        .attr('font-size', '11px');
    });

    nodeGroup.on('mouseleave', function(event, d) {
      setHoveredNode(null);
      
      link
        .transition()
        .duration(150)
        .attr('stroke-opacity', 0.3);
      
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
        .attr('fill', '#cccccc')
        .attr('font-size', '10px');
    });

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      nodeGroup.attr('transform', d => `translate(${d.x},${d.y})`);
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
      
      {hoveredNode && (
        <div className="graph-tooltip" style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(30, 30, 30, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '6px',
          padding: '10px 14px',
          maxWidth: '280px',
          fontSize: '12px',
          color: '#ffffff',
          zIndex: 1000
        }}>
          <div style={{fontWeight: '500', marginBottom: '6px'}}>
            {hoveredNode.title}
          </div>
          <div style={{fontSize: '11px', color: '#999', display: 'flex', gap: '10px'}}>
            {hoveredNode.year && <span>{hoveredNode.year}</span>}
            {hoveredNode.citation_count && (
              <span>{hoveredNode.citation_count.toLocaleString()} cites</span>
            )}
          </div>
        </div>
      )}
      
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
      
      <div className="graph-legend" style={{
        position: 'absolute',
        bottom: '80px',
        left: '20px',
        background: 'rgba(30, 30, 30, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '6px',
        padding: '10px 12px',
        fontSize: '10px',
        color: '#999'
      }}>
        <div style={{fontWeight: '500', marginBottom: '6px', color: '#ccc'}}>Legend</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <div style={{width: '10px', height: '10px', borderRadius: '50%', background: '#ffffff', border: '2px solid #404040'}}></div>
            <span>Main Paper</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <div style={{width: '14px', height: '14px', borderRadius: '50%', background: '#667eea'}}></div>
            <span>Size = Citations</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphVisualization;



    