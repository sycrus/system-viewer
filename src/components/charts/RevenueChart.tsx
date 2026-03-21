import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface RevenueData {
  stream: string;
  revenue: number;
  share: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  width?: number;
  height?: number;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ 
  data, 
  width = 300, 
  height = 200 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d.stream))
      .range([0, innerWidth])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.revenue) || 0])
      .nice()
      .range([innerHeight, 0]);

    const color = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, data.length - 1]);

    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.stream)!)
      .attr('y', d => y(d.revenue))
      .attr('width', x.bandwidth())
      .attr('height', d => innerHeight - y(d.revenue))
      .attr('fill', (_, i) => color(i));

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dx', '-0.8em')
      .attr('dy', '0.15em');

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `$${d}`));

    g.append('text')
      .attr('class', 'y-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 10)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .text('Monthly Revenue (USD)');

    data.forEach((d) => {
      g.append('text')
        .attr('x', x(d.stream)! + x.bandwidth() / 2)
        .attr('y', y(d.revenue) - 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#333')
        .text(`$${d.revenue.toLocaleString()}`);
    });

  }, [data, width, height]);

  return (
    <div className="bg-white p-4 rounded border">
      <h3 className="font-medium text-gray-700 mb-2">Revenue Distribution</h3>
      <svg ref={svgRef} width={width} height={height} />
      <div className="text-sm text-gray-600 mt-2">
        <div className="flex justify-between">
          <span>Total Streams:</span>
          <span className="font-medium">{data.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Total Revenue:</span>
          <span className="font-medium text-green-600">
            ${data.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;